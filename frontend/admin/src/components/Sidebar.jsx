import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Package, ClipboardList, Users, Settings, UserCog, Wrench, X, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { APP_CONFIG } from '../config/constants'
import { cn } from '@/lib/utils'

const iconMap = { LayoutDashboard, Package, ClipboardList, Users, UserCog, Wrench, Settings }

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard", to: "/" },
  { key: "produk", label: "Produk", icon: "Package", to: "/produk" },
  { key: "pesanan", label: "Pesanan", icon: "ClipboardList", to: "/pesanan" },
  { key: "pengguna", label: "Pengguna", icon: "Users", to: "/pengguna" },
  { key: "akun-pelanggan", label: "Akun Pelanggan", icon: "UserCog", to: "/akun-pelanggan" },
  { key: "layanan", label: "Layanan", icon: "Wrench", to: "/layanan" },
  { key: "pengaturan", label: "Pengaturan", icon: "Settings", to: "/pengaturan" },
]

function SidebarContent({ activeKey, setMobileOpen, isCollapsed }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border min-h-[73px]">
        <div className="w-8 h-8 rounded-lg bg-olaTosca/15 border border-olaTosca/30 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-olaTosca" />
        </div>
        {!isCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden whitespace-nowrap">
            <div className="text-sm font-bold text-foreground">{APP_CONFIG.APP_NAME}</div>
            <div className="text-[10px] text-muted-foreground">OLA ATK DASHBOARD</div>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {!isCollapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">Menu</p>
        )}
        {sidebarItems.map(item => {
          const Icon = iconMap[item.icon]
          const isActive = activeKey === item.key
          return (
            <Link
              key={item.key}
              to={item.to}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative',
                isActive ? 'bg-olaTosca/15 text-olaTosca border border-olaTosca/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? 'text-olaTosca' : 'text-muted-foreground group-hover:text-foreground')} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isActive && (isCollapsed ? 
                <span className="absolute right-1 w-1 h-4 rounded-full bg-olaTosca" /> : 
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-olaTosca" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border min-h-[45px]">
        {!isCollapsed && <p className="text-[10px] text-muted-foreground">© 2026 {APP_CONFIG.APP_NAME}</p>}
      </div>
    </div>
  )
}

export default function Sidebar({ activeKey, mobileOpen, setMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Desktop */}
      <motion.aside 
        animate={{ width: isCollapsed ? 64 : 224 }}
        className="hidden md:flex flex-col h-screen sticky top-0 bg-sidebar border-r border-border flex-shrink-0 relative group/sidebar"
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-16 w-6 h-6 bg-sidebar border border-border rounded-full flex items-center justify-center z-10 hover:bg-accent transition-colors shadow-sm opacity-0 group-hover/sidebar:opacity-100"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <SidebarContent activeKey={activeKey} isCollapsed={isCollapsed} />
      </motion.aside>

      {/* Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="md:hidden fixed inset-0 bg-black/60 z-40" />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }} className="md:hidden fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-border z-50">
              <SidebarContent activeKey={activeKey} setMobileOpen={setMobileOpen} isCollapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}