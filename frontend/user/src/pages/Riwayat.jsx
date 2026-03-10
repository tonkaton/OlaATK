import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ordersAPI } from '../services/api'
import { Clock, CheckCircle, XCircle, Loader2, FileText, Calendar } from 'lucide-react'
import { API_BASE_URL } from '../config/constants'
import { useAuth } from '../contexts/AuthContext'

export default function Riwayat() {
  const { isAuthenticated } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if(isAuthenticated) {
        fetchMyOrders()
    } else {
        setLoading(false)
    }
  }, [isAuthenticated])

  const fetchMyOrders = async () => {
    try {
      // Backend otomatis filter by ID User yang login
      const response = await ordersAPI.getAll()
      // Handle struktur response: bisa array langsung atau object data
      const data = response.data?.pesanan || response.pesanan || []
      setOrders(data)
    } catch (error) {
      console.error("Gagal ambil riwayat:", error)
    } finally {
      setLoading(false)
    }
  }

  // Komponen Badge Status biar cantik
  const StatusBadge = ({ status }) => {
    let style = "bg-gray-100 text-gray-600"
    let icon = <Clock size={14} />

    if (status === 'MENUNGGU') {
      style = "bg-yellow-100 text-yellow-700 border border-yellow-200"
    } else if (status === 'DIPROSES') {
      style = "bg-blue-100 text-blue-700 border border-blue-200"
      icon = <Loader2 size={14} className="animate-spin" />
    } else if (status === 'SELESAI') {
      style = "bg-green-100 text-green-700 border border-green-200"
      icon = <CheckCircle size={14} />
    } else if (status === 'BATAL') {
      style = "bg-red-100 text-red-700 border border-red-200"
      icon = <XCircle size={14} />
    }

    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${style}`}>
        {icon} {status}
      </span>
    )
  }

  if (loading) return <div className="pt-32 text-center flex justify-center"><Loader2 className="animate-spin text-olaTosca" /></div>

  if (!isAuthenticated) return (
      <div className="pt-32 text-center">
          <p>Silakan login untuk melihat riwayat.</p>
      </div>
  )

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Riwayat Pesanan</h1>
        <p className="text-gray-500 mb-8">Pantau status pesanan kamu di sini.</p>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-700">Belum ada pesanan</h3>
            <p className="text-gray-500 text-sm mt-2">Yuk buat pesanan pertamamu sekarang!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold
                      ${order.mode_pesanan === 'ONLINE' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                      {order.mode_pesanan === 'ONLINE' ? 'ON' : 'OFF'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{order.jenis_layanan}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar size={14}/>
                        {new Date(order.created_at).toLocaleDateString('id-ID', { 
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* INI YANG PENTING: STATUS BADGE */}
                  <div className="self-start md:self-center">
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-100 pt-4 mt-2">
                   {/* Detail Barang/File */}
                   <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Detail Pesanan</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {order.barangTerbeli && order.barangTerbeli.length > 0 ? (
                             order.barangTerbeli.map((item, idx) => (
                               <li key={idx} className="flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                 {item.nama_barang} <span className="text-gray-400">x{item.jumlah}</span>
                               </li>
                             ))
                          ) : (
                            <li>Detail belum diproses admin</li>
                          )}
                        </ul>
                      </div>
                      
                      {order.nama_file && (
                        <div className="text-right">
                           <p className="text-xs font-bold text-gray-400 uppercase mb-2">File Upload</p>
                           <a 
                             href={`${API_BASE_URL}/uploads/${order.nama_file}`} 
                             target="_blank" 
                             rel="noreferrer"
                             className="text-sm text-olaTosca hover:underline truncate max-w-[200px] inline-block"
                           >
                             {order.nama_file}
                           </a>
                        </div>
                      )}
                   </div>

                   {/* Catatan & Total */}
                   <div className="mt-4 flex justify-between items-end bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 italic max-w-xs">
                        "{order.catatan_pesanan || 'Tidak ada catatan tambahan'}"
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Total Biaya</p>
                        <p className="text-lg font-bold text-gray-800">
                          {order.nilai_pesanan > 0 
                            ? `Rp ${order.nilai_pesanan.toLocaleString('id-ID')}` 
                            : <span className="text-orange-500 text-sm">Menunggu Admin</span>}
                        </p>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}