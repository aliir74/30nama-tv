import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadRuntimeConfig } from './api/config'

// The client key may come from config.json at runtime, so it is loaded before the first request.
loadRuntimeConfig().then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
