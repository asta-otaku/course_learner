import { io, Socket } from "socket.io-client";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/lib/types/socket";
import { fetchSocketToken, getBucketFromRoute } from "@/lib/auth/client-session";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Access token for the Socket.IO handshake, fetched from our own
 * `/api/auth/socket-token` route (the cookie itself is httpOnly).
 */
export function getSocketToken(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  return fetchSocketToken(getBucketFromRoute());
}

export const initSocket = (): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> => {
  if (!socket) {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001";

    socket = io(`${SOCKET_URL}/events`, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      query: {},
    });

    // Refresh the handshake token before the next reconnect attempt lands.
    socket.io.on("reconnect_attempt", () => {
      void getSocketToken().then((token) => {
        if (token) setSocketQueryToken(token);
      });
    });
  }

  return socket;
};

/** Call before connect() to ensure the socket uses the current token (e.g. after login). */
export const setSocketQueryToken = (token: string | null) => {
  if (socket) {
    socket.io.opts.query = token ? { jwtToken: token } : {};
  }
};

/** Fetch a fresh token and connect. Resolves `false` when there is no session. */
export const connectSocketWithToken = async (): Promise<boolean> => {
  const current = initSocket();
  if (current.connected) return true;
  const token = await getSocketToken();
  if (!token) return false;
  setSocketQueryToken(token);
  current.connect();
  return true;
};

export const getSocket = (): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
