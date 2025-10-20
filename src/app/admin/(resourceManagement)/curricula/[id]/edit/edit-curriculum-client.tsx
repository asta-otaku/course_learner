"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, X } from "lucide-react";
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
import { usePutCurriculum, useDeleteCurriculum } from "@/lib/api/mutations";
import type { Curriculum } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditCurriculumClient({
  curriculumId,
}: {
  curriculumId: string;
}) {
  const router = useRouter();
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

  // Delete mutation
  const { mutate: deleteCurriculum, isPending: isDeleting } =
    useDeleteCurriculum(curriculumId);

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

    if (!formData.title?.trim()) {
      toast.error("Please enter a title");
      return;
    }

    // Only send the fields that should be updated
    const updateData = {
      title: formData.title,
      description: formData.description,
      subscriptionPlanId: formData.subscriptionPlanId,
      durationWeeks: formData.durationWeeks,
      learningObjectives: formData.learningObjectives,
      prerequisites: formData.prerequisites,
      tags: formData.tags,
      visibility: formData.visibility,
    };

    updateCurriculum(updateData as Curriculum, {
      onSuccess: (response) => {
        if (response.status === 200) {
          toast.success(response.data.message);
          router.push(`/admin/curricula/${curriculumId}`);
        }
      },
    });
  };

  const handleDelete = () => {
    deleteCurriculum(undefined, {
      onSuccess: (response) => {
        toast.success("Curriculum deleted successfully");
        router.push("/admin/curricula");
      },
      onError: (error) => {
        toast.error("Failed to delete curriculum");
      },
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
        <div className="mb-6 flex justify-between items-start">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link href={`/admin/curricula/${curriculumId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Curriculum
              </Link>
            </Button>

            <h1 className="text-3xl font-bold">Edit Curriculum</h1>
            <p className="text-muted-foreground">
              Update curriculum information
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Curriculum
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  curriculum and all associated lessons and data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                    disabled
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="subscriptionPlanId">
                    Subscription Plan *
                  </Label>
                  <Select value={formData.subscriptionPlanId || ""} disabled>
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
                    disabled
                    placeholder="1"
                    min="1"
                    max="52"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select value={formData.visibility || "PRIVATE"} disabled>
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
                <ul className="space-y-2">
                  {(formData.learningObjectives || []).map(
                    (objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-sm flex-1">• {objective}</span>
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
                <ul className="space-y-2">
                  {(formData.prerequisites || []).map((prerequisite, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-sm flex-1">• {prerequisite}</span>
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
                <ul className="space-y-2">
                  {(formData.tags || []).map((tag, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-sm flex-1">• {tag}</span>
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
