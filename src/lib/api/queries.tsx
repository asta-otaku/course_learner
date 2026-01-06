import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../services/axiosInstance";
import {
  ApiResponse,
  ManageSubscriptionResponse,
  ChildProfile,
  TutorDetails,
  Timeslot,
  SessionResponse,
  AdminSessionsResponse,
  FullSubscriptionPlan,
  APIGetResponse,
  SubscriptionPlan,
  ParentDetails,
  Question,
  QuestionQueryOptions,
  Quiz,
  Curriculum,
  Lesson,
  Chat,
  Message,
  LibraryCurriculum,
  ChildLesson,
  Analytics,
  TutorAnalytics,
  SupportTicket,
  ChangeRequest,
  Homework,
  HomeworkReview,
  Section,
} from "../types";

// User Queries
export const useGetUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<ApiResponse<TutorDetails[]>> => {
      const response = await axiosInstance.get("/users");
      return response.data;
    },
  });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async (): Promise<APIGetResponse<TutorDetails>> => {
      const response = await axiosInstance.get("/users/profile");
      return response.data;
    },
  });
};

export const useGetUserById = (id: string) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async (): Promise<TutorDetails> => {
      const response = await axiosInstance.get(`/users/${id}`);
      return response.data;
    },
  });
};

// Subscription Queries
export const useGetSubscriptionPlans = (isUser?: boolean, id?: string) => {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async (): Promise<
      APIGetResponse<FullSubscriptionPlan[] | SubscriptionPlan>
    > => {
      const url = isUser
        ? "/subscriptions/user-subscription"
        : "/subscriptions";
      const response = await axiosInstance.get(
        url,
        id ? { params: { parentId: id } } : undefined
      );
      return response.data;
    },
  });
};

export const useGetSubscriptionPlansWithIds = () => {
  return useQuery({
    queryKey: ["subscription-plans-with-ids"],
    queryFn: async (): Promise<
      APIGetResponse<
        {
          id: string;
          offerType: string;
          stripePriceId: string;
          isActive: boolean;
        }[]
      >
    > => {
      const response = await axiosInstance.get("/subscriptions/plans");
      return response.data;
    },
  });
};

export const useGetManageSubscription = () => {
  return useQuery({
    queryKey: ["manage-subscription"],
    queryFn: async (): Promise<APIGetResponse<ManageSubscriptionResponse>> => {
      const response = await axiosInstance.get(
        "/subscriptions/manage-subscription"
      );
      return response.data;
    },
  });
};

// Child Profile Queries
export const useGetChildProfile = () => {
  return useQuery({
    queryKey: ["child-profiles"],
    queryFn: async (): Promise<APIGetResponse<ChildProfile[]>> => {
      const response = await axiosInstance.get("/child-profiles");
      return response.data;
    },
  });
};

export const useGetChildProfileById = (id: string) => {
  return useQuery({
    queryKey: ["child-profile", id],
    queryFn: async (): Promise<APIGetResponse<ChildProfile>> => {
      const response = await axiosInstance.get(`/child-profiles/${id}`);
      return response.data;
    },
  });
};

export const useGetChildTutor = (id: string) => {
  return useQuery({
    queryKey: ["child-tutor", id],
    queryFn: async (): Promise<TutorDetails> => {
      const response = await axiosInstance.get(`/child-profiles/${id}/tutor`);
      return response.data;
    },
  });
};

// Tutor Queries
export const useGetTutors = () => {
  return useQuery({
    queryKey: ["tutors"],
    queryFn: async (): Promise<APIGetResponse<TutorDetails[]>> => {
      const response = await axiosInstance.get("/tutors");
      return response.data;
    },
  });
};

export const useGetTutorById = (id: string) => {
  return useQuery({
    queryKey: ["tutor", id],
    queryFn: async (): Promise<TutorDetails> => {
      const response = await axiosInstance.get(`/tutors/${id}`);
      return response.data;
    },
  });
};

