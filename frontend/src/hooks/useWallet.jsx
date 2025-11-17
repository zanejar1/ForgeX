import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

function getProvider() {
  if (typeof window === 'undefined') return undefined
  const eth = window.ethereum
  if (!eth) return undefined
  if (Array.isArray(eth.providers)) {
    const mm = eth.providers.find((p) => p && p.isMetaMask)
    if (mm) return mm
  }
  if (eth.isMetaMask) return eth
  return undefined
}

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [hasProvider, setHasProvider] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const DISCONNECT_KEY = 'fgx:wallet:manuallyDisconnected'

  const getManualFlag = useCallback(() => {
    try {
      if (typeof window === 'undefined') return false
      return window.localStorage.getItem(DISCONNECT_KEY) === '1'
    } catch {
      return false
    }
  }, [])

  const setManualFlag = useCallback((v) => {
    try {
      if (typeof window === 'undefined') return
      if (v) window.localStorage.setItem(DISCONNECT_KEY, '1')
      else window.localStorage.removeItem(DISCONNECT_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const manuallyDisconnectedRef = useRef(false)

  useEffect(() => {
    const provider = getProvider()
    const present = !!provider
    setHasProvider(present)

    if (!present) return
    manuallyDisconnectedRef.current = getManualFlag()

    const handleAccountsChanged = (accounts) => {
      if (manuallyDisconnectedRef.current) {
        if (!accounts || accounts.length === 0) setAccount(null)
        return
      }
      if (Array.isArray(accounts) && accounts.length > 0) setAccount(accounts[0])
      else setAccount(null)
    }

    provider.on?.('accountsChanged', handleAccountsChanged)

    if (!manuallyDisconnectedRef.current) {
      provider
        .request({ method: 'eth_accounts' })
        .then((accounts) => {
          if (Array.isArray(accounts) && accounts.length > 0) setAccount(accounts[0])
        })
        .catch((err) => {
          console.warn('Failed to read existing accounts', err)
        })
    }

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged)
    }
  }, [getManualFlag])

  const connect = useCallback(async () => {
    setError(null)
    const provider = getProvider()
    if (!provider) {
      setHasProvider(false)
      setError('MetaMask not found')
      return false
    }
    try {
      setIsConnecting(true)
      manuallyDisconnectedRef.current = false
      setManualFlag(false)

      try {
        await provider.request({
          method: 'wallet_requestPermissions',
          params: [ { eth_accounts: {} } ],
        })
      } catch {}

      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0])
        return true
      }
      return false
    } catch (err) {
      if (err && err.code === 4001) {
        setError('Connection request rejected')
      } else {
        setError(err?.message || 'Failed to connect wallet')
      }
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    setError(null)
    const provider = getProvider()
    try {
      await provider?.request?.({
        method: 'wallet_revokePermissions',
        params: [ { eth_accounts: {} } ],
      })
    } catch {}
    setAccount(null)
    manuallyDisconnectedRef.current = true
    setManualFlag(true)
  }, [])

  const value = {
    account,
    isConnected: !!account,
    hasProvider,
    isConnecting,
    error,
    connect,
    disconnect,
  }

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  )
}

export default function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
