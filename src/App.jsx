import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import Learning from './pages/Learning.jsx'
import LearningDetail from './pages/LearningDetail.jsx'
import VirtualLab from './pages/VirtualLab.jsx'
import LabDetail from './pages/LabDetail.jsx'
import Results from './pages/Results.jsx'
import Portfolio from './pages/Portfolio.jsx'
import Quiz from './pages/Quiz.jsx'
import NotFound from './pages/NotFound.jsx'

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Tutup sidebar (layar kecil) setiap pindah halaman dan kembali ke atas.
  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="app">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && (
        <div
          className="app__overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="app__main">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/pembelajaran" element={<Learning />} />
            <Route path="/pembelajaran/:id" element={<LearningDetail />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/virtual-lab" element={<VirtualLab />} />
            <Route path="/virtual-lab/:id" element={<LabDetail />} />
            <Route path="/hasil" element={<Results />} />
            <Route path="/portofolio" element={<Portfolio />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/*"
        element={user ? <Shell /> : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}
