/* Energetic Navbar with scroll background change and smooth link highlighting */
import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Home, LogOut, History } from 'lucide-react'
import { motion } from 'framer-motion'
import { useConfig } from '../contexts/ConfigContext'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar(){
  const { config } = useConfig()
  const { isAuthenticated, user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Check if user is admin (should not show logout button for admins in user frontend generally)
  const isUserLoggedIn = isAuthenticated && user?.userType === 'user'

  useEffect(() => {
    function onScroll(){ setScrolled(window.scrollY > 30) }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close mobile menu on route change
  useEffect(() => setOpen(false), [location])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className={`fixed w-full z-50 transition-all ${scrolled ? 'backdrop-blur bg-white/80 shadow' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-olaTosca to-olaBlue flex items-center justify-center shadow">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold">{config.APP_NAME}</div>
              <div className="text-xs text-gray-500 -mt-0.5">{config.APP_TAGLINE}</div>
            </div>
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" label="Beranda" />
            <NavLink to="/services" label="Layanan" />
            <NavLink to="/order" label="Pemesanan" />
            
            {/* [FIX] Menu RIWAYAT Cuma Muncul Kalau Login */}
            {isUserLoggedIn && (
               <NavLink to="/riwayat" label="Riwayat" />
            )}

            <NavLink to="/kontak" label="Kontak" />

            <div className="flex items-center gap-3 ml-2">
              {isUserLoggedIn ? (
                <>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-red-500 text-red-500 hover:bg-red-50 transition text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="px-4 py-2 rounded-md border border-olaBlue text-olaBlue hover:bg-olaLight transition text-sm font-medium">Login</Link>
                  <Link to="/order" className="px-4 py-2 rounded-md bg-gradient-to-r from-olaTosca to-olaBlue text-white shadow-md hover:scale-[1.03] transition-transform text-sm font-medium">Pesan Sekarang</Link>
                </>
              )}
            </div>
          </nav>

          {/* MOBILE TOGGLE */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="p-2 rounded-md focus:outline-none">
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22 }}
        className="md:hidden overflow-hidden border-t bg-white shadow-lg"
      >
        <div className="px-4 py-3 space-y-2 text-sm font-medium">
          <Link to="/" className="block py-2 text-gray-700 hover:text-olaBlue" >Beranda</Link>
          <Link to="/services" className="block py-2 text-gray-700 hover:text-olaBlue" >Layanan</Link>
          <Link to="/order" className="block py-2 text-gray-700 hover:text-olaBlue" >Pemesanan</Link>
          
          {/* [FIX] Menu RIWAYAT Mobile */}
          {isUserLoggedIn && (
            <Link to="/riwayat" className="block py-2 text-olaTosca font-semibold flex items-center gap-2">
                <History size={16}/> Riwayat Pesanan
            </Link>
          )}

          <Link to="/kontak" className="block py-2 text-gray-700 hover:text-olaBlue" >Kontak</Link>
          
          <div className="pt-4 flex gap-2 border-t mt-2">
            {isUserLoggedIn ? (
              <>
                <button 
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-red-500 text-red-500 bg-red-50/50"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="flex-1 text-center px-4 py-2 rounded-md border border-olaBlue text-olaBlue">Login</Link>
                <Link to="/order" className="flex-1 text-center px-4 py-2 rounded-md bg-gradient-to-r from-olaTosca to-olaBlue text-white">Pesan</Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </header>
  )
}

/* NavLink component with active underline animation */
function NavLink({to, label}){
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link to={to} className={`relative py-2 text-sm font-medium ${active ? 'text-olaBlue' : 'text-gray-600 hover:text-olaBlue'}`}>
      {label}
      <span className={`absolute left-0 -bottom-1 w-full h-0.5 transition-all duration-300 ${active ? 'bg-olaTosca scale-x-100' : 'bg-transparent scale-x-0'}`}></span>
    </Link>
  )
}