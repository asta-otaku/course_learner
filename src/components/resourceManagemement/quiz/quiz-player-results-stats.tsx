"use client";

import { Trophy, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatTimeFromMinutes } from "@/lib/utils";
import type { QuizSubmissionResults } from "@/lib/types";

export function QuizPlayerResultsStats({
  submissionResults,
}: {
  submissionResults: QuizSubmissionResults;
}) {
  const correctCount = submissionResults.results.filter((r) => r.isCorrect).length;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <Trophy className="h-8 w-8 text-blue-600" />
        <div>
          <p className="text-sm text-blue-600 font-medium">Score</p>
          <p className="text-2xl font-bold text-blue-900">
            {submissionResults.score.toFixed(2)}/
            {submissionResults.totalPoints.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="h-8 w-8 text-green-600" />
        <div>
          <p className="text-sm text-green-600 font-medium">Percentage</p>
          <p className="text-2xl font-bold text-green-900">
            {submissionResults.percentage.toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <Clock className="h-8 w-8 text-purple-600" />
        <div>
          <p className="text-sm text-purple-600 font-medium">Time Spent</p>
          <p className="text-2xl font-bold text-purple-900">
            {formatTimeFromMinutes(submissionResults.timeSpent)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <AlertCircle className="h-8 w-8 text-orange-600" />
        <div>
          <p className="text-sm text-orange-600 font-medium">Correct Answers</p>
          <p className="text-2xl font-bold text-orange-900">
            {correctCount}/{submissionResults.results.length}
          </p>
        </div>
      </div>
    </div>
  );
}
