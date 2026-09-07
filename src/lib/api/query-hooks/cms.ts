import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";
import {
  APIGetResponse,
  Question,
  QuestionQueryOptions,
  Quiz,
  Curriculum,
  Lesson,
  QuizResumeAttempt,
} from "../../types";

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

export type FetchQuestionsOptions = Omit<QuestionQueryOptions, "type"> & {
  type?: QuestionQueryOptions["type"] | QuestionQueryOptions["type"][] | string[];
};

export type QuestionsListResult = {
  questions: Question[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export async function fetchQuestions(
  options?: FetchQuestionsOptions,
): Promise<QuestionsListResult> {
  const params = new URLSearchParams();

  if (options?.search) params.append("search", options.search);
  if (options?.type) {
    const types = Array.isArray(options.type) ? options.type : [options.type];
    types.forEach((t) => {
      if (t) params.append("type", t);
    });
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
  if (options?.sortOrder)
    params.append("sortOrder", options.sortOrder.toUpperCase());

  const queryString = params.toString();
  const url = queryString ? `/questions?${queryString}` : "/questions";

  const response = await axiosInstance.get(url);
  const result = response.data;

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
}

export async function fetchQuestionById(id: string): Promise<APIGetResponse<Question>> {
  const response = await axiosInstance.get(`/questions/${id}`);
  return response.data;
}

// Question Queries
export const useGetQuestions = (options?: QuestionQueryOptions) => {
  return useQuery({
    queryKey: [
      "questions",
      options?.search ?? "",
      options?.type ?? "",
      options?.difficulty ?? "",
      options?.difficultyMin ?? "",
      options?.difficultyMax ?? "",
      options?.tags?.join(",") ?? "",
      options?.isPublic ?? "",
      options?.createdBy ?? "",
      options?.collectionId ?? "",
      options?.folderId ?? "",
      options?.dateFrom ?? "",
      options?.dateTo ?? "",
      options?.page ?? "",
      options?.limit ?? "",
      options?.sortBy ?? "",
      options?.sortOrder ?? "",
    ],
    queryFn: () => fetchQuestions(options),
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
    enabled: Boolean(id?.trim()),
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

export const useGetResumeQuizAttempt = (attemptId: string) => {
  return useQuery({
    queryKey: ["resume-quiz-attempt", attemptId],
    queryFn: async (): Promise<APIGetResponse<QuizResumeAttempt>> => {
      const response = await axiosInstance.get(`/quiz-attempts/${attemptId}/resume`);
      return response.data;
    },
    enabled: !!attemptId,
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
  } = {},
  options?: { enabled?: boolean }
) => {
  // Primitive queryKey — avoid a new object reference each render (unstable keys → refetch loops)
  const curriculaQueryKey = [
    "curricula",
    params.offerType ?? "",
    params.searchTitle ?? "",
    params.gradeLevel ?? "",
    params.minGradeLevel ?? "",
    params.maxGradeLevel ?? "",
    params.isPublic === undefined ? "__" : String(params.isPublic),
    params.page ?? "",
    params.limit ?? "",
  ] as const;

  return useQuery({
    queryKey: curriculaQueryKey,
    enabled: options?.enabled !== undefined ? options.enabled : true,
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
export const useGetLessonById = (
  id: string,
  options?: { enabled?: boolean }
) => {
  const baseEnabled = !!id;
  const enabled =
    options?.enabled === undefined
      ? baseEnabled
      : baseEnabled && options.enabled;
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: async (): Promise<APIGetResponse<Lesson>> => {
      const response = await axiosInstance.get(`/lesson/${id}`);
      return response.data;
    },
    enabled,
  });
};

export const useGetQuizzesForLesson = (lessonId: string, childId?: string) => {
  return useQuery({
    queryKey: ["quizzes-for-lesson", lessonId, childId ?? ""],
    queryFn: async (): Promise<APIGetResponse<Quiz[]>> => {
      const q = childId
        ? `?childId=${encodeURIComponent(childId)}`
        : "";
      const response = await axiosInstance.get(
        `/lesson/${lessonId}/quizzes${q}`
      );
      return response.data;
    },
    enabled: !!lessonId,
  });
};
