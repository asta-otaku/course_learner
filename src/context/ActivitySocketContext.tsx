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
    // Check if user is a tutor
    const isTutor =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/tutor");

    // Initialize socket
    const activitySocket = initActivitySocket();
    setSocket(activitySocket);

    // Connect socket
    activitySocket.connect();

    // Socket event handlers
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = (reason?: string) => {
      setIsConnected(false);
    };

    const onActivity = (data: any) => {
      setLastActivity(data);
    };

    const onStudentActivity = (data: any) => {
      // Only handle studentActivity for tutors
      if (isTutor) {
        // Create a new object reference to ensure React detects the change
        const activityWithId = {
          ...data,
          _wsId: Date.now() + Math.random(), // Unique ID to force React to see it as new
        };
        setLastActivity(activityWithId);
      }
    };

    // Register event listeners
    activitySocket.on("connect", onConnect);
    activitySocket.on("disconnect", onDisconnect);

    // Listen to different events based on user type
    if (isTutor) {
      activitySocket.on("studentActivity", onStudentActivity);
    } else {
      activitySocket.on("activity", onActivity);
    }

    // Cleanup
    return () => {
      activitySocket.off("connect", onConnect);
      activitySocket.off("disconnect", onDisconnect);
      if (isTutor) {
        activitySocket.off("studentActivity", onStudentActivity);
      } else {
        activitySocket.off("activity", onActivity);
      }
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
