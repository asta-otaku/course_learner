"use client";

import React from "react";
import HomeWorkTable from "./table";
import AssignHomeworkForm from "./assignHomework";
import { useGetHomework } from "@/lib/api/queries";
import type { Homework } from "@/lib/types";

function HomeworkComponent() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("All");
  const [activeSubscriptionOnly, setActiveSubscriptionOnly] =
    React.useState(true);
  const [step, setStep] = React.useState(0);

  const { data: homeworkResponse, isLoading } = useGetHomework(
    undefined,
    activeSubscriptionOnly,
  );
  const homeworkData = (homeworkResponse?.data ?? []) as Homework[];

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
              activeSubscriptionOnly={activeSubscriptionOnly}
              setActiveSubscriptionOnly={setActiveSubscriptionOnly}
              filteredData={filteredData}
              isLoading={isLoading}
            />
          ),
          1: (
            <AssignHomeworkForm
              onBack={() => setStep(0)}
              onAssign={() => {
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
