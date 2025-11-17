import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useEffect, useState } from 'react'
import { CHAINS } from '../config/contracts.js'
import { getBrowserProvider, getChainId, ensureSepoliaNetwork } from '../lib/eth.js'
import useWallet from '../hooks/useWallet.jsx'
import erc20Artifact from '../abis/ERC20Token.json'
import erc721Artifact from '../abis/ERC721NFT.json'
import { Contract, formatUnits } from 'ethers'

function TabToggle({ active, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-100 p-1">
      <button
        className={`${active === 'coins' ? 'bg-white shadow-soft' : 'bg-transparent'} rounded-lg px-3 py-1.5 text-sm font-medium transition-colors`}
        onClick={() => onChange('coins')}
        type="button"
      >
        Manage Coins
      </button>
      <button
        className={`${active === 'nfts' ? 'bg-white shadow-soft' : 'bg-transparent'} rounded-lg px-3 py-1.5 text-sm font-medium transition-colors`}
        onClick={() => onChange('nfts')}
        type="button"
      >
        Manage NFTs
      </button>
    </div>
  )
}

function useStoredERC20Addresses() {
  const key = `fgx:erc20:${CHAINS.sepolia.chainId}`
  const [addresses, setAddresses] = useState([])
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setAddresses(arr)
      }
    } catch {}
  }, [key])
  return [addresses, (arr) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(arr))
    } catch {}
    setAddresses(arr)
  }]
}

function useStoredERC721Addresses() {
  const key = `fgx:erc721:${CHAINS.sepolia.chainId}`
  const [addresses, setAddresses] = useState([])
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setAddresses(arr)
      }
    } catch {}
  }, [key])
  return [addresses, (arr) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(arr))
    } catch {}
    setAddresses(arr)
  }]
}

