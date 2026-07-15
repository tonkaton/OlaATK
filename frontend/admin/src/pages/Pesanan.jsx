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
    'expire':     { cls: 'bg-muted text-muted-foreground border-border',             label: 'Expire' },
  }
  const c = config[status] || { cls: 'bg-muted text-muted-foreground border-border', label: status }
  return <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border', c.cls)}>{c.label}</span>
}

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 focus:border-olaTosca/60 transition"
const selectClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 transition"

const FILTERS = {
  '':              {},
  'AMBIL':         { pengiriman: 'AMBIL' },
  'DIANTAR':       { pengiriman: 'DIANTAR' },
  'ONLINE':        { mode: 'ONLINE' },
  'OFFLINE':       { mode: 'OFFLINE' },
  'MENUNGGU':      { status: 'MENUNGGU' },
  'DIPROSES':      { status: 'DIPROSES' },
  'SELESAI':       { status: 'SELESAI' },
  'BATAL':         { status: 'BATAL' },
  'PPENDING':      { payment_status: 'pending' },
  'PSETTLEMENT':   { payment_status: 'settlement' },
  'PCANCEL':       { payment_status: 'cancel' },
  'PEXPIRE':       { payment_status: 'expire' },
  'PRODUK':        { jenis: 'produk' },
  'LAYANAN':       { jenis: 'layanan' },
}

const FILTER_LABELS = {
  '': 'Semua',
  'AMBIL': 'Ambil di Toko',
  'DIANTAR': 'Diantar',
  'ONLINE': 'Online',
  'OFFLINE': 'Offline',
  'MENUNGGU': 'Menunggu',
  'DIPROSES': 'Diproses',
  'SELESAI': 'Selesai',
  'BATAL': 'Batal',
  'PPENDING': 'Payment: Pending',
  'PSETTLEMENT': 'Payment: Lunas',
  'PCANCEL': 'Payment: Ditolak',
  'PEXPIRE': 'Payment: Expire',
  'PRODUK': 'Produk',
  'LAYANAN': 'Layanan',
}

const FILTER_ICONS = {
  '': '\u2205',
  'AMBIL': '\uD83C\uDFEA',
  'DIANTAR': '\uD83D\uDE9A',
  'ONLINE': '\uD83C\uDF10',
  'OFFLINE': '\uD83C\uDFED',
  'MENUNGGU': '\u23F3',
  'DIPROSES': '\uD83D\uDD27',
  'SELESAI': '\u2705',
  'BATAL': '\u274C',
  'PPENDING': '\uD83D\uDCB3',
  'PSETTLEMENT': '\uD83D\uDCB0',
  'PCANCEL': '\uD83D\uDEAB',
  'PEXPIRE': '\u23F0',
  'PRODUK': '\uD83D\uDCE6',
  'LAYANAN': '\uD83D\uDDA8\uFE0F',
}

