import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import MenuPage from './pages/MenuPage'

export default function App() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="menu" element={<MenuPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}