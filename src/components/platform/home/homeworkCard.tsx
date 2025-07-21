"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";

export default function HomeworkCard({
  homework,
}: {
  homework: {
    title: string;
    course: string;
    topic: string;
    due: string;
    href: string;
  };
}) {
  const { push } = useRouter();
  return (
    <div className="flex justify-between items-center py-3 border-b last:border-none">
      <div>
        <p className="font-medium text-sm">{homework.title}</p>
        <p className="text-xs text-muted-foreground">
          {homework.course} – {homework.topic}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Due {format(new Date(homework.due), "MMM d")}
        </p>
      </div>
      <Button
        onClick={() => push(homework.href)}
        variant="link"
        className="text-xs text-primaryBlue px-0"
      >
        Start <BackArrow color="#286CFF" flipped />
      </Button>
    </div>
  );
}
