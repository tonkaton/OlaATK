/* Clean Navbar inspired by Aura template */
import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfig } from '../contexts/ConfigContext'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar(){
  const { config } = useConfig()
  const { isAuthenticated, user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isUserLoggedIn = isAuthenticated && user?.userType === 'user'

  useEffect(() => {
    function onScroll(){ setScrolled(window.scrollY > 30) }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [location])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className={`w-full fixed top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-light/95 backdrop-blur-md shadow-sm border-b border-border' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-[82rem] mx-auto px-6 md:px-12 lg:px-20 relative">
        <div className="flex items-center justify-between py-5">
          
          {/* KIRI: LOGO (Dikasih flex-1 biar bisa nahan layout) */}
          <div className="flex-1 flex justify-start">
            <Link 
              to="/" 
              className="font-display text-[1.5rem] font-medium tracking-tighter text-dark hover:opacity-80 transition-opacity relative z-10"
            >
              {config.APP_NAME || 'Ola ATK'}
            </Link>
          </div>
          
          {/* TENGAH: DESKTOP MENU (Absolute Centering di layar MD ke atas) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-normal text-neutral-text">
            <NavLink to="/" label="Beranda" />
            <NavLink to="/services" label="Layanan" />
            <NavLink to="/order" label="Pemesanan" />
            {isUserLoggedIn && <NavLink to="/riwayat" label="Riwayat" />}
            <NavLink to="/kontak" label="Kontak" />
          </div>

          {/* KANAN: CTA BUTTONS (Dikasih flex-1 dan justify-end) */}
          <div className="flex-1 flex items-center justify-end gap-4">
            <AnimatePresence mode="wait">
              {isUserLoggedIn ? (
                <motion.button
                  key="logout"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-dark text-dark text-sm font-normal hover:bg-dark hover:text-white transition-colors"
                >
                  <Icon icon="solar:logout-2-linear" className="text-lg" />
                  Logout
                </motion.button>
              ) : (
                <motion.div
                  key="auth-buttons"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="hidden md:flex items-center gap-4"
                >
                  <Link
                    to="/auth"
                    className="px-4 py-2 rounded-full border border-dark text-dark text-sm font-normal hover:bg-dark hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/order"
                    className="flex items-center bg-dark text-white rounded-full py-2 px-4 gap-2 hover:bg-dark-lighter transition-colors group"
                  >
                    <span className="text-sm font-normal">Pesan Sekarang</span>
                    <Icon icon="solar:arrow-right-up-linear" className="text-lg group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MOBILE TOGGLE (Tetap di kanan) */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-dark text-[1.5rem] flex items-center justify-center p-2 hover:bg-light-gray rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Icon icon={open ? "solar:close-circle-linear" : "solar:hamburger-menu-linear"} />
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-light border-t border-border"
          >
            <div className="px-6 py-6 space-y-1">
              <MobileNavLink to="/" label="Beranda" />
              <MobileNavLink to="/services" label="Layanan" />
              <MobileNavLink to="/order" label="Pemesanan" />
              {isUserLoggedIn && <MobileNavLink to="/riwayat" label="Riwayat" />}
              <MobileNavLink to="/kontak" label="Kontak" />
              
              {/* MOBILE CTA */}
              <div className="pt-4 flex flex-col gap-2 border-t border-border mt-4">
                {isUserLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-dark text-dark text-sm font-normal hover:bg-dark hover:text-white transition-colors"
                  >
                    <Icon icon="solar:logout-2-linear" className="text-lg" />
                    Logout
                  </button>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      className="text-center px-4 py-2.5 rounded-full border border-dark text-dark text-sm font-normal hover:bg-dark hover:text-white transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/order"
                      className="flex items-center justify-center bg-dark text-white rounded-full py-2.5 px-4 gap-2 hover:bg-dark-lighter transition-colors"
                    >
                      <span className="text-sm font-normal">Pesan Sekarang</span>
                      <Icon icon="solar:arrow-right-up-linear" className="text-lg" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

/* Desktop NavLink with subtle hover */
function NavLink({to, label}){
  const location = useLocation()
  const active = location.pathname === to
  
  return (
    <Link 
      to={to} 
      className={`transition-colors relative ${
        active 
          ? 'text-dark font-medium' 
          : 'text-neutral-text hover:text-dark'
      }`}
    >
      {label}
      {/* Underline indicator untuk active state */}
      {active && (
        <motion.div
          layoutId="navbar-indicator"
          className="absolute -bottom-[1.4rem] left-0 right-0 h-0.5 bg-dark"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  )
}

/* Mobile NavLink - full width clickable */
function MobileNavLink({to, label}){
  const location = useLocation()
  const active = location.pathname === to
  
  return (
    <Link 
      to={to} 
      className={`block py-3 px-4 rounded-lg transition-colors ${
        active 
          ? 'bg-light-gray text-dark font-medium' 
          : 'text-neutral-text hover:bg-light-gray hover:text-dark'
      }`}
    >
      {label}
    </Link>
  )
}