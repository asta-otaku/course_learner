import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ManagementFilter from "@/assets/svgs/managementfilter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getPlanTypeColors } from "./p";

type TableMetricsProps = {
  userData: any[];
  setSelectedUser: (id: string) => void;
  setStep: (step: number) => void;
  setShowTutorModal: (show: boolean) => void;
  uniqueYears: string[];
};

function TableMetrics({
  userData,
  setSelectedUser,
  setStep,
  setShowTutorModal,
  uniqueYears,
}: TableMetricsProps) {
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<{ planType?: string; year?: string }>(
    {}
  );

  const filteredUserData = userData.filter(
    (user) =>
      (user.user.toLowerCase().includes(search.toLowerCase()) ||
        user.childName.toLowerCase().includes(search.toLowerCase())) &&
      (!filter.planType ||
        filter.planType === "all" ||
        user.planType === filter.planType) &&
      (!filter.year || filter.year === "all" || user.year === filter.year)
  );

  const handleApplyFilter = () => setShowFilter(false);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-lg md:text-xl">Users</h2>
        <div className="flex items-center gap-4 max-w-lg w-full">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-borderGray/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryBlue"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-textSubtitle" />
          </div>
          <Popover open={showFilter} onOpenChange={setShowFilter}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-textSubtitle border-borderGray/50 rounded-lg bg-white"
              >
                <ManagementFilter />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Plan Type</label>
                  <Select
                    value={filter.planType || "all"}
                    onValueChange={(val) =>
                      setFilter((f) => ({
                        ...f,
                        planType: val === "all" ? undefined : val,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Offer 1">Offer 1</SelectItem>
                      <SelectItem value="Offer 2">Offer 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Year</label>
                  <Select
                    value={filter.year || "all"}
                    onValueChange={(val) =>
                      setFilter((f) => ({
                        ...f,
                        year: val === "all" ? undefined : val,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setFilter({})}>
                    Clear
                  </Button>
                  <Button onClick={handleApplyFilter}>Apply</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* User Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full font-geist whitespace-nowrap">
            <thead className="bg-bgOffwhite">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-textSubtitle">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-textSubtitle">
                  Child's Name
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-textSubtitle">
                  Plan Type
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-textSubtitle">
                  Year
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-textSubtitle">
                  Assigned Tutor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUserData.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {user.user}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {user.childName}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getPlanTypeColors(
                        user.planType
                      )}`}
                    >
                      {user.planType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium">
                    {user.year}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.assignedTutor ? (
                      <Button
                        variant="ghost"
                        className="text-primaryBlue p-0 text-sm font-medium hover:text-blue-700"
                        onClick={() => {
                          setSelectedUser(user.id);
                          setStep(1);
                        }}
                      >
                        {user.assignedTutor}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="text-primaryBlue p-0 text-sm font-medium hover:text-blue-700"
                        onClick={() => {
                          setSelectedUser(user.id);
                          setShowTutorModal(true);
                        }}
                      >
                        Assign Tutor
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TableMetrics;
