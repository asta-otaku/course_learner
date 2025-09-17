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
import { useGetSubscriptionPlansWithIds } from "@/lib/api/queries";
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

  // Get subscription plans
  const { data: subscriptionPlansData } = useGetSubscriptionPlansWithIds();
  const subscriptionPlans = subscriptionPlansData?.data || [];
  const [formData, setFormData] = useState<Partial<Curriculum>>({
    title: "",
    description: "",
    subscriptionPlanId: "",
    durationWeeks: 1,
    learningObjectives: [],
    prerequisites: [],
    tags: [],
    visibility: "PRIVATE",
  });
  const [objectiveInput, setObjectiveInput] = useState("");
  const [prerequisiteInput, setPrerequisiteInput] = useState("");
  const [tagInput, setTagInput] = useState("");

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

    if (!formData.subscriptionPlanId) {
      toast.error("Please select a subscription plan");
      return;
    }

    createCurriculum(formData as Curriculum, {
      onSuccess: async (response) => {
        if (response.data?.data) {
          toast.success("Curriculum created successfully!");
          const curriculumId = await (response.data.data as any).id;
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
        learningObjectives: [
          ...(formData.learningObjectives || []),
          objectiveInput.trim(),
        ],
      });
      setObjectiveInput("");
    }
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      learningObjectives: (formData.learningObjectives || []).filter(
        (_, i) => i !== index
      ),
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

  const addTag = () => {
    if (tagInput.trim() && !(formData.tags || []).includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput("");
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

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((_, i) => i !== index),
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
                  <Label htmlFor="subscriptionPlan">Subscription Plan *</Label>
                  <Select
                    value={formData.subscriptionPlanId || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, subscriptionPlanId: value })
                    }
                  >
                    <SelectTrigger id="subscriptionPlan">
                      <SelectValue placeholder="Select subscription plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.offerType}
                        </SelectItem>
                      ))}
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

                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={formData.visibility || "PRIVATE"}
                    onValueChange={(value: "PRIVATE" | "PUBLIC") =>
                      setFormData({ ...formData, visibility: value })
                    }
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                    </SelectContent>
                  </Select>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addObjective();
                      }
                    }}
                  />
                  <Button type="button" onClick={addObjective} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {(formData.learningObjectives || []).length > 0 && (
                  <div className="space-y-2">
                    {(formData.learningObjectives || []).map(
                      (objective, index) => (
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
                      )
                    )}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPrerequisite();
                      }
                    }}
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

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Add tags to help categorize and search for this curriculum
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {(formData.tags || []).length > 0 && (
                  <div className="space-y-2">
                    {(formData.tags || []).map((tag, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="flex-1 justify-between"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
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
