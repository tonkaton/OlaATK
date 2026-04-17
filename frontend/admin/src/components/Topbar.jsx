import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, ChevronDown, Menu, LogOut } from 'lucide-react'
import { APP_CONFIG } from '../config/constants'
import { cn } from '@/lib/utils'

export default function Topbar({ dark, setDark, profileOpen, setProfileOpen, profileRef, onMenuClick }) {
  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg hover:bg-accent transition"
        >
          <Menu className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="text-sm text-muted-foreground hidden md:block">
          Selamat datang, <span className="font-semibold text-foreground">Admin</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Dark toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="p-1.5 rounded-lg hover:bg-accent transition text-muted-foreground hover:text-foreground"
        >
          {dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition"
          >
            <div className="w-7 h-7 rounded-full bg-olaTosca/20 border border-olaTosca/30 flex items-center justify-center text-olaTosca text-xs font-bold">
              A
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">Admin</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground hidden sm:block transition-transform', profileOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-xl shadow-lg py-1 z-50"
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-foreground">Admin</p>
                  <p className="text-[10px] text-muted-foreground">{APP_CONFIG.APP_NAME}</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN)
                    localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_KEYS.USER_DATA)
                    window.location.href = '/admin/login'
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}