import BackArrow from "@/assets/svgs/arrowback";
import { Progress } from "@/components/ui/progress";
import { Course } from "@/lib/types";
import { convertDuration, getCurrentTopic, slugify } from "@/lib/utils";
import { Clock } from "lucide-react";
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
    ? `/library/${lesson.curriculumId}/${lesson.id}`
    : course.curriculumId
      ? `/library/${course.curriculumId}`
      : `/dashboard/${slugify(course.course)}/${slugify(getCurrentTopic(course).title)}`;

  const displayTitle = lesson?.title || getCurrentTopic(course).title;
  const displayCourse = lesson?.curriculumTitle || course.course;
  const displayImage = lesson?.curriculumImage || course.image;
  const displayProgress = lesson?.completionPercentage || course.progress;

  return (
    <div className="max-w-2xl p-2 rounded-2xl bg-[#FAFAFA] border flex items-center gap-3 md:gap-5">
      <Image
        src={displayImage}
        alt="Course Image"
        width={0}
        height={0}
        className="max-w-[180px] h-[150px] w-full rounded-2xl"
      />
      <div className="flex w-full flex-col gap-2 md:gap-4">
        <h4 className="text-textSubtitle text-xs font-medium">
          {displayCourse}
        </h4>
        <h2 className="text-textGray font-semibold text-base md:text-lg lg:text-xl line-clamp-2">
          {displayTitle}
        </h2>
        <div className="space-y-1">
          <div className="md:flex items-center gap-2 hidden">
            <span className="text-[10px] text-textSubtitle font-medium">
              {displayProgress}% completed
            </span>
            <span className="w-1 h-1 rounded-full bg-textSubtitle" />
            <span className="flex items-center gap-1 text-textSubtitle text-[10px]">
              <Clock className="text-textSubtitle w-3" />
              {convertDuration(displayProgress, course.duration)}
            </span>
          </div>
          <Progress
            color="bg-bgGreen"
            value={displayProgress}
            className="bg-bgWhiteGray"
          />
        </div>
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
}: {
  course: Course & { curriculumId?: string };
}) {
  const href = course.curriculumId
    ? `/library/${course.curriculumId}`
    : `/dashboard/${slugify(course.course)}`;

  return (
    <Link href={href}>
      <div className="p-2 rounded-2xl bg-[#FAFAFA] border flex flex-col gap-4">
        <Image
          src={course.image}
          alt="Course Image"
          width={0}
          height={0}
          className="h-[181px] w-full rounded-2xl"
        />
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="uppercase text-textGray font-medium">
              {course.course}
            </h3>
            <p className="text-textSubtitle text-xs">Place and Value</p>
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
            <h6 className="text-textSubtitle text-xs">Total Section</h6>
            <p className="text-xs font-medium">{course.total_section}</p>
          </div>
          <div className="flex items-center justify-between">
            <h6 className="text-textSubtitle text-xs">Completed Section</h6>
            <p className="text-xs font-medium">{course.completed_section}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
