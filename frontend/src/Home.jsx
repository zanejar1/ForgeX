import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import { useState } from 'react'

function TabToggle({ active, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-100 p-1">
      <button
        className={`${active === 'coin' ? 'bg-white shadow-soft' : 'bg-transparent'} rounded-lg px-3 py-1.5 text-sm font-medium transition-colors`}
        onClick={() => onChange('coin')}
      >
        Create Coin
      </button>
      <button
        className={`${active === 'nft' ? 'bg-white shadow-soft' : 'bg-transparent'} rounded-lg px-3 py-1.5 text-sm font-medium transition-colors`}
        onClick={() => onChange('nft')}
      >
        Create NFT
      </button>
    </div>
  )
}

function CreateCoinForm() {
  const handleSubmit = (e) => {
    e.preventDefault()
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="label" htmlFor="coin-name">Coin name</label>
        <input id="coin-name" type="text" className="input" placeholder="e.g., Forge Token" />
      </div>
      <div className="space-y-1">
        <label className="label" htmlFor="coin-symbol">Coin symbol</label>
        <input id="coin-symbol" type="text" className="input" placeholder="e.g., FRGX" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="label" htmlFor="initial-supply">Initial supply</label>
          <input id="initial-supply" type="number" min="0" className="input" placeholder="0" />
        </div>
        <div className="space-y-1">
          <label className="label" htmlFor="max-supply">Max supply</label>
          <input id="max-supply" type="number" min="0" className="input" placeholder="1000000" />
        </div>
      </div>
      <button type="submit" className="btn btn-primary w-full">Create Coin</button>
    </form>
  )
}

function CreateNFTForm() {
  const handleSubmit = (e) => {
    e.preventDefault()
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="label" htmlFor="collection-name">Collection name</label>
        <input id="collection-name" type="text" className="input" placeholder="e.g., ForgeX Originals" />
      </div>
      <div className="space-y-1">
        <label className="label" htmlFor="nft-symbol">NFT symbol</label>
        <input id="nft-symbol" type="text" className="input" placeholder="e.g., FXO" />
      </div>
      <div className="space-y-1">
        <label className="label" htmlFor="nft-max-supply">Max supply</label>
        <input id="nft-max-supply" type="number" min="0" className="input" placeholder="10000" />
      </div>
      <div className="space-y-1">
        <label className="label" htmlFor="nft-art">NFT art</label>
        <input id="nft-art" type="file" accept="image/*" className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800" />
      </div>
      <button type="submit" className="btn btn-primary w-full">Create NFT</button>
    </form>
  )
}

export default function Home() {
  const [active, setActive] = useState('coin')
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="card">
          <div className="flex items-center justify-center mb-5">
            <TabToggle active={active} onChange={setActive} />
          </div>
          {active === 'coin' ? <CreateCoinForm /> : <CreateNFTForm />}
        </div>
      </main>
      <Footer />
    </div>
  )
}
