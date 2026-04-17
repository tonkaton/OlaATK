import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import useTheme from '../hooks/useTheme'
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
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const profileRef = useRef(null)

  // Apply dark class to html element for shadcn CSS variables
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [dark])

  useEffect(() => {
    const close = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  const getActiveKey = (pathname) => {
    if (pathname === '/') return 'dashboard'
    if (pathname.includes('produk')) return 'produk'
    if (pathname.includes('pesanan')) return 'pesanan'
    if (pathname.includes('akun-pelanggan')) return 'akun-pelanggan'
    if (pathname.includes('pengguna')) return 'pengguna'
    if (pathname.includes('layanan')) return 'layanan'
    if (pathname.includes('pengaturan')) return 'pengaturan'
    return 'dashboard'
  }

  const renderContent = () => {
    const p = location.pathname
    if (p === '/') return <Dashboard dark={dark} />
    if (p.includes('produk')) return <Produk dark={dark} />
    if (p.includes('pesanan')) return <Pesanan dark={dark} />
    if (p.includes('akun-pelanggan')) return <AkunPelanggan dark={dark} />
    if (p.includes('pengguna')) return <Pengguna dark={dark} />
    if (p.includes('layanan')) return <Layanan dark={dark} />
    if (p.includes('pengaturan')) return <Pengaturan dark={dark} />
    return <Dashboard dark={dark} />
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar
        dark={dark}
        activeKey={getActiveKey(location.pathname)}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
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
        <main className="flex-1 p-4 md:p-6 overflow-x-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}