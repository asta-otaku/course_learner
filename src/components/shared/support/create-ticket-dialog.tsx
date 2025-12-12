"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePostSupportTicket } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Loader2, X, Upload } from "lucide-react";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
}: CreateTicketDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createTicketMutation = usePostSupportTicket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const data: any = {
        title: title.trim(),
        description: description.trim(),
      };

      if (media) {
        data.media = media;
      }

      await createTicketMutation.mutateAsync(data);
      toast.success("Support ticket created successfully");
      
      // Reset form
      setTitle("");
      setDescription("");
      setMedia(null);
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setMedia(file);
    }
  };

  const removeMedia = () => {
    setMedia(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
          <DialogDescription>
            Submit a support request and our team will get back to you as soon
            as possible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about your issue"
              rows={6}
              required
            />
          </div>

          <div>
            <Label>Attachment (Optional)</Label>
            {media ? (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Upload className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    {media.name}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeMedia}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary/50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload a file
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Images, videos, or documents up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTicketMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTicketMutation.isPending}
            >
              {createTicketMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