export const useGetTutorStudent = (id: string) => {
  return useQuery({
    queryKey: ["tutor-student", id],
    queryFn: async (): Promise<ChildProfile[]> => {
      const response = await axiosInstance.get(
        `/tutors/assigned-students?tutorId=${id}`
      );
      return response.data.data;
    },
    enabled: !!id,
  });
};

// Timeslot Queries
export const useGetTimeslots = () => {
  return useQuery({
    queryKey: ["timeslots"],
    queryFn: async (): Promise<APIGetResponse<Timeslot[]>> => {
      const response = await axiosInstance.get("/time-slots");
      return response.data;
    },
  });
};

export const useGetTimeSlotByDayOfWeek = (dayOfWeek: string) => {
  return useQuery({
    queryKey: ["timeslot", dayOfWeek],
    queryFn: async (): Promise<APIGetResponse<Timeslot[]>> => {
      const response = await axiosInstance.get(`/time-slots/day/${dayOfWeek}`);
      return response.data;
    },
  });
};

// Session Queries
export const useGetSessions = (options?: {
  dayOfWeek?: string;
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [
      "sessions",
      options?.dayOfWeek,
      options?.status,
      options?.date,
      options?.page,
      options?.limit,
    ],
    queryFn: async (): Promise<APIGetResponse<AdminSessionsResponse>> => {
      const params = new URLSearchParams();
      if (options?.dayOfWeek) params.append("dayOfWeek", options.dayOfWeek);
      if (options?.status) params.append("status", options.status);
      if (options?.date) params.append("date", options.date);
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/sessions?${queryString}` : "/sessions";

      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};

export const useGetMySessions = (options?: {
  dayOfWeek?: string;
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [
      "my-sessions",
      options?.dayOfWeek,
      options?.status,
      options?.date,
      options?.page,
      options?.limit,
    ],
    queryFn: async (): Promise<APIGetResponse<SessionResponse[]>> => {
      const params = new URLSearchParams();
      if (options?.dayOfWeek) params.append("dayOfWeek", options.dayOfWeek);
      if (options?.status) params.append("status", options.status);
      if (options?.date) params.append("date", options.date);
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/sessions/me?${queryString}` : "/sessions/me";

      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};

export const useGetBookedSessions = (
  childId: string,
  options?: {
    status?: string;
    date?: string;
    dayOfWeek?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ["booked-sessions", childId, options],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const params = new URLSearchParams();

      if (options?.status && options.status !== "all")
        params.append("status", options.status);
      if (options?.date) params.append("date", options.date);
      if (options?.dayOfWeek && options.dayOfWeek !== "all")
        params.append("dayOfWeek", options.dayOfWeek);
      if (options?.search) params.append("search", options.search);
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());

      const queryString = params.toString();
      const url = queryString
        ? `/sessions/booked/${childId}?${queryString}`
        : `/sessions/booked/${childId}`;
      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};

export const useGetAvailableSessions = (
  childId: string,
  options?: {
    status?: string;
    date?: string;
    dayOfWeek?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ["available-sessions", childId, options],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const params = new URLSearchParams();

      if (options?.status && options.status !== "all")
        params.append("status", options.status);
      if (options?.date) params.append("date", options.date);
      if (options?.dayOfWeek && options.dayOfWeek !== "all")
        params.append("dayOfWeek", options.dayOfWeek);
      if (options?.search) params.append("search", options.search);
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());

      const queryString = params.toString();
      const url = queryString
        ? `/sessions/available/${childId}?${queryString}`
        : `/sessions/available/${childId}`;
      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};

// Tutor Availability Queries
export const useGetTutorAvailability = () => {
  return useQuery({
    queryKey: ["tutor-availability"],
    queryFn: async (): Promise<APIGetResponse<TutorDetails>> => {
      const response = await axiosInstance.get("/tutor-availability");
      return response.data;
    },
  });
};

// Parent Queries
export const useGetAllParents = () => {
  return useQuery({
    queryKey: ["all-parents"],
    queryFn: async (): Promise<APIGetResponse<ParentDetails[]>> => {
      const response = await axiosInstance.get("/parents");
      return response.data;
    },
  });
};

// Bulk Import Queries
export const useGetTemplate = (
  type: "csv" | "json",
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["template", type],
    queryFn: async (): Promise<string> => {
      const response = await axiosInstance.get(`/bulk-import/template/${type}`);
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
};

// Question Queries
export const useGetQuestions = (options?: QuestionQueryOptions) => {
  return useQuery({
    queryKey: ["questions", options],
    queryFn: async (): Promise<{
      questions: Question[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    }> => {
      const params = new URLSearchParams();

      if (options?.search) params.append("search", options.search);
      if (options?.type) {
        params.append("type", options.type);
      }
      if (options?.difficulty !== undefined)
        params.append("difficulty", options.difficulty.toString());
      if (options?.difficultyMin !== undefined)
        params.append("difficultyMin", options.difficultyMin.toString());
      if (options?.difficultyMax !== undefined)
        params.append("difficultyMax", options.difficultyMax.toString());
      if (options?.tags && options.tags.length > 0) {
        options.tags.forEach((tag: string) => params.append("tags", tag));
      }
      if (options?.isPublic !== undefined)
        params.append("isPublic", options.isPublic.toString());
      if (options?.createdBy) params.append("createdBy", options.createdBy);
      if (options?.collectionId)
        params.append("collectionId", options.collectionId);
      if (options?.folderId) params.append("folderId", options.folderId);

      if (options?.dateFrom) params.append("dateFrom", options.dateFrom);
      if (options?.dateTo) params.append("dateTo", options.dateTo);

      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());

      if (options?.sortBy) params.append("sortBy", options.sortBy);
      if (options?.sortOrder) params.append("sortOrder", options.sortOrder);

      const queryString = params.toString();
      const url = queryString ? `/questions?${queryString}` : "/questions";

      const response = await axiosInstance.get(url);
      const result = response.data;

      // Transform the API response to match our expected structure
      return {
        questions: result.data || [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 20,
          totalCount: result.pagination?.totalCount || 0,
          totalPages: result.pagination?.totalPages || 1,
          hasNextPage: result.pagination?.hasNextPage || false,
          hasPreviousPage: result.pagination?.hasPreviousPage || false,
        },
      };
    },
  });
};

export const useGetQuestionById = (
  id: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["question", id],
    queryFn: async (): Promise<APIGetResponse<Question>> => {
      const response = await axiosInstance.get(`/questions/${id}`);
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
};

// Folder Queries
export const useGetFolders = () => {
  return useQuery({
    queryKey: ["folders"],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const response = await axiosInstance.get("/folder");
      return response.data;
    },
    select: (data: APIGetResponse<any>) => {
      const flattenFolders = (
        folders: any[],
        parentId: string | null = null
      ): any[] => {
        const result: any[] = [];

        folders.forEach((folder) => {
          // Create a copy of the folder with the correct parentFolderId
          const flattenedFolder = {
            ...folder,
            parentFolderId: parentId,
          };

          result.push(flattenedFolder);

          // Recursively process subfolders
          if (folder.subFolders && Array.isArray(folder.subFolders)) {
            const subFolders = flattenFolders(folder.subFolders, folder.id);
            result.push(...subFolders);
          }
        });

        return result;
      };

      return {
        ...data,
        data: flattenFolders(data.data || []),
        nestedData: data.data || [],
      };
    },
  });
};

export const useGetFolderById = (id: string) => {
  return useQuery({
    queryKey: ["folder", id],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const response = await axiosInstance.get(`/folder/${id}`);
      return response.data;
    },
    select: (data: APIGetResponse<any>) => {
      // The API returns { status, message, data: {...} }
      // We want to return the data object directly for easier consumption
      return {
        ...data,
        data: data.data || null,
      };
    },
  });
};

// Quiz Queries
export const useGetQuiz = (id: string) => {
  return useQuery({
    queryKey: ["quiz", id],
    queryFn: async (): Promise<APIGetResponse<Quiz>> => {
      const response = await axiosInstance.get(`/quizzes/${id}`);
      return response.data;
    },
  });
};

export const useGetQuizQuestions = (quizId: string) => {
  return useQuery({
    queryKey: ["quiz-questions", quizId],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const response = await axiosInstance.get(`/quizzes/${quizId}/questions`);
      return response.data;
    },
    enabled: !!quizId,
  });
};

export const useGetQuizzes = (options?: {
  search?: string;
  status?: "draft" | "published" | "archived";
  lessonId?: string;
  gradeId?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["quizzes", options],
    queryFn: async (): Promise<{
      quizzes: Quiz[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    }> => {
      const params = new URLSearchParams();

      if (options?.search) params.append("searchTitle", options.search);
      if (options?.status) params.append("status", options.status);
      if (options?.lessonId) params.append("lessonId", options.lessonId);
      if (options?.gradeId) params.append("gradeId", options.gradeId);
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/quizzes?${queryString}` : "/quizzes";

      const response = await axiosInstance.get(url);
      const result = response.data;

      // Transform the API response to match our expected structure
      return {
        quizzes: result.data || [],
        pagination: {
          page: result.pagination?.page || 1,
          limit: result.pagination?.limit || 20,
          totalCount: result.pagination?.totalCount || 0,
          totalPages: result.pagination?.totalPages || 1,
          hasNextPage: result.pagination?.hasNextPage || false,
          hasPreviousPage: result.pagination?.hasPreviousPage || false,
        },
      };
    },
  });
};

// Collection Queries
export const useGetCollections = () => {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const response = await axiosInstance.get("/collections");
      return response.data;
    },
  });
};

export const useGetCollection = (id?: string) => {
  return useQuery({
    queryKey: ["collection", id],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      if (!id)
        return {
          status: "success",
          message: "No ID provided",
          data: { collection: null },
        };
      const response = await axiosInstance.get(`/collections/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Curriculum Queries
export const useGetCurricula = (
  params: {
    searchTitle?: string;
    gradeLevel?: string;
    minGradeLevel?: number;
    maxGradeLevel?: number;
    isPublic?: boolean;
    page?: number;
    limit?: number;
    offerType?: string;
  } = {}
) => {
  return useQuery({
    queryKey: ["curricula", params],
    queryFn: async (): Promise<{
      curricula: Curriculum[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    }> => {
      const searchParams = new URLSearchParams();

      if (params.searchTitle) {
        searchParams.append("searchTitle", params.searchTitle);
      }
      if (params.gradeLevel) {
        searchParams.append("gradeLevel", params.gradeLevel);
      }
      if (params.minGradeLevel !== undefined) {
        searchParams.append("minGradeLevel", params.minGradeLevel.toString());
      }
      if (params.maxGradeLevel !== undefined) {
        searchParams.append("maxGradeLevel", params.maxGradeLevel.toString());
      }
      if (params.isPublic !== undefined) {
        searchParams.append("isPublic", params.isPublic.toString());
      }
      if (params.offerType) {
        searchParams.append("offerType", params.offerType);
      }
      if (params.page !== undefined) {
        searchParams.append("page", params.page.toString());
      }
      if (params.limit !== undefined) {
        searchParams.append("limit", params.limit.toString());
      }

      const queryString = searchParams.toString();
      const url = queryString ? `/curriculum?${queryString}` : "/curriculum";

      const response = await axiosInstance.get(url);
      const result = response.data;

      // Transform the API response to match our expected structure
      return {
        curricula: result.data || [],
        pagination: {
          page: result.pagination?.page || 1,
          limit: result.pagination?.limit || 20,
          totalCount: result.pagination?.totalCount || 0,
          totalPages: result.pagination?.totalPages || 1,
          hasNextPage: result.pagination?.hasNextPage || false,
          hasPreviousPage: result.pagination?.hasPreviousPage || false,
        },
      };
    },
  });
};

export const useGetCurriculum = (curriculumId?: string) => {
  return useQuery({
    queryKey: ["curriculum", curriculumId],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const response = await axiosInstance.get(`/curriculum/${curriculumId}`);
      return response.data;
    },
    enabled: !!curriculumId,
  });
};

// Lesson Queries
export const useGetLessonById = (id: string) => {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: async (): Promise<APIGetResponse<Lesson>> => {
      const response = await axiosInstance.get(`/lesson/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useGetQuizzesForLesson = (lessonId: string) => {
  return useQuery({
    queryKey: ["quizzes-for-lesson", lessonId],
    queryFn: async (): Promise<APIGetResponse<Quiz[]>> => {
      const response = await axiosInstance.get(`/lesson/${lessonId}/quizzes`);
      return response.data;
    },
    enabled: !!lessonId,
  });
};

// Chats
export const useGetTutorChatList = () => {
  return useQuery({
    queryKey: ["tutor-chat-list"],
    queryFn: async (): Promise<APIGetResponse<Chat[]>> => {
      const response = await axiosInstance.get("/chat/tutor");
      return response.data;
    },
  });
};

export const useGetStudentChatList = ({ childId }: { childId: string }) => {
  return useQuery({
    queryKey: ["student-chat-list"],
    queryFn: async (): Promise<APIGetResponse<Chat[]>> => {
      const response = await axiosInstance.get(
        `/chat/child?childId=${childId}`
      );
      return response.data;
    },
    enabled: !!childId,
  });
};

export const useGetChatMessages = (
  chatId: string,
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: ["chat-messages", chatId, page],
    queryFn: async (): Promise<APIGetResponse<Message[]>> => {
      const response = await axiosInstance.get(
        `/chat/${chatId}/messages?page=${page}&limit=${limit}`
      );
      return response.data;
    },
    enabled: !!chatId,
  });
};

export const useGetChatById = (chatId: string) => {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: async (): Promise<APIGetResponse<Chat>> => {
      const response = await axiosInstance.get(`/chat/${chatId}`);
      return response.data;
    },
    enabled: !!chatId,
  });
};

// Tag Queries
export const useGetTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async (): Promise<APIGetResponse<string[]>> => {
      const response = await axiosInstance.get("/tags");
      return response.data;
    },
  });
};

export const useGetTagSearch = (tag: string) => {
  return useQuery({
    queryKey: ["tag-search", tag],
    queryFn: async (): Promise<APIGetResponse<string[]>> => {
      const response = await axiosInstance.get(`/tags/search?tag=${tag}`);
      return response.data;
    },
    enabled: !!tag,
  });
};

export const useGetPopularTags = () => {
  return useQuery({
    queryKey: ["popular-tags"],
    queryFn: async (): Promise<APIGetResponse<string[]>> => {
      const response = await axiosInstance.get("/tags/popular");
      return response.data;
    },
  });
};

export const useGetTagLessons = (tag: string) => {
  return useQuery({
    queryKey: ["tag-lessons", tag],
    queryFn: async (): Promise<APIGetResponse<Lesson[]>> => {
      const response = await axiosInstance.get(`/tags/${tag}/lessons`);
      return response.data;
    },
    enabled: !!tag,
  });
};

// Child Library Queries
export const useGetLibrary = (childId: string) => {
  return useQuery({
    queryKey: ["library", childId],
    queryFn: async (): Promise<APIGetResponse<LibraryCurriculum[]>> => {
      const response = await axiosInstance.get(`/library/${childId}`);
      return response.data;
    },
    enabled: !!childId,
  });
};

export const useGetChildLessons = (
  childId: string,
  curriculumId: string,
  sectionId?: string
) => {
  return useQuery({
    queryKey: ["child-lessons", childId, curriculumId, sectionId],
    queryFn: async (): Promise<APIGetResponse<ChildLesson[]>> => {
      const url = sectionId
        ? `/library/${childId}/curriculums/${curriculumId}/lessons?sectionId=${sectionId}`
        : `/library/${childId}/curriculums/${curriculumId}/lessons`;
      const response = await axiosInstance.get(url);
      return response.data;
    },
    enabled: !!childId && !!curriculumId,
  });
};

// Analytics Queries
export const useGetAnalytics = () => {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async (): Promise<APIGetResponse<Analytics>> => {
      const response = await axiosInstance.get("/analytics");
      return response.data;
    },
  });
};

export const useGetTutorAnalytics = (tutorId: string) => {
  return useQuery({
    queryKey: ["tutor-analytics", tutorId],
    queryFn: async (): Promise<APIGetResponse<TutorAnalytics>> => {
      const response = await axiosInstance.get(`/analytics/tutor/${tutorId}`);
      return response.data;
    },
    enabled: !!tutorId,
  });
};

// Activity Queries
export const useGetActivityLog = (cursor?: string, limit?: number) => {
  return useQuery({
    queryKey: ["activity-log", cursor, limit],
    queryFn: async (): Promise<{
      status: string;
      message: string;
      data: {
        message: string;
        timestamp: string;
      }[];
      pagination: {
        nextCursor: string | null;
        hasMore: boolean;
      };
    }> => {
      const response = await axiosInstance.get("/activity-log", {
        params: {
          cursor,
          limit,
        },
      });
      return response.data;
    },
  });
};

// Twillio Queries
export const useGetSessionMeetingUrl = (sessionId: string) => {
  return useQuery({
    queryKey: ["session-meeting-url", sessionId],
    queryFn: async (): Promise<APIGetResponse<string>> => {
      const response = await axiosInstance.get(
        `/twilio-video/url/${sessionId}`
      );
      return response.data;
    },
    enabled: !!sessionId,
  });
};

// Support Queries
export const useGetSupports = () => {
  return useQuery({
    queryKey: ["supports"],
    queryFn: async (): Promise<APIGetResponse<SupportTicket[]>> => {
      const response = await axiosInstance.get("/support");
      return response.data;
    },
  });
};

export const useGetSupportTicketById = (id: string) => {
  return useQuery({
    queryKey: ["support", id],
    queryFn: async (): Promise<APIGetResponse<SupportTicket>> => {
      const response = await axiosInstance.get(`/support/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Tutor Change Queries
export const useGetTutorChangeRequests = () => {
  return useQuery({
    queryKey: ["tutor-change-requests"],
    queryFn: async (): Promise<APIGetResponse<ChangeRequest[]>> => {
      const response = await axiosInstance.get("/tutor-change-request");
      return response.data;
    },
  });
};

export const useGetChangeRequestById = (id: string) => {
  return useQuery({
    queryKey: ["tutor-change-request", id],
    queryFn: async (): Promise<APIGetResponse<ChangeRequest>> => {
      const response = await axiosInstance.get(`/tutor-change-request/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Homework Queries
export const useGetHomework = (childId?: string) => {
  return useQuery({
    queryKey: ["homeworks", childId],
    queryFn: async (): Promise<APIGetResponse<Homework[]>> => {
      const response = await axiosInstance.get(`/homework`, {
        params: {
          childId,
        },
      });
      return response.data;
    },
  });
};

export const useGetHomeworkById = (id: string) => {
  return useQuery({
    queryKey: ["homework", id],
    queryFn: async (): Promise<APIGetResponse<HomeworkReview>> => {
      const response = await axiosInstance.get(`/homework/${id}/review`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useGetQuizAttemptById = (attemptId: string) => {
  return useQuery({
    queryKey: ["quiz-attempt", attemptId],
    queryFn: async (): Promise<APIGetResponse<HomeworkReview>> => {
      const response = await axiosInstance.get(`/quiz-attempts/${attemptId}/review`);
      return response.data;
    },
    enabled: !!attemptId,
  });
};

// Section Queries
export const useGetSections = () => {
  return useQuery({
    queryKey: ["sections"],
    queryFn: async (): Promise<APIGetResponse<Section[]>> => {
      const response = await axiosInstance.get("/sections");
      return response.data;
    },
  });
};

export const useGetSectionById = (id: string, offerType?: string) => {
  return useQuery({
    queryKey: ["section", id],
    queryFn: async (): Promise<APIGetResponse<Section>> => {
      const response = await axiosInstance.get(
        `/sections/${id}?offerType=${offerType}`
      );
      return response.data;
    },
    enabled: !!id && !!offerType,
  });
};
