import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastCtx = createContext(null)

export function useAvaxToast() {
  return useContext(ToastCtx)
}

export function AvaxToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback(({ type, amount, message }) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, amount, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const pay = useCallback((amount, message) => show({ type: 'pay', amount, message }), [show])
  const earn = useCallback((amount, message) => show({ type: 'earn', amount, message }), [show])

  return (
    <ToastCtx.Provider value={{ pay, earn }}>
      {children}
      <div className="fixed top-20 right-6 z-[60] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className={`pointer-events-auto rounded-xl px-4 py-3 shadow-2xl border backdrop-blur-xl flex items-center gap-3 min-w-[260px] ${
                t.type === 'earn'
                  ? 'bg-emerald-500/15 border-emerald-400/30'
                  : 'bg-[#ff6b6b]/15 border-[#ff6b6b]/30'
              }`}
            >
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-lg ${
                t.type === 'earn' ? 'bg-emerald-500/20' : 'bg-[#ff6b6b]/20'
              }`}>
                {t.type === 'earn' ? '💰' : '🔗'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${t.type === 'earn' ? 'text-emerald-300' : 'text-[#ff6b6b]'}`}>
                  {t.type === 'earn' ? '+' : '-'}{t.amount} AVAX
                </p>
                <p className="text-[11px] text-white/50 truncate">{t.message}</p>
              </div>
              <svg className="h-4 w-4 shrink-0 opacity-40" viewBox="0 0 32 32" fill="none">
                <path fill="#E84142" d="M16 3L3 27h26L16 3zm0 6.2L22.4 23H9.6L16 9.2z" />
              </svg>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}
