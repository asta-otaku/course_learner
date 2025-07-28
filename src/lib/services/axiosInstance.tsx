import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Helper to get user object from localStorage
function getUserFromStorage() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Helper to set user object in localStorage
function setUserToStorage(user: any) {
  localStorage.setItem("user", JSON.stringify(user));
}

let isRefreshing = false;
type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use((config) => {
  const user = getUserFromStorage();
  const token = user?.data?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const user = getUserFromStorage();
      const refreshToken = user?.data?.refreshTokem || user?.data?.refreshToken;
      if (!refreshToken) {
        // No refresh token, logout or reject
        return Promise.reject(error);
      }
      if (isRefreshing) {
        // Queue the request until refresh is done
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      isRefreshing = true;
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-tokens`,
          { refreshToken }
        );
        if (response.data?.status === "success") {
          const newTokens = response.data.data;
          // Update user object
          const updatedUser = {
            ...user,
            data: {
              ...user.data,
              accessToken: newTokens.accessToken,
              refreshTokem: newTokens.refreshToken,
              refreshToken: newTokens.refreshToken,
            },
          };
          setUserToStorage(updatedUser);
          processQueue(null, newTokens.accessToken);
          originalRequest.headers["Authorization"] =
            "Bearer " + newTokens.accessToken;
          return axiosInstance(originalRequest);
        } else {
          processQueue(error, null);
          // Logout or reject
          return Promise.reject(error);
        }
      } catch (err) {
        processQueue(err, null);
        // Logout or reject
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
