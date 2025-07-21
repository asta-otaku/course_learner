import { StaticImageData } from "next/image";

export interface Course {
  image: StaticImageData;
  course: string;
  topics: {
    title: string;
    number_of_quizzes: number;
  }[];
  progress: number;
  duration: number;
  total_section: number;
  completed_section: number;
}

export interface Quiz {
  title: string;
  attempts: {
    label: string;
    date: string;
    score: number;
  }[];
  questions: {
    question: string;
    options?: [string, string, string, string];
    isFillInBlank?: boolean;
  }[];
  correctAnswers: string[];
}

export interface VideoTopic {
  title: string;
  image: StaticImageData;
  description: string;
  subtopics: { name: string; status: string }[];
}

export interface User {
  id: string;
  name: string;
  year: number;
  image: string;
  status: string;
  subscriptionDate: string;
  duration: number;
  subscriptionAmount: number;
  subscriptionName: string;
}

export type DateRange =
  | "ALL"
  | "TODAY"
  | "LAST_3_DAYS"
  | "LAST_WEEK"
  | "LAST_TWO_WEEKS"
  | "LAST_MONTH"
  | "LAST_3_MONTHS";

export const dateRangeLabels: Record<DateRange, string> = {
  ALL: "All Time",
  TODAY: "Today",
  LAST_3_DAYS: "Last 3 Days",
  LAST_WEEK: "Last Week",
  LAST_TWO_WEEKS: "Last Two Weeks",
  LAST_MONTH: "Last Month",
  LAST_3_MONTHS: "Last 3 Months",
};

export type TimeSlot = {
  id: string;
  label: string;
  value: string;
};

export type Session = {
  id: number;
  date: string;
  name: string;
  time: string;
  timeSlot: string;
  tutor: string;
  student?: string; // Optional student for admin scheduling
  participants?: string[]; // Array of participants for admin view
  issue?: string;
};

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  role: string;
}

export interface TutorProfile {
  id: string;
  name: string;
  activity: string;
  time: string;
  studentCount: number;
  homeworkCount: number;
  averageResponseTime: string;
  availability: {
    [day: string]: string[];
  };
}
