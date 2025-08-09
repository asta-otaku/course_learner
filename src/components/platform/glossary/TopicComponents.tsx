"use client";

import BackArrow from "@/assets/svgs/arrowback";
import GlossaryTag from "@/assets/svgs/glossaryTag";
import { slugify } from "@/lib/utils";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { tutorHomeworkMockData } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SearchIcon, MoreHorizontal } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import PlayIcon from "@/assets/svgs/play";
import RecommendIcon from "@/assets/svgs/recommend";

export const TopicCard = ({
  topic,
  onClick,
}: {
  topic: {
    title: string;
    course: string;
    number_of_quizzes: number;
  };
  onClick: () => void;
}) => (
  <div
    className="bg-white px-4 py-6 rounded-[20px] cursor-pointer hover:bg-gray-5 flex gap-3 items-center"
    onClick={onClick}
  >
    <span className="p-3 rounded-full bg-primaryBlue/10">
      <GlossaryTag />
    </span>
    <div>
      <h3 className="text-lg font-medium">{topic.title}</h3>
      <div className="flex gap-2 items-center">
        <p className="text-xs text-textSubtitle">{topic.course}</p>
        <span className="p-0.5 bg-textSubtitle/50 rounded-full" />
        <p className="text-xs text-textSubtitle">
          {topic.number_of_quizzes} Resource
          {topic.number_of_quizzes > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  </div>
);

export const TopicDetail = ({
  topic,
  onClose,
}: {
  topic: {
    title: string;
    course: string;
    number_of_quizzes: number;
  };
  onClose: () => void;
}) => {
  const pathname = usePathname();
  const isTutorMode = pathname.includes("tutor");

  const [studentSearch, setStudentSearch] = useState("");
  const [actionPopover, setActionPopover] = useState<number | null>(null);
  const [recommendDialog, setRecommendDialog] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<{
    [key: number]: string[];
  }>({});

  // Get students from mock data
  const students = tutorHomeworkMockData.map((s) => ({
    label: s.student,
    value: s.student,
    year: s.year,
  }));

  // Remove duplicates
  const uniqueStudents = Array.from(
    new Map(students.map((s) => [s.value, s])).values()
  );

  const filteredStudents = uniqueStudents.filter((s) =>
    s.label.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const videos = Array.from({ length: topic.number_of_quizzes }, (_, i) => ({
    title: `${topic.title} - Part ${i + 1}`,
    link: `/dashboard/${slugify(topic.course)}/${slugify(topic.title)}`,
  }));

  const handleStudentToggle = (studentValue: string, videoIndex: number) => {
    setSelectedStudents((prev) => {
      const current = prev[videoIndex] || [];
      return {
        ...prev,
        [videoIndex]: current.includes(studentValue)
          ? current.filter((v) => v !== studentValue)
          : [...current, studentValue],
      };
    });
  };

  const renderActionCell = (video: any, idx: number) => (
    <>
      <Popover
        open={actionPopover === idx}
        onOpenChange={(open) => setActionPopover(open ? idx : null)}
      >
        <PopoverTrigger asChild>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <MoreHorizontal />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 p-2 rounded-xl shadow">
          <div className="flex flex-col">
            <a
              href={video.link}
              className="py-2 px-4 hover:bg-gray-100 rounded text-left flex items-center gap-2"
            >
              {isTutorMode ? (
                <>
                  <PlayIcon />
                  <span className="text-sm">Watch Video</span>
                </>
              ) : (
                <span className="text-sm">Watch Video</span>
              )}
            </a>
            {isTutorMode && (
              <button
                className="py-2 px-4 hover:bg-gray-100 rounded text-left flex items-center gap-2"
                onClick={() => {
                  setRecommendDialog(idx);
                  setActionPopover(null);
                }}
              >
                <RecommendIcon />
                <span className="text-sm">Recommend</span>
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {/* Recommendation Dialog */}
      {isTutorMode && (
        <Dialog
          open={recommendDialog === idx}
          onOpenChange={(open) => {
            if (!open) setRecommendDialog(null);
          }}
        >
          <DialogContent className="max-w-lg !rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-medium text-lg">
                Recommend To
              </DialogTitle>
              <DialogDescription className="text-sm text-textSubtitle">
                Select one or more students to recommend this video to.
              </DialogDescription>
            </DialogHeader>
            <div className="mb-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textSubtitle" />
                <Input
                  placeholder="Search"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 focus:outline-none shadow-none bg-white rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {filteredStudents.length === 0 && (
                <div className="text-textSubtitle text-center py-4">
                  No students found
                </div>
              )}
              {filteredStudents.map((student) => (
                <div
                  key={student.value}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-b-0s"
                >
                  <Checkbox
                    id={student.value}
                    checked={(selectedStudents[idx] || []).includes(
                      student.value
                    )}
                    onClick={() => handleStudentToggle(student.value, idx)}
                    className="cursor-pointer rounded-full ring-2 ring-offset-[3px] ring-black w-2 h-2"
                  />
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleStudentToggle(student.value, idx)}
                  >
                    <div className="font-medium text-sm">{student.label}</div>
                    <div className="text-xs text-gray-400">{student.year}</div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                className="w-full bg-primaryBlue text-white rounded-full py-5 text-sm font-medium"
                onClick={() => {
                  // Handle recommend action for selected students

                  setRecommendDialog(null);
                  setSelectedStudents((prev) => ({ ...prev, [idx]: [] }));
                }}
                disabled={
                  !(selectedStudents[idx] && selectedStudents[idx].length > 0)
                }
              >
                Recommend
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <button
        onClick={onClose}
        className="text-sm text-primaryBlue flex items-center gap-1 mb-6"
      >
        <BackArrow />
      </button>
      <table className="w-full text-left">
        <thead className="bg-white text-center">
          <tr className="text-sm text-textSubtitle">
            <th className="pl-4 py-3 text-left font-medium text-textGray">
              SECTION
            </th>
            <th className="py-3 font-medium text-textGray">VIDEOS</th>
            <th className="py-3 font-medium text-textGray">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video, idx) => (
            <tr key={idx} className="text-sm text-center border-b">
              {idx === 0 && (
                <td
                  className="py-4 px-3 font-semibold uppercase text-left text-textGray text-base md:text-lg align-middle w-1/4"
                  rowSpan={videos.length}
                >
                  {topic.title}
                </td>
              )}
              <td className="py-4 px-3 border-l text-textGray font-medium">
                {video.title}
              </td>
              <td className="py-4 px-3 border-l">
                {renderActionCell(video, idx)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
