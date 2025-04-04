import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import GroceryAnalysisFreeside2025 from './GroceryAnalysisFreeside2025.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GroceryAnalysisFreeside2025 />
  </StrictMode>,
)
