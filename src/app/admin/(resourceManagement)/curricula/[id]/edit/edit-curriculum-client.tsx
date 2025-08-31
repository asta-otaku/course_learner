"use client";

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
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCurriculum,
  updateCurriculum,
  getCategories,
  type CreateCurriculumInput,
} from "@/app/actions/curricula";

export default function EditCurriculumClient({
  curriculumId,
}: {
  curriculumId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [formData, setFormData] = useState<CreateCurriculumInput>({
    title: "",
    description: "",
    categoryId: undefined,
    objectives: [],
    prerequisites: [],
    isPublic: false,
  });
  const [objectiveInput, setObjectiveInput] = useState("");
  const [prerequisiteInput, setPrerequisiteInput] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [curriculum, categoriesData] = await Promise.all([
          getCurriculum(curriculumId),
          getCategories(),
        ]);

        if (!curriculum) {
          toast({
            title: "Error",
            description: "Failed to load curriculum",
            variant: "destructive",
          });
          router.push("/curricula");
          return;
        }
        setFormData({
          title: curriculum.title,
          description: curriculum.description || "",
          categoryId: curriculum.category_id || undefined,
          objectives: curriculum.objectives || [],
          prerequisites: curriculum.prerequisites || [],
          isPublic: curriculum.is_public || false,
        });

        setCategories(categoriesData || []);
      } catch (_error) {
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [curriculumId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateCurriculum(curriculumId, formData);

      if (result.error) {
        toast({
          title: "Error",
          description: (result as any).error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Curriculum updated successfully",
        });
        router.push(`/curricula/${curriculumId}`);
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update curriculum",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addObjective = () => {
    if (
      objectiveInput.trim() &&
      !(formData.objectives || []).includes(objectiveInput.trim())
    ) {
      setFormData({
        ...formData,
        objectives: [...(formData.objectives || []), objectiveInput.trim()],
      });
      setObjectiveInput("");
    }
  };

  const removeObjective = (objective: string) => {
    setFormData({
      ...formData,
      objectives: (formData.objectives || []).filter((o) => o !== objective),
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

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container py-6 max-w-4xl mx-auto w-full flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primaryBlue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container py-6 max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={`/curricula/${curriculumId}`}>
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
                  <Label htmlFor="categoryId">Category</Label>
                  <Select
                    value={formData.categoryId || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                  >
                    <SelectTrigger id="categoryId" className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPublic: checked })
                    }
                  />
                  <Label htmlFor="isPublic">Public</Label>
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
                  {(formData.objectives || []).map((objective, index) => (
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
                  ))}
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

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/curricula/${curriculumId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
