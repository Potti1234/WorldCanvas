import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

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

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(0.5)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [isPinching, setIsPinching] = useState(false)
  const [startPinchDist, setStartPinchDist] = useState(0)
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

    const clampPan = (pan: { x: number; y: number }, scale: number) => {
      if (!canvas) return pan
      const vw = canvas.width
      const vh = canvas.height

      let minX, maxX, minY, maxY

      if (2000 * scale < vw) {
        minX = maxX = (vw - 1000 * scale) / 2
      } else {
        minX = vw - 1500 * scale
        maxX = 500 * scale
      }

      if (2000 * scale < vh) {
        minY = maxY = (vh - 1000 * scale) / 2
      } else {
        minY = vh - 1500 * scale
        maxY = 500 * scale
      }

      return {
        x: Math.max(minX, Math.min(maxX, pan.x)),
        y: Math.max(minY, Math.min(maxY, pan.y))
      }
    }

    const draw = () => {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(pan.x, pan.y)
      ctx.scale(scale, scale)

      // Draw the white canvas background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 1000, 1000)

      // Draw a border around the canvas so we can see it when zoomed out
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 1 / scale
      ctx.strokeRect(0, 0, 1000, 1000)

      // Draw grid lines if zoomed in enough
      if (scale > 5) {
        ctx.strokeStyle = '#eee'
        ctx.lineWidth = 1 / scale

        const viewXStart = -pan.x / scale
        const viewXEnd = (canvas.width - pan.x) / scale
        const viewYStart = -pan.y / scale
        const viewYEnd = (canvas.height - pan.y) / scale

        const startX = Math.max(0, Math.floor(viewXStart))
        const endX = Math.min(1000, Math.ceil(viewXEnd))
        const startY = Math.max(0, Math.floor(viewYStart))
        const endY = Math.min(1000, Math.ceil(viewYEnd))

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

    const handleCanvasClick = (e: MouseEvent) => {
      if (!isPlacing || scale <= 5 || !canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const canvasX = Math.floor((mouseX - pan.x) / scale)
      const canvasY = Math.floor((mouseY - pan.y) / scale)

      if (canvasX >= 0 && canvasX < 1000 && canvasY >= 0 && canvasY < 1000) {
        setSelectedPixel({ x: canvasX, y: canvasY })
        setShowColorPicker(true)
        setIsPlacing(false)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const minScale = Math.min(canvas.width, canvas.height) / 2000
      const zoom = 1 - e.deltaY * 0.001
      const newScale = Math.max(minScale, scale * zoom)
      const actualZoom = newScale / scale
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const newPan = {
        x: mouseX - (mouseX - pan.x) * actualZoom,
        y: mouseY - (mouseY - pan.y) * actualZoom
      }
      setScale(newScale)
      setPan(clampPan(newPan, newScale))
    }

    const handleMouseDown = (e: MouseEvent) => {
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const newPan = {
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y
        }
        setPan(clampPan(newPan, scale))
      }
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        setIsPanning(true)
        setStartPan({
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y
        })
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        setIsPinching(true)
        setStartPinchDist(dist)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isPanning && e.touches.length === 1) {
        const newPan = {
          x: e.touches[0].clientX - startPan.x,
          y: e.touches[0].clientY - startPan.y
        }
        setPan(clampPan(newPan, scale))
      } else if (isPinching && e.touches.length === 2) {
        const minScale = Math.min(canvas.width, canvas.height) / 2000
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        const zoom = dist / startPinchDist
        const newScale = Math.max(minScale, scale * zoom)
        const actualZoom = newScale / scale
        const rect = canvas.getBoundingClientRect()
        const touchX =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
        const touchY =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top

        const newPan = {
          x: touchX - (touchX - pan.x) * actualZoom,
          y: touchY - (touchY - pan.y) * actualZoom
        }

        setScale(newScale)
        setPan(clampPan(newPan, newScale))
        setStartPinchDist(dist)
      }
    }

    const handleTouchEnd = () => {
      setIsPanning(false)
      setIsPinching(false)
    }

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        setPan(p => clampPan(p, scale))
      }
    }

    canvas.addEventListener('click', handleCanvasClick)
    canvas.addEventListener('wheel', handleWheel)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchmove', handleTouchMove)
    canvas.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('resize', handleResize)

    return () => {
      canvas.removeEventListener('click', handleCanvasClick)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('resize', handleResize)
    }
  }, [
    scale,
    pan,
    isPanning,
    startPan,
    isPinching,
    startPinchDist,
    pixels,
    isPlacing,
    showColorPicker,
    selectedPixel,
    selectedColor
  ])

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
          <Button onClick={() => setIsPlacing(true)}>Place Pixel</Button>
        )}
        {isPlacing && (
          <Button onClick={() => setIsPlacing(false)} variant='destructive'>
            Cancel Pixel Placing
          </Button>
        )}
      </div>

      {showColorPicker && selectedPixel && (
        <Card
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            width: '250px'
          }}
        >
          <CardHeader>
            <CardTitle>Select a color</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px'
              }}
            >
              {COLORS.map(color => (
                <div
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: '100%',
                    paddingBottom: '100%',
                    backgroundColor: color,
                    cursor: 'pointer',
                    border:
                      selectedColor === color
                        ? '3px solid blue'
                        : '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter style={{ justifyContent: 'space-between' }}>
            <Button onClick={handlePlacePixel}>Confirm</Button>
            <Button variant='outline' onClick={handleCancelPlacement}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

export default Canvas
