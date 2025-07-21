"use client";

import { courses, dummyCurriculum, dummyQuizzes, slugify } from "@/lib/utils";
import Link from "next/link";
import React, { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";

export default function CourseList() {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedCurriculum, setSelectedCurriculum] = useState("uk");
  const pathParts = useMemo(() => pathname.split("/"), [pathname]);
  const courseSlug = pathParts[2] || "";
  const topicSlug = pathParts[3] || "";

  const course = useMemo(
    () => courses.find((c) => slugify(c.course) === courseSlug) ?? null,
    [courseSlug]
  );

  useEffect(() => {
    if (course && !topicSlug) {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        const firstTopicSlug = slugify(course.topics[0].title);
        router.replace(`/dashboard/${courseSlug}/${firstTopicSlug}`);
      }
    }
  }, [course, topicSlug, courseSlug, router]);

  const currentTopic = useMemo(() => {
    if (!topicSlug) return null;
    return course?.topics.find((t) => slugify(t.title) === topicSlug) as {
      title: string;
      number_of_quizzes: number;
      quizzes: {
        title: string;
        attempts: { label: string; date: string; score: number }[];
      }[];
    };
  }, [topicSlug, course?.topics]);

  if (!course) {
    return (
      <div className="p-8 text-center text-red-500">
        Course "{courseSlug}" not found.
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-[calc(100vh-80px)]">
      {/* Curriculum selector */}
      <select
        value={selectedCurriculum}
        onChange={(e) => setSelectedCurriculum(e.target.value)}
        className="bg-white py-2 px-4 rounded-full border-none focus:outline-none focus:ring-0 active:outline-none max-w-fit active:ring-0 my-6"
      >
        {dummyCurriculum.map((curr, index) => (
          <option
            key={index}
            value={curr.value}
            className="text-sm text-textSubtitle"
          >
            {curr.name}
          </option>
        ))}
      </select>

      <div className="flex gap-6">
        {/* Sidebar - Hidden on mobile when topic selected */}
        <div
          className={`md:max-w-xs w-full border border-dashed flex flex-col max-h-[80vh] h-fit scrollbar-hide overflow-auto ${
            topicSlug ? "hidden md:flex" : "flex"
          }`}
        >
          {course.topics.map((topic, idx) => {
            const topicSlug = slugify(topic.title);
            const href = `/dashboard/${courseSlug}/${topicSlug}`;
            return (
              <Link
                href={href}
                key={idx}
                className={`border-b last-of-type:border-none border-dashed p-4 hover:bg-[#EEEEEE]/20 w-full ${
                  pathname === href ? "bg-[#EEEEEE]" : "bg-white"
                }`}
              >
                <span
                  className={`${
                    pathname === href
                      ? "text-primaryBlue font-semibold"
                      : "text-textSubtitle"
                  } font-medium text-sm md:text-base max-w-[300px] whitespace-nowrap truncate inline-block`}
                >
                  {topic.title}
                </span>
                <p className="text-textSubtitle text-sm font-inter mt-2">
                  {topic.number_of_quizzes} Quiz
                </p>
              </Link>
            );
          })}
        </div>

        {/* Main Content - Hidden on mobile when no topic selected */}
        <div
          className={`w-full flex justify-center ${
            topicSlug ? "block" : "hidden md:flex"
          }`}
        >
          <div className="space-y-6 max-w-2xl w-full">
            {/* Mobile Back Button */}
            {topicSlug && (
              <Link
                href={`/dashboard/${courseSlug}`}
                className="md:hidden mb-4 text-primaryBlue font-medium flex items-center gap-2"
              >
                <BackArrow color="#286cff" /> Back to Topics
              </Link>
            )}

            {/* Tutorial Video Section */}
            <div className="bg-primaryBlue rounded-2xl flex items-center gap-4 justify-between py-4 px-6">
              <h2 className="font-medium md:text-xl text-white">
                Tutorial Video
              </h2>
              <Button
                variant="outline"
                className="rounded-full text-primaryBlue font-medium text-xs"
                onClick={() =>
                  router.push(`/videos-quiz/${courseSlug}/${topicSlug}`)
                }
              >
                Watch Video <img src="/play.svg" alt="" />
              </Button>
            </div>

            {/* Quizzes List */}
            {(currentTopic?.quizzes || dummyQuizzes).map((quiz) => (
              <div
                key={quiz.title}
                className="border rounded-2xl bg-white overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4">
                  <h3 className="font-medium">{quiz.title}</h3>
                  <Button
                    onClick={() =>
                      router.push(
                        `/videos-quiz/${courseSlug}/${topicSlug}/${slugify(
                          quiz.title
                        )}`
                      )
                    }
                    className="rounded-full bg-primaryBlue text-white text-xs py-2 px-4"
                  >
                    Attempt Quiz
                  </Button>
                </div>

                <table className="w-full table-fixed border-y border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-r border-gray-200 py-3 px-4 text-textSubtitle text-xs font-medium text-left">
                        N/O
                      </th>
                      <th className="border-b border-r border-gray-200 py-3 px-4 text-textSubtitle text-xs font-medium text-left">
                        Date
                      </th>
                      <th className="border-b border-r border-gray-200 py-3 px-4 text-textSubtitle text-xs font-medium text-left">
                        Score
                      </th>
                      <th className="border-b border-gray-200 py-3 px-4 text-textSubtitle text-xs font-medium text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {quiz.attempts.map((a) => (
                      <tr key={a.label}>
                        <td className="border-b border-r border-gray-200 py-3 px-4 text-sm">
                          {a.label}
                        </td>
                        <td className="border-b border-r border-gray-200 py-3 px-4 text-sm">
                          {a.date}
                        </td>
                        <td className="border-b border-r border-gray-200 py-3 px-4 text-sm">
                          {a.score}%
                        </td>
                        <td className="border-b border-gray-200 py-3 px-4 text-sm">
                          <Link
                            href="#"
                            className="flex items-center gap-2 font-medium text-sm text-primaryBlue"
                          >
                            View Breakdown <span>&rarr;</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
