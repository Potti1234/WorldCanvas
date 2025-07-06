import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCanvasControls } from '@/hooks/useCanvasControls'
import { ColorPicker } from './ColorPicker'
import { useSession } from '@/hooks/useSession'
import { handleVerify } from '@/lib/worldcoin'
import { toast } from 'sonner'
import { VerificationLevel } from '@worldcoin/minikit-js'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { PixelInfoCard } from './PixelInfoCard'
import { getContrastColor } from '@/lib/color'
import { usePlacePixelOnContract } from '@/lib/transactions/placepixel'
import { MiniKit } from '@worldcoin/minikit-js'
import { SelfAppBuilder } from '@selfxyz/qrcode'
import { SelfVerifyModal } from './SelfVerifyModal'
import { MessageSquare, Trophy } from 'lucide-react'
import { Chat } from './Chat'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Leaderboard } from './Leaderboard'

const COLORS = [
  '#FFFFFF',
  '#F0F8FF',
  '#E6E6FA',
  '#C0C0C0',
  '#666666',
  '#000000',
  '#FFE4E1',
  '#FFC0CB',
  '#FFB6C1',
  '#FF80ED',
  '#9400D3', // DarkViolet
  '#FF7373',
  '#FA8072',
  '#FF0000',
  '#A0522D', // Sienna
  '#FFA500',
  '#FFD700',
  '#FFFF00',
  '#D3FFCE',
  '#BADA55',
  '#40E0D0',
  '#008080',
  '#065535',
  '#C6E2FF',
  '#B0E0E6',
  '#00FFFF',
  '#003366',
  '#133337',
  '#0000FF',
  '#FAEBD7'
]

interface CanvasProps {
  size: number
}