function NFTRow({ address }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [details, setDetails] = useState(null)
  const [minting, setMinting] = useState(false)
  const [recipient, setRecipient] = useState('')

  useEffect(() => {
    let cancelled = false
    const parseIpfsCid = (input) => {
      if (!input || typeof input !== 'string') return null
      let v = input.trim()
      if (v.startsWith('ipfs://')) {
        v = v.slice('ipfs://'.length)
      }
      const idx = v.indexOf('/ipfs/')
      if (idx !== -1) {
        v = v.slice(idx + 6)
      }
      // first segment is the CID
      const cid = v.split(/[/?#]/)[0]
      return cid || null
    }
    const extractCidFromTokenURI = (uri) => {
      if (!uri) return null
      if (uri.startsWith('data:application/json')) {
        try {
          const base64Part = uri.split('base64,')[1]
          if (!base64Part) return null
          const jsonStr = typeof atob === 'function' ? decodeURIComponent(escape(atob(base64Part))) : Buffer.from(base64Part, 'base64').toString('utf8')
          const obj = JSON.parse(jsonStr)
          const img = obj.image || obj.image_url || ''
          return parseIpfsCid(img)
        } catch {
          return null
        }
      }
      return parseIpfsCid(uri)
    }
    async function fetchDetails() {
      setLoading(true)
      setError(null)
      try {
        const provider = getBrowserProvider()
        if (!provider) throw new Error('Wallet provider not found')
        const contract = new Contract(address, erc721Artifact.abi, provider)
        const [name, symbol, nextTokenId, owner, maxSupply] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.nextTokenId?.().catch(() => null),
          contract.owner?.().catch(() => null),
          contract.maxSupply?.().catch(() => null),
        ])
        let token0URI = null
        try {
          token0URI = await contract.tokenURI(0)
        } catch {}
        const cid = extractCidFromTokenURI(token0URI)
        if (!cancelled) setDetails({ name, symbol, nextTokenId: nextTokenId !== null ? Number(nextTokenId) : null, owner, token0URI, cid, maxSupply: maxSupply ? BigInt(maxSupply) : null })
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load NFT collection')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDetails()
    return () => { cancelled = true }
  }, [address])

  return (
    <div className="rounded-lg border border-neutral-200 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="space-y-1 w-full">
        <div className="text-sm font-semibold break-all">{address}</div>
        {loading && <div className="text-xs text-neutral-500">Loading details…</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
        {details && (
          <div className="text-xs text-neutral-700 flex flex-wrap gap-x-4 gap-y-1">
            <span><span className="text-neutral-500">Name:</span> {details.name}</span>
            <span><span className="text-neutral-500">Symbol:</span> {details.symbol}</span>
            {typeof details.nextTokenId === 'number' && <span><span className="text-neutral-500">Next ID:</span> {details.nextTokenId}</span>}
            {details.maxSupply !== null && <span><span className="text-neutral-500">Max:</span> {details.maxSupply.toString()}</span>}
            {details.owner && <span><span className="text-neutral-500">Owner:</span> {details.owner}</span>}
            <span className="w-full">
              <span className="text-neutral-500">CID:</span>{' '}
              {details.cid ? (
                <span className="inline-block max-w-full truncate align-middle" title={details.cid}>{details.cid}</span>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </span>
          </div>
        )}
        <div className="mt-2 flex gap-2 items-center">
          <input type="text" className="input w-[60%]" placeholder="Recipient (0x...)" value={recipient} onChange={(e)=>setRecipient(e.target.value)} />
          <button
            type="button"
            className="btn btn-secondary"
            disabled={minting || !/^0x[a-fA-F0-9]{40}$/.test(recipient.trim())}
            onClick={async ()=>{
              try {
                setMinting(true); setError(null)
                const provider = getBrowserProvider(); if (!provider) throw new Error('Provider not found')
                const cid = await getChainId(provider); if (cid !== CHAINS.sepolia.chainId) { const ok = await ensureSepoliaNetwork(); if (!ok) throw new Error('Switch to Sepolia') }
                const signer = await provider.getSigner()
                const signerAddr = (await signer.getAddress()).toLowerCase()
                const c = new Contract(address, erc721Artifact.abi, signer)

                // Cap pre-checks if functions exist
                if (typeof c.maxSupply === 'function' && typeof c.nextTokenId === 'function') {
                  try {
                    const [nextId, max] = await Promise.all([c.nextTokenId(), c.maxSupply()])
                    if (nextId >= max) throw new Error('Max supply reached')
                  } catch {}
                }

                // Prefer mintTo(to) -> mint() -> mintWithURI(token0URI)
                let tx
                const rec = recipient.trim()
                const ownerAddr = (details?.owner || (await c.owner?.().catch(() => null)) || '').toLowerCase()
                const isOwner = ownerAddr && ownerAddr === signerAddr
                if (typeof c.mintTo === 'function' && isOwner) {
                  tx = await c.mintTo(rec)
                } else if (typeof c.mint === 'function') {
                  if (rec !== signerAddr) {
                    throw new Error('Only the collection owner can mint to another wallet. Set recipient to your address or use the owner wallet.')
                  }
                  tx = await c.mint()
                } else if (typeof c.mintWithURI === 'function' && details?.token0URI) {
                  if (rec !== signerAddr) {
                    throw new Error('This collection cannot mint to another wallet. Set recipient to your address or use the owner wallet.')
                  }
                  tx = await c.mintWithURI(details.token0URI)
                } else {
                  throw new Error('This collection does not support minting from UI')
                }

                await tx.wait()
                // refresh (best-effort)
                try {
                  const next2 = await (typeof c.nextTokenId === 'function' ? c.nextTokenId() : null)
                  if (next2 !== null) setDetails(d => d ? { ...d, nextTokenId: Number(next2) } : d)
                } catch {}
                setRecipient('')
              } catch (e) {
                const msg = e?.shortMessage || e?.info?.error?.message || e?.message || 'Mint failed'
                setError(msg.includes('missing revert data') ? 'Mint failed (check ownership and max supply).' : msg)
              } finally { setMinting(false) }
            }}
          >Mint</button>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <a className="px-2 py-1 text-xs rounded bg-neutral-800 text-white hover:bg-neutral-700" href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noreferrer">Etherscan</a>
        <button type="button" className="px-2 py-1 text-xs rounded bg-neutral-200 hover:bg-neutral-300" onClick={() => navigator.clipboard.writeText(address)}>Copy</button>
      </div>
    </div>
  )
}

function CoinRow({ address }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [details, setDetails] = useState(null)
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [minting, setMinting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchDetails() {
      setLoading(true)
      setError(null)
      try {
        const provider = getBrowserProvider()
        if (!provider) throw new Error('Wallet provider not found')
        const contract = new Contract(address, erc20Artifact.abi, provider)
        const [name, symbol, decimals, totalSupply, owner, maxSupply] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
          contract.totalSupply(),
          contract.owner?.().catch(() => null),
          contract.maxSupply?.().catch(() => null),
        ])
        if (!cancelled) setDetails({ name, symbol, decimals: Number(decimals), totalSupply, owner, maxSupply: maxSupply ? BigInt(maxSupply) : null })
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load token')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDetails()
    return () => { cancelled = true }
  }, [address])

  return (
    <div className="rounded-lg border border-neutral-200 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="space-y-1 w-full">
        <div className="text-sm font-semibold break-all">{address}</div>
        {loading && <div className="text-xs text-neutral-500">Loading details…</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
        {details && (
          <div className="text-xs text-neutral-700 flex flex-wrap gap-x-4 gap-y-1">
            <span><span className="text-neutral-500">Name:</span> {details.name}</span>
            <span><span className="text-neutral-500">Symbol:</span> {details.symbol}</span>
            <span><span className="text-neutral-500">Decimals:</span> {details.decimals}</span>
            <span><span className="text-neutral-500">Total:</span> {formatUnits(details.totalSupply, details.decimals)}</span>
            {details.maxSupply !== null && <span><span className="text-neutral-500">Max:</span> {formatUnits(details.maxSupply, details.decimals)}</span>}
            {details.owner && <span><span className="text-neutral-500">Owner:</span> {details.owner}</span>}
          </div>
        )}
        <div className="mt-2 flex gap-2 items-center">
          <input type="text" className="input w-[40%]" placeholder="Recipient (0x...)" value={to} onChange={(e)=>setTo(e.target.value)} />
          <input type="number" min="0" className="input w-[30%]" placeholder="Amount" value={amount} onChange={(e)=>setAmount(e.target.value)} />
          <button type="button" className="btn btn-secondary" disabled={minting || !details}
            onClick={async ()=>{
              if (!/^0x[a-fA-F0-9]{40}$/.test(to.trim())) { setError('Enter a valid recipient'); return }
              if (!/^\d+$/.test(String(amount).trim())) { setError('Enter a whole amount'); return }
              try {
                setMinting(true); setError(null)
                const provider = getBrowserProvider(); if (!provider) throw new Error('Provider not found')
                const cid = await getChainId(provider); if (cid !== CHAINS.sepolia.chainId) { const ok = await ensureSepoliaNetwork(); if (!ok) throw new Error('Switch to Sepolia') }
                const signer = await provider.getSigner()
                const c = new Contract(address, erc20Artifact.abi, signer)
                // Pre-check against max
                const [dec, ts, max] = await Promise.all([c.decimals(), c.totalSupply(), c.maxSupply()])
                const amtWhole = BigInt(String(amount).trim())
                const amtBase = amtWhole * (10n ** BigInt(dec))
                if (ts + amtBase > max) throw new Error('Mint would exceed max supply')
                const tx = await c.mint(to.trim(), amtWhole)
                await tx.wait()
                const ts2 = await c.totalSupply()
                setDetails(d => d ? { ...d, totalSupply: ts2 } : d)
                setAmount('')
              } catch (e) {
                setError(e?.shortMessage || e?.message || 'Mint failed')
              } finally { setMinting(false) }
            }}>Mint</button>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <a className="px-2 py-1 text-xs rounded bg-neutral-800 text-white hover:bg-neutral-700" href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noreferrer">Etherscan</a>
        <button type="button" className="px-2 py-1 text-xs rounded bg-neutral-200 hover:bg-neutral-300" onClick={() => navigator.clipboard.writeText(address)}>Copy</button>
      </div>
    </div>
  )
}

export default function Manage() {
  const [active, setActive] = useState('coins')
  const [addresses] = useStoredERC20Addresses()
  const [nftAddresses] = useStoredERC721Addresses()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="card w-full max-w-2xl">
          <div className="flex items-center justify-center mb-5">
            <TabToggle active={active} onChange={setActive} />
          </div>
          {active === 'coins' ? (
            <div className="space-y-3">
              {addresses && addresses.length > 0 ? (
                addresses.map((addr) => (
                  <CoinRow key={addr} address={addr} />
                ))
              ) : (
                <div className="text-sm text-neutral-500">No coins saved yet. Deploy a token on the Home page.</div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {nftAddresses && nftAddresses.length > 0 ? (
                nftAddresses.map((addr) => (
                  <NFTRow key={addr} address={addr} />
                ))
              ) : (
                <div className="text-sm text-neutral-500">No NFTs saved yet. Deploy an NFT on the Home page.</div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
