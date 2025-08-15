import React from "react";
import { Session } from "@/lib/types";
import TutorSessionCard from "./TutorSessionCard";

interface SessionSectionProps {
  title: string;
  description: string;
  sessions: Session[];
  onCancel: (id: string) => void;
  onReschedule: (session: Session) => void;
  onConfirm: (session: Session) => void;
  onComplete: (session: Session) => void;
}

export default function SessionSectionComponent({
  title,
  description,
  sessions,
  onCancel,
  onReschedule,
  onConfirm,
  onComplete,
}: SessionSectionProps) {
  return (
    <TutorSessionCard
      title={title}
      description={description}
      sessions={sessions}
      onCancel={onCancel}
      onReschedule={onReschedule}
      onConfirm={onConfirm}
      onComplete={onComplete}
    />
  );
}