export default function Pesanan({ dark }) {
  const [activeTab, setActiveTab] = useState('list')

  // --- STATE LIST ---
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [filterKey, setFilterKey] = useState("")
  const [editingOngkir, setEditingOngkir] = useState(null) // order id being edited
  const [ongkirValue, setOngkirValue] = useState("")
  const [editingPaymentStatus, setEditingPaymentStatus] = useState(null)
  const [paymentStatusValue, setPaymentStatusValue] = useState("")

  // --- STATE KASIR ---
  const [services, setServices] = useState([])
  const [priceList, setPriceList] = useState(null)
  const [offlineForm, setOfflineForm] = useState({ name: '', phone: '', service: null, notes: '' })
  const [offlineDetails, setOfflineDetails] = useState({
    copies: 1, totalPages: 1, paperSize: 'A4',
    colorMode: 'Hitam Putih', bindingType: 'Tidak Ada', bwPages: 0, colorPages: 0,
    sisi_cetak: 'SATU_SISI',
    gramasi: '80gr'
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [serviceError, setServiceError] = useState('')
  const [kasirBayar, setKasirBayar] = useState('')

  // --- STATE JUAL PRODUK ---
  const [products, setProducts] = useState([])
  const [produkDropdownOpen, setProdukDropdownOpen] = useState(false)
  const [produkSearch, setProdukSearch] = useState('')
  const [cart, setCart] = useState([])
  const [produkForm, setProdukForm] = useState({ name: '', phone: '' })
  const [produkSubmitLoading, setProdukSubmitLoading] = useState(false)
  const [produkSuccess, setProdukSuccess] = useState('')
  const [produkBayar, setProdukBayar] = useState('')

  useEffect(() => {
    fetchOrders()
    if (activeTab === 'input') { fetchServices(); fetchPrices() }
    if (activeTab === 'produk') { fetchProducts() }
    let interval
    if (activeTab === 'list') interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [page, search, activeTab, filterKey])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const filterParams = FILTERS[filterKey] || {}
      const res = await ordersAPI.getAll({
        page, search, limit: pagination.limit,
        ...filterParams,
      })
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
        const maxStok = effectiveStock(existing.product, existing.satuan_beli)
        if (existing.jumlah >= maxStok) { alert(`Stok ${product.nama} hanya ${maxStok} ${existing.satuan_beli}`); return prev }
        return prev.map(c => c.product.id === product.id ? { ...c, jumlah: c.jumlah + 1 } : c)
      }
      return [...prev, { product, jumlah: 1, satuan_beli: product.satuan || "PCS" }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.product.id !== id))

  const effectiveStock = (product, satuanBeli) => {
    if (satuanBeli !== product.satuan && product.isi_per_satuan) return product.jumlah_stok * product.isi_per_satuan
    return product.jumlah_stok
  }

  const effectivePrice = (product, satuanBeli) => {
    if (satuanBeli !== product.satuan && product.isi_per_satuan) return product.harga_satuan / product.isi_per_satuan
    return product.harga_satuan
  }

  const updateCartSatuan = (productId, newSatuan) => {
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, satuan_beli: newSatuan, jumlah: 1 } : c))
  }

  const updateCartQty = (productId, jumlah) => {
    const item = cart.find(c => c.product.id === productId)
    if (!item) return
    const maxStok = effectiveStock(item.product, item.satuan_beli)
    if (jumlah > maxStok) { alert(`Stok hanya ${maxStok} ${item.satuan_beli}`); return }
    if (jumlah <= 0) { removeFromCart(productId); return }
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, jumlah } : c))
  }

  const totalCart = cart.reduce((sum, c) => sum + effectivePrice(c.product, c.satuan_beli) * c.jumlah, 0)

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
      const gr = offlineDetails.gramasi || '80gr'
      const hargaBw = parseInt(priceList[`harga_cetak_${kertas}_${gr}_bw`]) || parseInt(priceList[`harga_cetak_${kertas}_bw`]) || 0
      const hargaWarna = parseInt(priceList[`harga_cetak_${kertas}_${gr}_color`]) || parseInt(priceList[`harga_cetak_${kertas}_color`]) || 0
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
      const res = await ordersAPI.updateStatus(orderId, { status: newStatus })
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
      const cetakLabel = offlineDetails.sisi_cetak === 'DUA_SISI' ? 'Bolak-Balik' : ''
      const gramasiLabel = offlineDetails.gramasi || '80gr'
      const namaSesi = `${cetakLabel ? `${offlineForm.service.nama} - ${cetakLabel}` : offlineForm.service.nama} ${gramasiLabel}`
      if (isCetak) {
        const gr = offlineDetails.gramasi || '80gr'
        const hargaBw = parseInt(priceList?.[`harga_cetak_${kertas}_${gr}_bw`]) || parseInt(priceList?.[`harga_cetak_${kertas}_bw`]) || 0
        const hargaWarna = parseInt(priceList?.[`harga_cetak_${kertas}_${gr}_color`]) || parseInt(priceList?.[`harga_cetak_${kertas}_color`]) || 0
        if (offlineDetails.colorMode === 'Campur') {
          if (offlineDetails.bwPages > 0) items.push({ nama_barang: `${namaSesi} ${offlineDetails.paperSize} (Hitam Putih)`, harga_satuan: hargaBw, jumlah: parseInt(offlineDetails.bwPages) * copies })
          if (offlineDetails.colorPages > 0) items.push({ nama_barang: `${namaSesi} ${offlineDetails.paperSize} (Berwarna)`, harga_satuan: hargaWarna, jumlah: parseInt(offlineDetails.colorPages) * copies })
        } else {
          items.push({ nama_barang: `${namaSesi} ${offlineDetails.paperSize} (${offlineDetails.colorMode})`, harga_satuan: offlineDetails.colorMode === 'Berwarna' ? hargaWarna : hargaBw, jumlah: (parseInt(offlineDetails.totalPages) || 1) * copies })
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
      const res = await ordersAPI.createPublic({ 
        nama_lengkap: offlineForm.name, 
        nomor_telepon: offlineForm.phone || '-', 
        alamat: '-', 
        jenis_layanan: offlineForm.service.nama, 
        mode_pesanan: 'OFFLINE', 
        items, 
        catatan_pesanan: offlineForm.notes, 
        nilai_pesanan: hitungTotal(),
        uang_diterima: kasirBayar ? parseInt(kasirBayar) : null,
        kembalian: kasirBayar ? parseInt(kasirBayar) - hitungTotal() : null,
        sisi_cetak: offlineDetails.sisi_cetak,
        gramasi: offlineDetails.gramasi,
      })
      if (res.success) {
        setSubmitSuccess('Pesanan Berhasil Disimpan!')
        setTimeout(() => setSubmitSuccess(''), 3000)
        setOfflineForm({ name: '', phone: '', service: null, notes: '' })
        setOfflineDetails({ copies: 1, totalPages: 1, paperSize: 'A4', colorMode: 'Hitam Putih', bindingType: 'Tidak Ada', bwPages: 0, colorPages: 0, sisi_cetak: 'SATU_SISI', gramasi: '80gr', metode_pengiriman: 'AMBIL' })
        setKasirBayar('')
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
        items: cart.map(c => ({
          stok_barang_id: c.product.id,
          nama_barang: c.product.nama,
          harga_satuan: effectivePrice(c.product, c.satuan_beli),
          jumlah: c.jumlah,
          satuan_beli: c.satuan_beli,
        })),
        nilai_pesanan: totalCart,
        uang_diterima: produkBayar ? parseInt(produkBayar) : null,
        kembalian: produkBayar ? parseInt(produkBayar) - totalCart : null,
      })
      if (res.success) {
        setProdukSuccess('Penjualan Berhasil!')
        setTimeout(() => setProdukSuccess(''), 3000)
        setCart([]); setProdukForm({ name: '', phone: '' })
        setProdukBayar('')
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
            <select value={filterKey} onChange={e => { setFilterKey(e.target.value); setPage(1) }} className="text-sm px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none">
              {Object.entries(FILTER_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{FILTER_ICONS[key]} {label}</option>
              ))}
            </select>
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
                      {["ID", "Pelanggan", "Alamat", "Layanan", "File", "Total", "Pembayaran", "Status", "Aksi"].map(h => (
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
                              <span className={cn('text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0', o.metode_pengiriman === 'DIANTAR' ? 'bg-olaBlue/10 text-olaBlue border-olaBlue/20' : 'bg-olaTosca/10 text-olaTosca border-olaTosca/20')}>
                                {o.metode_pengiriman === 'DIANTAR' ? '🚚 Diantar' : '🏪 Ambil'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{o.pelanggan?.nomor_telepon}</div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {o.metode_pengiriman === 'DIANTAR' ? (
                              <span className="text-muted-foreground truncate max-w-[160px] inline-block align-middle" title={o.alamat_pengiriman || ''}>{o.alamat_pengiriman || '-'}</span>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-olaTosca font-medium text-xs">
                            {o.jenis_layanan}
                            {o.sisi_cetak === 'DUA_SISI' && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-olaBlue/10 text-olaBlue border border-olaBlue/20 font-semibold">Bolak-Balik</span>
                            )}
                            {o.gramasi && o.gramasi !== '80gr' && (
                              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 font-semibold">{o.gramasi}</span>
                            )}
                          </td>
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
                             <td colSpan="9" className="px-4 py-4 pl-10">
                               <div className="bg-card border border-border rounded-xl p-4 max-w-2xl text-sm">
                                 <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Rincian Pesanan</h4>
                                 {o.metode_pengiriman === 'DIANTAR' && o.alamat_pengiriman && (
                                   <div className="text-xs text-muted-foreground mb-3 pb-3 border-b border-border">
                                     📍 {o.alamat_pengiriman}
                                   </div>
                                 )}
                                {o.barangTerbeli?.length > 0 ? (
                                  <>
                                    <ul className="space-y-2 mb-3">
                                      {o.barangTerbeli.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center border-b border-dashed border-border last:border-0 pb-2 last:pb-0">
                                          <span className="text-foreground">{item.nama_barang} <span className="text-muted-foreground">×{item.jumlah} {item.satuan_beli || 'PCS'}</span></span>
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
                                    {o.metode_pengiriman === 'DIANTAR' && (
                                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                                        <span className="text-xs text-muted-foreground">Ongkir</span>
                                        {editingOngkir === o.id ? (
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="number"
                                              value={ongkirValue}
                                              onChange={e => setOngkirValue(e.target.value)}
                                              className="w-24 px-2 py-1 text-xs bg-background border border-border rounded"
                                              min="0"
                                            />
                                            <button onClick={async () => {
                                              try {
                                                await ordersAPI.update(o.id, { ongkir: parseInt(ongkirValue) || 0 })
                                                setEditingOngkir(null)
                                                fetchOrders()
                                              } catch { alert('Gagal update ongkir') }
                                            }} className="text-xs px-2 py-1 bg-olaTosca text-white rounded font-medium">Simpan</button>
                                            <button onClick={() => setEditingOngkir(null)} className="text-xs px-2 py-1 border border-border rounded text-muted-foreground">Batal</button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground">{o.ongkir ? `Rp ${o.ongkir.toLocaleString('id-ID')}` : '-'}</span>
                                            <button onClick={() => { setEditingOngkir(o.id); setOngkirValue(o.ongkir?.toString() || '0') }} className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground transition">Edit</button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <div className="flex justify-between text-xs font-semibold pt-2 mt-2 border-t border-border">
                                      <span>Total</span>
                                      <span className="font-bold text-foreground">Rp {(o.barangTerbeli.reduce((s, i) => s + i.harga_satuan * i.jumlah, 0) + (o.ongkir || 0)).toLocaleString('id-ID')}</span>
                                    </div>
                                  </>
                                ) : <p className="text-xs text-muted-foreground">Tidak ada rincian.</p>}
                                {o.catatan_pesanan && (
                                  <div className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">
                                    Catatan: "{o.catatan_pesanan}"
                                  </div>
                                )}
                                {o.mode_pesanan === 'ONLINE' && (
                                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                                    <span className="text-xs text-muted-foreground">Status Bayar</span>
                                    {editingPaymentStatus === o.id ? (
                                      <div className="flex items-center gap-2">
                                        <select value={paymentStatusValue} onChange={e => setPaymentStatusValue(e.target.value)} className="text-xs px-2 py-1 bg-background border border-border rounded">
                                          <option value="pending">Pending</option>
                                          <option value="settlement">Lunas</option>
                                          <option value="cancel">Cancel</option>
                                          <option value="expire">Expire</option>
                                        </select>
                                        <button onClick={async () => {
                                          try {
                                            await ordersAPI.updateStatus(o.id, { status: o.status, payment_status: paymentStatusValue })
                                            setEditingPaymentStatus(null)
                                            fetchOrders()
                                          } catch { alert('Gagal update status bayar') }
                                        }} className="text-xs px-2 py-1 bg-olaTosca text-white rounded font-medium">Simpan</button>
                                        <button onClick={() => setEditingPaymentStatus(null)} className="text-xs px-2 py-1 border border-border rounded text-muted-foreground">Batal</button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <PaymentBadge status={o.payment_status} />
                                        <button onClick={() => { setEditingPaymentStatus(o.id); setPaymentStatusValue(o.payment_status || 'pending') }} className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground transition">Edit</button>
                                      </div>
                                    )}
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
                    {isCetakService && (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sisi Cetak</label>
                        <select value={offlineDetails.sisi_cetak} onChange={e => setOfflineDetails({...offlineDetails, sisi_cetak: e.target.value})} className={selectClass}>
                          <option value="SATU_SISI">Satu Sisi</option>
                          <option value="DUA_SISI">Dua Sisi (Bolak-Balik)</option>
                        </select>
                      </div>
                    )}
                    {isCetakService && (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Gramasi Kertas</label>
                        <select value={offlineDetails.gramasi} onChange={e => setOfflineDetails({...offlineDetails, gramasi: e.target.value})} className={selectClass}>
                          <option value="70gr">70gr</option>
                          <option value="80gr">80gr</option>
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

                  {/* Patch: Kembalian Kasir */}
                  {hitungTotal() > 0 && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="flex flex-wrap gap-1.5">
                        {[...new Set([hitungTotal(), ...[10000,20000,50000,100000].filter(a => a >= hitungTotal())])].sort((a,b) => a-b).slice(0,4).map(amt => (
                          <button key={amt} type="button" onClick={() => setKasirBayar(String(amt))}
                            className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition',
                              parseInt(kasirBayar) === amt
                                ? 'bg-olaTosca text-white border-olaTosca'
                                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-olaTosca/40'
                            )}>
                            {amt === hitungTotal() ? 'Pas' : `Rp ${(amt/1000).toFixed(0)}k`}
                          </button>
                        ))}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Uang Diterima</label>
                        <input
                          type="text" inputMode="numeric"
                          value={kasirBayar ? `Rp ${parseInt(kasirBayar).toLocaleString('id-ID')}` : ''}
                          onChange={e => setKasirBayar(e.target.value.replace(/\D/g, ''))}
                          placeholder="Rp 0" className={inputClass}
                        />
                      </div>
                      {kasirBayar && (
                        <div className={cn('flex justify-between items-center rounded-lg px-3 py-2.5',
                          parseInt(kasirBayar) < hitungTotal()
                            ? 'bg-destructive/10 border border-destructive/20'
                            : 'bg-olaTosca/10 border border-olaTosca/20'
                        )}>
                          <span className="text-xs font-semibold text-muted-foreground">Kembalian</span>
                          <span className={cn('text-lg font-black',
                            parseInt(kasirBayar) < hitungTotal() ? 'text-destructive' : 'text-olaTosca'
                          )}>
                            Rp {Math.abs(parseInt(kasirBayar) - hitungTotal()).toLocaleString('id-ID')}
                            {parseInt(kasirBayar) < hitungTotal() && ' (kurang)'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
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
                                <div className="text-xs text-muted-foreground">
                                  Rp {p.harga_satuan.toLocaleString('id-ID')}/{p.satuan || "PCS"}
                                  {p.isi_per_satuan ? ` (${p.isi_per_satuan} pc/unit)` : ''}
                                </div>
                              </div>
                              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', p.jumlah_stok > 5 ? 'bg-olaTosca/10 text-olaTosca' : 'bg-orange-500/10 text-orange-600')}>
                                {p.jumlah_stok} {p.satuan || "PCS"}
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
                  <div className="space-y-3">
                    {cart.map(c => {
                      const price = effectivePrice(c.product, c.satuan_beli)
                      const productSatuan = c.product.satuan || "PCS"
                      return (
                        <div key={c.product.id} className="bg-card border border-border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-foreground flex-1 truncate font-medium">{c.product.nama}</span>
                            <button type="button" onClick={() => removeFromCart(c.product.id)} className="text-destructive hover:text-destructive/80 transition flex-shrink-0"><Trash2 size={13}/></button>
                          </div>
                          {c.product.isi_per_satuan ? (
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-[11px] text-muted-foreground">Satuan:</span>
                              <div className="flex bg-muted/40 border border-border rounded-lg overflow-hidden">
                                {["PCS", productSatuan].filter((v,i,a) => a.indexOf(v)===i).map(sat => (
                                  <button key={sat} type="button" onClick={() => updateCartSatuan(c.product.id, sat)}
                                    className={cn('px-2.5 py-1 text-[11px] font-medium transition',
                                      c.satuan_beli === sat ? 'bg-olaTosca text-white' : 'text-muted-foreground hover:text-foreground'
                                    )}>
                                    {sat} {sat !== productSatuan && c.product.isi_per_satuan ? `(@${c.product.isi_per_satuan}pc)` : ''}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground mb-2">Satuan: {productSatuan}</div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => updateCartQty(c.product.id, c.jumlah - 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-accent text-foreground text-xs transition">-</button>
                              <span className="w-7 text-center text-sm font-semibold text-foreground">{c.jumlah}</span>
                              <button type="button" onClick={() => updateCartQty(c.product.id, c.jumlah + 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-accent text-foreground text-xs transition">+</button>
                              <span className="text-[11px] text-muted-foreground ml-1">{c.satuan_beli}</span>
                            </div>
                            <span className="text-xs font-medium text-foreground">Rp {(price * c.jumlah).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">@ Rp {price.toLocaleString('id-ID')}/{c.satuan_beli}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="text-2xl font-black text-olaTosca">Rp {totalCart.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Patch: Kembalian Produk */}
                  {totalCart > 0 && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="flex flex-wrap gap-1.5">
                        {[...new Set([totalCart, ...[10000,20000,50000,100000].filter(a => a >= totalCart)])].sort((a,b) => a-b).slice(0,4).map(amt => (
                          <button key={amt} type="button" onClick={() => setProdukBayar(String(amt))}
                            className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition',
                              parseInt(produkBayar) === amt
                                ? 'bg-olaTosca text-white border-olaTosca'
                                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-olaTosca/40'
                            )}>
                            {amt === totalCart ? 'Pas' : `Rp ${(amt/1000).toFixed(0)}k`}
                          </button>
                        ))}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Uang Diterima</label>
                        <input
                          type="text" inputMode="numeric"
                          value={produkBayar ? `Rp ${parseInt(produkBayar).toLocaleString('id-ID')}` : ''}
                          onChange={e => setProdukBayar(e.target.value.replace(/\D/g, ''))}
                          placeholder="Rp 0" className={inputClass}
                        />
                      </div>
                      {produkBayar && (
                        <div className={cn('flex justify-between items-center rounded-lg px-3 py-2.5',
                          parseInt(produkBayar) < totalCart
                            ? 'bg-destructive/10 border border-destructive/20'
                            : 'bg-olaTosca/10 border border-olaTosca/20'
                        )}>
                          <span className="text-xs font-semibold text-muted-foreground">Kembalian</span>
                          <span className={cn('text-lg font-black',
                            parseInt(produkBayar) < totalCart ? 'text-destructive' : 'text-olaTosca'
                          )}>
                            Rp {Math.abs(parseInt(produkBayar) - totalCart).toLocaleString('id-ID')}
                            {parseInt(produkBayar) < totalCart && ' (kurang)'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
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