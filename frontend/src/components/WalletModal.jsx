import { createPortal } from 'react-dom'

export default function WalletModal({ open, onClose, onConnectMetaMask, hasProvider }) {
  if (!open) return null

  const stop = (e) => e.stopPropagation()

  const overlay = (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="card w-full max-w-sm p-5" 
        onClick={stop}
      >
        <div className="mb-3">
          <h2 className="text-base font-semibold text-neutral-900">Connect a Wallet</h2>
          <p className="mt-1 text-sm text-neutral-500">Select a supported wallet to continue.</p>
        </div>

        <div className="space-y-2">
          {hasProvider ? (
            <button
              type="button"
              onClick={onConnectMetaMask}
              className="w-full flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold">🦊</div>
                <div className="text-neutral-900 font-medium">MetaMask</div>
              </div>
              <span className="text-neutral-400">Connect</span>
            </button>
          ) : (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold">🦊</div>
                <div>
                  <div className="text-neutral-900 font-medium">MetaMask</div>
                  <div className="text-xs text-neutral-500">Install to continue</div>
                </div>
              </div>
              <span className="text-neutral-400">Get</span>
            </a>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn">Cancel</button>
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
