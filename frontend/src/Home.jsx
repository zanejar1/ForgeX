import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import { useState } from 'react'
import { useToasts } from './components/Toasts.jsx'
import useWallet from './hooks/useWallet.jsx'
import { CHAINS } from './config/contracts.js'
import { getBrowserProvider, getChainId, ensureSepoliaNetwork, deployERC20Token, deployERC721NFT } from './lib/eth.js'
import { useNavigate } from 'react-router-dom'

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
  const { push } = useToasts()
  const { isConnected } = useWallet()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [initial, setInitial] = useState('')
  const [max, setMax] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastAddress, setLastAddress] = useState(null)
  const [lastTx, setLastTx] = useState(null)
  const [lastError, setLastError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      push({ type: 'error', message: 'Please connect your wallet first' })
      return
    }
    const provider = getBrowserProvider()
    if (!provider) {
      push({ type: 'error', message: 'Ethereum provider not found' })
      return
    }
    // Ensure Sepolia network
    const cid = await getChainId(provider)
    if (cid !== CHAINS.sepolia.chainId) {
      const switched = await ensureSepoliaNetwork()
      if (!switched) {
        push({ type: 'error', message: 'Please switch MetaMask to Sepolia network' })
        return
      }
    }
    const nm = name.trim()
    const sm = symbol.trim()
    if (!nm || !sm) {
      push({ type: 'error', message: 'Name and symbol are required' })
      return
    }
    let supplyStr = String(initial).trim()
    if (supplyStr === '') supplyStr = '0'
    if (!/^\d+$/.test(supplyStr)) {
      push({ type: 'error', message: 'Initial supply must be a whole number' })
      return
    }
    let maxStr = String(max).trim()
    if (!/^\d+$/.test(maxStr) || BigInt(maxStr) === 0n) {
      push({ type: 'error', message: 'Max supply must be a positive whole number' })
      return
    }
    if (BigInt(supplyStr) > BigInt(maxStr)) {
      push({ type: 'error', message: 'Initial supply must be <= max supply' })
      return
    }
    const decimals = 18
    try {
      setSubmitting(true)
      const signer = await provider.getSigner()

      const { address, txHash } = await deployERC20Token({
        signer,
        name: nm,
        symbol: sm.toUpperCase(),
        initialSupply: BigInt(supplyStr),
        maxSupply: BigInt(maxStr),
      })

      push({ type: 'success', message: `Token deployed: ${address}${txHash ? ' (tx ' + txHash + ')' : ''}` })
      setLastAddress(address)
      setLastTx(txHash || null)
      setLastError(null)
      try {
        const key = `fgx:erc20:${CHAINS.sepolia.chainId}`
        const raw = window.localStorage.getItem(key)
        const arr = raw ? JSON.parse(raw) : []
        if (!arr.includes(address)) {
          arr.unshift(address)
          window.localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)))
        }
      } catch {}
      setName('')
      setSymbol('')
      setInitial('')
      setMax('')
    } catch (err) {
      let msg = err?.info?.error?.message || err?.shortMessage || err?.message || 'Failed to create token'
      const code = err?.code || err?.info?.error?.code
      if (code === 'INSUFFICIENT_FUNDS') {
        msg = 'Insufficient funds for gas fees'
      } else if (code === 'ACTION_REJECTED' || code === 4001) {
        msg = 'Transaction rejected in MetaMask'
      }
      push({ type: 'error', message: msg })
      setLastError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="label" htmlFor="coin-name">Coin name</label>
        <input id="coin-name" type="text" className="input" placeholder="e.g., Forge Token" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="label" htmlFor="coin-symbol">Coin symbol</label>
        <input id="coin-symbol" type="text" className="input" placeholder="e.g., FRGX" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="label" htmlFor="initial-supply">Initial supply</label>
          <input id="initial-supply" type="number" min="0" className="input" placeholder="0" value={initial} onChange={(e) => setInitial(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="label" htmlFor="max-supply">Max supply</label>
          <input id="max-supply" type="number" min="1" className="input" placeholder="1000000" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={submitting}>{submitting ? 'Creating…' : 'Create Coin'}</button>
      
      {lastAddress && (
        <div className="mt-4 rounded-lg border border-neutral-200 p-3 text-sm bg-neutral-50">
          <div className="font-medium mb-1">Last Deployment</div>
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[60%]" title={lastAddress}>{lastAddress}</span>
            <button type="button" onClick={() => { navigator.clipboard.writeText(lastAddress); push({ type: 'info', message: 'Address copied' }) }} className="px-2 py-1 text-xs rounded bg-neutral-200 hover:bg-neutral-300">Copy</button>
            <a href={`https://sepolia.etherscan.io/address/${lastAddress}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded bg-neutral-800 text-white hover:bg-neutral-700">Explorer</a>
            {lastTx && (
              <a href={`https://sepolia.etherscan.io/tx/${lastTx}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500">Tx</a>
            )}
          </div>
        </div>
      )}
      {lastError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <span className="font-semibold">Deployment Error:</span> {lastError}
        </div>
      )}
    </form>
  )
}

