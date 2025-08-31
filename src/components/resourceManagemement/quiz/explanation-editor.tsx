"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, FileText, Eye, Edit3, Trash2 } from "lucide-react";
import { SimpleTextEditor } from "../editor/simple-text-editor";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface ExplanationEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ExplanationEditor({
  value,
  onChange,
  placeholder = "Add explanation or transition text...",
}: ExplanationEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!isEditing && !value) {
    return (
      <div className="flex justify-center py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="text-muted-foreground"
          data-testid="add-explanation-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add explanation
        </Button>
      </div>
    );
  }

  return (
    <div className="my-4">
      {isEditing ? (
        <div className="space-y-3">
          <SimpleTextEditor
            value={value}
            onChange={(newValue) => {
              onChange(newValue);
              setHasUnsavedChanges(true);
              setTimeout(() => setHasUnsavedChanges(false), 2000);
            }}
            placeholder={placeholder}
            className="min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                type="button"
              >
                {showPreview ? (
                  <>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </>
                )}
              </Button>
              {value ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange("");
                    setIsEditing(false);
                  }}
                  type="button"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    onChange("");
                  }}
                  type="button"
                >
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}
              <Button
                size="sm"
                onClick={() => setIsEditing(false)}
                type="button"
              >
                Done
              </Button>
            </div>
          </div>
          {showPreview && (
            <div className="prose prose-sm max-w-none p-4 bg-background border rounded-md">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {value || "*No content yet...*"}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ) : value ? (
        <div
          className="group relative border rounded-md p-4 cursor-pointer hover:border-primaryBlue/50 transition-all"
          onClick={() => setIsEditing(true)}
        >
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {value}
            </ReactMarkdown>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          className="w-full border-2 border-dashed rounded-md p-4 text-muted-foreground hover:text-foreground hover:border-primaryBlue/50 transition-all"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          <Plus className="h-4 w-4 inline mr-2" />
          Add explanation
        </button>
      )}
    </div>
  );
}
