import { io, Socket } from "socket.io-client";

interface ActivityServerToClientEvents {
  activity: (data: any) => void;
  studentActivity: (data: any) => void;
}

interface ActivityClientToServerEvents {
  // Add any client-to-server events if needed
}

let activitySocket: Socket<
  ActivityServerToClientEvents,
  ActivityClientToServerEvents
> | null = null;

// Helper to get access token (same logic as axiosInstance)
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname;
  let userType: "admin" | "tutor" | "user" = "user";

  if (pathname.startsWith("/admin")) {
    userType = "admin";
  } else if (pathname.startsWith("/tutor")) {
    userType = "tutor";
  }

  const userStr = localStorage.getItem(userType);
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    return (
      user?.data?.accessToken ||
      user?.accessToken ||
      user?.data?.data?.accessToken ||
      null
    );
  } catch {
    return null;
  }
}

export const initActivitySocket = (): Socket<
  ActivityServerToClientEvents,
  ActivityClientToServerEvents
> => {
  if (!activitySocket) {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    const token = getAccessToken();

    activitySocket = io(`${SOCKET_URL}/activity`, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: {
        jwtToken: token,
      },
    });

    activitySocket.io.on("reconnect_attempt", () => {
      const newToken = getAccessToken();
      if (activitySocket && newToken) {
        // @ts-ignore
        activitySocket.io.opts.query = { jwtToken: newToken };
      }
    });
  }

  return activitySocket;
};

export const getActivitySocket = (): Socket<
  ActivityServerToClientEvents,
  ActivityClientToServerEvents
> | null => {
  return activitySocket;
};

export const updateActivitySocketAuth = () => {
  if (activitySocket) {
    const token = getAccessToken();
    activitySocket.auth = { token };
    // Reconnect with new auth
    if (activitySocket.connected) {
      activitySocket.disconnect();
      activitySocket.connect();
    }
  }
};

export const disconnectActivitySocket = () => {
  if (activitySocket) {
    activitySocket.disconnect();
    activitySocket = null;
  }
};

