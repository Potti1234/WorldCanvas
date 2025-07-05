import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCanvasControls } from '@/hooks/useCanvasControls'
import { ColorPicker } from './ColorPicker'
import { useSession } from '@/hooks/useSession'
import { handleVerify } from '@/lib/worldcoin'
import { toast } from 'sonner'
import { VerificationLevel } from '@worldcoin/minikit-js'

const COLORS = [
  '#FFFFFF',
  '#C2C2C2',
  '#858585',
  '#474747',
  '#000000',
  '#362B23',
  '#7A4F33',
  '#E6A824',
  '#F3D49C',
  '#F8C3B8',
  '#E64A3E',
  '#9C273E',
  '#6A329C',
  '#32329C',
  '#3E4A9C',
  '#279C9C'
]

interface CanvasProps {
  size: number
}

const Canvas: React.FC<CanvasProps> = ({ size }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { pan, scale } = useCanvasControls(size, canvasRef)
  const { user, sessionId } = useSession()
  const [pixels, setPixels] = useState<Map<string, string>>(new Map())
  const [isPlacing, setIsPlacing] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedPixel, setSelectedPixel] = useState<{
    x: number
    y: number
  } | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const draw = () => {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(pan.x, pan.y)
      ctx.scale(scale, scale)

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, size, size)

      ctx.strokeStyle = 'black'
      ctx.lineWidth = 1 / scale
      ctx.strokeRect(0, 0, size, size)

      if (scale > 5) {
        ctx.strokeStyle = '#eee'
        ctx.lineWidth = 1 / scale

        const viewXStart = -pan.x / scale
        const viewXEnd = (canvas.width - pan.x) / scale
        const viewYStart = -pan.y / scale
        const viewYEnd = (canvas.height - pan.y) / scale

        const startX = Math.max(0, Math.floor(viewXStart))
        const endX = Math.min(size, Math.ceil(viewXEnd))
        const startY = Math.max(0, Math.floor(viewYStart))
        const endY = Math.min(size, Math.ceil(viewYEnd))

        for (let x = startX; x <= endX; x++) {
          ctx.beginPath()
          ctx.moveTo(x, startY)
          ctx.lineTo(x, endY)
          ctx.stroke()
        }
        for (let y = startY; y <= endY; y++) {
          ctx.beginPath()
          ctx.moveTo(startX, y)
          ctx.lineTo(endX, y)
          ctx.stroke()
        }
      }

      pixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number)
        ctx.fillStyle = color
        ctx.fillRect(x, y, 1, 1)
      })

      if (showColorPicker && selectedPixel) {
        ctx.fillStyle = selectedColor
        ctx.globalAlpha = 0.7
        ctx.fillRect(selectedPixel.x, selectedPixel.y, 1, 1)
        ctx.globalAlpha = 1.0
      }

      ctx.restore()
    }

    draw()
  }, [size, scale, pan, pixels, showColorPicker, selectedPixel, selectedColor])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleCanvasClick = (e: MouseEvent) => {
      if (!isPlacing || scale <= 5 || !canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const canvasX = Math.floor((mouseX - pan.x) / scale)
      const canvasY = Math.floor((mouseY - pan.y) / scale)

      if (canvasX >= 0 && canvasX < size && canvasY >= 0 && canvasY < size) {
        setSelectedPixel({ x: canvasX, y: canvasY })
        setShowColorPicker(true)
        setIsPlacing(false)
      }
    }

    canvas.addEventListener('click', handleCanvasClick)
    return () => {
      canvas.removeEventListener('click', handleCanvasClick)
    }
  }, [isPlacing, pan, scale, size])

  const handlePlacePixel = () => {
    if (selectedPixel) {
      const newPixels = new Map(pixels)
      newPixels.set(`${selectedPixel.x},${selectedPixel.y}`, selectedColor)
      setPixels(newPixels)
      setShowColorPicker(false)
      setSelectedPixel(null)
    }
  }

  const handleCancelPlacement = () => {
    setShowColorPicker(false)
    setSelectedPixel(null)
  }

  const handleEnterPlacementMode = async () => {
    if (!user || !sessionId) return

    if (
      user.verification_level === VerificationLevel.Device ||
      user.verification_level === VerificationLevel.Orb
    ) {
      setIsPlacing(true)
    } else {
      try {
        await handleVerify(sessionId)
        toast.success('Verification successful')
      } catch (error) {
        console.error('Verification failed:', error)
        toast.error('Verification failed')
      }
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}
      >
        {!isPlacing && !showColorPicker && (
          <Button onClick={handleEnterPlacementMode}>Place Pixel</Button>
        )}
        {isPlacing && (
          <Button onClick={() => setIsPlacing(false)} variant='destructive'>
            Cancel Pixel Placing
          </Button>
        )}
      </div>

      {showColorPicker && selectedPixel && (
        <ColorPicker
          colors={COLORS}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          onConfirm={handlePlacePixel}
          onCancel={handleCancelPlacement}
        />
      )}
    </div>
  )
}

export default Canvas
