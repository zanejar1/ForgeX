import Home from './Home.jsx'
import { ToastProvider } from './components/Toasts.jsx'

export default function App() {
  return (
    <ToastProvider>
      <Home />
    </ToastProvider>
  )
}
