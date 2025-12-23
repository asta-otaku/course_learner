"use client";

import React from "react";
import HomeWorkTable from "./table";
import AssignHomeworkForm from "./assignHomework";
import { useGetHomework } from "@/lib/api/queries";

function HomeworkComponent() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("All");
  const [step, setStep] = React.useState(0);

  // Fetch homework data - passing undefined to get all homeworks for the tutor
  const { data: homeworkResponse, isLoading } = useGetHomework(undefined);
  const homeworkData = homeworkResponse?.data || [];

  // Filter homework data based on search and status
  const filteredData = homeworkData.filter((row) => {
    const matchesSearch =
      row.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      search === "";
    const matchesStatus =
      status === "All" || row.status?.toLowerCase() === status.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {
        {
          0: (
            <HomeWorkTable
              setStep={setStep}
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
              filteredData={filteredData}
              isLoading={isLoading}
            />
          ),
          1: (
            <AssignHomeworkForm
              onBack={() => setStep(0)}
              onAssign={() => {
                // The mutation will automatically refetch the homework list
                setStep(0);
              }}
            />
          ),
        }[step]
      }
    </div>
  );
}

export default HomeworkComponent;
