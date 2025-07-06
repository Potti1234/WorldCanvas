import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

interface ColorPickerProps {
  colors: string[]
  selectedColor: string
  onSelectColor: (color: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  selectedColor,
  onSelectColor,
  onConfirm,
  onCancel
}) => {
  return (
    <Card
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        width: '300px'
      }}
    >
      <CardHeader>
        <CardTitle>Select a color</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '10px'
          }}
        >
          {colors.map(color => (
            <div
              key={color}
              onClick={() => onSelectColor(color)}
              style={{
                width: '100%',
                paddingBottom: '100%',
                backgroundColor: color,
                cursor: 'pointer',
                border:
                  selectedColor === color ? '3px solid blue' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter style={{ justifyContent: 'space-between' }}>
        <Button onClick={onConfirm}>Confirm</Button>
        <Button variant='outline' onClick={onCancel}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}
