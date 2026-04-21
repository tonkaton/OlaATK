import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import { ordersAPI } from '../services/api'
import { API_BASE_URL } from '../config/constants'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/Card'

export default function Riwayat() {
  const { isAuthenticated } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  
  // FIX: State untuk tracking kartu yang sedang di-expand
  const [expandedId, setExpandedId] = useState(null)

  // Fetch Orders (LOGIC TETAP SAMA!)
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyOrders()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchMyOrders = async () => {
    try {
      const response = await ordersAPI.getAll()
      const data = response.data?.pesanan || response.pesanan || []
      setOrders(data)
    } catch (error) {
      console.error("Gagal ambil riwayat:", error)
    } finally {
      setLoading(false)
    }
  }

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'MENUNGGU': {
        style: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: 'solar:clock-circle-linear'
      },
      'DIPROSES': {
        style: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: 'svg-spinners:ring-resize'
      },
      'SELESAI': {
        style: 'bg-green-50 text-green-700 border-green-200',
        icon: 'solar:check-circle-bold'
      },
      'BATAL': {
        style: 'bg-red-50 text-red-700 border-red-200',
        icon: 'solar:close-circle-bold'
      }
    }

    const config = statusConfig[status] || statusConfig['MENUNGGU']

    return (
      <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${config.style}`}>
        <Icon icon={config.icon} className="text-sm shrink-0" />
        {status}
      </span>
    )
  }

  // Toggle Accordion function
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="svg-spinners:ring-resize" className="text-4xl text-dark" />
      </div>
    )
  }

  // Not Authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card padding="lg" className="text-center max-w-md border-border shadow-sm">
          <div className="w-20 h-20 bg-light-gray rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="solar:lock-bold" className="text-4xl text-dark" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-dark mb-2 tracking-tight">
            Akses Ditolak
          </h2>
          <p className="text-neutral-text text-sm">
            Silakan masuk ke akun Anda terlebih dahulu untuk melihat riwayat pesanan.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light pt-32 pb-20">
      <div className="max-w-[56rem] mx-auto px-6 md:px-12">
        
        {/* Header - Consistent High-End Style */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="border border-border rounded-full px-4 py-1.5 bg-white shadow-sm">
              <span className="text-xs uppercase tracking-wider font-semibold text-dark">Riwayat</span>
            </div>
            <div className="h-[1px] bg-border flex-grow"></div>
          </div>

          <h1 className="font-display text-[2.5rem] md:text-[4.5rem] font-semibold tracking-tighter text-dark leading-[1.1]">
            Pesanan Anda.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-neutral-text max-w-2xl font-normal leading-relaxed">
            Pantau status pesanan, cek rincian dokumen, dan lihat estimasi biaya untuk setiap transaksi Anda.
          </p>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card padding="lg" className="text-center py-20 border-border bg-white shadow-sm">
              <div className="w-24 h-24 bg-light-gray rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon icon="solar:document-medicine-bold" className="text-5xl text-neutral-light opacity-50" />
              </div>
              <h3 className="font-display text-2xl font-medium text-dark mb-2 tracking-tight">
                Belum ada pesanan
              </h3>
              <p className="text-neutral-text text-sm mb-8">
                Riwayat pesanan Anda masih kosong. Yuk buat pesanan pertamamu sekarang!
              </p>
              <a 
                href="/order" 
                className="inline-flex items-center gap-2 bg-dark text-white px-8 py-3 rounded-xl font-semibold hover:bg-dark/90 transition-colors shadow-md"
              >
                Order Sekarang <Icon icon="solar:arrow-right-linear" />
              </a>
            </Card>
          </motion.div>
        ) : (
          // Orders Accordion List
          <div className="space-y-4">
            {orders.map((order, index) => {
              const isExpanded = expandedId === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <Card 
                    padding="none" 
                    className={`overflow-hidden border transition-all duration-300 ${
                      isExpanded ? 'border-dark shadow-md' : 'border-border hover:border-dark/50 bg-white'
                    }`}
                  >
                    {/* Compact Header (Always Visible & Clickable) */}
                    <div 
                      onClick={() => toggleExpand(order.id)}
                      className="cursor-pointer p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none group"
                    >
                      <div className="flex items-center gap-5">
                        {/* Status Icon Indicator */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isExpanded ? 'bg-dark text-white' : 'bg-light-gray text-dark group-hover:bg-dark/10'
                        }`}>
                          <Icon icon={order.mode_pesanan === 'ONLINE' ? 'solar:cloud-upload-bold' : 'solar:shop-bold'} className="text-2xl" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-display text-xl font-semibold text-dark tracking-tight leading-none">
                              {order.jenis_layanan}
                            </h3>
                            {/* Mode Badge Mini */}
                            <span className="text-[10px] uppercase font-bold tracking-widest bg-light-gray px-2 py-0.5 rounded text-neutral-text">
                              {order.mode_pesanan}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-text font-medium">
                            <Icon icon="solar:calendar-linear" className="text-base" />
                            {new Date(order.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pl-17 md:pl-0">
                        <StatusBadge status={order.status} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 bg-light-gray ${
                          isExpanded ? 'rotate-180 bg-dark text-white' : 'text-dark group-hover:bg-dark/10'
                        }`}>
                          <Icon icon="solar:alt-arrow-down-linear" className="text-xl" />
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content Area */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="p-6 pt-0 border-t border-border/50 bg-white">
                            <div className="grid md:grid-cols-2 gap-8 mt-6">
                              
                              {/* Left Col: Items & Subtotal */}
                              <div>
                                <h4 className="text-xs font-bold text-dark uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon icon="solar:box-linear" className="text-lg" />
                                  Rincian Item
                                </h4>
                                
                                {order.barangTerbeli && order.barangTerbeli.length > 0 ? (
                                  <div className="bg-light-gray rounded-xl p-4 border border-border/50">
                                    <ul className="space-y-3">
                                      {order.barangTerbeli.map((item, idx) => (
                                        <li key={idx} className="flex items-start justify-between gap-4 text-sm">
                                          <div className="flex items-start gap-3">
                                            <div className="mt-1.5 w-1.5 h-1.5 bg-dark rounded-full shrink-0"></div>
                                            <div>
                                              <span className="text-dark font-medium block leading-tight">{item.nama_barang}</span>
                                              <span className="text-neutral-text text-xs">Qty: {item.jumlah}</span>
                                            </div>
                                          </div>
                                          <span className="text-dark font-semibold whitespace-nowrap">
                                            {item.harga_satuan > 0
                                              ? `Rp ${(item.harga_satuan * item.jumlah).toLocaleString('id-ID')}`
                                              : '-'
                                            }
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                    
                                    <div className="mt-4 pt-3 border-t border-dashed border-border flex justify-between text-sm">
                                      <span className="text-neutral-text font-medium">Subtotal Item</span>
                                      <span className="font-bold text-dark">
                                        Rp {order.barangTerbeli.reduce((sum, item) => 
                                          sum + (item.harga_satuan * item.jumlah), 0
                                        ).toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-light-gray rounded-xl p-4 border border-border/50 text-center">
                                    <p className="text-sm text-neutral-text italic font-medium">
                                      Menunggu input rincian dari admin.
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Right Col: File, Notes & Final Total */}
                              <div className="space-y-6 flex flex-col">
                                
                                {/* File Uploaded */}
                                {order.nama_file && (
                                  <div>
                                    <h4 className="text-xs font-bold text-dark uppercase tracking-widest mb-3 flex items-center gap-2">
                                      <Icon icon="solar:document-linear" className="text-lg" />
                                      Dokumen Terlampir
                                    </h4>
                                    <a
                                      href={`${API_BASE_URL}/uploads/${order.nama_file}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="group flex items-center justify-between p-3 rounded-xl border border-border hover:border-dark hover:shadow-sm transition-all"
                                    >
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                                          <Icon icon="solar:file-download-bold" className="text-lg" />
                                        </div>
                                        <span className="text-sm text-dark font-medium truncate">{order.nama_file}</span>
                                      </div>
                                      <Icon icon="solar:arrow-right-up-linear" className="text-neutral-light group-hover:text-dark shrink-0 transition-colors" />
                                    </a>
                                  </div>
                                )}

                                {/* Notes */}
                                <div>
                                  <h4 className="text-xs font-bold text-dark uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Icon icon="solar:pen-linear" className="text-lg" />
                                    Catatan
                                  </h4>
                                  <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-xl text-sm text-dark font-medium italic">
                                    "{order.catatan_pesanan || 'Tidak ada instruksi tambahan.'}"
                                  </div>
                                </div>

                                {/* Total Banner (Pushed to bottom) */}
                                <div className="mt-auto pt-6 flex items-center justify-between bg-dark p-5 rounded-xl shadow-md">
                                  <div>
                                    <span className="text-xs text-white/60 font-bold uppercase tracking-wider block mb-1">Total Biaya</span>
                                    <span className="text-[10px] text-white/40 leading-none">Termasuk biaya admin</span>
                                  </div>
                                  <div className="text-right">
                                    {order.nilai_pesanan > 0 ? (
                                      <span className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
                                        Rp {order.nilai_pesanan.toLocaleString('id-ID')}
                                      </span>
                                    ) : (
                                      <span className="bg-white/20 text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider">
                                        Menunggu Hitung
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}