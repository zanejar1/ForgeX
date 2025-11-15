import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function getProvider() {
  if (typeof window === 'undefined') return undefined
  const eth = window.ethereum
  if (!eth) return undefined
  // Prefer MetaMask explicitly when multiple providers are injected
  if (Array.isArray(eth.providers)) {
    const mm = eth.providers.find((p) => p && p.isMetaMask)
    if (mm) return mm
  }
  // Single provider case
  if (eth.isMetaMask) return eth
  // If the global is not MetaMask, avoid triggering other wallets
  return undefined
}

export default function useWallet() {
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

  // Initialize provider and preload existing accounts if NOT manually disconnected
  useEffect(() => {
    const provider = getProvider()
    const present = !!provider
    setHasProvider(present)

    if (!present) return
    manuallyDisconnectedRef.current = getManualFlag()

    const handleAccountsChanged = (accounts) => {
      if (manuallyDisconnectedRef.current) {
        // Ignore connects unless user explicitly clicks Connect
        if (!accounts || accounts.length === 0) setAccount(null)
        return
      }
      if (Array.isArray(accounts) && accounts.length > 0) setAccount(accounts[0])
      else setAccount(null)
    }

    provider.on?.('accountsChanged', handleAccountsChanged)

    // Only prefill if user didn't disconnect manually
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
      // Clear manual flag so we accept events and prefill on future mounts
      manuallyDisconnectedRef.current = false
      setManualFlag(false)

      // Prefer requesting permissions to ensure a confirmation UI when appropriate
      try {
        await provider.request({
          method: 'wallet_requestPermissions',
          params: [ { eth_accounts: {} } ],
        })
      } catch (permErr) {
        // If permissions API not supported, fall back to eth_requestAccounts directly
      }

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
      // Attempt to revoke site permissions in MetaMask (if supported)
      await provider?.request?.({
        method: 'wallet_revokePermissions',
        params: [ { eth_accounts: {} } ],
      })
    } catch (_) {
      // Ignore if not supported or user rejects
    }
    // Always clear local state
    setAccount(null)
    // Remember manual disconnect to avoid auto-prefill on refresh
    manuallyDisconnectedRef.current = true
    setManualFlag(true)
  }, [])

  return {
    account,
    isConnected: !!account,
    hasProvider,
    isConnecting,
    error,
    connect,
    disconnect,
  }
}
