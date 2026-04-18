import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import useTheme from '../hooks/useTheme'

// Pages
import Dashboard from './Dashboard'
import Produk from './Produk'
import Pesanan from './Pesanan'
import Pengguna from './Pengguna'
import AkunPelanggan from './AkunPelanggan'
import Layanan from './Layanan'
import Pengaturan from './Pengaturan'

export default function AdminDashboard() {
  const location = useLocation()
  const { dark, setDark } = useTheme()
  
  // States
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false) // Wajib ada buat Sidebar baru
  
  const profileRef = useRef(null)

  // Sync Dark Mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Close profile on click outside
  useEffect(() => {
    const close = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', close) // mousedown lebih responsif
    return () => document.removeEventListener('mousedown', close)
  }, [])

  // Auto close mobile menu on navigation
  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  const getActiveKey = (pathname) => {
    const segment = pathname.split('/').filter(Boolean).pop() || 'dashboard'
    return segment === 'admin' ? 'dashboard' : segment
  }

  const renderContent = () => {
    const p = location.pathname
    // Enterprise style: Mapping routes biar gak kebanyakan IF
    const routes = {
      '/': <Dashboard dark={dark} />,
      '/produk': <Produk dark={dark} />,
      '/pesanan': <Pesanan dark={dark} />,
      '/akun-pelanggan': <AkunPelanggan dark={dark} />,
      '/pengguna': <Pengguna dark={dark} />,
      '/layanan': <Layanan dark={dark} />,
      '/pengaturan': <Pengaturan dark={dark} />,
    }
    
    // Logic pencarian route yang cocok
    const activeRoute = Object.keys(routes).find(route => p.endsWith(route)) || '/'
    return routes[activeRoute]
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      <Sidebar
        dark={dark}
        activeKey={getActiveKey(location.pathname)}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        isCollapsed={isCollapsed}        // Sinkronisasi Fitur Collapse
        setIsCollapsed={setIsCollapsed}  // Sinkronisasi Fitur Collapse
      />
      
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar
          dark={dark}
          setDark={setDark}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          profileRef={profileRef}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}