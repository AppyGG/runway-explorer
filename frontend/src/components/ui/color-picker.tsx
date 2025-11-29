import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  presetColors?: string[]
  className?: string
}

const defaultPresetColors = [
  '#3388ff', // Blue
  '#ff0000', // Red
  '#00cc00', // Green
  '#ff9900', // Orange
  '#d53f94', // Purple
  '#000000', // Black
  '#ffffff', // White
  '#ffff00', // Yellow
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
]

export function ColorPicker({ 
  value, 
  onChange, 
  presetColors = defaultPresetColors,
  className 
}: ColorPickerProps) {
  const [inputValue, setInputValue] = React.useState(value)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Only update if it's a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(newValue)) {
      onChange(newValue)
    }
  }

  const handlePresetClick = (color: string) => {
    setInputValue(color)
    onChange(color)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            className
          )}
        >
          <div className="flex items-center gap-2 w-full">
            <div
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: value }}
            />
            <span className="flex-1">{value.toUpperCase()}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2">
              <div
                className="h-9 w-9 rounded border flex-shrink-0"
                style={{ backgroundColor: value }}
              />
              <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Presets</label>
            <div className="grid grid-cols-6 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "h-5 w-5 rounded border-2 transition-all hover:scale-110",
                    value.toLowerCase() === color.toLowerCase()
                      ? "border-primary ring-1 ring-primary ring-offset-1"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handlePresetClick(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom</label>
            <input
              type="color"
              value={value}
              onChange={(e) => {
                setInputValue(e.target.value)
                onChange(e.target.value)
              }}
              className="h-8 w-full rounded border cursor-pointer"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
