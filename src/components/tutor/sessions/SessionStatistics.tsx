import React from "react";
import { Session } from "@/lib/types";

interface SessionStatisticsProps {
  allSessions: Session[];
}

export default function SessionStatistics({
  allSessions,
}: SessionStatisticsProps) {
  const totalSessions = allSessions.length;
  const availableSessions = allSessions.filter(
    (s) => s.status === "available"
  ).length;
  const bookedSessions = allSessions.filter(
    (s) => s.status === "booked"
  ).length;
  const cancelledSessions = allSessions.filter(
    (s) => s.status === "cancelled"
  ).length;
  const expiredSessions = allSessions.filter(
    (s) => s.status === "expired"
  ).length;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Session Overview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {totalSessions}
          </div>
          <div className="text-sm text-blue-800">Total Sessions</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {availableSessions}
          </div>
          <div className="text-sm text-green-800">Available</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {bookedSessions}
          </div>
          <div className="text-sm text-blue-800">Booked</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {cancelledSessions}
          </div>
          <div className="text-sm text-gray-800">Cancelled</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {expiredSessions}
          </div>
          <div className="text-sm text-orange-800">Expired</div>
        </div>
      </div>
    </div>
  );
}
