import React from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Package, ClipboardList, Users, Settings, UserCog, Wrench, X, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { APP_CONFIG } from '../config/constants'
import { cn } from '@/lib/utils'

const iconMap = {
  LayoutDashboard, Package, ClipboardList, Users, UserCog, Wrench, Settings
}

const sidebarItems = [
  { key: "dashboard",      label: "Dashboard",       icon: "LayoutDashboard", to: "/" },
  { key: "produk",         label: "Produk",           icon: "Package",         to: "/produk" },
  { key: "pesanan",        label: "Pesanan",          icon: "ClipboardList",   to: "/pesanan" },
  { key: "pengguna",       label: "Pengguna",         icon: "Users",           to: "/pengguna" },
  { key: "akun-pelanggan", label: "Akun Pelanggan",   icon: "UserCog",         to: "/akun-pelanggan" },
  { key: "layanan",        label: "Layanan",          icon: "Wrench",          to: "/layanan" },
  { key: "pengaturan",     label: "Pengaturan",       icon: "Settings",        to: "/pengaturan" },
]

function SidebarContent({ activeKey, setMobileOpen }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-olaTosca/15 border border-olaTosca/30 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-olaTosca" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">{APP_CONFIG.APP_NAME}</div>
            <div className="text-[10px] text-muted-foreground">Admin Dashboard</div>
          </div>
        </div>
        {setMobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 rounded hover:bg-accent transition">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">Menu</p>
        {sidebarItems.map(item => {
          const Icon = iconMap[item.icon]
          const isActive = activeKey === item.key
          return (
            <Link
              key={item.key}
              to={item.to}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-olaTosca/15 text-olaTosca border border-olaTosca/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <span className={cn(
                'w-4 h-4 flex-shrink-0 transition-colors',
                isActive ? 'text-olaTosca' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                {Icon && <Icon className="w-4 h-4" />}
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-olaTosca" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground">© {new Date().getFullYear()} {APP_CONFIG.APP_NAME}</p>
      </div>
    </div>
  )
}

export default function Sidebar({ dark, activeKey, mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Desktop */}
      <aside className="w-56 hidden md:flex flex-col h-screen sticky top-0 bg-card border-r border-border flex-shrink-0">
        <SidebarContent activeKey={activeKey} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="md:hidden fixed left-0 top-0 h-full w-56 bg-card border-r border-border z-50"
            >
              <SidebarContent activeKey={activeKey} setMobileOpen={setMobileOpen} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export { sidebarItems }