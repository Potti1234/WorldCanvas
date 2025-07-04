import React, { useRef, useEffect, useState } from 'react'

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(0.5)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [isPinching, setIsPinching] = useState(false)
  const [startPinchDist, setStartPinchDist] = useState(0)

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

      ctx.restore()
    }

    draw()

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoom = 1 - e.deltaY * 0.001
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const newScale = scale * zoom
      const newPan = {
        x: mouseX - (mouseX - pan.x) * zoom,
        y: mouseY - (mouseY - pan.y) * zoom
      }
      setScale(newScale)
      setPan(newPan)
    }

    const handleMouseDown = (e: MouseEvent) => {
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y
        })
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
        setPan({
          x: e.touches[0].clientX - startPan.x,
          y: e.touches[0].clientY - startPan.y
        })
      } else if (isPinching && e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        const zoom = dist / startPinchDist
        const rect = canvas.getBoundingClientRect()
        const touchX =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
        const touchY =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top

        const newScale = scale * zoom
        const newPan = {
          x: touchX - (touchX - pan.x) * zoom,
          y: touchY - (touchY - pan.y) * zoom
        }

        setScale(newScale)
        setPan(newPan)
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
        draw()
      }
    }

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
  }, [scale, pan, isPanning, startPan, isPinching, startPinchDist])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}

export default Canvas
