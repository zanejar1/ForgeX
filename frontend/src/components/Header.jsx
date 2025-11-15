import { useState } from 'react'
import logo from '../assets/logo.png'

export default function Header() {
  const [imgSrc, setImgSrc] = useState(logo)
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
        <button className="btn btn-primary">Connect Wallet</button>
      </div>
    </header>
  )
}
