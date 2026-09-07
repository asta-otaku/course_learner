import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";

import { AxiosError } from "axios";

import {
  ApiResponse,
  Homework,
  BaselinelineTestCreateData,
  BaselineTest,
  QuizMasterList,
  BaselineTestEntry,
  ChildPreferences,
  LearningPathItem,
} from "../../types";
import { handleErrorMessage } from "./handle-error";

// Child Library Mutations
export const usePatchLessonProgress = (lessonId: string, childId: string) => {
  return useMutation({
    mutationKey: ["patch-lesson-progress", lessonId, childId],
    mutationFn: (data: {
      progress: number;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.patch(
        `/library/${childId}/${lessonId}/progress/quiz`,
        data,
      ),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchVideoLessonProgress = (
  lessonId: string,
  childId: string,
) => {
  return useMutation({
    mutationKey: ["patch-video-lesson-progress", lessonId, childId],
    mutationFn: (data: {
      childId: string;
      watchedPosition: number;
    }): Promise<ApiResponse<{ message: string }>> =>
      axiosInstance.patch(
        `/library/${childId}/${lessonId}/progress/video`,
        data,
      ),
    onSuccess: (data: ApiResponse<{ message: string }>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      // handleErrorMessage(error);
      console.log(error);
    },
  });
};


// Homework Mutations
export const usePostHomework = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-homework"],
    mutationFn: (data: {
      studentId: string;
      quizId: string;
      dueAt?: string;
    }): Promise<ApiResponse<Homework>> => {
      const body: Record<string, unknown> = {
        studentId: data.studentId,
        quizId: data.quizId,
      };
      if (data.dueAt) body.dueAt = data.dueAt;
      return axiosInstance.post("/homework", body);
    },
    onSuccess: (data: ApiResponse<Homework>) => {
      queryClient.invalidateQueries({
        queryKey: ["homeworks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["homework"],
      });
      queryClient.invalidateQueries({
        queryKey: ["homework-details"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostStartHomework = () => {
  return useMutation({
    mutationKey: ["post-start-homework"],
    mutationFn: (data: {
      homeworkId: string;
      studentId: string;
    }): Promise<ApiResponse<Homework>> =>
      axiosInstance.post("/homework/start", data),
    onSuccess: (data: ApiResponse<Homework>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostSubmitHomework = (id: string, attemptId: string) => {
  return useMutation({
    mutationKey: ["post-submit-homework", id, attemptId],
    mutationFn: (data: {
      answers: Record<string, string | Record<string, string>>;
      timeSpent?: number;
    }): Promise<ApiResponse<Homework>> =>
      axiosInstance.post(`/homework/${id}/attempt/${attemptId}/submit`, data),
    onSuccess: (data: ApiResponse<Homework>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchMarkHomeworkAsReviewed = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-mark-homework-as-reviewed", id],
    mutationFn: (): Promise<ApiResponse<Homework>> =>
      axiosInstance.patch(`/homework/${id}/review`, {}),
    onSuccess: (data: ApiResponse<Homework>) => {
      queryClient.invalidateQueries({
        queryKey: ["homeworks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["homework"],
      });
      queryClient.invalidateQueries({
        queryKey: ["homework-details"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchDismissHomeworkReview = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-dismiss-homework-review", id],
    mutationFn: (): Promise<ApiResponse<Homework>> =>
      axiosInstance.patch(`/homework/${id}/dismiss-from-list`, {
        removedFromList: true,
      }),
    onSuccess: (data: ApiResponse<Homework>) => {
      queryClient.invalidateQueries({
        queryKey: ["homeworks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["homework"],
      });
      queryClient.invalidateQueries({
        queryKey: ["homework-details"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Baseline Test Mutations
export const usePostBaselineTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-baseline-test"],
    mutationFn: (
      data: BaselinelineTestCreateData,
    ): Promise<ApiResponse<BaselineTest>> =>
      axiosInstance.post("/baseline-test", data),
    onSuccess: (data: ApiResponse<BaselineTest>) => {
      queryClient.invalidateQueries({
        queryKey: ["baseline-tests"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostStartBaselineTest = (baselineTestId: string) => {
  return useMutation({
    mutationKey: ["post-start-baseline-test", baselineTestId],
    mutationFn: (data: {
      childProfileId: string;
    }): Promise<ApiResponse<BaselineTest>> =>
      axiosInstance.post(
        `/baseline-test/${baselineTestId}/attempts/start`,
        data,
      ),
    onSuccess: (data: ApiResponse<BaselineTest>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostSubmitBaselineTest = (
  baselineTestId: string,
  attemptId: string,
) => {
  return useMutation({
    mutationKey: ["post-submit-baseline-test", baselineTestId, attemptId],
    mutationFn: (data: {
      answers: Record<string, string | Record<string, string>>;
      timeSpent?: number;
    }): Promise<ApiResponse<BaselineTest>> =>
      axiosInstance.post(
        `/baseline-test/${baselineTestId}/attempts/${attemptId}/submit`,
        data,
      ),
    onSuccess: (data: ApiResponse<BaselineTest>) => {
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Quiz MasterList Mutations
export const usePostAddQuizzesToMasterList = (yearGroupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-add-quizzes-to-master-list", yearGroupId],
    mutationFn: (data: {
      quizIds: string[];
    }): Promise<ApiResponse<QuizMasterList>> =>
      axiosInstance.post(
        `/quiz-master-list/year-groups/${yearGroupId}/quizzes`,
        data,
      ),
    onSuccess: (data: ApiResponse<QuizMasterList>) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-master-list"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostBulkAddQuizzesToMasterList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-bulk-add-quizzes-to-master-list"],
    mutationFn: (data: {
      curriculumLessonId: string;
      yearGroupId: string;
    }): Promise<ApiResponse<QuizMasterList>> =>
      axiosInstance.post(
        `/quiz-master-list/curriculum-lessons/${data.curriculumLessonId}/quizzes`,
        data,
      ),
    onSuccess: (data: ApiResponse<QuizMasterList>) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-master-list"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteQuizzesFromMasterList = (yearGroupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-quizzes-from-master-list", yearGroupId],
    mutationFn: (data: {
      quizIds: string[];
    }): Promise<ApiResponse<QuizMasterList>> =>
      axiosInstance.delete(
        `/quiz-master-list/year-groups/${yearGroupId}/quizzes`,
        { data },
      ),
    onSuccess: (data: ApiResponse<QuizMasterList>) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-master-list"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteQuizFromMasterList = (yearGroupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-quiz-from-master-list", yearGroupId],
    mutationFn: (data: {
      quizId: string;
    }): Promise<ApiResponse<QuizMasterList>> =>
      axiosInstance.delete(
        `/quiz-master-list/year-groups/${yearGroupId}/quizzes/${data.quizId}`,
      ),
    onSuccess: (data: ApiResponse<QuizMasterList>) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-master-list"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostReorderMasterList = (yearGroupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-reorder-master-list", yearGroupId],
    mutationFn: (data: {
      quizIdsInOrder: string[];
    }): Promise<ApiResponse<QuizMasterList>> =>
      axiosInstance.post(
        `/quiz-master-list/year-groups/${yearGroupId}/reorder`,
        data,
      ),
    onSuccess: (data: ApiResponse<QuizMasterList>) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-master-list"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchRefreshMasterList = (yearGroupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-refresh-master-list", yearGroupId],
    mutationFn: (): Promise<ApiResponse<QuizMasterList>> =>
      axiosInstance.patch(`/quiz-master-list/year-groups/${yearGroupId}`),
    onSuccess: (data: ApiResponse<QuizMasterList>) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz-master-list"],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostBaselineTestEntry = (baselineTestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-baseline-test-entry", baselineTestId],
    mutationFn: (data: {
      quizId: string;
      orderIndex: number;
      testQuestionCount: number;
      masteryRules: {
        condition: string;
        threshold: number;
        action: string;
        targetQuizIds: string[];
      }[];
    }): Promise<ApiResponse<BaselineTestEntry>> =>
      axiosInstance.post(
        `/baseline-test-entry/baselineTest/${baselineTestId}`,
        data,
      ),
    onSuccess: (data: ApiResponse<BaselineTestEntry>) => {
      queryClient.invalidateQueries({
        queryKey: ["baseline-test-entry", baselineTestId],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchBaselineTestEntry = (
  baselineTestId: string,
  entryId: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-baseline-test-entry", baselineTestId, entryId],
    mutationFn: (data: {
      orderIndex?: number;
      testQuestionCount?: number;
      masteryRules?: {
        condition: string;
        threshold: number;
        action: string;
        targetQuizIds: string[];
      }[];
    }): Promise<ApiResponse<BaselineTestEntry>> =>
      axiosInstance.patch(
        `/baseline-test-entry/baselineTest/${baselineTestId}/entries/${entryId}`,
        data,
      ),
    onSuccess: (data: ApiResponse<BaselineTestEntry>) => {
      queryClient.invalidateQueries({
        queryKey: ["baseline-test-entry", baselineTestId],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const useDeleteBaselineTestEntry = (
  baselineTestId: string,
  entryId: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["delete-baseline-test-entry", baselineTestId, entryId],
    mutationFn: (): Promise<ApiResponse<BaselineTestEntry>> =>
      axiosInstance.delete(
        `/baseline-test-entry/baselineTest/${baselineTestId}/entries/${entryId}`,
      ),
    onSuccess: (data: ApiResponse<BaselineTestEntry>) => {
      queryClient.invalidateQueries({
        queryKey: ["baseline-test-entry", baselineTestId],
      });
      return data;
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

// Learning Path Config Mutations
export const usePatchChildPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-child-preferences"],
    mutationFn: (data: {
      childProfileId: string;
      selectedCurriculumId: string;
      weeklyQuota: number;
      pauseAssignments: boolean;
    }): Promise<ApiResponse<ChildPreferences>> =>
      axiosInstance.patch(
        `/child-profiles/${data.childProfileId}/preferences`,
        {
          selectedCurriculumId: data.selectedCurriculumId,
          weeklyQuota: data.weeklyQuota,
          pauseAssignments: data.pauseAssignments,
        },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["child-preferences", variables.childProfileId],
      });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePostAssignBaselineTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["post-assign-baseline-test"],
    mutationFn: async ({
      childId,
      yearGroupId,
    }: {
      childId: string;
      yearGroupId: string;
    }): Promise<ApiResponse<BaselineTest>> =>
      axiosInstance.post(`/baseline-test/assign/${childId}`, {
        yearGroupId,
      }),
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({
        queryKey: ["child-baseline-test", childId],
      });
      queryClient.invalidateQueries({
        queryKey: ["child-baseline-test-entries", childId],
      });
      queryClient.invalidateQueries({
        queryKey: ["child-scheme-of-work", childId],
      });
      queryClient.invalidateQueries({
        queryKey: ["child-learning-path-summary", childId],
      });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchReorderLearningPathItems = (childId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-reorder-learning-path-items", childId],
    mutationFn: (data: {
      quizIdsInOrder: string[];
    }): Promise<ApiResponse<LearningPathItem>> =>
      axiosInstance.patch(`/learning-path/${childId}/reorder`, data),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({
        queryKey: ["child-learning-path-summary", childId],
      });
      queryClient.invalidateQueries({
        queryKey: ["child-scheme-of-work", childId],
      });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchSkipLearningPathItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-skip-learning-path-item"],
    mutationFn: (data: {
      childId: string;
      quizId: string;
    }): Promise<ApiResponse<LearningPathItem>> =>
      axiosInstance.patch(
        `/learning-path/${data.childId}/items/${data.quizId}/skip`,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["child-learning-path-summary", variables.childId],
      });
      queryClient.invalidateQueries({
        queryKey: ["child-scheme-of-work", variables.childId],
      });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};

export const usePatchUnskipLearningPathItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["patch-unskip-learning-path-item"],
    mutationFn: (data: {
      childId: string;
      quizId: string;
    }): Promise<ApiResponse<LearningPathItem>> =>
      axiosInstance.patch(
        `/learning-path/${data.childId}/items/${data.quizId}/unskip`,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["child-learning-path-summary", variables.childId],
      });
      queryClient.invalidateQueries({
        queryKey: ["child-scheme-of-work", variables.childId],
      });
    },
    onError: (error: AxiosError) => {
      handleErrorMessage(error);
    },
  });
};
