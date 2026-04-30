import React from "react";
import Navbar from "@/components/platform/navbar";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bgWhiteGray min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}

export default layout;
