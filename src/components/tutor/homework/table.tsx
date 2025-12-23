import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SearchIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import BackArrow from "@/assets/svgs/arrowback";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

function HomeWorkTable({
  setStep,
  search,
  setSearch,
  status,
  setStatus,
  filteredData,
  isLoading,
}: {
  setStep: (step: number) => void;
  search: string;
  setSearch: (search: string) => void;
  status: string;
  setStatus: (status: string) => void;
  filteredData: any[];
  isLoading?: boolean;
}) {
  const statusColors: Record<string, string> = {
    "to-do": "bg-primaryBlue text-white",
    submitted: "bg-green-500 text-white",
    "done and marked": "bg-orange-400 text-white",
  };

  const statusLabels: Record<string, string> = {
    "to-do": "TO-DO",
    submitted: "SUBMITTED",
    "done and marked": "DONE AND MARKED",
  };

  const statusOptions = ["All", "to-do", "submitted", "done and marked"];
  const router = useRouter();
  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-medium text-lg md:text-xl">Home-Work</h1>
        <Button
          className="bg-primaryBlue text-white rounded-full px-6 py-2 text-sm font-medium shadow-none"
          onClick={() => setStep(1)}
        >
          Assign Homework
        </Button>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="relative w-full md:w-1/3">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 focus:outline-none shadow-none bg-white rounded-xl"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-white border rounded-xl px-4 py-2 text-sm font-medium text-black flex items-center gap-1">
              Status:{" "}
              {status === "All"
                ? "All"
                : statusLabels[status as keyof typeof statusLabels] ||
                  status.toUpperCase()}{" "}
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusOptions.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => setStatus(s)}>
                {s === "All"
                  ? "All"
                  : statusLabels[s as keyof typeof statusLabels]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        className="bg-white rounded-2xl p-0 overflow-x-auto px-4 min-h-[75vh]"
        style={{ borderRadius: 20 }}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100">
              <th className="text-left font-medium pt-8 pb-4">Student</th>
              <th className="text-left font-medium pt-8 pb-4">Homework</th>
              <th className="text-left font-medium pt-8 pb-4">Status</th>
              <th className="text-left font-medium pt-8 pb-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primaryBlue" />
                    <p className="text-gray-500">Loading homework...</p>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-8 h-8 text-gray-400"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium mb-1">
                        No homework found
                      </p>
                      <p className="text-gray-500 text-sm">
                        {search || status !== "All"
                          ? "Try adjusting your filters"
                          : "Get started by assigning homework to your students"}
                      </p>
                    </div>
                    {!search && status === "All" && (
                      <Button
                        className="mt-2 bg-primaryBlue text-white rounded-full px-6 py-2 text-sm font-medium shadow-none"
                        onClick={() => setStep(1)}
                      >
                        Assign Homework
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 whitespace-nowrap"
                >
                  <td className="py-4">
                    <div className="font-medium whitespace-nowrap">
                      {row.studentName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {row.dateAssigned
                        ? `Assigned ${format(new Date(row.dateAssigned), "MMM d, yyyy")}`
                        : ""}
                    </div>
                  </td>
                  <td className="py-4 px-4 md:px-0">
                    <div className="font-medium">Quiz Assignment</div>
                    <div className="text-xs text-gray-400">
                      {row.dueDate
                        ? `Due: ${format(new Date(row.dueDate), "MMM d, yyyy")}`
                        : "No due date"}
                    </div>
                  </td>
                  <td className="py-4 px-4 md:px-0">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs whitespace-nowrap ${
                        statusColors[row.status?.toLowerCase()] ||
                        "bg-gray-500 text-white"
                      }`}
                    >
                      {statusLabels[
                        row.status?.toLowerCase() as keyof typeof statusLabels
                      ] ||
                        row.status?.toUpperCase() ||
                        "UNKNOWN"}
                    </span>
                  </td>
                  <td className="py-4 px-4 md:px-0">
                    {row.status?.toLowerCase() === "to-do" ? (
                      <div className="text-xs text-gray-400 font-medium">
                        Waiting for submission
                      </div>
                    ) : row.status?.toLowerCase() === "submitted" ? (
                      <button
                        onClick={() => {
                          router.push(`/tutor/homework/${row.id}/review`);
                        }}
                        className="text-primaryBlue text-xs font-medium flex items-center gap-1"
                      >
                        Review <BackArrow flipped color="#286cff" />
                      </button>
                    ) : (
                      <button className="text-primaryBlue text-xs font-medium flex items-center gap-1">
                        View <BackArrow flipped color="#286cff" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HomeWorkTable;
