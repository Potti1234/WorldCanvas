import { createFileRoute, useRouter } from '@tanstack/react-router'
import { WalletAuthButton } from '@/components/WalletAuthButton'
import { useState } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useSession } from '@/hooks/useSession'

export const Route = createFileRoute('/login')({
  component: LoginComponent
})

function LoginComponent () {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const updateUserProfile = useMutation(api.login.updateUserProfile)
  const { setSessionId } = useSession()

  const handleSignInComplete = async ({
    isValid,
    sessionId,
    address
  }: {
    isValid: boolean
    address: string | null
    sessionId: string | null
  }) => {
    if (isValid && sessionId) {
      setSessionId(sessionId)
      if (address) {
        try {
          const user = await MiniKit.getUserByAddress(address)
          console.log('user', user)
          if (user) {
            await updateUserProfile({
              sessionId,
              username: user.username,
              profile_picture_url: user.profilePictureUrl ?? undefined
            })
          }
        } catch (e) {
          console.error('Failed to update user profile', e)
          setError('Failed to update user profile.')
        }
      }
      void router.navigate({ to: '/' })
    } else {
      setError('Login failed. Please try again.')
    }
  }

  return (
    <div
      className='min-h-screen bg-cover bg-center flex items-end justify-center p-4 pb-10'
      style={{ backgroundImage: "url('/LoginBackground.png')" }}
    >
      <div className='w-full max-w-xs p-6 space-y-6 bg-white/30 backdrop-blur-md rounded-2xl shadow-lg'>
        <div className='flex justify-center'>
          <WalletAuthButton onSignInComplete={handleSignInComplete} />
        </div>
        {error && (
          <p className='text-red-500 bg-red-100 p-3 rounded-lg text-center'>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
