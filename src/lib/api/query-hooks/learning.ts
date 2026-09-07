import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../services/axiosInstance";
import {
  APIGetResponse,
  Lesson,
  LibraryCurriculum,
  ChildLesson,
  Homework,
  HomeworkReview,
  Section,
  BaselineTest,
  QuizMasterList,
  YearGroup,
  BaselineTestEntry,
  LearningPath,
  BaselineTestAttempt,
  SchemeOfWork,
  LearningPathSummary,
  LearningHistory,
  ChildPreferences,
  RecentHomeworkItem,
  HistoryHomeworkItem,
} from "../../types";

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
export const useGetLibrary = (childId: string, curriculumId: string) => {
  return useQuery({
    queryKey: ["library", childId, curriculumId],
    queryFn: async (): Promise<APIGetResponse<LibraryCurriculum[]>> => {
      const response = await axiosInstance.get(`/library/${childId}/curriculums/${curriculumId}`);
      return response.data;
    },
    enabled: !!childId && !!curriculumId,
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

/**
 * Continue-lessons / next-lesson API may return:
 * - `ChildLesson[]`
 * - a single lesson object (next lesson to continue)
 * - wrappers like `{ lessons: [...] }` or `{ nextLesson: { ... } }`
 */
function normalizeContinueLessonsData(data: unknown): ChildLesson[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as ChildLesson[];
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of [
      "lessons",
      "continueLessons",
      "lastAccessedLessons",
      "sectionLessons",
      "items",
      "results",
      "rows",
    ] as const) {
      const v = o[key];
      if (Array.isArray(v)) return v as ChildLesson[];
    }
    if (Array.isArray(o.data)) return o.data as ChildLesson[];

    const unwrap = (node: unknown): ChildLesson | null => {
      if (!node || typeof node !== "object") return null;
      const x = node as Record<string, unknown>;
      if (typeof x.id === "string" && typeof x.sectionId === "string") {
        return childLessonFromNextPayload(x);
      }
      return null;
    };

    const fromNext = unwrap(o.nextLesson ?? o.lesson);
    if (fromNext) return [fromNext];

    const bare = unwrap(o);
    if (bare) return [bare];
  }
  return [];
}

/** Map slim "next lesson" payload to ChildLesson; missing fields get safe defaults. */
function childLessonFromNextPayload(x: Record<string, unknown>): ChildLesson {
  return {
    id: x.id as string,
    title: typeof x.title === "string" ? x.title : "",
    description: typeof x.description === "string" ? x.description : "",
    orderIndex: typeof x.orderIndex === "number" ? x.orderIndex : 0,
    sectionId: x.sectionId as string,
    watchedPosition: typeof x.watchedPosition === "number" ? x.watchedPosition : 0,
    videoCompleted: Boolean(x.videoCompleted),
    quizzesPassed: typeof x.quizzesPassed === "number" ? x.quizzesPassed : 0,
    totalQuizzes: typeof x.totalQuizzes === "number" ? x.totalQuizzes : 0,
    completionPercentage:
      typeof x.completionPercentage === "number" ? x.completionPercentage : 0,
    lessonCompleted: Boolean(x.lessonCompleted),
  };
}

export const useGetChildLastAccessedLessons = (
  childId: string,
  curriculumId: string
) => {
  return useQuery({
    queryKey: ["child-last-accessed-lessons", childId, curriculumId],
    queryFn: async (): Promise<APIGetResponse<ChildLesson[]>> => {
      const response = await axiosInstance.get(
        `/library/${childId}/curriculums/${curriculumId}/continue-lessons`
      );
      const body = response.data as APIGetResponse<unknown>;
      return {
        ...body,
        data: normalizeContinueLessonsData(body?.data),
      };
    },
    enabled: !!childId && !!curriculumId,
  });
};

// Homework Queries
export const useGetHomework = (
  childId?: string,
  activeSubscriptionOnly: boolean = true,
) => {
  return useQuery({
    queryKey: ["homeworks", childId, activeSubscriptionOnly],
    queryFn: async (): Promise<APIGetResponse<Homework[] | LearningPath[]>> => {
      const response = await axiosInstance.get(`/homework`, {
        params: {
          childId,
          activeSubscriptionOnly,
        },
      });
      return response.data;
    },
  });
};

export const useGetHomeworkDetails = (id: string) => {
  return useQuery({
    queryKey: ["homework-details", id],
    queryFn: async (): Promise<APIGetResponse<Homework>> => {
      const response = await axiosInstance.get(`/homework/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export const useGetRecentHomework = (childId: string) => {
  return useQuery({
    queryKey: ["recent-homework", childId],
    queryFn: async (): Promise<APIGetResponse<RecentHomeworkItem[]>> => {
      const response = await axiosInstance.get(`/homework/recent-works?childId=${childId}`);
      return response.data;
    },
    enabled: !!childId,
  });
}

export const useGetHistoryHomework = (childId: string) => {
  return useQuery({
    queryKey: ["history-homework", childId],
    queryFn: async (): Promise<APIGetResponse<HistoryHomeworkItem[]>> => {
      const response = await axiosInstance.get(`/homework/history?childId=${childId}`);
      return response.data;
    },
    enabled: !!childId,
  });
}

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
      const response = await axiosInstance.get(
        `/quiz-attempts/${attemptId}/review`
      );
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
    queryKey: ["section", id, offerType],
    queryFn: async (): Promise<APIGetResponse<Section>> => {
      const url = offerType
        ? `/sections/${id}?offerType=${offerType}`
        : `/sections/${id}`;
      const response = await axiosInstance.get(url);
      return response.data;
    },
    enabled: !!id,
  });
};

// Baseline Test Queries
export const useGetBaselineTests = () => {
  return useQuery({
    queryKey: ["baseline-tests"],
    queryFn: async (): Promise<APIGetResponse<BaselineTest[]>> => {
      const response = await axiosInstance.get("/baseline-test");
      return response.data;
    },
  });
};

export const useGetBaselineTestById = (id: string) => {
  return useQuery({
    queryKey: ["baseline-test", id],
    queryFn: async (): Promise<APIGetResponse<BaselineTest>> => {
      const response = await axiosInstance.get(`/baseline-test/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useGetChildBaselineTest = (childId: string) => {
  return useQuery({
    queryKey: ["child-baseline-test", childId],
    queryFn: async (): Promise<APIGetResponse<BaselineTest>> => {
      const response = await axiosInstance.get(`/baseline-test/child/${childId}`);
      return response.data;
    },
    enabled: !!childId,
  });
};

export const useGetChildBaselineTestEntries = (childId: string) => {
  return useQuery({
    queryKey: ["child-baseline-test-entries", childId],
    queryFn: async (): Promise<APIGetResponse<BaselineTestAttempt[]>> => {
      const response = await axiosInstance.get(`/baseline-test/attempts/${childId}`);
      return response.data;
    },
    enabled: !!childId,
  });
}

// Quiz MasterList Queries
export const useGeQuizMasterList = (yearGroupId: string, isCummulative = false) => {
  return useQuery({
    queryKey: ["quiz-master-list", yearGroupId, isCummulative],
    queryFn: async (): Promise<APIGetResponse<QuizMasterList>> => {
      const response = await axiosInstance.get(`/quiz-master-list/year-group/${yearGroupId}?cumulative=${isCummulative}`);
      return response.data;
    },
    enabled: !!yearGroupId,
  });
};

export const useGetYearGroups = () => {
  return useQuery({
    queryKey: ["year-groups"],
    queryFn: async (): Promise<APIGetResponse<YearGroup[]>> => {
      const response = await axiosInstance.get("/year-group");
      return response.data;
    },
  });
};

export const useGetBaselineTestEntry = (baselineTestId: string) => {
  return useQuery({
    queryKey: ["baseline-test-entry", baselineTestId],
    queryFn: async (): Promise<APIGetResponse<BaselineTestEntry[]>> => {
      const response = await axiosInstance.get(`/baseline-test-entry/baselineTest/${baselineTestId}`);
      return response.data;
    },
    enabled: !!baselineTestId,
  });
}

export const useGetLearningPath = (childId: string, status?: string) => {
  return useQuery({
    queryKey: ["learning-path", childId, status],
    queryFn: async (): Promise<APIGetResponse<LearningPath[]>> => {
      const response = await axiosInstance.get(`/learning-path/${childId}`, {
        params: {
          status,
        },
      });
      return response.data;
    },
    enabled: !!childId,
  });
}

export const useGetChildSchemeOfWork = (childId: string) => {
  return useQuery({
    queryKey: ["child-scheme-of-work", childId],
    queryFn: async (): Promise<APIGetResponse<SchemeOfWork[]>> => {
      const response = await axiosInstance.get(`/learning-path/${childId}/scheme-of-work`);
      return response.data;
    },
    enabled: !!childId,
  });
}

export const useGetChildLearningPathSummary = (childId: string) => {
  return useQuery({
    queryKey: ["child-learning-path-summary", childId],
    queryFn: async (): Promise<APIGetResponse<LearningPathSummary[]>> => {
      const response = await axiosInstance.get(`/learning-path/${childId}/learning-path-summary`);
      return response.data;
    },
    enabled: !!childId,
  });
}

export const useGetChildLearningHistory = (childId: string) => {
  return useQuery({
    queryKey: ["child-learning-history", childId],
    queryFn: async (): Promise<APIGetResponse<LearningHistory[]>> => {
      const response = await axiosInstance.get(`/learning-path/${childId}/history`);
      return response.data;
    },
    enabled: !!childId,
  });
}

export const useGetChildPreferences = (childId: string) => {
  return useQuery({
    queryKey: ["child-preferences", childId],
    queryFn: async (): Promise<APIGetResponse<ChildPreferences>> => {
      const response = await axiosInstance.get(`/child-profiles/${childId}/preferences`);
      return response.data;
    },
    enabled: !!childId,
  });
}
