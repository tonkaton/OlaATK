import React from 'react'
import { Link } from 'react-router-dom'
import { Home, BarChart2, ShoppingCart, ListChecks, Users, Settings, UserCog, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { APP_CONFIG } from '../config/constants'

const iconMap = {
  BarChart2,
  ShoppingCart,
  ListChecks,
  Users,
  UserCog,
  Home,
  Settings
}

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: "BarChart2", to: "/" },
  { key: "produk", label: "Produk", icon: "ShoppingCart", to: "/produk" },
  { key: "pesanan", label: "Pesanan", icon: "ListChecks", to: "/pesanan" },
  { key: "pengguna", label: "Pengguna", icon: "Users", to: "/pengguna" },
  { key: "akun-pelanggan", label: "Akun Pelanggan", icon: "UserCog", to: "/akun-pelanggan" },
  { key: "layanan", label: "Layanan", icon: "Home", to: "/layanan" },
  { key: "pengaturan", label: "Pengaturan", icon: "Settings", to: "/pengaturan" },
]

export default function Sidebar({ dark, activeKey, mobileOpen, setMobileOpen }) {
  const handleLinkClick = () => {
    // Close mobile sidebar when a link is clicked
    if (setMobileOpen) setMobileOpen(false)
  }

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-olaTosca to-olaBlue flex items-center justify-center text-white shadow">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{APP_CONFIG.APP_NAME}</div>
            <div className="text-sm text-white/80">Admin Dashboard</div>
          </div>
        </div>
        {/* Close button for mobile */}
        <button 
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="md:hidden p-2 rounded-md hover:bg-white/10 transition"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-2 mt-6">
        {sidebarItems.map(item => (
          <SidebarLink
            key={item.key}
            item={item}
            active={activeKey === item.key}
            dark={dark}
            onClick={handleLinkClick}
          />
        ))}
      </nav>
      <div className="text-xs text-white/70">© {new Date().getFullYear()} {APP_CONFIG.APP_NAME}</div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-72 hidden md:flex flex-col p-6 gap-6 rounded-tr-2xl rounded-br-2xl shadow-lg mr-6 bg-gradient-to-b from-startupPurple/90 via-olaBlue/60 to-olaTosca/40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="md:hidden fixed left-0 top-0 h-full w-72 flex flex-col p-6 gap-4 shadow-xl z-50 bg-gradient-to-b from-startupPurple via-olaBlue to-olaTosca"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarLink({ item, active, dark, onClick }) {
  const IconComponent = iconMap[item.icon]
  
  return (
    <Link 
      to={item.to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${active ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/8'}`}
    >
      <span className={`p-2 rounded-md ${active ? 'bg-white/10' : ''}`}>
        {IconComponent && <IconComponent className="w-5 h-5" />}
      </span>
      <span className={`text-sm font-medium ${active ? 'text-white' : 'text-white/90'}`}>{item.label}</span>
    </Link>
  )
}

export { sidebarItems }
