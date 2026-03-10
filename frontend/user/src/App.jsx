/* App with routes */
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ConfigProvider } from './contexts/ConfigContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'

// Import Halaman
import LandingPage from './pages/LandingPage'
import Services from './pages/Services'
import Order from './pages/Order'
import Auth from './pages/Auth'
import Kontak from './pages/Kontak'
import Riwayat from './pages/Riwayat'
import FloatingHistory from './pages/FloatingHistory'

export default function App(){
  return (
    <AuthProvider>
      <ConfigProvider>
        <div className="min-h-screen bg-white text-gray-800 font-sans relative">
          <Navbar />
          
          <main className="pt-6 pb-20"> {/* Tambah padding-bottom biar konten paling bawah gak ketutup widget */}
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/services" element={<Services />} />
              <Route path="/kontak" element={<Kontak />} />
              <Route path="/order" element={<Order />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Route ke Halaman Riwayat Lengkap */}
              <Route path="/riwayat" element={<Riwayat />} />
            </Routes>
          </main>

          <FloatingHistory />
          
        </div>
      </ConfigProvider>
    </AuthProvider>
  )
}