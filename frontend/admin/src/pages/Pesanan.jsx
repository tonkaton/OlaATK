import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/constants'
import { ordersAPI, servicesAPI, productsAPI } from '../services/api'
import { cn } from '@/lib/utils'
import {
  PlusCircle, List, FileText, ChevronDown, ChevronUp, CheckCircle,
  RefreshCw, Calculator, ShoppingCart, Trash2, Search
} from 'lucide-react'

const StatusBadge = ({ status }) => {
  const config = {
    'MENUNGGU': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    'DIPROSES': 'bg-olaBlue/10 text-olaBlue border-olaBlue/20',
    'SELESAI':  'bg-olaTosca/10 text-olaTosca border-olaTosca/20',
    'BATAL':    'bg-destructive/10 text-destructive border-destructive/20',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border', config[status] || 'bg-muted text-muted-foreground border-border')}>
      {status}
    </span>
  )
}

const PaymentBadge = ({ status }) => {
  if (!status) return null
  const config = {
    'pending':    { cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Pending' },
    'settlement': { cls: 'bg-olaTosca/10 text-olaTosca border-olaTosca/20',       label: 'Lunas' },
    'cancel':     { cls: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Cancel' },
    'deny':       { cls: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Ditolak' },
    'expire':     { cls: 'bg-muted text-muted-foreground border-border',            label: 'Expire' },
  }
  const c = config[status] || { cls: 'bg-muted text-muted-foreground border-border', label: status }
  return <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border', c.cls)}>{c.label}</span>
}

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 focus:border-olaTosca/60 transition"
const selectClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 transition"

export default function Pesanan({ dark }) {
  const [activeTab, setActiveTab] = useState('list')

  // --- STATE LIST ---
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  // --- STATE KASIR ---
  const [services, setServices] = useState([])
  const [priceList, setPriceList] = useState(null)
  const [offlineForm, setOfflineForm] = useState({ name: '', phone: '', service: null, notes: '' })
  const [offlineDetails, setOfflineDetails] = useState({
    copies: 1, totalPages: 1, paperSize: 'A4',
    colorMode: 'Hitam Putih', bindingType: 'Tidak Ada', bwPages: 0, colorPages: 0
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [serviceError, setServiceError] = useState('')

  // --- STATE JUAL PRODUK ---
  const [products, setProducts] = useState([])
  const [produkDropdownOpen, setProdukDropdownOpen] = useState(false)
  const [produkSearch, setProdukSearch] = useState('')
  const [cart, setCart] = useState([])
  const [produkForm, setProdukForm] = useState({ name: '', phone: '' })
  const [produkSubmitLoading, setProdukSubmitLoading] = useState(false)
  const [produkSuccess, setProdukSuccess] = useState('')

  useEffect(() => {
    fetchOrders()
    if (activeTab === 'input') { fetchServices(); fetchPrices() }
    if (activeTab === 'produk') { fetchProducts() }
    let interval
    if (activeTab === 'list') interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [page, search, activeTab])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await ordersAPI.getAll(page, search)
      setOrders(res.pesanan || res.data?.pesanan || [])
      setPagination(res.pagination || res.data?.pagination || { total: 0, totalPages: 0, limit: 10 })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchServices = async () => {
    try {
      const res = await servicesAPI.getAll()
      const all = res.dataLayanan || res.data?.dataLayanan || []
      const active = all.filter(s => s.status_layanan === true || s.status_layanan === 1 || s.status_layanan === '1')
      setServices(active)
      setServiceError(active.length === 0 ? 'Tidak ada layanan aktif.' : '')
    } catch { setServiceError('Gagal memuat layanan.') }
  }

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/konfigurasi/public`)
      const json = await res.json()
      if (json.success) setPriceList(json.data)
    } catch (e) { console.error(e) }
  }

  const fetchProducts = async () => {
    try {
      const data = await productsAPI.getAllForDropdown()
      setProducts(Array.isArray(data) ? data.filter(p => p.jumlah_stok > 0) : [])
    } catch (e) { console.error(e) }
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) {
        if (existing.jumlah >= product.jumlah_stok) { alert(`Stok ${product.nama} hanya ${product.jumlah_stok}`); return prev }
        return prev.map(c => c.product.id === product.id ? { ...c, jumlah: c.jumlah + 1 } : c)
      }
      return [...prev, { product, jumlah: 1 }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.product.id !== id))

  const updateCartQty = (productId, jumlah) => {
    const product = products.find(p => p.id === productId)
    if (jumlah > product?.jumlah_stok) { alert(`Stok hanya ${product.jumlah_stok}`); return }
    if (jumlah <= 0) { removeFromCart(productId); return }
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, jumlah } : c))
  }

  const totalCart = cart.reduce((sum, c) => sum + c.product.harga_satuan * c.jumlah, 0)

  const hitungTotal = () => {
    if (!priceList || !offlineForm.service) return 0
    const copies = parseInt(offlineDetails.copies) || 1
    const nama = offlineForm.service.nama.toLowerCase()
    const isCetak = nama.includes('cetak') || nama.includes('print')
    const isFotokopi = nama.includes('fotokopi') || nama.includes('fotocopy')
    const isLaminating = nama.includes('laminating')
    const isScan = nama.includes('scan')
    const isJilid = nama.includes('jilid') && !isCetak
    let totalPerBundel = 0
    const kertas = offlineDetails.paperSize.toLowerCase()
    if (isCetak) {
      const hargaBw = parseInt(priceList[`harga_cetak_${kertas}_bw`]) || 0
      const hargaWarna = parseInt(priceList[`harga_cetak_${kertas}_color`]) || 0
      if (offlineDetails.colorMode === 'Hitam Putih') totalPerBundel += (parseInt(offlineDetails.totalPages) || 0) * hargaBw
      else if (offlineDetails.colorMode === 'Berwarna') totalPerBundel += (parseInt(offlineDetails.totalPages) || 0) * hargaWarna
      else if (offlineDetails.colorMode === 'Campur') {
        totalPerBundel += (parseInt(offlineDetails.bwPages) || 0) * hargaBw
        totalPerBundel += (parseInt(offlineDetails.colorPages) || 0) * hargaWarna
      }
      if (offlineDetails.bindingType !== 'Tidak Ada') {
        const type = offlineDetails.bindingType.toLowerCase().split(' ')[0]
        totalPerBundel += parseInt(priceList[`harga_jilid_${type}`]) || 0
      }
    } else if (isFotokopi) {
      const hargaBw = parseInt(priceList[`harga_fotokopi_${kertas}`]) || 0
      const hargaWarna = parseInt(priceList[`harga_fotokopi_${kertas}_color`]) || 0
      totalPerBundel = (parseInt(offlineDetails.totalPages) || 0) * (offlineDetails.colorMode === 'Berwarna' ? hargaWarna : hargaBw)
    } else if (isLaminating) {
      totalPerBundel = (parseInt(offlineDetails.totalPages) || 0) * (parseInt(priceList[`harga_laminating_${kertas}`]) || 0)
    } else if (isScan) {
      totalPerBundel = (parseInt(offlineDetails.totalPages) || 0) * (parseInt(priceList['harga_scan']) || 0)
    } else if (isJilid) {
      const type = offlineDetails.bindingType.toLowerCase().split(' ')[0]
      totalPerBundel = parseInt(priceList[`harga_jilid_${type}`]) || 0
    }
    return totalPerBundel * copies
  }

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Ubah status ke ${newStatus}?`)) return
    try {
      const res = await ordersAPI.updateStatus(orderId, newStatus)
      if (res.success) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch { alert('Gagal update status') }
  }

  const handleOfflineSubmit = async (e) => {
    e.preventDefault()
    if (!offlineForm.name || !offlineForm.service) return alert("Wajib isi Nama & Layanan")
    if (offlineDetails.colorMode === 'Campur' && offlineDetails.bwPages <= 0 && offlineDetails.colorPages <= 0)
      return alert("Isi jumlah halaman Hitam Putih atau Berwarna!")
    setSubmitLoading(true)
    try {
      const items = []
      const copies = parseInt(offlineDetails.copies)
      const kertas = offlineDetails.paperSize.toLowerCase()
      const nama = offlineForm.service.nama.toLowerCase()
      const isCetak = nama.includes('cetak') || nama.includes('print')
      const isFotokopi = nama.includes('fotokopi') || nama.includes('fotocopy')
      const isLaminating = nama.includes('laminating')
      const isScan = nama.includes('scan')
      const isJilid = nama.includes('jilid') && !isCetak
      if (isCetak) {
        const hargaBw = parseInt(priceList?.[`harga_cetak_${kertas}_bw`]) || 0
        const hargaWarna = parseInt(priceList?.[`harga_cetak_${kertas}_color`]) || 0
        if (offlineDetails.colorMode === 'Campur') {
          if (offlineDetails.bwPages > 0) items.push({ nama_barang: `${offlineForm.service.nama} - ${offlineDetails.paperSize} (Hitam Putih)`, harga_satuan: hargaBw, jumlah: parseInt(offlineDetails.bwPages) * copies })
          if (offlineDetails.colorPages > 0) items.push({ nama_barang: `${offlineForm.service.nama} - ${offlineDetails.paperSize} (Berwarna)`, harga_satuan: hargaWarna, jumlah: parseInt(offlineDetails.colorPages) * copies })
        } else {
          items.push({ nama_barang: `${offlineForm.service.nama} - ${offlineDetails.paperSize} (${offlineDetails.colorMode})`, harga_satuan: offlineDetails.colorMode === 'Berwarna' ? hargaWarna : hargaBw, jumlah: (parseInt(offlineDetails.totalPages) || 1) * copies })
        }
        if (offlineDetails.bindingType !== 'Tidak Ada') {
          const type = offlineDetails.bindingType.toLowerCase().split(' ')[0]
          items.push({ nama_barang: `Jilid ${offlineDetails.bindingType}`, harga_satuan: parseInt(priceList?.[`harga_jilid_${type}`]) || 0, jumlah: copies })
        }
      } else if (isFotokopi) {
        const hargaBw = parseInt(priceList?.[`harga_fotokopi_${kertas}`]) || 0
        const hargaWarna = parseInt(priceList?.[`harga_fotokopi_${kertas}_color`]) || 0
        items.push({ nama_barang: `Fotokopi ${offlineDetails.paperSize} (${offlineDetails.colorMode})`, harga_satuan: offlineDetails.colorMode === 'Berwarna' ? hargaWarna : hargaBw, jumlah: (parseInt(offlineDetails.totalPages) || 1) * copies })
      } else if (isLaminating) {
        items.push({ nama_barang: `Laminating ${offlineDetails.paperSize}`, harga_satuan: parseInt(priceList?.[`harga_laminating_${kertas}`]) || 0, jumlah: (parseInt(offlineDetails.totalPages) || 1) * copies })
      } else if (isScan) {
        items.push({ nama_barang: `Scan`, harga_satuan: parseInt(priceList?.['harga_scan']) || 0, jumlah: (parseInt(offlineDetails.totalPages) || 1) * copies })
      } else if (isJilid) {
        const type = offlineDetails.bindingType.toLowerCase().split(' ')[0]
        items.push({ nama_barang: `Jilid ${offlineDetails.bindingType}`, harga_satuan: parseInt(priceList?.[`harga_jilid_${type}`]) || 0, jumlah: copies })
      }
      const res = await ordersAPI.createPublic({ nama_lengkap: offlineForm.name, nomor_telepon: offlineForm.phone || '-', alamat: '-', jenis_layanan: offlineForm.service.nama, mode_pesanan: 'OFFLINE', items, catatan_pesanan: offlineForm.notes, nilai_pesanan: hitungTotal() })
      if (res.success) {
        setSubmitSuccess('Pesanan Berhasil Disimpan!')
        setTimeout(() => setSubmitSuccess(''), 3000)
        setOfflineForm({ name: '', phone: '', service: null, notes: '' })
        setOfflineDetails({ copies: 1, totalPages: 1, paperSize: 'A4', colorMode: 'Hitam Putih', bindingType: 'Tidak Ada', bwPages: 0, colorPages: 0 })
        fetchOrders(); setActiveTab('list')
      }
    } catch (err) { alert('Gagal: ' + (err.message || 'Error')) }
    finally { setSubmitLoading(false) }
  }

  const handleJualProdukSubmit = async (e) => {
    e.preventDefault()
    if (!produkForm.name) return alert("Wajib isi Nama Pembeli")
    if (cart.length === 0) return alert("Pilih minimal 1 produk")
    setProdukSubmitLoading(true)
    try {
      const res = await ordersAPI.createPublic({
        nama_lengkap: produkForm.name, nomor_telepon: produkForm.phone || '-', alamat: '-',
        jenis_layanan: 'Penjualan Produk', mode_pesanan: 'OFFLINE',
        items: cart.map(c => ({ stok_barang_id: c.product.id, nama_barang: c.product.nama, harga_satuan: c.product.harga_satuan, jumlah: c.jumlah })),
        nilai_pesanan: totalCart,
      })
      if (res.success) {
        setProdukSuccess('Penjualan Berhasil!')
        setTimeout(() => setProdukSuccess(''), 3000)
        setCart([]); setProdukForm({ name: '', phone: '' })
        fetchOrders(); fetchProducts(); setActiveTab('list')
      } else { alert(res.message || 'Gagal') }
    } catch (err) { alert('Error: ' + (err.message || 'Unknown')) }
    finally { setProdukSubmitLoading(false) }
  }

  const isCetakService = offlineForm.service?.nama.toLowerCase().includes('cetak') || offlineForm.service?.nama.toLowerCase().includes('print')
  const isFotokopiService = offlineForm.service?.nama.toLowerCase().includes('fotokopi') || offlineForm.service?.nama.toLowerCase().includes('fotocopy')
  const isLaminatingService = offlineForm.service?.nama.toLowerCase().includes('laminating')
  const isScanService = offlineForm.service?.nama.toLowerCase().includes('scan')
  const isJilidService = offlineForm.service?.nama.toLowerCase().includes('jilid') && !isCetakService

  const tabs = [
    { key: 'list',   label: 'Daftar Pesanan', icon: List },
    { key: 'input',  label: 'Kasir',          icon: PlusCircle },
    { key: 'produk', label: 'Jual Produk',     icon: ShoppingCart },
  ]

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/30 p-1 rounded-xl w-fit border border-border">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
                activeTab === t.key
                  ? 'bg-card text-foreground shadow border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* === TAB 1: LIST === */}
      {activeTab === 'list' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Cari pesanan..." className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 transition" />
            </div>
            <button onClick={fetchOrders} className="p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition">
              <RefreshCw size={15} />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Belum ada pesanan.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["ID", "Pelanggan", "Layanan", "File", "Total", "Pembayaran", "Status", "Aksi"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <React.Fragment key={o.id}>
                        <tr className={cn('border-b border-border hover:bg-muted/20 transition', expandedOrderId === o.id && 'bg-muted/30')}>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{o.id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground truncate max-w-[120px]">{o.pelanggan?.nama_lengkap}</span>
                              <span className={cn('text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0', o.mode_pesanan === 'ONLINE' ? 'bg-startupPurple/10 text-startupPurple border-startupPurple/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20')}>
                                {o.mode_pesanan}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{o.pelanggan?.nomor_telepon}</div>
                          </td>
                          <td className="px-4 py-3 text-olaTosca font-medium text-xs">{o.jenis_layanan}</td>
                          <td className="px-4 py-3">
                            {o.nama_file
                              ? <a href={`${API_BASE_URL}/uploads/${o.nama_file}`} target="_blank" rel="noreferrer" className="text-olaBlue hover:underline flex items-center gap-1 text-xs"><FileText size={12}/> File</a>
                              : <span className="text-xs text-muted-foreground">-</span>
                            }
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground text-xs">Rp {o.nilai_pesanan?.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3">
                            {o.mode_pesanan === 'ONLINE' ? <PaymentBadge status={o.payment_status} /> : <span className="text-xs text-muted-foreground">-</span>}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 justify-between">
                              <select value={o.status} onChange={e => handleStatusChange(o.id, e.target.value)} className="text-xs px-2 py-1 bg-background border border-border rounded-lg text-foreground cursor-pointer focus:outline-none">
                                <option value="MENUNGGU">MENUNGGU</option>
                                <option value="DIPROSES">DIPROSES</option>
                                <option value="SELESAI">SELESAI</option>
                                <option value="BATAL">BATAL</option>
                              </select>
                              <button onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)} className="p-1 rounded hover:bg-accent text-muted-foreground transition flex-shrink-0">
                                {expandedOrderId === o.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedOrderId === o.id && (
                          <tr className="bg-muted/10 border-b border-border">
                            <td colSpan="8" className="px-4 py-4 pl-10">
                              <div className="bg-card border border-border rounded-xl p-4 max-w-2xl text-sm">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Rincian Pesanan</h4>
                                {o.barangTerbeli?.length > 0 ? (
                                  <>
                                    <ul className="space-y-2 mb-3">
                                      {o.barangTerbeli.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center border-b border-dashed border-border last:border-0 pb-2 last:pb-0">
                                          <span className="text-foreground">{item.nama_barang} <span className="text-muted-foreground">×{item.jumlah}</span></span>
                                          <span className="font-medium text-foreground text-xs">
                                            {item.harga_satuan > 0 ? `Rp ${(item.harga_satuan * item.jumlah).toLocaleString('id-ID')}` : '-'}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                    <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                                      <span>Subtotal</span>
                                      <span className="font-bold text-foreground">Rp {o.barangTerbeli.reduce((s, i) => s + i.harga_satuan * i.jumlah, 0).toLocaleString('id-ID')}</span>
                                    </div>
                                  </>
                                ) : <p className="text-xs text-muted-foreground">Tidak ada rincian.</p>}
                                {o.catatan_pesanan && (
                                  <div className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">
                                    Catatan: "{o.catatan_pesanan}"
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Halaman {page} dari {pagination.totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition">← Prev</button>
                    <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition">Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === TAB 2: KASIR === */}
      {activeTab === 'input' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-6">
            {submitSuccess && (
              <div className="mb-4 p-3 bg-olaTosca/10 border border-olaTosca/20 rounded-lg text-olaTosca text-sm flex items-center gap-2">
                <CheckCircle size={16}/> {submitSuccess}
              </div>
            )}
            <form onSubmit={handleOfflineSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Pelanggan</label>
                  <input required type="text" value={offlineForm.name} onChange={e => setOfflineForm({...offlineForm, name: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">No. HP</label>
                  <input type="text" value={offlineForm.phone} onChange={e => setOfflineForm({...offlineForm, phone: e.target.value})} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Pilih Layanan</label>
                {services.length === 0 ? <p className="text-sm text-muted-foreground">Memuat...</p> : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {services.map(srv => (
                      <div key={srv.id} onClick={() => setOfflineForm({...offlineForm, service: srv})}
                        className={cn('cursor-pointer border p-2.5 text-center rounded-lg text-xs font-medium transition',
                          offlineForm.service?.id === srv.id
                            ? 'bg-olaTosca text-white border-olaTosca'
                            : 'border-border text-muted-foreground hover:border-olaTosca/50 hover:text-foreground'
                        )}>
                        {srv.nama}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {offlineForm.service && (
                <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Detail {offlineForm.service.nama}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jumlah Rangkap</label>
                      <input type="number" min="1" value={offlineDetails.copies} onChange={e => setOfflineDetails({...offlineDetails, copies: e.target.value})} className={inputClass} />
                    </div>
                    {(isCetakService || isFotokopiService || isLaminatingService || isScanService) && offlineDetails.colorMode !== 'Campur' && (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          {isScanService || isLaminatingService ? 'Total Lembar' : 'Total Halaman'}
                        </label>
                        <input type="number" min="1" value={offlineDetails.totalPages} onChange={e => setOfflineDetails({...offlineDetails, totalPages: e.target.value})} className={inputClass} />
                      </div>
                    )}
                    {(isCetakService || isFotokopiService || isLaminatingService) && (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ukuran Kertas</label>
                        <select value={offlineDetails.paperSize} onChange={e => setOfflineDetails({...offlineDetails, paperSize: e.target.value})} className={selectClass}>
                          <option>A4</option><option>F4</option>
                        </select>
                      </div>
                    )}
                    {(isCetakService || isFotokopiService) && (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Warna</label>
                        <select value={offlineDetails.colorMode} onChange={e => setOfflineDetails({...offlineDetails, colorMode: e.target.value})} className={selectClass}>
                          <option>Hitam Putih</option>
                          <option>Berwarna</option>
                          {isCetakService && <option value="Campur">Campur (Custom)</option>}
                        </select>
                      </div>
                    )}
                    {isCetakService && (
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jilid Sekalian?</label>
                        <select value={offlineDetails.bindingType} onChange={e => setOfflineDetails({...offlineDetails, bindingType: e.target.value})} className={cn(selectClass, 'w-auto min-w-[200px]')}>
                          <option>Tidak Ada</option><option>Lakban Biasa</option><option>Softcover</option><option>Hardcover</option><option>Spiral</option>
                        </select>
                      </div>
                    )}
                    {isJilidService && (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jenis Jilid</label>
                        <select value={offlineDetails.bindingType} onChange={e => setOfflineDetails({...offlineDetails, bindingType: e.target.value})} className={selectClass}>
                          <option value="Lakban Biasa">Lakban Biasa</option>
                          <option value="Softcover">Softcover</option>
                          <option value="Hardcover">Hardcover (Skripsi)</option>
                          <option value="Spiral">Spiral Kawat</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {isCetakService && offlineDetails.colorMode === 'Campur' && (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-orange-600">
                        <Calculator size={13}/> Detail Halaman per Buku
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1.5">Hal. Hitam Putih</label>
                          <input type="number" min="0" value={offlineDetails.bwPages} onChange={e => setOfflineDetails({...offlineDetails, bwPages: e.target.value})} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1.5">Hal. Berwarna</label>
                          <input type="number" min="0" value={offlineDetails.colorPages} onChange={e => setOfflineDetails({...offlineDetails, colorPages: e.target.value})} className={inputClass} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Estimasi Total</span>
                    <span className="text-2xl font-black text-olaTosca">Rp {hitungTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan</label>
                <textarea rows="2" value={offlineForm.notes} onChange={e => setOfflineForm({...offlineForm, notes: e.target.value})} placeholder="Catatan tambahan..." className={inputClass} />
              </div>

              <button type="submit" disabled={submitLoading || !offlineForm.service} className="w-full py-3 bg-olaTosca hover:bg-olaTosca/90 text-white font-semibold rounded-xl transition disabled:opacity-50">
                {submitLoading ? 'Menyimpan...' : 'Simpan ke Kasir'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* === TAB 3: JUAL PRODUK === */}
      {activeTab === 'produk' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-6">
            {produkSuccess && (
              <div className="mb-4 p-3 bg-olaTosca/10 border border-olaTosca/20 rounded-lg text-olaTosca text-sm flex items-center gap-2">
                <CheckCircle size={16}/> {produkSuccess}
              </div>
            )}
            <form onSubmit={handleJualProdukSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Pembeli</label>
                  <input required type="text" value={produkForm.name} onChange={e => setProdukForm({...produkForm, name: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">No. HP</label>
                  <input type="text" value={produkForm.phone} onChange={e => setProdukForm({...produkForm, phone: e.target.value})} className={inputClass} />
                </div>
              </div>

              {/* Dropdown produk */}
              <div className="relative">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pilih Produk</label>
                <button type="button" onClick={() => setProdukDropdownOpen(!produkDropdownOpen)}
                  className={cn(inputClass, 'flex justify-between items-center text-left')}>
                  <span className="text-muted-foreground">Klik untuk pilih produk...</span>
                  <ChevronDown size={14} className={cn('transition', produkDropdownOpen && 'rotate-180')} />
                </button>
                {produkDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => { setProdukDropdownOpen(false); setProdukSearch('') }} />
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                      <input autoFocus type="text" placeholder="Cari produk..." value={produkSearch} onChange={e => setProdukSearch(e.target.value)}
                        className="w-full px-3 py-2.5 border-b border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                      <div className="max-h-56 overflow-y-auto">
                        {products.filter(p => p.nama.toLowerCase().includes(produkSearch.toLowerCase())).length === 0
                          ? <div className="p-4 text-center text-sm text-muted-foreground">Tidak ditemukan</div>
                          : products.filter(p => p.nama.toLowerCase().includes(produkSearch.toLowerCase())).map(p => (
                            <button key={p.id} type="button" onClick={() => { addToCart(p); setProdukDropdownOpen(false); setProdukSearch('') }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent flex justify-between items-center border-b border-border last:border-0 transition">
                              <div>
                                <div className="font-medium text-foreground">{p.nama}</div>
                                <div className="text-xs text-muted-foreground">Rp {p.harga_satuan.toLocaleString('id-ID')}</div>
                              </div>
                              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', p.jumlah_stok > 5 ? 'bg-olaTosca/10 text-olaTosca' : 'bg-orange-500/10 text-orange-600')}>
                                {p.jumlah_stok}
                              </span>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <div className="bg-muted/20 border border-border rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Keranjang ({cart.length})</h4>
                  <div className="space-y-2">
                    {cart.map(c => (
                      <div key={c.product.id} className="flex items-center gap-3">
                        <span className="text-sm text-foreground flex-1 truncate">{c.product.nama}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => updateCartQty(c.product.id, c.jumlah - 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-accent text-foreground text-xs transition">-</button>
                          <span className="w-7 text-center text-sm font-semibold text-foreground">{c.jumlah}</span>
                          <button type="button" onClick={() => updateCartQty(c.product.id, c.jumlah + 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-accent text-foreground text-xs transition">+</button>
                        </div>
                        <span className="text-xs font-medium text-foreground w-20 text-right">Rp {(c.product.harga_satuan * c.jumlah).toLocaleString('id-ID')}</span>
                        <button type="button" onClick={() => removeFromCart(c.product.id)} className="text-destructive hover:text-destructive/80 transition"><Trash2 size={13}/></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="text-2xl font-black text-olaTosca">Rp {totalCart.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={produkSubmitLoading || cart.length === 0} className="w-full py-3 bg-olaTosca hover:bg-olaTosca/90 text-white font-semibold rounded-xl transition disabled:opacity-50">
                {produkSubmitLoading ? 'Menyimpan...' : 'Selesaikan Penjualan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}