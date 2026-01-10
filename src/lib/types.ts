import { StaticImageData } from "next/image";

export interface Course {
  imageUrl: string;
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

export interface QuizSettings {
  timeLimit: number;
  randomizeQuestions: boolean;
  showCorrectAnswers: boolean;
  maxAttempts: number;
  passingScore: number;
  showFeedback: boolean;
  allowRetakes: boolean;
  allowReview: boolean;
  availableFrom: string;
  availableUntil: string;
}

export interface QuizQuestion {
  questionId: string;
  order: number;
  pointsOverride: number;
  required: boolean;
}

export interface Quiz {
  id?: string;
  title: string;
  description: string;
  instructions?: string;
  categoryId?: string;
  gradeId?: string;
  lessonId?: string;
  tags?: string[] | null;
  timeLimit?: number;
  randomizeQuestions?: boolean;
  showCorrectAnswers?: boolean;
  maxAttempts?: number;
  passingScore?: string | number;
  showFeedback?: boolean;
  allowRetakes?: boolean;
  allowReview?: boolean;
  availableFrom?: string;
  availableUntil?: string;
  scheduledFor?: string | null;
  metadata?: any;
  questions?: QuizQuestion[];
  questionsCount?: number; // Number of questions in the quiz
  status?: "draft" | "published" | "archived";
  feedbackMode?: "immediate" | "after_completion" | "delayed_random" | "manual_tutor_review";
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizQuestionOrder {
  questionId: string;
  orderIndex: number;
}

export interface QuizQuestionOperation {
  questionId: string;
  orderIndex: number;
  pointsOverride?: number;
  required?: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  childId: string;
  attemptNumber: number;
  status: "in_progress" | "submitted" | "graded" | "completed";
  score: number | null;
  percentage: number | null;
  timeSpent: number | null;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  gradedBy: string | null;
  feedback: string | null;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
}


export interface QuizUpdateData {
  title?: string;
  description?: string;
  instructions?: string;
  gradeId?: string;
  tags?: string[];
  settings?: QuizSettings;
  status?: "draft" | "published" | "archived";
  questions?: QuizQuestionOperation[];
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
  id: string;
  date: string;
  name: string;
  time: string;
  timeSlot: string;
  tutor: string;
  tutorId: string;
  student?: string; // Optional student for admin scheduling
  participants?: string[]; // Array of participants for admin view
  issue?: string;
  status?: string; // Session status for filtering and display
  bookedAt?: string | null;
  bookedBy?: string | null;
  bookedById?: string | null;
  notes?: string | null;
};

export interface APISession {
  id: string;
  startTime: string;
  endTime: string;
  sessionDate: string;
  bookedAt: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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
  isActive: boolean;
  offerType: string;
  updatedAt: string;
  deletedAt?: string | null;
  tutorId?: string;
  parentFirstName: string;
  parentLastName: string;
  tutorFirstName: string;
  tutorLastName: string;
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

export enum SessionStatus {
  AVAILABLE = 'available',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  RESCHEDULED = 'rescheduled',
}

// Session Mutation Request Types
export interface BookSessionData {
  childProfileId: string;
  notes: string;
}

export interface ConfirmSessionData {
  notes: string;
}

export interface CancelSessionData {
  reason: string;
}

export interface RescheduleSessionData {
  newSessionId: string;
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

// New interface for the actual API response structure
export interface AdminSessionData {
  id: string;
  bookedAt: string | null;
  tutor: string;
  tutorId: string;
  bookedBy: string | null;
  bookedById: string | null;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminSessionsResponse {
  data: AdminSessionData[];
  pagination: PaginationInfo;
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

export interface Question {
  id: string;
  title: string;
  content: string;
  type: "multiple_choice" | "true_false" | "free_text" | "matching" | "matching_pairs";
  points: number;
  difficultyLevel: number | null;
  explanation: string | null;
  hint: string | null;
  timeLimit: number | null;
  tags: string[];
  metadata: {
    correctFeedback?: string;
    incorrectFeedback?: string;
    matchingPairs?: any[];
  } | null;
  isPublic: boolean;
  image: string | null;
  folderId: string | null;
  createdBy: string | null;
  answers: QuestionAnswer[];
  createdAt: string;
  updatedAt: string;
}

// Update Question Payload Interface (matches API expectation)
export interface UpdateQuestionPayload {
  title: string;
  content: string;
  type: "multiple_choice" | "true_false" | "free_text" | "matching" | "matching_pairs";
  difficultyLevel: number;
  points: number;
  timeLimit: number;
  tags: string[];
  hint: string;
  explanation: string;
  isPublic: boolean;
  imageUrl: string;
  correctFeedback: string;
  incorrectFeedback: string;
  answers?: {
    content: string;
    isCorrect: boolean;
    explanation: string;
    orderIndex: number;
  }[];
  metadata?: string;
  acceptedAnswers?: {
    content: string;
    gradingCriteria: string;
  }[];
  matchingPairs?: {
    left: string;
    right: string;
  }[];
}

export interface QuestionAnswer {
  id: string;
  questionId: string;
  content: string;
  isCorrect: boolean;
  explanation: string | null;
  orderIndex: number;
  gradingCriteria: string | null;
  sampleAnswer: string | null;
  matchingPairs: any[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionQueryOptions {
  search?: string;
  type?:
    | "multiple_choice"
    | "true_false"
    | "fill_in_the_gap"
    | "matching_pairs"
    | "free_text";
  difficulty?: number;
  difficultyMin?: number;
  difficultyMax?: number;
  tags?: string[];
  isPublic?: boolean;
  createdBy?: string;
  collectionId?: string;
  folderId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface Curriculum {
  title: string;
  description: string;
  subscriptionPlanId: string;
  durationWeeks: number;
  learningObjectives: string[];
  prerequisites: string[];
  tags: string[];
  visibility: "PRIVATE" | "PUBLIC";
}

export interface Lesson {
  id: string;
  title: string;
  sectionId: string;
  description: string;
  content: string;
  orderIndex: number;
  durationMinutes: number;
  objectives: string[];
  tags: string[];
  quizIds: string[];
  isActive: boolean;
  videoUrl: string;
  videoKeyName?: string;
  videoFileName?: string;
  videoFileSize?: number;
  videoDuration?: number;
  quizzesCount?: number;
}

export interface CurriculumProgress {
  curriculumId: string;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  passedQuizzes: number;
  totalVideoDuration: number;
  watchedVideoDuration: number;
  completionPercentage: number;
  firstAccessedAt: string | null;
  lastAccessedAt: string | null;
  completedAt: string | null;
  isCompleted: boolean;
}

export interface LibraryCurriculum {
  id: string;
  title: string;
  description: string;
  durationWeeks: number;
  learningObjectives: string[];
  prerequisites: string[];
  lessonsCount: number;
  createdAt: string;
  orderIndex: number;
  progress: CurriculumProgress;
}

export interface ChildLesson {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  watchedPosition: number;
  videoCompleted: boolean;
  quizzesPassed: number;
  totalQuizzes: number;
  completionPercentage: number;
  lessonCompleted: boolean;
  sectionId: string;
}

export interface Chat {
  _id: string;
  tutorId: string;
  childId: string;
  tutorName: string;
  childName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  id: string;
  unreadCount: number;
  online?: boolean;
  name?: string; // For backward compatibility
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  media: string | null;
  type: string;
  status: string;
  isReadByRecipient: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Analytics {
  totalParents: number;
  totalTutors: number;
  totalAdmins: number;
  totalChildren: number;
  newSignups: number;
  completedSessions: number;
  confirmedSessions: number;
  cancelledSessions: number;
}

export interface TutorAnalytics {
  totalStudents: number;
  completedSessions: number;
  confirmedSessions: number;
  cancelledSessions: number;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  media?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
  creatorId?: string;
  creatorName?: string;
  messages?: {
    id: string;
    messageId?: string;
    message: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      role?: string;
    };
    senderName?: string;
    createdAt: string;
    updatedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequest {
  id: string,
  childProfileId: string | null,
  childName: string | null,
  currentTutorId: string,
  currentTutorName: string | null,
  requestedTutorId: string;
  requestedTutorName: string;
  status: string;
  reason: string | null;
  reviewNote: string;
  createdAt: string;
  reviewedAt: string;
}

export interface Homework {
  id: string;
  dateAssigned: string;
  dueDate: string;
  status: string;
  studentId: string;
  studentName: string;
  tutorId: string;
  tutorName: string;
  dateSubmitted: string | null;
  dateReviewed: string | null;
  message: string;
}

export interface HomeworkReview {
  attemptId: string;
  quizId: string;
  childId: string;
  attemptNumber: number;
  status: string;
  score: number;
  totalPoints: number;
  percentage: number;
  results: any[];
  timeSpent: number;
}

export interface Section {
  id: string;
  title: string;
  lessonsCount: number;
  imageUrl: string;
  lessons: {
    id: string;
    title: string;
    orderIndex: number;
  }[]
}

// Export socket types
export * from "./types/socket";