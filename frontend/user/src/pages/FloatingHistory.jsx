import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import { ordersAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function FloatingHistory() {
  const { isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch Orders (LOGIC SAMA!)
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await ordersAPI.getAll()
      const data = response.data?.pesanan || response.pesanan || []
      setOrders(data.slice(0, 5)) // 5 terakhir
    } catch (error) {
      console.error("Gagal ambil history widget:", error)
    } finally {
      setLoading(false)
    }
  }

  // Auto fetch pas login (LOGIC SAMA!)
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated])

  // Hidden kalo ga login
  if (!isAuthenticated) return null

  // Mini Status Badge
  const MiniStatus = ({ status }) => {
    const config = {
      'MENUNGGU': { 
        color: 'text-yellow-700 bg-yellow-50 border-yellow-200', 
        icon: 'solar:clock-circle-linear' 
      },
      'DIPROSES': { 
        color: 'text-blue-700 bg-blue-50 border-blue-200', 
        icon: 'svg-spinners:ring-resize' 
      },
      'SELESAI': { 
        color: 'text-green-700 bg-green-50 border-green-200', 
        icon: 'solar:check-circle-bold' 
      },
      'BATAL': { 
        color: 'text-red-700 bg-red-50 border-red-200', 
        icon: 'solar:close-circle-bold' 
      },
    }
    
    const style = config[status] || config['MENUNGGU']

    return (
      <span className={`px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 border ${style.color}`}>
        <Icon icon={style.icon} className="text-xs" />
        {status}
      </span>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* POPUP WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-80 bg-white rounded-xl shadow-2xl border border-border overflow-hidden"
          >
            {/* HEADER */}
            <div className="bg-dark p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Icon icon="solar:history-linear" className="text-lg" />
                <span className="font-medium text-sm">Pesanan Terakhir</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={fetchOrders} 
                  disabled={loading} 
                  className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                  aria-label="Refresh"
                >
                  <Icon 
                    icon={loading ? "svg-spinners:ring-resize" : "solar:refresh-linear"} 
                    className="text-base" 
                  />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                  aria-label="Minimize"
                >
                  <Icon icon="solar:alt-arrow-down-linear" className="text-base" />
                </button>
              </div>
            </div>

            {/* BODY LIST */}
            <div className="max-h-80 overflow-y-auto bg-light-gray p-3 space-y-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {orders.length === 0 ? (
                <div className="text-center py-10 text-neutral-light">
                  <Icon icon="solar:file-text-linear" className="text-5xl mx-auto mb-3 opacity-40" />
                  <p className="text-xs">Belum ada pesanan aktif</p>
                </div>
              ) : (
                orders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-2">
                        <p className="text-xs font-medium text-dark line-clamp-1">
                          {order.jenis_layanan}
                        </p>
                        <p className="text-[10px] text-neutral-light mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <MiniStatus status={order.status} />
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-light-muted h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          order.status === 'SELESAI' ? 'bg-green-500 w-full' : 
                          order.status === 'DIPROSES' ? 'bg-blue-500 w-2/3' : 
                          order.status === 'BATAL' ? 'bg-red-500 w-full' :
                          'bg-yellow-400 w-1/3'
                        }`}
                      ></div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {/* FOOTER */}
            <div className="bg-white p-3 border-t border-border text-center">
              <a 
                href="/riwayat" 
                className="text-xs text-dark font-medium hover:underline inline-flex items-center gap-1"
              >
                Lihat Semua Riwayat
                <Icon icon="solar:arrow-right-linear" className="text-xs" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TRIGGER BUTTON */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen 
            ? 'bg-dark-muted text-white' 
            : 'bg-dark text-white hover:bg-dark-lighter'
        }`}
        aria-label="Toggle order history"
      >
        <Icon 
          icon={isOpen ? "solar:close-circle-linear" : "solar:history-linear"} 
          className={`text-2xl transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </motion.button>

    </div>
  )
}