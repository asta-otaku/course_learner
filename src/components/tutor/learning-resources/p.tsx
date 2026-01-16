"use client";

import { Button } from "@/components/ui/button";
import { BadgeAlert } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useGetSections } from "@/lib/api/queries";

function LearningResource() {
  const { push } = useRouter();

  const { data: sections } = useGetSections();

  // Get sections data
  const sectionsData = useMemo(() => {
    return sections?.data || [];
  }, [sections?.data]);

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      <h1 className="text-textGray font-medium md:text-lg lg:text-xl capitalize my-6">
        Learning Resources
      </h1>
      <div className="bg-[#ECF2FF] rounded-2xl p-3 md:p-4 xl:p-6 flex items-center gap-4">
        <BadgeAlert className="text-primaryBlue min-w-6" />
        <p className="text-primaryBlue text-xs md:text-sm">
          This tab contains videos and worksheets for the entire{" "}
          {sectionsData.length} sections. We have numbered each section of the
          sections. This is the order we would like you to follow! If you don't
          want to follow the recommended order, we strongly recommend you cover
          the {sectionsData.length} sections first, as this provides the
          foundation for every other section
        </p>
      </div>
      <div className="my-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
        {sectionsData.map((section, index) => (
          <div
            key={section.id}
            className="bg-white rounded-3xl py-6 px-7 space-y-4 max-w-[355px]"
          >
            <Image
              src={section.imageUrl}
              className="rounded-2xl w-16"
              alt={section.title}
              width={100}
              height={100}
            />
            <div className="space-y-2">
              <h2 className="text-textGray font-semibold text-xl line-clamp-2 h-[60px]">
                {section.title}
              </h2>
            </div>
            <Button
              onClick={() => push(`/tutor/learning-resources/${section.id}`)}
              className="w-full flex gap-2 my-3 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
            >
              Proceed
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearningResource;
