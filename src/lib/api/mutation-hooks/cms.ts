import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";

import { AxiosError } from "axios";

import {
  ApiResponse,
  Question,
  Quiz,
  QuizUpdateData,
  Lesson,
  Curriculum,
  QuizAttempt,
} from "../../types";
import { handleErrorMessage } from "./handle-error";

// Bulk Import Mutations
export const usePostValidate = (type: "csv" | "json") => {
  return useMutation({
    mutationKey: ["post-validate", type],
    mutationFn: (data: {
      file: File;
    }): Promise<ApiResponse<{ message: string }>> => {
      const formData = new FormData();
      formData.append("file", data.file);
      return axiosInstance.post(`/bulk-import/validate/${type}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostBulkImport = (type: "csv" | "json") => {
  return useMutation({
    mutationKey: ["post-bulk-import", type],
    mutationFn: (data: {
      file: File;
      addToQuizId?: string;
      folderId?: string;
    }): Promise<ApiResponse<{ message: string }>> => {
      const formData = new FormData();
      formData.append("file", data.file);
      if (data.addToQuizId) {
        formData.append("addToQuizId", data.addToQuizId);
      }
      if (data.folderId) {
        formData.append("folderId", data.folderId);
      }
      return axiosInstance.post(`/bulk-import/import/${type}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Question Mutations
export const usePostQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-question"],
    mutationFn: (data: FormData): Promise<ApiResponse<Question>> =>
      axiosInstance.post("/questions", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: (data: ApiResponse<Question>) => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutQuestion = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-question", id],
    mutationFn: (data: FormData): Promise<ApiResponse<Question>> =>
      axiosInstance.put(`/questions/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: (data: ApiResponse<Question>) => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["question", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["quiz-questions"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteQuestion = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-question", id],
    mutationFn: (): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/questions/${id}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["question", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteQuestions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-questions"],
    mutationFn: (data: {
      ids: string[];
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete("/questions/bulk", { data }),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["question"],
      });
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["folder"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Folder Mutations
export const usePostFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-folder"],
    mutationFn: (data: {
      name: string;
      description: string;
      parentFolderId?: string;
    }): Promise<
      ApiResponse<{
        id: string;
        name: string;
        description: string;
        parentFolderId?: string;
        createdAt: string;
        updatedAt: string;
      }>
    > => axiosInstance.post("/folder", data),
    onSuccess: (
      data: ApiResponse<{
        id: string;
        name: string;
        description: string;
        parentFolderId?: string;
        createdAt: string;
        updatedAt: string;
      }>,
    ) => {
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteFolder = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-folder", id],
    mutationFn: (): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/folder/${id}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteFolderDynamic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-folder-dynamic"],
    mutationFn: (folderId: string): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/folder/${folderId}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchFolder = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-folder", id],
    mutationFn: (data: {
      name: string;
      description: string;
      parentFolderId?: string;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.patch(`/folder/${id}`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutAddQuestionsToFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-add-questions-to-folder"],
    mutationFn: (data: {
      questionIds: string[];
      targetFolderId: string;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.put(`/folder/${data.targetFolderId}/questions`, {
        questionIds: data.questionIds,
      }),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["folders"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Quiz Mutations
export const usePostQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-quiz"],
    mutationFn: (data: Quiz): Promise<ApiResponse<Quiz>> =>
      axiosInstance.post("/quizzes", data),
    onSuccess: (data: ApiResponse<Quiz>) => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["quizzes-for-lesson"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutQuiz = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-quiz", id],
    mutationFn: (data: QuizUpdateData): Promise<ApiResponse<Quiz>> =>
      axiosInstance.put(`/quizzes/${id}`, data),
    onSuccess: (data: ApiResponse<Quiz>) => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["quiz", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-quiz"],
    mutationFn: (data: {
      quizIds: string[];
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/quizzes`, { data }),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchUpdateQuizStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-update-quiz-status"],
    mutationFn: (data: {
      quizIds: string[];
      status: string;
    }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.patch(`/quizzes/status`, data),
    onSuccess: (data: ApiResponse<Quiz>) => {
      queryClient.invalidateQueries({
        queryKey: ["quizzes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["quiz"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostAddQuestionToQuiz = () => {
  return useMutation({
    mutationKey: ["post-add-question-to-quiz"],
    mutationFn: (data: {
      quizId: string;
      questionId: string;
    }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.post(`/quizzes/${data.quizId}/questions`, {
        questionId: data.questionId,
      }),
    onSuccess: (data: ApiResponse<Quiz>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostAttemptQuiz = (id: string) => {
  return useMutation({
    mutationKey: ["post-attempt-quiz", id],
    mutationFn: (data: {
      childId?: string;
    }): Promise<ApiResponse<QuizAttempt>> =>
      axiosInstance.post(`/quizzes/${id}/attempt`, data),
    onSuccess: (data: ApiResponse<QuizAttempt>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostSubmitQuiz = (id: string, attemptId: string) => {
  return useMutation({
    mutationKey: ["post-submit-quiz", id, attemptId],
    mutationFn: (data: {
      answers: Record<string, string | Record<string, string>>;
      timeSpent?: number;
    }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.post(`/quizzes/${id}/attempt/${attemptId}/submit`, data),
    onSuccess: (data: ApiResponse<Quiz>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostSubmitQuizQuestionDynamic = (
  id: string,
  attemptId: string,
) => {
  return useMutation({
    mutationKey: ["post-submit-quiz-question-dynamic", id, attemptId],
    mutationFn: ({
      questionId,
      answer,
      timeSpent,
    }: {
      questionId: string;
      answer: string;
      timeSpent?: number;
    }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.post(
        `/quizzes/${id}/attempt/${attemptId}/question/${questionId}/submit`,
        { answer, timeSpent },
      ),
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchUpdateQuizQuestionDynamic = (
  id: string,
  attemptId: string,
) => {
  return useMutation({
    mutationKey: ["patch-update-quiz-question-dynamic", id, attemptId],
    mutationFn: ({
      questionId,
      answer,
      timeSpent,
    }: {
      questionId: string;
      answer: string;
      timeSpent?: number;
    }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.patch(
        `/quizzes/${id}/attempt/${attemptId}/question/${questionId}/submit`,
        { answer, timeSpent },
      ),
    onSuccess: (data: ApiResponse<Quiz>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchAddQuizFeedback = (questionAttemptId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-add-quiz-feedback", questionAttemptId],
    mutationFn: (data: { feedback: string }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.patch(
        `/question-attempts/${questionAttemptId}/feedback`,
        data,
      ),
    onSuccess: (data: ApiResponse<Quiz>) => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchMarkQuizQuestionAsCorrect = (questionAttemptId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-mark-quiz-question-as-correct", questionAttemptId],
    mutationFn: (
      data: { feedback?: string; addToCorrectOptions?: boolean } = {},
    ): Promise<ApiResponse<Quiz>> =>
      axiosInstance.patch(
        `/question-attempts/${questionAttemptId}/mark-correct`,
        data,
      ),
    onSuccess: (data: ApiResponse<Quiz>) => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      queryClient.invalidateQueries({ queryKey: ["homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      queryClient.invalidateQueries({ queryKey: ["homework-details"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-attempt"] });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchQuizAttemptOverallFeedback = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-quiz-attempt-overall-feedback", id],
    mutationFn: (data: { feedback: string }): Promise<ApiResponse<Quiz>> =>
      axiosInstance.patch(`/quiz-attempts/${id}/feedback`, data),
    onSuccess: (data: ApiResponse<Quiz>) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempt"] });
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Curriculum Mutations
export const usePostCurriculum = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-curriculum"],
    mutationFn: (data: Curriculum): Promise<ApiResponse<Curriculum>> =>
      axiosInstance.post("/curriculum", data),
    onSuccess: (data: ApiResponse<Curriculum>) => {
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutCurriculum = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-curriculum", id],
    mutationFn: (data: Curriculum): Promise<ApiResponse<Curriculum>> =>
      axiosInstance.put(`/curriculum/${id}`, data),
    onSuccess: (data: ApiResponse<Curriculum>) => {
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteCurriculum = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-curriculum", id],
    mutationFn: (): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/curriculum/${id}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchReorderCurriculum = (subscriptionPlanId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-reorder-curriculum", subscriptionPlanId],
    mutationFn: (data: {
      curriculumIds: string[];
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.patch(`/curriculum/${subscriptionPlanId}/curricula`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostDuplicateCurriculum = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-duplicate-curriculum", id],
    mutationFn: (data: {
      subscriptionPlanId: string;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.post(`/curriculum/${id}/duplicate`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["curricula"],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum", id],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Lesson Mutations
export const usePostLesson = (curriculumId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-lesson", curriculumId],
    mutationFn: (data: Lesson): Promise<ApiResponse<Lesson>> =>
      axiosInstance.post(`/curriculum/${curriculumId}/lessons`, data),
    onSuccess: (data: ApiResponse<Lesson>) => {
      queryClient.invalidateQueries({
        queryKey: ["curriculum", curriculumId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lesson"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutLesson = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-lesson", lessonId],
    mutationFn: (data: Lesson): Promise<ApiResponse<Lesson>> =>
      axiosInstance.put(`/lesson/${lessonId}`, data),
    onSuccess: (data: ApiResponse<Lesson>) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson", lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchLessonQuizzes = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-lesson-quizzes", lessonId],
    mutationFn: (data: { quizIds: string[] }): Promise<ApiResponse<Lesson>> =>
      axiosInstance.patch(`/lesson/${lessonId}/quizzes`, data),
    onSuccess: (data: ApiResponse<Lesson>) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson", lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["quizzes-for-lesson", lessonId],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteLesson = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-lesson", lessonId],
    mutationFn: (): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.delete(`/lesson/${lessonId}`),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson", lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchReorderLessons = (curriculumId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-reorder-lessons", curriculumId],
    mutationFn: (data: {
      lessonIds: string[];
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.patch(`/lesson/${curriculumId}/reorder`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson", curriculumId],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostDuplicateLessonToCurriculum = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-duplicate-lesson-to-curriculum", lessonId],
    mutationFn: (data: {
      targetCurriculumId: string;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.post(`/lesson/${lessonId}/curriculum`, data),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson", lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["curriculum"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Uploader
export const usePostUploader = () => {
  return useMutation({
    mutationKey: ["post-uploader"],
    mutationFn: (data: {
      key: string;
      contentType: string;
    }): Promise<ApiResponse<{ fileKeyName: string; url: string }>> =>
      axiosInstance.post("/s3/pre-signed-url", data),
    onSuccess: (data: ApiResponse<{ fileKeyName: string; url: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostDuplicateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-duplicate-question"],
    mutationFn: (id: string): Promise<ApiResponse<Question>> =>
      axiosInstance.post(`/questions/${id}/duplicate`),
    onSuccess: (data: ApiResponse<Question>) => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchReorderFolders = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-reorder-folders"],
    mutationFn: (
      folderOrders: Array<{ id: string; order_index: number }>,
    ): Promise<void> =>
      Promise.all(
        folderOrders.map((folder) =>
          axiosInstance.patch(`/folder/${folder.id}`, {
            orderIndex: folder.order_index,
          }),
        ),
      ).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-collection"],
    mutationFn: (data: {
      name: string;
      description?: string | null;
    }): Promise<ApiResponse<unknown>> => axiosInstance.post("/collections", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePutCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["put-collection"],
    mutationFn: (data: {
      id: string;
      name?: string;
      description?: string | null;
    }): Promise<ApiResponse<unknown>> => {
      const { id, ...body } = data;
      return axiosInstance.put(`/collections/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection"] });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-collection"],
    mutationFn: (id: string): Promise<unknown> =>
      axiosInstance.delete(`/collections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostCollectionQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-collection-question"],
    mutationFn: (data: {
      collectionId: string;
      questionId: string;
    }): Promise<unknown> =>
      axiosInstance.post(`/collections/${data.collectionId}/questions`, {
        questionId: data.questionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection"] });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteCollectionQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-collection-question"],
    mutationFn: (data: {
      collectionId: string;
      questionId: string;
    }): Promise<unknown> =>
      axiosInstance.delete(
        `/collections/${data.collectionId}/questions/${data.questionId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection"] });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchReorderCollectionQuestions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-reorder-collection-questions"],
    mutationFn: (data: {
      collectionId: string;
      questionOrders: Array<{ questionId: string; orderIndex: number }>;
    }): Promise<unknown> =>
      axiosInstance.patch(`/collections/${data.collectionId}/reorder`, {
        questionOrders: data.questionOrders,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection"] });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

