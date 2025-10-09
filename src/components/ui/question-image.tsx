import React from 'react';
import { 
  getQuestionImageStyles, 
  getQuestionImageContainerStyles, 
  handleQuestionImageError,
  type QuestionImageProps
} from '@/lib/image-utils';

/**
 * Standardized component for rendering question images consistently across the app
 */
export function QuestionImage({ 
  src, 
  alt = "Question illustration", 
  metadata, 
  className = "rounded-lg border shadow-sm",
  defaultMaxHeight = "600px"
}: QuestionImageProps) {
  return (
    <div className="mt-4" style={getQuestionImageContainerStyles(metadata)}>
      <img 
        src={src}
        alt={alt}
        className={className}
        style={getQuestionImageStyles(metadata, defaultMaxHeight)}
        onError={(e) => handleQuestionImageError(e, src)}
      />
    </div>
  );
}