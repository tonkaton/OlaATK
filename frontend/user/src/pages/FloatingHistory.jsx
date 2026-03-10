/* File: frontenduser/src/pages/FloatingHistory.jsx */
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, X, RefreshCw, ChevronDown, FileText, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react'
import { ordersAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function FloatingHistory() {
  const { isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch data pas komponen diload atau pas tombol refresh ditekan
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await ordersAPI.getAll()
      // Handle struktur response backend lu
      const data = response.data?.pesanan || response.pesanan || []
      // Ambil 5 pesanan terakhir aja
      setOrders(data.slice(0, 5))
    } catch (error) {
      console.error("Gagal ambil history widget:", error)
    } finally {
      setLoading(false)
    }
  }

  // Auto fetch pas user login
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated])

  // Kalau gak login, jangan tampilkan apa-apa (Hidden)
  if (!isAuthenticated) return null

  // --- HELPER STATUS BADGE (Versi Mini) ---
  const MiniStatus = ({ status }) => {
    const config = {
      'MENUNGGU': { color: 'text-yellow-600 bg-yellow-100', icon: Clock },
      'DIPROSES': { color: 'text-blue-600 bg-blue-100', icon: Loader2 },
      'SELESAI': { color: 'text-green-600 bg-green-100', icon: CheckCircle },
      'BATAL': { color: 'text-red-600 bg-red-100', icon: XCircle },
    }
    const style = config[status] || config['MENUNGGU']
    const Icon = style.icon

    return (
      <span className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${style.color}`}>
        <Icon size={10} className={status === 'DIPROSES' ? 'animate-spin' : ''} /> {status}
      </span>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* --- POPUP WINDOW --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* HEADER */}
            <div className="bg-olaTosca p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <History size={18} />
                <span className="font-bold text-sm">Pesanan Terakhir</span>
              </div>
              <div className="flex gap-2">
                <button onClick={fetchOrders} disabled={loading} className="hover:bg-white/20 p-1 rounded transition">
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* BODY LIST */}
            <div className="max-h-80 overflow-y-auto bg-gray-50 p-2 space-y-2 custom-scrollbar">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Belum ada pesanan aktif</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-bold text-gray-800 line-clamp-1">{order.jenis_layanan}</p>
                        <p className="text-[10px] text-gray-400">
                           {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                      <MiniStatus status={order.status} />
                    </div>
                    
                    {/* Progress Bar Gimmick */}
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full rounded-full ${
                          order.status === 'SELESAI' ? 'bg-green-500 w-full' : 
                          order.status === 'DIPROSES' ? 'bg-blue-500 w-2/3 animate-pulse' : 
                          order.status === 'BATAL' ? 'bg-red-500 w-full' :
                          'bg-yellow-400 w-1/3'
                        }`}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* FOOTER */}
            <div className="bg-white p-2 border-t text-center">
              <a href="/riwayat" className="text-xs text-olaTosca font-bold hover:underline">Lihat Semua Riwayat</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TRIGGER BUTTON --- */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen ? 'bg-gray-600 text-white rotate-90' : 'bg-gradient-to-tr from-olaTosca to-olaBlue text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : (
            <div className="relative">
                <History size={24} />
            </div>
        )}
      </motion.button>

    </div>
  )
}