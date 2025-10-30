import React from "react";

function BackArrow({ color, flipped }: { color?: string; flipped?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={flipped ? { transform: "rotate(180deg)" } : undefined}
    >
      <path
        d="M4 12H20"
        stroke={color ? color : "#141B34"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.99997 17C8.99997 17 4.00002 13.3176 4 12C3.99999 10.6824 9 7 9 7"
        stroke={color ? color : "#141B34"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default BackArrow;
