import { createFileRoute, useRouter } from '@tanstack/react-router'
import { WalletAuthButton } from '@/components/WalletAuthButton'
import { useEffect, useState } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useSession } from '@/hooks/useSession'
import { TantoConnectButton } from '@sky-mavis/tanto-widget'

export const Route = createFileRoute('/login')({
  component: LoginComponent
})

function LoginComponent () {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const updateUserProfile = useMutation(api.login.updateUserProfile)
  const signInRonin = useMutation(api.login.signInRonin)
  const { setSessionId } = useSession()
  const [isInsideWorldcoinApp, setIsInsideWorldcoinApp] = useState(false)

  useEffect(() => {
    setIsInsideWorldcoinApp(MiniKit.isInstalled())
  }, [])

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

  const handleRoninSignInComplete = async (data: {
    address?: string
    chainId: number
    connectorId?: string
  }) => {
    if (data.address) {
      try {
        const { sessionId } = await signInRonin({ address: data.address })
        setSessionId(sessionId)
        void router.navigate({ to: '/' })
      } catch (e) {
        console.error('Failed to sign in with Ronin', e)
        setError('Failed to sign in. Please try again.')
      }
    } else {
      setError('Login failed: No address found. Please try again.')
    }
  }

  return (
    <div
      className='min-h-screen bg-cover bg-center flex items-end justify-center p-4 pb-10'
      style={{ backgroundImage: "url('/LoginBackground.png')" }}
    >
      <div className='w-full max-w-xs p-6 space-y-6 bg-white/30 backdrop-blur-md rounded-2xl shadow-lg'>
        <div className='flex justify-center'>
          {isInsideWorldcoinApp ? (
            <WalletAuthButton onSignInComplete={handleSignInComplete} />
          ) : (
            <TantoConnectButton onConnect={handleRoninSignInComplete} />
          )}
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
