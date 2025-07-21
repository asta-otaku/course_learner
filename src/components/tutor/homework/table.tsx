import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import BackArrow from "@/assets/svgs/arrowback";

function HomeWorkTable({
  setStep,
  search,
  setSearch,
  status,
  setStatus,
  filteredData,
}: {
  setStep: (step: number) => void;
  search: string;
  setSearch: (search: string) => void;
  status: string;
  setStatus: (status: string) => void;
  filteredData: any[];
}) {
  const statusColors: Record<string, string> = {
    "TO-DO": "bg-primaryBlue text-white",
    SUBMITTED: "bg-green-500 text-white",
    "DONE AND MARKED": "bg-orange-400 text-white",
  };

  const statusOptions = ["All", "TO-DO", "SUBMITTED", "DONE AND MARKED"];
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
              Status: {status} <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusOptions.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => setStatus(s)}>
                {s}
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
            {filteredData.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 whitespace-nowrap"
              >
                <td className="py-4">
                  <div className="font-medium whitespace-nowrap">
                    {row.student}
                  </div>
                  <div className="text-xs text-gray-400">{row.year}</div>
                </td>
                <td className="py-4 px-4 md:px-0">
                  <div className="font-medium">{row.homework}</div>
                  <div className="text-xs text-gray-400">{row.topic}</div>
                </td>
                <td className="py-4 px-4 md:px-0">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs whitespace-nowrap ${
                      statusColors[row.status]
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="py-4 px-4 md:px-0">
                  <button className="text-primaryBlue text-xs font-medium flex items-center gap-1">
                    {row.action} <BackArrow flipped color="#286cff" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HomeWorkTable;
