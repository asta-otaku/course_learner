import { io, Socket } from "socket.io-client";
import { fetchSocketToken, getBucketFromRoute } from "@/lib/auth/client-session";

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

function getSocketToken(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  return fetchSocketToken(getBucketFromRoute());
}

export const initActivitySocket = (): Socket<
  ActivityServerToClientEvents,
  ActivityClientToServerEvents
> => {
  if (!activitySocket) {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    activitySocket = io(`${SOCKET_URL}/activity`, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: {},
    });

    activitySocket.io.on("reconnect_attempt", () => {
      void getSocketToken().then((token) => {
        if (activitySocket && token) {
          activitySocket.io.opts.query = { jwtToken: token };
        }
      });
    });
  }

  return activitySocket;
};

/** Fetch a fresh token and connect. Resolves `false` when there is no session. */
export const connectActivitySocketWithToken = async (): Promise<boolean> => {
  const current = initActivitySocket();
  if (current.connected) return true;
  const token = await getSocketToken();
  if (!token) return false;
  current.io.opts.query = { jwtToken: token };
  current.connect();
  return true;
};

export const getActivitySocket = (): Socket<
  ActivityServerToClientEvents,
  ActivityClientToServerEvents
> | null => {
  return activitySocket;
};

export const disconnectActivitySocket = () => {
  if (activitySocket) {
    activitySocket.disconnect();
    activitySocket = null;
  }
};
