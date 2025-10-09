import type { CSSProperties } from 'react';

export interface ImageSettings {
  size_mode?: 'auto' | 'custom';
  alignment?: 'left' | 'center' | 'right';
  object_fit?: 'contain' | 'cover' | 'fill' | 'scale-down';
  max_height?: string;
  width?: string;
  height?: string;
}

export interface ImageDimensions {
  width?: number;
  height?: number;
}

export interface QuestionImageMetadata {
  image_settings?: ImageSettings;
  image_dimensions?: ImageDimensions;
}

/**
 * Generate consistent image styles for question images across all components
 */
export function getQuestionImageStyles(
  metadata?: QuestionImageMetadata,
  defaultMaxHeight: string = '600px'
): CSSProperties {
  const settings = metadata?.image_settings;
  const dimensions = metadata?.image_dimensions;

  return {
    maxHeight: settings?.max_height || defaultMaxHeight,
    objectFit: settings?.object_fit || 'contain',
    width: settings?.width || 
           (dimensions?.width ? `${dimensions.width}px` : 'auto'),
    height: settings?.height || 
            (dimensions?.height ? `${dimensions.height}px` : 'auto'),
    maxWidth: '100%'
  };
}

/**
 * Generate consistent container styles for question image alignment
 */
export function getQuestionImageContainerStyles(
  metadata?: QuestionImageMetadata
): CSSProperties {
  const alignment = metadata?.image_settings?.alignment || 'center';
  
  return {
    display: 'flex',
    justifyContent: alignment === 'left' ? 'flex-start' : 
                   alignment === 'right' ? 'flex-end' : 'center'
  };
}

/**
 * Standardized error handler for question images
 */
export function handleQuestionImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  imageUrl?: string
) {
  console.error('Failed to load question image:', imageUrl);
  event.currentTarget.style.display = 'none';
}

/**
 * Props interface for QuestionImage component
 */
export interface QuestionImageProps {
  src: string;
  alt?: string;
  metadata?: QuestionImageMetadata;
  className?: string;
  defaultMaxHeight?: string;
}