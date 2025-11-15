import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastsContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2)
    const t = { id, type: toast.type || 'info', message: toast.message || '' }
    setToasts((ts) => [...ts, t])
    // Auto dismiss
    setTimeout(() => remove(id), toast.duration ?? 3000)
    return id
  }, [remove])

  const value = useMemo(() => ({ push, remove }), [push, remove])

  return (
    <ToastsContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-soft backdrop-blur bg-white ${
              t.type === 'success' ? 'border-green-200' : t.type === 'error' ? 'border-red-200' : 'border-neutral-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className={`h-2.5 w-2.5 mt-1 rounded-full ${
                t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-neutral-400'
              }`} />
              <div className="text-neutral-800">{t.message}</div>
            </div>
          </div>
        ))}
      </div>
    </ToastsContext.Provider>
  )
}

export function useToasts() {
  const ctx = useContext(ToastsContext)
  if (!ctx) throw new Error('useToasts must be used within ToastProvider')
  return ctx
}
