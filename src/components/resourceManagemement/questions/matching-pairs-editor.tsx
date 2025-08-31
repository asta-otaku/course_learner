"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Plus, GripVertical } from "lucide-react";

interface MatchingPair {
  left: string;
  right: string;
}

interface MatchingPairsEditorProps {
  value: MatchingPair[];
  onChange: (pairs: MatchingPair[]) => void;
  disabled?: boolean;
  showErrors?: boolean;
}

export function MatchingPairsEditor({
  value = [],
  onChange,
  disabled = false,
  showErrors = false,
}: MatchingPairsEditorProps) {
  const [pairs, setPairs] = useState<MatchingPair[]>(() => {
    if (value && value.length > 0) {
      return value;
    }
    return [
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
    ];
  });

  // Update internal state when value prop changes
  useEffect(() => {
    if (value && value.length > 0) {
      setPairs(value);
    }
  }, [value]);

  const handleAddPair = useCallback(() => {
    if (pairs.length >= 10) return;

    const newPairs = [...pairs, { left: "", right: "" }];
    setPairs(newPairs);
    onChange(newPairs);
  }, [pairs, onChange]);

  const handleRemovePair = useCallback(
    (index: number) => {
      if (pairs.length <= 2) return;

      const newPairs = pairs.filter((_, i) => i !== index);
      setPairs(newPairs);
      onChange(newPairs);
    },
    [pairs, onChange]
  );

  const handlePairChange = useCallback(
    (index: number, side: "left" | "right", value: string) => {
      const newPairs = [...pairs];
      newPairs[index] = { ...newPairs[index], [side]: value };
      setPairs(newPairs);
      onChange(newPairs);
    },
    [pairs, onChange]
  );

  const hasErrors =
    showErrors && pairs.some((pair) => !pair.left.trim() || !pair.right.trim());

  return (
    <div className="space-y-4">
      <div>
        <Label>Matching Pairs</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Create pairs that students will need to match. Each pair consists of a
          term and its definition or matching concept.
        </p>

        <div className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 mb-2">
          <div></div>
          <Label className="text-center font-medium">Term/Concept</Label>
          <Label className="text-center font-medium">Definition/Match</Label>
          <div></div>
        </div>

        <div className="space-y-2">
          {pairs.map((pair, index) => (
            <div
              key={index}
              className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 items-center"
            >
              <div className="cursor-move text-muted-foreground flex justify-center">
                <GripVertical className="h-5 w-5" />
              </div>

              <Input
                value={pair.left}
                onChange={(e) =>
                  handlePairChange(index, "left", e.target.value)
                }
                placeholder="Enter term or concept"
                disabled={disabled}
                className={
                  showErrors && !pair.left.trim() ? "border-red-500" : ""
                }
              />

              <Input
                value={pair.right}
                onChange={(e) =>
                  handlePairChange(index, "right", e.target.value)
                }
                placeholder="Enter definition or match"
                disabled={disabled}
                className={
                  showErrors && !pair.right.trim() ? "border-red-500" : ""
                }
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePair(index)}
                disabled={pairs.length <= 2 || disabled}
                className="text-muted-foreground hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleAddPair}
        disabled={pairs.length >= 10 || disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Pair
      </Button>

      {hasErrors && (
        <div className="text-sm text-red-500">
          All pairs must have both a term and definition filled in.
        </div>
      )}

      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Preview</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Students will see the terms on the left and definitions on the right,
          but shuffled randomly.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Terms:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {pairs
                .filter((p) => p.left.trim())
                .map((pair, index) => (
                  <li key={index} className="text-muted-foreground">
                    {pair.left}
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <strong>Definitions:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {pairs
                .filter((p) => p.right.trim())
                .map((pair, index) => (
                  <li key={index} className="text-muted-foreground">
                    {pair.right}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
