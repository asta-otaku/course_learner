"use client";

import React from "react";
import { tutorHomeworkMockData } from "@/lib/utils";
import HomeWorkTable from "./table";
import AssignHomeworkForm from "./assignHomework";

function HomeworkComponent() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("All");
  const [step, setStep] = React.useState(0);
  const [homeworkData, setHomeworkData] = React.useState([
    ...tutorHomeworkMockData,
  ]);
  const filteredData = homeworkData.filter((row) => {
    const matchesSearch =
      row.student.toLowerCase().includes(search.toLowerCase()) ||
      row.homework.toLowerCase().includes(search.toLowerCase()) ||
      row.topic.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || row.status === status;
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
            />
          ),
          1: (
            <AssignHomeworkForm
              onBack={() => setStep(0)}
              onAssign={(assignment) => {
                setHomeworkData((prev) => [assignment, ...prev]);
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
