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
  feedbackMode?:
    | "immediate"
    | "after_completion"
    | "delayed_random"
    | "manual_tutor_review";
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
  curriculumLessonId?: string;
  scheduledFor?: string | null;
  metadata?: any;
  questions?: QuizQuestion[];
  questionsCount?: number; // Number of questions in the quiz
  /** Present when quizzes are fetched with childId — whether the child has met the passing score. */
  passed?: boolean;
  /** In-progress attempt id; when set, UI may offer "Resume Quiz". */
  quizAttemptId?: string | null;
  orderIndex?: number;
  status?: "draft" | "published" | "archived";
  feedbackMode?:
    | "immediate"
    | "after_completion"
    | "delayed_random"
    | "manual_tutor_review";
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
  isResuming?: boolean;
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

export interface QuizPlayerQuestionImageSettings {
  width?: string;
  height?: string;
  alignment?: "left" | "center" | "right";
  size_mode?: "auto" | "custom" | "percentage";
  max_height?: string;
  object_fit?: "contain" | "cover" | "fill" | "scale-down";
}

export interface QuizPlayerQuestionItem {
  id: string;
  title: string;
  content: string;
  type: string;
  image?: string;
  image_url?: string;
  imageSettings?: QuizPlayerQuestionImageSettings;
  options?: Array<{ id: string; text: string }>;
  pairs?: Array<{ id: string; left: string; right: string }>;
  correctAnswer?: string | Record<string, string>;
}

/** Transformed question shape used by QuizPlayer (one item in the questions list). */
export interface QuizPlayerQuestion {
  id: string;
  order: number;
  /** Points for this quiz item (from API transform). */
  points?: number;
  explanation?: string;
  correct_feedback?: string;
  incorrect_feedback?: string;
  question: QuizPlayerQuestionItem;
}

export interface QuizTransition {
  id: string;
  position: number;
  content: string;
}

export interface QuizPlayerProps {
  quizId: string;
  quizAttemptId?: string | null;
  attemptNumber?: number;
  isTestMode?: boolean;
  attemptId?: string | null;
  isHomework?: boolean;
  homeworkId?: string;
  isBaselineTest?: boolean;
  baselineTestId?: string;
  timeLimit?: number;
  isResuming?: boolean;
}

export interface QuizQuestionResult {
  questionId: string;
  userAnswerContent?: string;
  userAnswerId?: string;
  correctAnswers: Array<{
    id: string;
    content: string | Record<string, string>;
  }>;
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  feedback?: string;
}

export interface QuizSubmissionResults {
  attemptId: string;
  quizId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  results: QuizQuestionResult[];
  /** Total time on the quiz in seconds (submit response and UI). */
  timeSpent: number;
}

export type QuizNavigationPosition = {
  type: "transition" | "question" | "explanation";
  questionIndex: number;
};

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
export interface Subscription {
  id: string;
  status: string;
  plan: {
    id: string;
    offerType: string;
    isActive: boolean;
  };
  startDate: string;
  endDate: string;
  cancelAtPeriodEnd: boolean;
  trialUsed: boolean;
  pendingCancellation: boolean;
  /** When present, links this subscription to a child profile (e.g. tuition per child) */
  childProfileId?: string;
}
export interface SubscriptionPlan {
  offerType: string;
  amount?: number;
  tiers?: {
    upTo: number | "infinity";
    amount: number;
  }[];
  currency: string;
  interval: string;
  intervalCount: number;
  trialPeriodDays: number;
  displayName: string;
  description: string;
  metadata: Record<string, any>;
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
  state: string;
  status: string;
  pendingCancellation: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  canCancelEverything: boolean;
  nextBilling?: {
    amountDue: number;
    currency: string;
    billingDate: string;
    breakdown: {
      description: string;
      amount: number;
      currency: string;
      periodEnd: string;
    }[];
  } | null;
  childSubscription: {
    childProfileId: string;
    childName: string;
    accessLevel: string;
    accessEndsAt: string | null;
    actions: string[];
  }[];
}

export interface UpgradeToTuitionPreviewResponse {
  currency: string,
  dueNow: number,
  dueNextBilling: number,
  billingDate: string,
  breakdown: {
    description: string,
    amount: number,
    currency: string,
    isProration: boolean,
    periodEnd: string,
    timing: string,
  }[]
}

export interface CreateSubscriptionData {
  childProfileId: string;
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
  status: string;
  /** Present on `/child-profiles` API responses */
  preferences?: {
    selectedCurriculumId: string | null;
  } | null;
}

