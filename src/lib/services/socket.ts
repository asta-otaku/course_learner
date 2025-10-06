import { io, Socket } from "socket.io-client";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/lib/types/socket";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

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

export const initSocket = (): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> => {
  if (!socket) {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001";

    const token = getAccessToken();

    socket = io(`${SOCKET_URL}/events`, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: {
        jwtToken: token,
      },
    });

    socket.io.on("reconnect_attempt", () => {
      const newToken = getAccessToken();
      if (socket && newToken) {
        // @ts-ignore
        socket.io.opts.query = { jwtToken: newToken };
      }
    });
  }

  return socket;
};

export const getSocket = (): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> | null => {
  return socket;
};

export const updateSocketAuth = () => {
  if (socket) {
    const token = getAccessToken();
    socket.auth = { token };
    // Reconnect with new auth
    if (socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

