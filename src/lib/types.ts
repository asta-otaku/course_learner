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

// API Response Types
export interface ApiResponse<T = any> {
  status: number;
  data: {
    status: string;
    message: string;
    data: T;
  };
}

export interface APIGetResponse<T = any> {
  status: string;
  message: string;
  data: T;
}

// Auth Types
export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  howDidYouHearAboutUs?: string;
  referralCode?: string;
}

export interface TutorSignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  avatar?: File | null;
  howDidYouHearAboutUs?: string;
  referralCode?: string;
}

export interface TimeslotCreateData {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  chunkSizeMinutes: number;
}

export interface Timeslot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  isActive: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  firstName: string;
  lastName: string;
  userRole: string;
  accessToken: string;
  refreshToken: string;
}

// Subscription Types
export interface SubscriptionPlan {
  description: string;
  subscriptionId: string;
  status: string;
  offerType: string;
  startDate: string;
  endDate: string;
}

export interface FullSubscriptionPlan {
  id: string;
  object: string;
  active: boolean;
  attributes: any[];
  created: number;
  default_price: {
    id: string;
    object: string;
    active: boolean;
    billing_scheme: string;
    created: number;
    currency: string;
    custom_unit_amount: number | null;
    livemode: boolean;
    lookup_key: string | null;
    metadata: Record<string, any>;
    nickname: string | null;
    product: string;
    recurring: {
      interval: string;
      interval_count: number;
      meter: string | null;
      trial_period_days: number | null;
      usage_type: string;
    };
    tax_behavior: string;
    tiers_mode: string | null;
    transform_quantity: string | null;
    type: string;
    unit_amount: number;
    unit_amount_decimal: string;
  };
  description: string;
  images: string[];
  livemode: boolean;
  marketing_features: any[];
  metadata: {
    offerType: string;
  };
  name: string;
  package_dimensions: any | null;
  shippable: boolean | null;
  statement_descriptor: string | null;
  tax_code: string | null;
  type: string;
  unit_label: string | null;
  updated: number;
  url: string | null;
}

export interface ManageSubscriptionResponse {
  url: string;
}

export interface CreateSubscriptionData {
  offerType: string;
}

// Child Profile Types
export interface ChildProfile {
  id: string;
  name: string;
  year: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  tutor?: {
    id: string;
    avatar: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  } | null;
}

export interface ParentProfile {
  id: number;
  howDidYouHearAboutUs: string;
  stripeCustomerId: string;
  referralCode: string;
  offerType: string;
}

export interface TutorUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  referralCode: string;
  tutorProfile: Record<string, never>;
  parentProfile: ParentProfile;
}

export interface TutorDetails {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    referralCode: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  avatar: string;
  assignedStudents: Array<{
    id: string;
    name: string;
    year: string;
    avatar: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }>;
  timeSlots: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    chunkSizeMinutes: number;
    isRecurring: boolean;
    isActive: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Interface for the transformed tutor data used in components
export interface TransformedTutorProfile {
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

// Interface for change requests
export interface ChangeRequest {
  id: string;
  className: string;
  currentTutorId: string;
  currentTutor: string;
  requestedTutorId: string;
  requestedTutor: string;
  status: string;
  requestDate: string;
}

export interface DetailedChildProfile {
  id: number;
  name: string;
  year: string;
  avatar: string;
  parent: ParentProfile;
  tutor: TutorDetails;
}

export interface CreateChildProfileData {
  name: string;
  year: string;
  avatar: File;
}

// Session Types
export interface SessionTimeSlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  isActive: boolean;
}

export interface SessionBookedBy {
  id: number;
  firstName: string;
  lastName: string;
}

export interface SessionData {
  id: number;
  timeSlot: SessionTimeSlot;
  startTime: string;
  endTime: string;
  sessionDate: string;
  bookedAt: string;
  bookedBy: SessionBookedBy;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Session Mutation Request Types
export interface BookSessionData {
  childProfileId: number;
  notes: string;
}

export interface ConfirmSessionData {
  notes: string;
}

export interface CancelSessionData {
  reason: string;
}

export interface RescheduleSessionData {
  newSessionId: number;
  reason: string;
}

// Session API Response Types
export interface SessionResponse {
  id: number;
  timeSlot: SessionTimeSlot;
  startTime: string;
  endTime: string;
  sessionDate: string;
  bookedAt: string;
  bookedBy: SessionBookedBy;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  chunkSize: number;
  isActive?: boolean;
}

export interface DayAvailability {
  [day: string]: TimeSlot[];
} 

export interface ParentDetails {
  id: string
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    referralCode: string;
  };
  howDidYouHearAboutUs: string;
  referralCode: string;
  offerType: string;
  childProfiles: ChildProfile[];
}
