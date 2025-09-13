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

export const useGetQuestionById = (id: string) => {
  return useQuery({
    queryKey: ["question", id],
    queryFn: async (): Promise<APIGetResponse<Question>> => {
      const response = await axiosInstance.get(`/questions/${id}`);
      return response.data;
    },
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
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const response = await axiosInstance.get(`/lessons/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useGetQuizzesForLesson = (lessonId: string) => {
  return useQuery({
    queryKey: ["quizzes-for-lesson", lessonId],
    queryFn: async (): Promise<APIGetResponse<any>> => {
      const response = await axiosInstance.get(`/lessons/${lessonId}/quizzes`);
      return response.data;
    },
    enabled: !!lessonId,
  });
};
