import { useState } from 'react'
import logo from '../assets/logo.png'
import useWallet from '../hooks/useWallet.js'
import WalletModal from './WalletModal.jsx'
import { useToasts } from './Toasts.jsx'

export default function Header() {
  const [imgSrc, setImgSrc] = useState(logo)
  const { account, isConnected, hasProvider, isConnecting, connect, disconnect } = useWallet()
  const [showWallets, setShowWallets] = useState(false)
  const { push } = useToasts()

  const shorten = (addr) => {
    if (!addr || addr.length < 10) return addr || ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  return (
    <header className="w-full border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={imgSrc}
            alt="ForgeX logo"
            onError={() => setImgSrc('/fallback-logo.svg')}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-contain"
          />
          <span className="text-lg font-semibold tracking-tight">ForgeX</span>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <span className="hidden sm:inline-flex items-center rounded-lg bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                {shorten(account)}
              </span>
              <button
                className="btn btn-primary"
                onClick={disconnect}
                type="button"
              >
                Disconnect Wallet
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setShowWallets(true)}
              type="button"
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
      <WalletModal
        open={showWallets}
        onClose={() => setShowWallets(false)}
        hasProvider={hasProvider}
        onConnectMetaMask={async () => {
          const ok = await connect()
          setShowWallets(false)
          if (ok) {
            push({ type: 'success', message: 'Wallet connected successfully' })
          } else {
            push({ type: 'error', message: 'Failed to connect wallet' })
          }
        }}
      />
    </header>
  )
}
