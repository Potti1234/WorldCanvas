import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  component: RootComponent
})

function RootComponent () {
  return (
    <>
      <div className='flex flex-col min-h-screen'>
        <main className='flex-grow'>
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
      <Toaster />
    </>
  )
}
