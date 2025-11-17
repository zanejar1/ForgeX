import Home from './Home.jsx'
import Manage from './pages/Manage.jsx'
import { ToastProvider } from './components/Toasts.jsx'
import { WalletProvider } from './hooks/useWallet.jsx'
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <WalletProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manage" element={<Manage />} />
        </Routes>
      </ToastProvider>
    </WalletProvider>
  )
}