const Canvas: React.FC<CanvasProps> = ({ size }) => {
  const PIXEL_COOLDOWN = 5 * 1000

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { pan, scale, setPan, setScale } = useCanvasControls(size, canvasRef)
  const { user, sessionId } = useSession()
  const pixels = useQuery(api.entity.pixel.list)
  const placePixel = useMutation(api.entity.pixel.placePixel)
  const updateUserVerification = useMutation(
    api.login.updateUserVerificationLevelToDevice
  )
  const [isPlacing, setIsPlacing] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedPixel, setSelectedPixel] = useState<{
    x: number
    y: number
  } | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0])
  const [cooldown, setCooldown] = useState(0)
  const [showPixelInfo, setShowPixelInfo] = useState<any | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [showSelfQR, setShowSelfQR] = useState(false)
  const [selfApp, setSelfApp] = useState<any>(null)
  //const [selfQRUrl, setSelfQRUrl] = useState('')
  const {
    placePixel: placePixelOnContract,
    isSubmitting,
    isConfirming
  } = usePlacePixelOnContract(
    async () => {
      if (selectedPixel && sessionId) {
        try {
          await placePixel({
            x: selectedPixel.x,
            y: selectedPixel.y,
            color: selectedColor,
            sessionId: sessionId
          })
          setShowColorPicker(false)
          setSelectedPixel(null)
          toast.success('Pixel placed!')
        } catch (error) {
          toast.error(
            'Transaction succeeded, but failed to update pixel in DB.'
          )
        }
      }
    },
    error => {
      toast.error(error.message)
    }
  )

  useEffect(() => {
    const targetScale = 6
    const animationDuration = 2000 // 2 seconds
    const initialScale = 0.1
    let startTime: number | null = null

    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime
      }

      const elapsedTime = currentTime - startTime
      const progress = Math.min(elapsedTime / animationDuration, 1)

      const easedProgress = 1 - Math.pow(1 - progress, 3) // easeOutCubic

      const newScale =
        initialScale + (targetScale - initialScale) * easedProgress

      const newPan = {
        x: (window.innerWidth - size * newScale) / 2,
        y: (window.innerHeight - size * newScale) / 2
      }

      setScale(newScale)
      setPan(newPan)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    const animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [setPan, setScale, size])

  useEffect(() => {
    const updateCooldown = () => {
      if (!user?.lastPlaced) {
        setCooldown(0)
        return
      }
      const now = Date.now()
      const diff = now - user.lastPlaced
      const secondsLeft = Math.ceil((PIXEL_COOLDOWN - diff) / 1000)
      if (secondsLeft <= 0) {
        setCooldown(0)
      } else {
        setCooldown(secondsLeft)
      }
    }

    updateCooldown()
    const interval = setInterval(updateCooldown, 1000)
    return () => clearInterval(interval)
  }, [user?.lastPlaced])

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

      if (pixels) {
        pixels.forEach(pixel => {
          ctx.fillStyle = pixel.color
          ctx.fillRect(pixel.x, pixel.y, 1, 1)
        })
      }

      if (showPixelInfo) {
        const contrastColor = getContrastColor(showPixelInfo.color)
        ctx.strokeStyle = contrastColor
        ctx.lineWidth = 2 / scale
        ctx.strokeRect(showPixelInfo.x, showPixelInfo.y, 1, 1)
      }

      if (showColorPicker && selectedPixel) {
        const underlyingPixel = pixels?.find(
          p => p.x === selectedPixel.x && p.y === selectedPixel.y
        )
        const contrastColor = getContrastColor(
          underlyingPixel?.color || '#FFFFFF'
        )

        ctx.strokeStyle = contrastColor
        ctx.lineWidth = 2 / scale
        ctx.strokeRect(selectedPixel.x, selectedPixel.y, 1, 1)

        ctx.fillStyle = selectedColor
        ctx.fillRect(selectedPixel.x, selectedPixel.y, 1, 1)
        ctx.globalAlpha = 1.0
      }

      ctx.restore()
    }

    draw()
  }, [
    size,
    scale,
    pan,
    pixels,
    showColorPicker,
    selectedPixel,
    selectedColor,
    showPixelInfo
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleCanvasClick = (e: MouseEvent) => {
      if (scale <= 5 || !canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const canvasX = Math.floor((mouseX - pan.x) / scale)
      const canvasY = Math.floor((mouseY - pan.y) / scale)

      if (canvasX < 0 || canvasX >= size || canvasY < 0 || canvasY >= size) {
        return
      }

      if (isPlacing) {
        setShowPixelInfo(null)
        setSelectedPixel({ x: canvasX, y: canvasY })
        setShowColorPicker(true)
        setIsPlacing(false)
      } else {
        const clickedPixel = pixels?.find(
          p => p.x === canvasX && p.y === canvasY
        )
        if (clickedPixel && clickedPixel.user) {
          setShowPixelInfo(clickedPixel)
          setPopupPosition({ x: e.clientX, y: e.clientY })
        } else {
          setShowPixelInfo(null)
        }
      }
    }

    canvas.addEventListener('click', handleCanvasClick)
    return () => {
      canvas.removeEventListener('click', handleCanvasClick)
    }
  }, [isPlacing, pan, scale, size, pixels, showColorPicker])

  useEffect(() => {
    if (isSubmitting) {
      toast.info('Please approve the transaction in your wallet.')
    }
    if (isConfirming) {
      toast.info('Transaction is being confirmed...')
    }
  }, [isSubmitting, isConfirming])

  const handlePlacePixel = async () => {
    if (selectedPixel && sessionId) {
      await placePixelOnContract(
        selectedPixel.x,
        selectedPixel.y,
        selectedColor
      )
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
      if (MiniKit.isInstalled()) {
        try {
          await handleVerify(sessionId)
          toast.success('Verification successful')
        } catch (error) {
          console.error('Verification failed:', error)
          toast.error('Verification failed')
        }
      } else {
        if (!user.walletAddress) {
          toast.error('Wallet not connected. Please connect your wallet first.')
          return
        }
        const app = new SelfAppBuilder({
          appName: 'World Canvas',
          scope: 'verify',
          endpoint: '0xDB611E19303debA0C967A6f293E23Fc5D9D58513',
          endpointType: 'celo',
          userId: user.walletAddress,
          userIdType: 'hex',
          userDefinedData: 'I need to change of computer',
          version: 2,
          disclosures: {
            date_of_birth: true,
            nationality: true,
            minimumAge: 18
          },
          devMode: false
        }).build()

        //const url = getUniversalLink(app)

        setSelfApp(app)
        //setSelfQRUrl(url)
        setShowSelfQR(true)
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
      {showSelfQR && selfApp && (
        <SelfVerifyModal
          selfApp={selfApp}
          //qrUrl={selfQRUrl}
          onSuccess={async () => {
            setShowSelfQR(false)
            if (sessionId) {
              await updateUserVerification({ sessionId: sessionId })
              toast.success(
                'Verification successful! You can now place a pixel.'
              )
            } else {
              toast.error('Session not found.')
            }
          }}
          onError={() => {
            toast.error('Verification failed')
          }}
          onClose={() => setShowSelfQR(false)}
        />
      )}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          gap: '10px'
        }}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button>
              <MessageSquare />
            </Button>
          </DrawerTrigger>
          <DrawerContent className='h-3/4'>
            <Chat />
          </DrawerContent>
        </Drawer>
        {isPlacing ? (
          <Button onClick={() => setIsPlacing(false)} variant='destructive'>
            Cancel Pixel Placing
          </Button>
        ) : (
          !showColorPicker && (
            <Button onClick={handleEnterPlacementMode} disabled={cooldown > 0}>
              {cooldown > 0 ? `Next pixel in 00:0${cooldown}` : 'Place Pixel'}
            </Button>
          )
        )}
        <Drawer>
          <DrawerTrigger asChild>
            <Button>
              <Trophy />
            </Button>
          </DrawerTrigger>
          <DrawerContent className='h-3/4'>
            <Leaderboard />
          </DrawerContent>
        </Drawer>
      </div>

      {showColorPicker && selectedPixel && (
        <ColorPicker
          colors={COLORS}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          onConfirm={isSubmitting || isConfirming ? () => {} : handlePlacePixel}
          onCancel={handleCancelPlacement}
        />
      )}
      {showPixelInfo && (
        <div
          style={{
            position: 'absolute',
            top: popupPosition.y + 10,
            left: popupPosition.x + 10,
            zIndex: 20
          }}
        >
          <PixelInfoCard
            pixelData={showPixelInfo}
            onClose={() => setShowPixelInfo(null)}
          />
        </div>
      )}
    </div>
  )
}

export default Canvas
