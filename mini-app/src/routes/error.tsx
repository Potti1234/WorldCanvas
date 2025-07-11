import { Button } from '@/components/ui/button'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export default function ErrorComponent ({ error }: { error: Error }) {
  const { history } = useRouter()

  return (
    <main className='flex flex-col items-center gap-y-4 text-center'>
      <div className='mt-8 space-y-2 text-4xl font-bold sm:text-5xl'>
        Internal server error
      </div>
      <p className='text-lg font-light sm:text-xl'>
        Something went wrong. We apologize for the inconvenience.
      </p>
      {error.message && <p className='text-sm'>{error.message}</p>}
      <Button
        variant='link'
        className='w-32 hover:no-underline'
        onClick={() => history.go(-1)}
      >
        ← Go back
      </Button>
    </main>
  )
}

export const Route = createFileRoute('/error')({
  component: ErrorComponent,
  beforeLoad: () => {
    return { getTitle: () => 'Internal server error' }
  }
})
