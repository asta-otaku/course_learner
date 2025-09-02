import React from "react";
import Navbar from "@/components/admin/navbar";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bgWhiteGray min-h-screen">
      <Navbar />
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl w-full mx-auto min-h-screen">
        {children}
      </div>
    </div>
  );
}

export default layout;
