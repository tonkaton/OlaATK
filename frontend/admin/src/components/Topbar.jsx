import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, ChevronDown, Menu } from 'lucide-react'

export default function Topbar({ dark, setDark, profileOpen, setProfileOpen, profileRef, onMenuClick }) {
  return (
    <header className="flex items-center justify-between p-4 md:p-6 bg-transparent">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md bg-white/10 hover:bg-white/20 transition"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        <div className="font-semibold text-white">Halo, Admin</div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <button 
          onClick={() => setDark(!dark)} 
          className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition"
        >
          {dark ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
        </button>
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setProfileOpen(o => !o)} 
            className="flex items-center gap-2 bg-white/6 backdrop-blur rounded-md px-2 md:px-3 py-1"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">A</div>
            <div className="text-sm text-white/90 hidden sm:block">Admin</div>
            <ChevronDown className="w-4 h-4 text-white/80 hidden sm:block" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }} 
                className={`absolute right-0 mt-2 w-48 rounded-xl backdrop-blur shadow-lg-soft py-2 text-sm z-50 ${dark ? 'bg-slate-900/80 border border-white/10' : 'bg-white/80 border border-slate-200'}`}
              >
                <div className={`${dark ? 'border-white/10' : 'border-slate-200'} border-t my-1`} />
                <button 
                  onClick={() => {
                    localStorage.removeItem('ola_auth_token')
                    localStorage.removeItem('ola_user_data')
                    window.location.href = '/'
                  }} 
                  className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-500/10 transition"
                >
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
