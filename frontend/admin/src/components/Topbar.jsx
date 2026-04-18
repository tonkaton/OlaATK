import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Moon, Sun, ChevronDown, Menu, LogOut, Search, Command,
  Package, ClipboardList, Users, Settings, Wrench, UserCog,
  LayoutDashboard, User
} from 'lucide-react'
import { APP_CONFIG } from '../config/constants'
import { cn } from '@/lib/utils'
import { productsAPI, ordersAPI } from '../services/api'

// Static Pages
const PAGES = [
  { id: 1, type: 'page', title: 'Dashboard',       category: 'Navigasi', to: '/',               icon: LayoutDashboard },
  { id: 2, type: 'page', title: 'Produk & Stok',   category: 'Navigasi', to: '/produk',         icon: Package },
  { id: 3, type: 'page', title: 'Pesanan',         category: 'Navigasi', to: '/pesanan',        icon: ClipboardList },
  { id: 4, type: 'page', title: 'Pengguna',        category: 'Navigasi', to: '/pengguna',       icon: Users },
  { id: 5, type: 'page', title: 'Akun Pelanggan',  category: 'Navigasi', to: '/akun-pelanggan', icon: UserCog },
  { id: 6, type: 'page', title: 'Layanan',         category: 'Navigasi', to: '/layanan',        icon: Wrench },
  { id: 7, type: 'page', title: 'Pengaturan',      category: 'Navigasi', to: '/pengaturan',     icon: Settings },
]

export default function Topbar({ dark, setDark, profileOpen, setProfileOpen, profileRef, onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [allResults, setAllResults] = useState([])
  const [loading, setLoading] = useState(false)

  const currentPath = location.pathname.split('/').filter(Boolean).pop() || 'Dashboard'

  // Shortcut Ctrl + K handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setShowResults(false)
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Multi-source search
  useEffect(() => {
    if (!query.trim()) {
      setAllResults([])
      return
    }

    const performSearch = async () => {
      setLoading(true)
      const queryLower = query.toLowerCase()
      let results = []

      // Search pages
      results.push(...PAGES.filter(p =>
        p.title.toLowerCase().includes(queryLower) ||
        p.category.toLowerCase().includes(queryLower)
      ))

      try {
        // Search products — FIX: use .stokBarang not .data
        const productsData = await productsAPI.getAll(1, query)
        const products = productsData?.stokBarang || []
        products.slice(0, 3).forEach(p => results.push({
          type: 'product',
          id: `prod-${p.id}`,
          title: p.nama,
          category: 'Produk',
          icon: Package,
          data: p,
          action: () => navigate('/produk')
        }))
      } catch (e) { /* silent */ }

      try {
        // Search orders/customers
        const ordersData = await ordersAPI.getAll(1, query)
        const orders = ordersData?.pesanan || []
        orders
          .filter(o => o.pelanggan?.nama_lengkap?.toLowerCase().includes(queryLower))
          .slice(0, 3)
          .forEach(o => results.push({
            type: 'customer',
            id: `cust-${o.id}`,
            title: o.pelanggan?.nama_lengkap || 'Unknown',
            category: 'Pelanggan',
            icon: User,
            data: o,
            action: () => navigate('/pesanan')
          }))
      } catch (e) { /* silent */ }

      setAllResults(results)
      setLoading(false)
    }

    performSearch()
  }, [query])

  const handleSelectResult = (result) => {
    if (result.action) {
      result.action()
    } else if (result.to) {
      navigate(result.to)
    }
    setShowResults(false)
    setQuery('')
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex-shrink-0">
      
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

      {/* Center: Live Search Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md px-10 relative">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-olaTosca transition-colors" />
          <input 
            ref={searchInputRef}
            type="text" 
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            placeholder="Cari halaman, barang, pelanggan..." 
            className="w-full h-9 bg-accent/40 border border-transparent focus:border-olaTosca/20 focus:bg-card focus:ring-1 focus:ring-olaTosca/10 rounded-lg pl-9 pr-4 text-xs transition-all outline-none text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 bg-background border border-border px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground group-focus-within:hidden">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </div>

        {/* Dropdown Results */}
        <AnimatePresence>
          {showResults && (
            <>
              {/* FIX: z-40 so it intercepts clicks properly */}
              <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border shadow-2xl rounded-xl z-50 max-h-96 overflow-y-auto"
              >
                {loading && query.length > 0 && (
                  <div className="px-4 py-8 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-2 h-2 bg-olaTosca rounded-full animate-pulse" />
                      <p className="text-xs text-muted-foreground">Mencari...</p>
                    </div>
                  </div>
                )}

                {!loading && (
                  <div className="py-2">
                    {/* FIX: Jelajahi — muncul saat query kosong */}
                    {!query && (
                      <div className="px-3 pb-2">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1">Jelajahi</p>
                        {PAGES.map(page => {
                          const Icon = page.icon
                          return (
                            <button 
                              key={page.id} 
                              onClick={() => handleSelectResult(page)}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-lg transition group text-left"
                            >
                              <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-olaTosca transition-colors" />
                              <span className="text-xs text-muted-foreground group-hover:text-foreground">{page.title}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* FIX: Search results — muncul saat ada query */}
                    {query && allResults.length > 0 && Object.entries(
                      allResults.reduce((acc, r) => {
                        if (!acc[r.category]) acc[r.category] = []
                        acc[r.category].push(r)
                        return acc
                      }, {})
                    ).map(([category, items]) => (
                      <div key={category}>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-1.5">{category}</p>
                        {items.map(result => {
                          const Icon = result.icon
                          return (
                            <button 
                              key={result.id} 
                              onClick={() => handleSelectResult(result)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition group text-left"
                            >
                              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-olaTosca transition-colors flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{result.title}</p>
                                {result.data?.nomor_telepon && (
                                  <p className="text-[10px] text-muted-foreground">{result.data.nomor_telepon}</p>
                                )}
                                {result.data?.harga_satuan !== undefined && (
                                  <p className="text-[10px] text-muted-foreground">Rp {result.data.harga_satuan.toLocaleString('id-ID')}</p>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </button>
                          )
                        })}
                      </div>
                    ))}

                    {query && !loading && allResults.length === 0 && (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-muted-foreground">Tidak ada hasil untuk "<span className="text-foreground font-medium">{query}</span>"</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
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
                  onClick={() => { localStorage.clear(); window.location.href = '/admin/login' }}
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