export interface ChildPreferences {
  childProfileId?: string
  selectedCurriculumId: string
  weeklyQuota: number
  pauseAssignments: boolean
  pauseUntil?: string | null
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
  avatar?: File;
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
  AVAILABLE = "available",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  RESCHEDULED = "rescheduled",
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
  id: string;
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
  type:
    | "multiple_choice"
    | "true_false"
    | "free_text"
    | "matching"
    | "matching_pairs";
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
  type:
    | "multiple_choice"
    | "true_false"
    | "free_text"
    | "matching"
    | "matching_pairs";
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

/** Section progress from GET /library/:childId/curriculums/:curriculumId */
export interface LibrarySectionProgress {
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  sectionCompleted: boolean;
}

/**
 * Section row in child library (curriculum-scoped).
 * Formerly modeled as a full curriculum; API now returns sections with compact progress.
 */
export interface LibraryCurriculum {
  id: string;
  title: string;
  orderIndex: number;
  imageUrl: string;
  progress: LibrarySectionProgress;
}

/** Quiz row on child lesson payloads (dashboard / library) with attempt history. */
export interface ChildLessonQuizSummary {
  id: string;
  title: string;
  orderIndex?: number;
  quizAttemptId?: string | null;
  passed?: boolean;
  attempts?: Array<{
    id: string;
    submittedAt: string;
    percentage: number | string;
  }>;
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
  quizzesCount?: number;
  /** When API returns nested quiz progress (e.g. dashboard lessons). */
  quizAttempts?: ChildLessonQuizSummary[];
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
  id: string;
  childProfileId: string | null;
  childName: string | null;
  currentTutorId: string;
  currentTutorName: string | null;
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
  isAutoAssigned: boolean;
  isPassed: boolean;
  message: string;
  quizId: string;
  quizTitle: string;
  curriculumLessonId: string;
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
    /** When provided by API, lesson is fully completed (e.g. all quizzes passed). */
    lessonCompleted?: boolean;
  }[];
}

export interface BaselineTest {
  id: string;
  quizId: string;
  title: string;
  yearGroup: string;
}

export interface BaselineTestAttempt {
  id: string;
  childProfileId: string;
  baselineTestId: string;
  quizAttemptId: string;
  baselineTestTitle: string;
  quizId: string;
  score: number;
  percentage: number;
  submittedAt: string;
}

export interface BaselinelineTestCreateData {
  yearGroup: string;
  description?: string;
  passingScore?: number;
  quizSettings?: QuizSettings;
}

/** Result for a single question (present when question was already submitted). */
export interface QuizResumeQuestionResult {
  questionId: string;
  questionAttemptId: string;
  userAnswerId: string;
  userAnswerContent: string;
  correctAnswers: Array<{ id: string; content: string }>;
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  feedback: string;
}

/** Answer option for MC / true-false (present when question has choices). */
export interface QuizResumeQuestionAnswer {
  id: string;
  content: string;
  orderIndex: number;
}

/** Matching-pairs format (present for matching_pairs questions). */
export interface QuizResumeQuestionFormat {
  left_items: string[];
  right_items: string[];
}

/** Image settings for a question (optional). */
export interface QuizResumeQuestionImageSettings {
  width?: string;
  height?: string;
  max_height?: string;
  alignment?: string;
  object_fit?: string;
  size_mode?: string;
}

/** Single question in a resume attempt; result, answers, and question_format are optional depending on type/state. */
export interface QuizResumeQuestion {
  quizQuestionId: string;
  orderIndex: number;
  pointsOverride: number;
  questionId: string;
  title: string;
  content: string;
  type: string;
  points: number;
  tags?: string[];
  image?: string;
  hint?: Record<string, unknown>;
  imageSettings?: QuizResumeQuestionImageSettings;
  isLocked: boolean;
  /** Present when question was already submitted (e.g. immediate feedback). */
  result?: QuizResumeQuestionResult;
  /** Present for multiple_choice / true_false. */
  answers?: QuizResumeQuestionAnswer[];
  /** Present for matching_pairs. */
  question_format?: QuizResumeQuestionFormat;
}

export interface QuizResumeAttempt {
  attemptId: string;
  quizId: string;
  status: "in_progress" | "submitted" | "graded";
  /** Remaining time in seconds for timed quizzes; absent for untimed ones */
  timeLeft?: number;
  progress: {
    answeredCount: number;
    totalQuestions: number;
    totalPoints: number;
    score: number;
    percentage: number;
  };
  questions: QuizResumeQuestion[];
}

export interface QuizMasterList {
  yearGroupId: string;
  yearGroupName: string;
  yearGroupOrder: number;
  cumulativeFromYear: number;
  cumulativeToYear: number;
  totalItems: number;
  baselineTestId?: string;
  baselineTestQuestions?: number;
  items: {
    sectionId: string;
    sectionName: string;
    sectionOrder: number;
    lessonId: string;
    lessonName: string;
    lessonOrder: number;
    curriculumLessonId: string;
    quizId: string;
    quizTitle: string;
    quizOrder: number;
    yearGroupId: string;
    yearGroupName: string;
    yearGroupOrder: number;
  }[];
}

export interface YearGroup {
  id: string;
  name: string;
  description: string;
  orderNumber: number;
}

export interface MasteryRule {
  condition: string;
  threshold: number;
  action: string;
  targetQuizIds: string[];
}

export interface BaselineTestEntry {
  id?: string;
  orderIndex: number;
  testQuestionCount: number;
  quizId: string;
  quizTitle: string;
  masteryRules: MasteryRule[];
}

export interface LearningPath {
  quizTitle: string;
  sectionName: string
  lessonName: string
  status: string
  dueAt: string;
  homeworkId: string
}

export interface SchemeOfWork {
  quizId: string;
  quizTitle: string;
  sectionTitle: string;
  lessonTitle: string;
  orderIndex: number;
  inLearningPath: boolean;
  status: string;
}

export interface LearningPathSummary {
  assigned: {
    quizId: string;
    quizTitle: string;
    sectionTitle: string;
    lessonTitle: string;
    status: string;
  }[];
  upNext: {
    quizId: string;
    quizTitle: string;
    sectionTitle: string;
    lessonTitle: string;
    status: string;
  }[];
}

export interface LearningHistory {
  quizAttemptId: string;
  lessonTitle: string;
  quizTitle: string;
  score: number;
  status: string;
  completedAt: string;
}

// Export socket types
export * from "./types/socket";
