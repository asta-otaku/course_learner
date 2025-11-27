"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  initActivitySocket,
  disconnectActivitySocket,
} from "@/lib/services/activitySocket";
import { Socket } from "socket.io-client";

interface ActivitySocketContextType {
  isConnected: boolean;
  socket: Socket | null;
  lastActivity: any | null;
}

const ActivitySocketContext = createContext<
  ActivitySocketContextType | undefined
>(undefined);

export const ActivitySocketProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastActivity, setLastActivity] = useState<any | null>(null);

  useEffect(() => {
    // Initialize socket
    const activitySocket = initActivitySocket();
    setSocket(activitySocket);

    // Connect socket
    activitySocket.connect();

    // Socket event handlers
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onActivity = (data: any) => {
      setLastActivity(data);
    };

    // Register event listeners
    activitySocket.on("connect", onConnect);
    activitySocket.on("disconnect", onDisconnect);
    activitySocket.on("activity", onActivity);

    // Cleanup
    return () => {
      activitySocket.off("connect", onConnect);
      activitySocket.off("disconnect", onDisconnect);
      activitySocket.off("activity", onActivity);
      disconnectActivitySocket();
    };
  }, []);

  return (
    <ActivitySocketContext.Provider
      value={{
        isConnected,
        socket,
        lastActivity,
      }}
    >
      {children}
    </ActivitySocketContext.Provider>
  );
};

export const useActivitySocket = () => {
  const context = useContext(ActivitySocketContext);
  if (context === undefined) {
    throw new Error(
      "useActivitySocket must be used within an ActivitySocketProvider"
    );
  }
  return context;
};
