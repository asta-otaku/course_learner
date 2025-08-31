'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus, GripVertical } from 'lucide-react';
import type { MatchingQuestion } from '@/lib/validations/question';

interface MatchingEditorProps {
  question?: Partial<MatchingQuestion>;
  onChange: (data: Partial<MatchingQuestion>) => void;
}

export function MatchingEditor({ question, onChange }: MatchingEditorProps) {
  const [pairs, setPairs] = useState<Array<{ id: string; left: string; right: string }>>(
    question?.matching_pairs?.map(pair => ({
      id: pair.id || Date.now().toString(),
      left: pair.left || '',
      right: pair.right || ''
    })) || [
      { id: '1', left: '', right: '' },
      { id: '2', left: '', right: '' },
    ]
  );

  const handleAddPair = () => {
    if (pairs.length >= 10) return;
    const newPairs = [...pairs, { id: Date.now().toString(), left: '', right: '' }];
    setPairs(newPairs);
    onChange({ type: 'matching', matching_pairs: newPairs });
  };

  const handleRemovePair = (index: number) => {
    if (pairs.length <= 2) return;
    const newPairs = pairs.filter((_, i) => i !== index);
    setPairs(newPairs);
    onChange({ type: 'matching', matching_pairs: newPairs });
  };

  const handlePairChange = (index: number, side: 'left' | 'right', value: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [side]: value };
    setPairs(newPairs);
    onChange({ type: 'matching', matching_pairs: newPairs });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Matching Pairs</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Create pairs that students will need to match. You can have 2-10 pairs.
        </p>
        <div className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 mb-2">
          <div></div>
          <Label className="text-center">Left Side</Label>
          <Label className="text-center">Right Side</Label>
          <div></div>
        </div>
        <div className="space-y-2">
          {pairs.map((pair, index) => (
            <div key={pair.id} className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 items-center">
              <div className="cursor-move text-muted-foreground">
                <GripVertical className="h-5 w-5" />
              </div>
              <Input
                value={pair.left}
                onChange={(e) => handlePairChange(index, 'left', e.target.value)}
                placeholder="Left item"
              />
              <Input
                value={pair.right}
                onChange={(e) => handlePairChange(index, 'right', e.target.value)}
                placeholder="Right item"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePair(index)}
                disabled={pairs.length <= 2}
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
        disabled={pairs.length >= 10}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Pair
      </Button>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Students will need to correctly match all pairs. 
          The right side items will be shuffled when presented to students.
        </p>
      </div>
    </div>
  );
}