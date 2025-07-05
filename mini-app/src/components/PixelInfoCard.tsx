import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from './ui/button'

interface PixelInfoCardProps {
  pixelData: {
    user: {
      username: string | null | undefined
      profile_picture_url: string | null | undefined
    } | null
    color: string
    x: number
    y: number
  }
  onClose: () => void
}

export const PixelInfoCard: React.FC<PixelInfoCardProps> = ({
  pixelData,
  onClose
}) => {
  if (!pixelData.user) return null

  return (
    <Card className='w-64'>
      <CardHeader>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3 min-w-0'>
            <Avatar>
              <AvatarImage
                src={pixelData.user.profile_picture_url || ''}
                alt={pixelData.user.username || 'User'}
              />
              <AvatarFallback>
                {pixelData.user.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <CardTitle className='truncate'>
                {pixelData.user.username || 'Anonymous'}
              </CardTitle>
              <CardDescription>
                Pixel at ({pixelData.x}, {pixelData.y})
              </CardDescription>
            </div>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='-translate-y-1 shrink-0'
          >
            &times;
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}
