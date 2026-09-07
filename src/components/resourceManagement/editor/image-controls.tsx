'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RotateCcw } from 'lucide-react'

export interface ImageSettings {
  size_mode: 'percentage' | 'pixels' | 'auto'
  width?: string | null
  height?: string | null
  max_height?: string
  alignment: 'left' | 'center' | 'right'
  object_fit: 'contain' | 'cover' | 'fill'
}

interface ImageControlsProps {
  settings: ImageSettings
  onChange: (settings: ImageSettings) => void
  imageUrl?: string | null
}

const DEFAULT_SETTINGS: ImageSettings = {
  size_mode: 'auto',
  width: null,
  height: null,
  max_height: '600px',
  alignment: 'center',
  object_fit: 'contain'
}

const SIZE_PRESETS = [
  { label: 'Thumbnail', width: '150px', height: '150px' },
  { label: 'Small', width: '300px', height: 'auto' },
  { label: 'Medium', width: '500px', height: 'auto' },
  { label: 'Large', width: '800px', height: 'auto' },
  { label: 'Full Width', width: '100%', height: 'auto' },
]

const PERCENTAGE_OPTIONS = ['25%', '50%', '75%', '100%']

export function ImageControls({ settings, onChange, imageUrl }: ImageControlsProps) {
  const handleSizeModeChange = (mode: ImageSettings['size_mode']) => {
    const newSettings = { ...settings, size_mode: mode }
    
    // Set default values based on mode
    if (mode === 'percentage') {
      newSettings.width = '50%'
      newSettings.height = 'auto'
    } else if (mode === 'pixels') {
      newSettings.width = '400px'
      newSettings.height = 'auto'
    } else {
      newSettings.width = null
      newSettings.height = null
    }
    
    onChange(newSettings)
  }

  const handlePresetSelect = (preset: typeof SIZE_PRESETS[0]) => {
    onChange({
      ...settings,
      size_mode: 'pixels',
      width: preset.width,
      height: preset.height
    })
  }

  const handleReset = () => {
    onChange(DEFAULT_SETTINGS)
  }

  const getImageStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      maxHeight: settings.max_height || '600px',
      objectFit: settings.object_fit || 'contain',
    }

    if (settings.width) {
      styles.width = settings.width
    }
    if (settings.height && settings.height !== 'auto') {
      styles.height = settings.height
    }

    // Handle alignment
    if (settings.alignment === 'left') {
      styles.marginRight = 'auto'
    } else if (settings.alignment === 'right') {
      styles.marginLeft = 'auto'
    } else {
      styles.marginLeft = 'auto'
      styles.marginRight = 'auto'
    }

    return styles
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Image Display Settings</CardTitle>
            <CardDescription>
              Configure how the image will appear in questions and quizzes
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Presets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            {SIZE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Size Mode */}
        <div className="space-y-2">
          <Label>Size Mode</Label>
          <RadioGroup
            value={settings.size_mode}
            onValueChange={handleSizeModeChange}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="auto" />
              <Label htmlFor="auto" className="font-normal">
                Auto (Original Size)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage" className="font-normal">
                Percentage
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pixels" id="pixels" />
              <Label htmlFor="pixels" className="font-normal">
                Fixed Pixels
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Size Controls */}
        {settings.size_mode === 'percentage' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width-percent">Width</Label>
              <Select
                value={settings.width || '50%'}
                onValueChange={(value) => onChange({ ...settings, width: value })}
              >
                <SelectTrigger id="width-percent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERCENTAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="height-percent">Height</Label>
              <Select
                value={settings.height || 'auto'}
                onValueChange={(value) => onChange({ ...settings, height: value })}
              >
                <SelectTrigger id="height-percent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  {PERCENTAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {settings.size_mode === 'pixels' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width-px">Width (px)</Label>
              <Input
                id="width-px"
                type="number"
                placeholder="400"
                value={settings.width?.replace('px', '') || ''}
                onChange={(e) => {
                  const value = e.target.value ? `${e.target.value}px` : null
                  onChange({ ...settings, width: value })
                }}
                min="50"
                max="2000"
              />
            </div>
            <div>
              <Label htmlFor="height-px">Height (px)</Label>
              <Input
                id="height-px"
                type="text"
                placeholder="auto"
                value={settings.height?.replace('px', '') || 'auto'}
                onChange={(e) => {
                  const value = e.target.value === 'auto' ? 'auto' : `${e.target.value}px`
                  onChange({ ...settings, height: value })
                }}
              />
            </div>
          </div>
        )}

        {/* Max Height */}
        <div>
          <Label htmlFor="max-height">Maximum Height (px)</Label>
          <Input
            id="max-height"
            type="number"
            placeholder="600"
            value={settings.max_height?.replace('px', '') || ''}
            onChange={(e) => {
              const value = e.target.value ? `${e.target.value}px` : '600px'
              onChange({ ...settings, max_height: value })
            }}
            min="100"
            max="1200"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Prevents images from becoming too tall
          </p>
        </div>

        {/* Alignment */}
        <div className="space-y-2">
          <Label>Alignment</Label>
          <RadioGroup
            value={settings.alignment}
            onValueChange={(value: ImageSettings['alignment']) => 
              onChange({ ...settings, alignment: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="left" id="align-left" />
              <Label htmlFor="align-left" className="font-normal">
                Left
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="center" id="align-center" />
              <Label htmlFor="align-center" className="font-normal">
                Center
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="right" id="align-right" />
              <Label htmlFor="align-right" className="font-normal">
                Right
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Object Fit */}
        <div>
          <Label htmlFor="object-fit">Object Fit</Label>
          <Select
            value={settings.object_fit}
            onValueChange={(value: ImageSettings['object_fit']) => 
              onChange({ ...settings, object_fit: value })
            }
          >
            <SelectTrigger id="object-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contain">
                Contain (Fit within bounds)
              </SelectItem>
              <SelectItem value="cover">
                Cover (Fill bounds, may crop)
              </SelectItem>
              <SelectItem value="fill">
                Fill (Stretch to fill)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        {imageUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-muted/50">
              <img
                src={imageUrl}
                alt="Preview"
                style={getImageStyles()}
                className="block"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}