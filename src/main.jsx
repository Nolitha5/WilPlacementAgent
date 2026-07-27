import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// ✅ Updated: now imports from the restructured src/App.jsx instead of the monolith.
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
