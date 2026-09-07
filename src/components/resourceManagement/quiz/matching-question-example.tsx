'use client';

import { useState } from 'react';
import { MatchingQuestion } from './matching-question';

// Example usage component
export function MatchingQuestionExample() {
  const [matches, setMatches] = useState<Record<string, string>>({});

  const samplePairs = [
    { id: '1', left: 'Python', right: 'print()' },
    { id: '2', left: 'JavaScript', right: 'console.log()' },
    { id: '3', left: 'Java', right: 'System.out.println()' },
    { id: '4', left: 'C++', right: 'cout <<' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Matching Question Example</h2>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Match each programming language with its print statement:
        </h3>
        
        <MatchingQuestion
          questionId="example-1"
          pairs={samplePairs}
          value={matches}
          onChange={setMatches}
          disabled={false}
        />
        
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold mb-2">Current Matches:</h4>
          <pre className="text-sm">{JSON.stringify(matches, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}