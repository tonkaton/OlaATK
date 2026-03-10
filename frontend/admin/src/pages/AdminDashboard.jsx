import React, { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import useTheme from "../hooks/useTheme"
import Dashboard from "./Dashboard"
import Produk from "./Produk"
import Pesanan from "./Pesanan"
import Pengguna from "./Pengguna"
import AkunPelanggan from "./AkunPelanggan"
import Layanan from "./Layanan"
import Pengaturan from "./Pengaturan"

export default function AdminDashboard() {
  const location = useLocation()
  const { dark, setDark } = useTheme()
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const close = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Determine which page to show based on route
  const getActiveKey = (pathname) => {
    if (pathname === "/") return "dashboard"
    if (pathname.includes("produk")) return "produk"
    if (pathname.includes("pesanan")) return "pesanan"
    if (pathname.includes("akun-pelanggan")) return "akun-pelanggan"
    if (pathname.includes("pengguna")) return "pengguna"
    if (pathname.includes("layanan")) return "layanan"
    if (pathname.includes("pengaturan")) return "pengaturan"
    return "dashboard"
  }

  const renderContent = () => {
    const pathname = location.pathname
    if (pathname === "/") return <Dashboard dark={dark} />
    if (pathname.includes("produk")) return <Produk dark={dark} />
    if (pathname.includes("pesanan")) return <Pesanan dark={dark} />
    if (pathname.includes("akun-pelanggan")) return <AkunPelanggan dark={dark} />
    if (pathname.includes("pengguna")) return <Pengguna dark={dark} />
    if (pathname.includes("layanan")) return <Layanan dark={dark} />
    if (pathname.includes("pengaturan")) return <Pengaturan dark={dark} />
    return <Dashboard dark={dark} />
  }

  return (
    <div className={`min-h-screen flex bg-gradient-to-b from-startupPurple/90 via-olaBlue/50 to-olaTosca/30 ${dark ? "text-white" : "text-slate-900"}`}>
      <Sidebar 
        dark={dark} 
        activeKey={getActiveKey(location.pathname)} 
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar 
          dark={dark} 
          setDark={setDark} 
          profileOpen={profileOpen} 
          setProfileOpen={setProfileOpen} 
          profileRef={profileRef}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="p-4 md:p-6 lg:p-10 overflow-x-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
