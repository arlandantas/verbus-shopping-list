import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/data/firebase'
import { initInstallPrompt } from '@/pwa/installPrompt'
import './index.css'
initInstallPrompt()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
