import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, ChevronDown, Menu, LogOut, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Topbar({ dark, setDark, profileOpen, setProfileOpen, profileRef, onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())

  const currentPath = location.pathname.split('/').filter(Boolean).pop() || 'Dashboard'

  // Update jam setiap detik
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Format ke Waktu Jakarta (WIB)
  const timeString = time.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\./g, ':') // Fix: format id-ID kadang pake titik, kita ubah ke titik dua

  const dateString = time.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex-shrink-0 relative">
      
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-accent transition">
          <Menu className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold">
          <span>Pages</span>
          <span className="text-muted-foreground/30">/</span>
          <span className="font-bold text-foreground capitalize">{currentPath.replace(/-/g, ' ')}</span>
        </div>
      </div>

      {/* Center: Live Clock Jakarta */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex flex-col items-center justify-center">
        <div className="flex items-center gap-1.5 text-foreground">
          <Clock className="w-3.5 h-3.5 text-olaTosca" />
          <span className="text-sm font-bold tracking-wider font-mono">
            {timeString} <span className="text-[10px] text-muted-foreground font-sans">WIB</span>
          </span>
        </div>
        <span className="text-[9px] font-medium text-muted-foreground tracking-widest uppercase mt-0.5">
          {dateString}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          {dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen(o => !o)} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-accent transition border border-transparent hover:border-border">
            <div className="w-7 h-7 rounded-full bg-olaTosca text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-olaTosca/20">AD</div>
            <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform duration-200', profileOpen && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-xl shadow-xl py-1.5 z-50 overflow-hidden"
              >
                <div className="px-4 py-2 mb-1 border-b border-border/50 bg-accent/20">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Access Level</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">Administrator</p>
                </div>
                <button
                  onClick={() => { 
                    localStorage.clear()
                    setProfileOpen(false)
                    navigate('/admin-login', { replace: true }) 
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}