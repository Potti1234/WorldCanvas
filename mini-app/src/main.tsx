import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider } from 'convex/react'
import './index.css'
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider'
import ErudaProvider from './components/eruda-provider.tsx'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { SessionProvider } from './hooks/useSession'
import ErrorComponent from './routes/error'
import NotFound from './routes/not-found'
import { routeTree } from './routeTree.gen.ts'
import { ThemeProvider } from './components/theme/theme-provider.tsx'
import { convex } from './lib/convex.ts'
import { getDefaultConfig, TantoProvider } from '@sky-mavis/tanto-widget'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { saigon } from 'viem/chains'

const config = getDefaultConfig({
  appMetadata: {
    appName: 'My DApp',
    appIcon: '<https://my-dapp.com/icon.png>',
    appDescription: 'A decentralized application for Web3 enthusiasts',
    appUrl: '<https://my-dapp.com>'
  },
  keylessWalletConfig: {
    chainId: 2020, // Ronin Mainnet
    clientId: 'YOUR_CLIENT_ID',
    waypointOrigin: '<https://waypoint.roninchain.com>',
    popupCloseDelay: 1000
  },
  walletConnectConfig: {
    projectId: 'YOUR_WALLETCONNECT_PROJECT_ID'
  },
  coinbaseWalletConfig: {
    enable: true
  },
  chains: [saigon]
})
const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  defaultErrorComponent: ErrorComponent,
  defaultNotFoundComponent: NotFound
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <TantoProvider>
            <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
              <ErudaProvider>
                <MiniKitProvider>
                  <ConvexProvider client={convex}>
                    <SessionProvider>
                      <RouterProvider router={router} />
                    </SessionProvider>
                  </ConvexProvider>
                </MiniKitProvider>
              </ErudaProvider>
            </ThemeProvider>
          </TantoProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>
  )
}
