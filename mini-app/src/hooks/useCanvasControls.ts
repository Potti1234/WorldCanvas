import { useState, useEffect, RefObject } from 'react'

export const useCanvasControls = (
  size: number,
  canvasRef: RefObject<HTMLCanvasElement | null>
) => {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(0.5)
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [isPinching, setIsPinching] = useState(false)
  const [startPinchDist, setStartPinchDist] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const padding = size / 2

    const clampPan = (pan: { x: number; y: number }, currentScale: number) => {
      const vw = canvas.width
      const vh = canvas.height
      const contentWidth = (size + 2 * padding) * currentScale
      const contentHeight = (size + 2 * padding) * currentScale

      let minX, maxX, minY, maxY

      if (contentWidth < vw) {
        minX = maxX = (vw - size * currentScale) / 2
      } else {
        minX = vw - (size + padding) * currentScale
        maxX = padding * currentScale
      }

      if (contentHeight < vh) {
        minY = maxY = (vh - size * currentScale) / 2
      } else {
        minY = vh - (size + padding) * currentScale
        maxY = padding * currentScale
      }

      return {
        x: Math.max(minX, Math.min(maxX, pan.x)),
        y: Math.max(minY, Math.min(maxY, pan.y))
      }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const minScale = Math.min(canvas.width, canvas.height) / (size + 2 * padding)
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
        setStartPan({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y })
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
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
        const minScale = Math.min(canvas.width, canvas.height) / (size + 2 * padding)
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
        const zoom = dist / startPinchDist
        const newScale = Math.max(minScale, scale * zoom)
        const actualZoom = newScale / scale
        const rect = canvas.getBoundingClientRect()
        const touchX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
        const touchY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top

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
        setPan(p => clampPan(p, scale))
    }

    canvas.addEventListener('wheel', handleWheel)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
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
  }, [size, canvasRef, scale, pan, isPanning, startPan, isPinching, startPinchDist])

  return { pan, scale }
} 