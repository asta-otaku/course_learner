import Navbar from "@/components/platform/navbar";
import VideoQuizComponent from "@/components/platform/videos-quiz/VideosQuizPage";
import React from "react";

function Page() {
  return (
    <div className="bg-bgWhiteGray min-h-screen">
      <Navbar />
      <VideoQuizComponent />
    </div>
  );
}

export default Page;
