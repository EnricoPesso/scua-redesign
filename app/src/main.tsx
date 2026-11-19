import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

async function iniciar() {
  if (import.meta.env.VITE_API_MOCK === 'true') {
    const { worker } = await import('./features/extensoes/api/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void iniciar()
