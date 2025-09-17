"use client";

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
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetCurriculum,
  useGetSubscriptionPlansWithIds,
} from "@/lib/api/queries";
import { usePutCurriculum } from "@/lib/api/mutations";
import type { Curriculum } from "@/lib/types";

export default function EditCurriculumClient({
  curriculumId,
}: {
  curriculumId: string;
}) {
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

  // Get curriculum data
  const { data: curriculumData, isLoading: curriculumLoading } =
    useGetCurriculum(curriculumId);
  const curriculum = curriculumData?.data;

  // Get subscription plans
  const { data: subscriptionPlansData } = useGetSubscriptionPlansWithIds();
  const subscriptionPlans = subscriptionPlansData?.data || [];

  // Update mutation
  const { mutate: updateCurriculum, isPending: isUpdating } =
    usePutCurriculum(curriculumId);

  // Populate form data when curriculum is loaded
  useEffect(() => {
    if (curriculum) {
      setFormData({
        title: curriculum.title,
        description: curriculum.description || "",
        subscriptionPlanId: curriculum.subscriptionPlanId || "",
        durationWeeks: curriculum.durationWeeks || 1,
        learningObjectives: curriculum.learningObjectives || [],
        prerequisites: curriculum.prerequisites || [],
        tags: curriculum.tags || [],
        visibility: curriculum.visibility || "PRIVATE",
      });
    }
  }, [curriculum]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error("Please fill in the title");
      return;
    }

    updateCurriculum(formData as Curriculum, {
      onSuccess: (response) => {
        if (response.status === 200) {
          toast.success(response.data.message);
        }
      },
    });
  };

  const addObjective = () => {
    if (
      objectiveInput.trim() &&
      !(formData.learningObjectives || []).includes(objectiveInput.trim())
    ) {
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

  const removeObjective = (objective: string) => {
    setFormData({
      ...formData,
      learningObjectives: (formData.learningObjectives || []).filter(
        (o) => o !== objective
      ),
    });
  };

  const addPrerequisite = () => {
    if (
      prerequisiteInput.trim() &&
      !(formData.prerequisites || []).includes(prerequisiteInput.trim())
    ) {
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

  const removePrerequisite = (prerequisite: string) => {
    setFormData({
      ...formData,
      prerequisites: (formData.prerequisites || []).filter(
        (p) => p !== prerequisite
      ),
    });
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

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((t) => t !== tag),
    });
  };

  if (curriculumLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="py-6 max-w-4xl mx-auto w-full flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primaryBlue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="py-6 max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={`/admin/curricula/${curriculumId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Curriculum
            </Link>
          </Button>

          <h1 className="text-3xl font-bold">Edit Curriculum</h1>
          <p className="text-muted-foreground">Update curriculum information</p>
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential details about the curriculum
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
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="subscriptionPlanId">
                    Subscription Plan *
                  </Label>
                  <Select
                    value={formData.subscriptionPlanId || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, subscriptionPlanId: value })
                    }
                  >
                    <SelectTrigger id="subscriptionPlanId" className="mt-1">
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
                    className="mt-1"
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
                    <SelectTrigger id="visibility" className="mt-1">
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
                  What students will learn from this curriculum
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a learning objective"
                    value={objectiveInput}
                    onChange={(e) => setObjectiveInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addObjective())
                    }
                  />
                  <Button type="button" onClick={addObjective} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-2">
                  {(formData.learningObjectives || []).map(
                    (objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-sm flex-1">• {objective}</span>
                        <button
                          type="button"
                          onClick={() => removeObjective(objective)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prerequisites</CardTitle>
                <CardDescription>
                  What students should know before starting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a prerequisite"
                    value={prerequisiteInput}
                    onChange={(e) => setPrerequisiteInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addPrerequisite())
                    }
                  />
                  <Button type="button" onClick={addPrerequisite} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-2">
                  {(formData.prerequisites || []).map((prerequisite, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-sm flex-1">• {prerequisite}</span>
                      <button
                        type="button"
                        onClick={() => removePrerequisite(prerequisite)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
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
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-2">
                  {(formData.tags || []).map((tag, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-sm flex-1">• {tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/admin/curricula/${curriculumId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
