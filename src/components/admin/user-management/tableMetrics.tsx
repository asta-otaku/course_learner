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
  groupedUserData: any[];
  userData: any[];
  setSelectedUser: (id: string) => void;
  setStep: (step: number) => void;
  setShowTutorModal: (show: boolean) => void;
  uniqueYears: string[];
};

function TableMetrics({
  groupedUserData,
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

  const filteredGroupedData = groupedUserData
    .map((parent) => ({
      ...parent,
      children: parent.children.filter(
        (child: any) =>
          !filter.year || filter.year === "all" || child.year === filter.year
      ),
    }))
    .filter((parent) => {
      const matchesSearch =
        search === "" ||
        parent.parentName.toLowerCase().includes(search.toLowerCase()) ||
        parent.children.some((child: any) =>
          child.childName.toLowerCase().includes(search.toLowerCase())
        );

      const matchesPlanType =
        !filter.planType ||
        filter.planType === "all" ||
        parent.planType === filter.planType;

      const hasMatchingChildren = parent.children.length > 0;

      return matchesSearch && matchesPlanType && hasMatchingChildren;
    });

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
                  Parent
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-textSubtitle">
                  Children
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-textSubtitle">
                  Year
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-textSubtitle">
                  Plan Type
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-textSubtitle">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGroupedData.map((parent) => (
                <tr
                  key={parent.parentId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Parent Info */}
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold text-base">
                        {parent.parentName}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {parent.children.length} child
                        {parent.children.length !== 1 ? "ren" : ""}
                      </span>
                    </div>
                  </td>

                  {/* Children List */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {parent.children.map((child: any) => (
                        <div key={child.id} className="flex items-center gap-3">
                          {child.avatar && (
                            <img
                              src={child.avatar}
                              alt={child.childName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <span className="text-sm font-medium">
                            {child.childName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Year Column */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col gap-2">
                      {parent.children.map((child: any) => (
                        <div
                          key={child.id}
                          className="text-sm font-medium text-gray-900"
                        >
                          {child.year}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Plan Type */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getPlanTypeColors(
                        parent.planType
                      )}`}
                    >
                      {parent.planType}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col gap-2">
                      {parent.children.map((child: any) => (
                        <div key={child.id}>
                          {!parent.canAssignTutor ? (
                            <span className="text-gray-500 text-xs">
                              Not Available
                            </span>
                          ) : child.assignedTutorName ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primaryBlue p-1 text-xs font-medium hover:text-blue-700"
                              onClick={() => {
                                setSelectedUser(child.id);
                                setStep(1);
                              }}
                            >
                              {child.assignedTutorName}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primaryBlue p-1 text-xs font-medium hover:text-blue-700"
                              onClick={() => {
                                setSelectedUser(child.id);
                                setShowTutorModal(true);
                              }}
                            >
                              Assign Tutor
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
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
