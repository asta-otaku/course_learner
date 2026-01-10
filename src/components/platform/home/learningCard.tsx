import BackArrow from "@/assets/svgs/arrowback";
import { Course } from "@/lib/types";
import { getCurrentTopic, slugify } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function LearningCard({
  course,
  lesson,
}: {
  course: Course & { curriculumId?: string };
  lesson?: any;
}) {
  const href = lesson?.id
    ? `/library/${lesson.sectionId || lesson.curriculumId}/${lesson.id}`
    : course.curriculumId
      ? `/library/${course.curriculumId}`
      : `/dashboard/${slugify(course.course)}/${slugify(getCurrentTopic(course).title)}`;

  const displayTitle = lesson?.title || getCurrentTopic(course).title;
  const displayCourse = lesson?.curriculumTitle || course.course;
  const displayImage = lesson?.curriculumImageUrl || course.imageUrl;

  return (
    <div className="max-w-2xl p-2 rounded-2xl bg-[#FAFAFA] border flex items-center gap-3 md:gap-5">
      <Image
        src={displayImage}
        alt="Course Image"
        width={100}
        height={100}
        className="max-w-[180px] h-[150px] w-full rounded-2xl"
      />
      <div className="flex w-full flex-col gap-2 md:gap-4">
        <h4 className="text-textSubtitle text-xs font-medium">
          {displayCourse}
        </h4>
        <h2 className="text-textGray font-semibold text-base md:text-lg lg:text-xl line-clamp-2">
          {displayTitle}
        </h2>
        <Link
          href={href}
          className="flex items-center gap-1 text-primaryBlue font-medium text-sm"
        >
          Resume Learning <BackArrow color="#286cff" flipped />
        </Link>
      </div>
    </div>
  );
}

export function ProgressCard({
  course,
  isTutor = false,
}: {
  course: Course & { curriculumId?: string };
  isTutor?: boolean;
}) {
  const href = course.curriculumId
    ? `/dashboard/${course.curriculumId}`
    : `/dashboard/${slugify(course.course)}`;

  return (
    <Link href={isTutor ? `#` : href}>
      <div className="p-2 rounded-2xl bg-[#FAFAFA] border flex flex-col gap-4">
        <Image
          src={course.imageUrl}
          alt="Course Image"
          width={100}
          height={100}
          className="h-[181px] w-full rounded-2xl"
        />
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="uppercase text-textGray font-medium line-clamp-2 h-[60px]">
              {course.course}
            </h3>
          </div>
          <div className="relative w-8 h-8">
            <svg className="w-full h-full">
              <circle
                cx="50%"
                cy="50%"
                r="12"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-bgWhiteGray"
              />
              <circle
                cx="50%"
                cy="50%"
                r="12"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-bgGreen"
                strokeDasharray="75.398"
                strokeDashoffset={`${
                  75.398 - (75.398 * course.progress) / 100
                }`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h6 className="text-textSubtitle text-xs">Total Lesson</h6>
            <p className="text-xs font-medium">{course.total_section}</p>
          </div>
          <div className="flex items-center justify-between">
            <h6 className="text-textSubtitle text-xs">Completed Lesson</h6>
            <p className="text-xs font-medium">{course.completed_section}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