function CreateNFTForm() {
  const { push } = useToasts()
  const { isConnected } = useWallet()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [artworkCid, setArtworkCid] = useState('')
  const [max, setMax] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastAddress, setLastAddress] = useState(null)
  const [lastTx, setLastTx] = useState(null)
  const [lastError, setLastError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      push({ type: 'error', message: 'Please connect your wallet first' })
      return
    }
    const provider = getBrowserProvider()
    if (!provider) {
      push({ type: 'error', message: 'Ethereum provider not found' })
      return
    }
    const cid = await getChainId(provider)
    if (cid !== CHAINS.sepolia.chainId) {
      const switched = await ensureSepoliaNetwork()
      if (!switched) {
        push({ type: 'error', message: 'Please switch MetaMask to Sepolia network' })
        return
      }
    }
    const nm = name.trim()
    const sm = symbol.trim()
    const cidInput = artworkCid.trim()
    if (!nm || !sm || !cidInput) {
      push({ type: 'error', message: 'Name, symbol and artwork CID are required' })
      return
    }
    // Normalize to bare CID and build data: URI metadata
    const normalizeToCid = (value) => {
      let v = value.trim()
      if (v.startsWith('ipfs://')) v = v.slice('ipfs://'.length)
      const ipfsIdx = v.indexOf('/ipfs/')
      if (ipfsIdx !== -1) v = v.slice(ipfsIdx + 6)
      return v.split(/[/?#]/)[0]
    }
    const cidOnly = normalizeToCid(cidInput)
    const imageUri = `ipfs://${cidOnly}`
    const metadata = {
      name: nm,
      description: `${nm} — minted on ForgeX`,
      image: imageUri
    }
    const metadataJson = JSON.stringify(metadata)
    const metadataBase64 = typeof btoa === 'function'
      ? btoa(unescape(encodeURIComponent(metadataJson)))
      : Buffer.from(metadataJson, 'utf8').toString('base64')
    const tokenURI = `data:application/json;base64,${metadataBase64}`
    let maxStr = String(max).trim()
    if (!/^\d+$/.test(maxStr) || BigInt(maxStr) === 0n) {
      push({ type: 'error', message: 'Max supply must be a positive whole number' })
      return
    }
    try {
      setSubmitting(true)
      const signer = await provider.getSigner()
      const { address, txHash } = await deployERC721NFT({ signer, name: nm, symbol: sm.toUpperCase(), tokenURI, maxSupply: BigInt(maxStr) })
      push({ type: 'success', message: `NFT collection deployed with artwork only; token #0 minted: ${address}${txHash ? ' (tx ' + txHash + ')' : ''}` })
      setLastAddress(address)
      setLastTx(txHash || null)
      setLastError(null)
      try {
        const key = `fgx:erc721:${CHAINS.sepolia.chainId}`
        const raw = window.localStorage.getItem(key)
        const arr = raw ? JSON.parse(raw) : []
        if (!arr.includes(address)) {
          arr.unshift(address)
          window.localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)))
        }
      } catch {}
      setName('')
      setSymbol('')
      setArtworkCid('')
      setMax('')
    } catch (err) {
      let msg = err?.info?.error?.message || err?.shortMessage || err?.message || 'Failed to deploy NFT'
      const code = err?.code || err?.info?.error?.code
      if (code === 'INSUFFICIENT_FUNDS') {
        msg = 'Insufficient funds for gas fees'
      } else if (code === 'ACTION_REJECTED' || code === 4001) {
        msg = 'Transaction rejected in MetaMask'
      }
      push({ type: 'error', message: msg })
      setLastError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="label" htmlFor="nft-name">Collection name</label>
        <input id="nft-name" type="text" className="input" placeholder="e.g., ForgeX Originals" value={name} onChange={(e)=>setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="label" htmlFor="nft-symbol">Symbol</label>
        <input id="nft-symbol" type="text" className="input" placeholder="e.g., FXO" value={symbol} onChange={(e)=>setSymbol(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="label" htmlFor="nft-artwork">Artwork CID (IPFS)</label>
        <input id="nft-artwork" type="text" className="input" placeholder="Qm... or ipfs://Qm... or https://gateway/ipfs/Qm..." value={artworkCid} onChange={(e)=>setArtworkCid(e.target.value)} />
        <p className="text-[11px] text-neutral-500">We’ll auto-generate JSON metadata that references your artwork at ipfs://&lt;CID&gt; and store it as a data: URI.</p>
      </div>
      <div className="space-y-1">
        <label className="label" htmlFor="nft-max">Max supply</label>
        <input id="nft-max" type="number" min="1" className="input" placeholder="10000" value={max} onChange={(e)=>setMax(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={submitting}>{submitting ? 'Deploying…' : 'Create NFT'}</button>
      {lastAddress && (
        <div className="mt-4 rounded-lg border border-neutral-200 p-3 text-sm bg-neutral-50">
          <div className="font-medium mb-1">Last NFT Deployment</div>
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[60%]" title={lastAddress}>{lastAddress}</span>
            <button type="button" onClick={() => { navigator.clipboard.writeText(lastAddress); push({ type: 'info', message: 'Address copied' }) }} className="px-2 py-1 text-xs rounded bg-neutral-200 hover:bg-neutral-300">Copy</button>
            <a href={`https://sepolia.etherscan.io/address/${lastAddress}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded bg-neutral-800 text-white hover:bg-neutral-700">Explorer</a>
            {lastTx && (
              <a href={`https://sepolia.etherscan.io/tx/${lastTx}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500">Tx</a>
            )}
          </div>
        </div>
      )}
      {lastError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <span className="font-semibold">Deployment Error:</span> {lastError}
        </div>
      )}
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
