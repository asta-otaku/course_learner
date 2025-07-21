"use client";

import React from "react";
import { useParams } from "next/navigation";
import StudentPage from "@/components/tutor/students/studentPage";

export default function StudentPageComponent() {
  const { id } = useParams();
  return <StudentPage id={id as string} />;
}
