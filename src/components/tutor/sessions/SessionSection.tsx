import React from "react";
import { Session } from "@/lib/types";
import TutorSessionCard from "./TutorSessionCard";

export type SessionSectionType = "upcoming" | "previous";

interface SessionSectionProps {
  sectionType: SessionSectionType;
  title: string;
  description: string;
  sessions: Session[];
  onCancel: (id: string) => void;
  onReschedule: (session: Session) => void;
  onConfirm: (session: Session) => void;
  onComplete: (session: Session) => void;
}

export default function SessionSectionComponent({
  sectionType,
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
      sectionType={sectionType}
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
