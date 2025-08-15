"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { Session } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";

interface RescheduleSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  availableSessions: Session[];
  onConfirm: (newSessionId: string, reason: string) => void;
  isLoading?: boolean;
}

export default function RescheduleSessionDialog({
  open,
  onOpenChange,
  session,
  availableSessions,
  onConfirm,
  isLoading = false,
}: RescheduleSessionDialogProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("all");

  // Filter available sessions based on user preferences
  const filteredSessions = useMemo(() => {
    let filtered = availableSessions.filter(
      (s) => s.status === "available" && s.id !== session?.id
    );

    // Filter by date if specified
    if (dateFilter) {
      filtered = filtered.filter((s) => s.date === dateFilter);
    }

    // Filter by day of week if specified
    if (dayFilter !== "all") {
      filtered = filtered.filter((s) => {
        const sessionDate = new Date(s.date);
        const dayName = sessionDate
          .toLocaleDateString("en-US", { weekday: "long" })
          .toUpperCase();
        return dayName === dayFilter;
      });
    }

    // Sort by date and time
    return filtered.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [availableSessions, session?.id, dateFilter, dayFilter]);

  const handleConfirm = () => {
    if (selectedSessionId && reason.trim()) {
      onConfirm(selectedSessionId, reason.trim());
      setSelectedSessionId("");
      setReason("");
      setDateFilter("");
      setDayFilter("all");
    }
  };

  const handleCancel = () => {
    setSelectedSessionId("");
    setReason("");
    setDateFilter("");
    setDayFilter("all");
    onOpenChange(false);
  };

  const isFormValid = selectedSessionId && reason.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-left">
                Reschedule Session
              </DialogTitle>
              <DialogDescription className="text-left">
                Choose a new time slot for your session
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {session && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Current Session:</span>{" "}
                {session.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {session.date}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Time:</span> {session.time}
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Filter Available Sessions
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dateFilter" className="text-xs">
                  Specific Date
                </Label>
                <Input
                  id="dateFilter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dayFilter" className="text-xs">
                  Day of Week
                </Label>
                <Select value={dayFilter} onValueChange={setDayFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Days</SelectItem>
                    <SelectItem value="MONDAY">Monday</SelectItem>
                    <SelectItem value="TUESDAY">Tuesday</SelectItem>
                    <SelectItem value="WEDNESDAY">Wednesday</SelectItem>
                    <SelectItem value="THURSDAY">Thursday</SelectItem>
                    <SelectItem value="FRIDAY">Friday</SelectItem>
                    <SelectItem value="SATURDAY">Saturday</SelectItem>
                    <SelectItem value="SUNDAY">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Available Sessions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Select New Session ({filteredSessions.length} available)
            </Label>
            <div className="max-h-48 overflow-y-auto border rounded-md">
              {filteredSessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No available sessions found. Try adjusting your filters.
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredSessions.map((availableSession) => {
                    const displayDate = formatDisplayDate(
                      availableSession.date
                    );
                    return (
                      <button
                        key={availableSession.id}
                        type="button"
                        onClick={() =>
                          setSelectedSessionId(availableSession.id)
                        }
                        className={`w-full text-left p-3 rounded-md border transition-colors ${
                          selectedSessionId === availableSession.id
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {displayDate.day}, {displayDate.date}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {availableSession.time}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(availableSession.date).getFullYear()}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reschedule Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for rescheduling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-gray-500">
              Please provide a reason for rescheduling this session.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isFormValid || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Rescheduling..." : "Reschedule Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
