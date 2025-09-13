"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategories } from "@/app/actions/curricula";
import { usePostCurriculum } from "@/lib/api/mutations";
import type { Curriculum } from "@/lib/types";

export default function NewCurriculumPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<
    Array<{
      id: string;
      name: string;
      color: string | null;
      icon: string | null;
    }>
  >([]);
  const [formData, setFormData] = useState<Partial<Curriculum>>({
    title: "",
    description: "",
    gradeLevel: "",
    durationWeeks: 1,
    objectives: [],
    prerequisites: [],
    isPublic: false,
  });
  const [objectiveInput, setObjectiveInput] = useState("");
  const [prerequisiteInput, setPrerequisiteInput] = useState("");

  // Use the mutation hook
  const { mutate: createCurriculum, isPending: isCreating } =
    usePostCurriculum();

  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategories();
      setCategories(cats);
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error("Please fill in the title");
      return;
    }

    if (!formData.gradeLevel) {
      toast.error("Please select a grade level");
      return;
    }

    createCurriculum(formData as Curriculum, {
      onSuccess: (response) => {
        if (response.data?.data) {
          toast.success("Curriculum created successfully!");
          const curriculumId = (response.data.data as any).id;
          router.push(`/admin/curricula/${curriculumId}`);
        } else {
          toast.error("Failed to create curriculum. Please try again.");
        }
      },
      onError: (error) => {
        console.error("Error creating curriculum:", error);
        toast.error("Failed to create curriculum. Please try again.");
      },
    });
  };

  const addObjective = () => {
    if (objectiveInput.trim()) {
      setFormData({
        ...formData,
        objectives: [...(formData.objectives || []), objectiveInput.trim()],
      });
      setObjectiveInput("");
    }
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      objectives: (formData.objectives || []).filter((_, i) => i !== index),
    });
  };

  const addPrerequisite = () => {
    if (prerequisiteInput.trim()) {
      setFormData({
        ...formData,
        prerequisites: [
          ...(formData.prerequisites || []),
          prerequisiteInput.trim(),
        ],
      });
      setPrerequisiteInput("");
    }
  };

  const removePrerequisite = (index: number) => {
    setFormData({
      ...formData,
      prerequisites: (formData.prerequisites || []).filter(
        (_, i) => i !== index
      ),
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="py-6 max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/admin/curricula">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Curricula
            </Link>
          </Button>

          <h1 className="text-3xl font-bold font-poppins">
            Create New Curriculum
          </h1>
          <p className="text-muted-foreground">
            Organize your lessons and quizzes into a structured curriculum
          </p>
        </div>
        <div className="flex-1 overflow-y-auto pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide basic details about your curriculum
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Algebra I"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this curriculum covers..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="gradeLevel">Grade Level *</Label>
                  <Select
                    value={formData.gradeLevel || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gradeLevel: value })
                    }
                  >
                    <SelectTrigger id="gradeLevel">
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year One</SelectItem>
                      <SelectItem value="2">Year Two</SelectItem>
                      <SelectItem value="3">Year Three</SelectItem>
                      <SelectItem value="4">Year Four</SelectItem>
                      <SelectItem value="5">Year Five</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="durationWeeks">Duration (Weeks) *</Label>
                  <Input
                    id="durationWeeks"
                    type="number"
                    value={formData.durationWeeks || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationWeeks: parseInt(e.target.value) || 1,
                      })
                    }
                    placeholder="1"
                    min="1"
                    max="52"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="public"
                    checked={formData.isPublic || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPublic: checked })
                    }
                  />
                  <Label htmlFor="public">Make this curriculum public</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Objectives</CardTitle>
                <CardDescription>
                  What will students learn from this curriculum?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={objectiveInput}
                    onChange={(e) => setObjectiveInput(e.target.value)}
                    placeholder="Add a learning objective..."
                    onKeyPress={(e) => e.key === "Enter" && addObjective()}
                  />
                  <Button type="button" onClick={addObjective} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {(formData.objectives || []).length > 0 && (
                  <div className="space-y-2">
                    {(formData.objectives || []).map((objective, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="flex-1 justify-between"
                        >
                          {objective}
                          <button
                            type="button"
                            onClick={() => removeObjective(index)}
                            className="ml-2"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prerequisites</CardTitle>
                <CardDescription>
                  What should students know before starting this curriculum?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={prerequisiteInput}
                    onChange={(e) => setPrerequisiteInput(e.target.value)}
                    placeholder="Add a prerequisite..."
                    onKeyPress={(e) => e.key === "Enter" && addPrerequisite()}
                  />
                  <Button type="button" onClick={addPrerequisite} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {(formData.prerequisites || []).length > 0 && (
                  <div className="space-y-2">
                    {(formData.prerequisites || []).map(
                      (prerequisite, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="flex-1 justify-between"
                          >
                            {prerequisite}
                            <button
                              type="button"
                              onClick={() => removePrerequisite(index)}
                              className="ml-2"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/curricula")}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Curriculum"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
