/* App with routes */
import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ConfigProvider } from './contexts/ConfigContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Import Halaman
import LandingPage from './pages/LandingPage'
import Services from './pages/Services'
import Order from './pages/Order'
import Auth from './pages/Auth'
import Kontak from './pages/Kontak'
import Riwayat from './pages/Riwayat'
import FloatingHistory from './pages/FloatingHistory'

export default function App(){
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <AuthProvider>
      <ConfigProvider>
        <div className="min-h-screen bg-light text-neutral-text font-sans antialiased relative overflow-x-hidden">
          <Navbar />
          
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/services" element={<Services />} />
              <Route path="/kontak" element={<Kontak />} />
              <Route path="/order" element={<Order />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/riwayat" element={<Riwayat />} />
            </Routes>
          </main>

          <FloatingHistory />
          
          {/* Footer Global (muncul di semua page) */}
          <Footer />
          
        </div>
      </ConfigProvider>
    </AuthProvider>
  )
}