import React, { useState, useEffect } from 'react'
import Section from '../components/Section'
import GlassTable from '../components/GlassTable'
import Pagination from '../components/Pagination'
import { API_BASE_URL } from '../config/constants'
import { ordersAPI, servicesAPI, productsAPI } from '../services/api'
import { 
  PlusCircle, List, FileText, ChevronDown, ChevronUp, CheckCircle, RefreshCw, Calculator, ShoppingCart, Trash2
} from 'lucide-react'

// Helper Badge Status
const StatusBadge = ({ status }) => {
  const colors = {
    'MENUNGGU': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'DIPROSES': 'bg-blue-100 text-blue-800 border-blue-200',
    'SELESAI':  'bg-green-100 text-green-800 border-green-200',
    'BATAL':    'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colors[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  )
}

// Helper Badge Payment
const PaymentBadge = ({ status }) => {
  if (!status) return null
  const colors = {
    'pending':    'bg-yellow-50 text-yellow-700 border-yellow-200',
    'settlement': 'bg-green-50 text-green-700 border-green-200',
    'cancel':     'bg-red-50 text-red-700 border-red-200',
    'deny':       'bg-red-50 text-red-700 border-red-200',
    'expire':     'bg-gray-100 text-gray-600 border-gray-200',
  }
  const labels = {
    'pending':    '⏳ Pending',
    'settlement': '✅ Lunas',
    'cancel':     '❌ Cancel',
    'deny':       '❌ Ditolak',
    'expire':     '⌛ Expire',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colors[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  )
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
  
  // --- STATE INPUT KASIR ---
  const [services, setServices] = useState([]) 
  const [priceList, setPriceList] = useState(null) 
  const [offlineForm, setOfflineForm] = useState({ name: '', phone: '', service: null, notes: '' })
  
  const [offlineDetails, setOfflineDetails] = useState({ 
    copies: 1,         
    totalPages: 1,     
    paperSize: 'A4', 
    colorMode: 'Hitam Putih', 
    bindingType: 'Tidak Ada',
    bwPages: 0,
    colorPages: 0
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
    if (activeTab === 'input') {
      fetchServices()
      fetchPrices() 
    }
    if (activeTab === 'produk') {
      fetchProducts()
    }

    // Lock page scroll saat dropdown produk open
    if (produkDropdownOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Polling setiap 30 detik di tab list
    let interval
    if (activeTab === 'list') {
      interval = setInterval(fetchOrders, 30000)
    }
    return () => {
      clearInterval(interval)
      document.body.style.overflow = 'unset'
    }
  }, [page, search, activeTab, produkDropdownOpen])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await ordersAPI.getAll(page, search)
      const orderList = res.pesanan || res.data?.pesanan || [] 
      setOrders(orderList)
      setPagination(res.pagination || res.data?.pagination || { total: 0, totalPages: 0, limit: 10 })
    } catch (err) { console.error("Error fetch orders:", err) }
    finally { setLoading(false) }
  }

  const fetchServices = async () => {
    try {
      const res = await servicesAPI.getAll()
      const allServices = res.dataLayanan || res.data?.dataLayanan || []
      const activeServices = allServices.filter(s => s.status_layanan === true || s.status_layanan === 1 || s.status_layanan === '1')
      
      setServices(activeServices)
      if (activeServices.length === 0) setServiceError('Tidak ada layanan aktif.')
      else setServiceError('')
    } catch (err) { setServiceError('Gagal memuat layanan.') }
  }

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/konfigurasi/public`);
      const json = await res.json();
      if(json.success) setPriceList(json.data);
    } catch (error) { console.error("Gagal tarik harga", error) }
  }

  const fetchProducts = async () => {
    try {
      const data = await productsAPI.getAllForDropdown()
      setProducts(Array.isArray(data) ? data.filter(p => p.jumlah_stok > 0) : [])
    } catch (err) { console.error("Gagal fetch produk:", err) }
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) {
        if (existing.jumlah >= product.jumlah_stok) {
          alert(`Stok ${product.nama} hanya ${product.jumlah_stok}`)
          return prev
        }
        return prev.map(c => c.product.id === product.id
          ? { ...c, jumlah: c.jumlah + 1 }
          : c
        )
      }
      return [...prev, { product, jumlah: 1 }]
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(c => c.product.id !== productId))
  }

  const updateCartQty = (productId, jumlah) => {
    const product = products.find(p => p.id === productId)
    if (jumlah > product?.jumlah_stok) {
      alert(`Stok hanya ${product.jumlah_stok}`)
      return
    }
    if (jumlah <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, jumlah } : c))
  }

  const totalCart = cart.reduce((sum, c) => sum + c.product.harga_satuan * c.jumlah, 0)

  const handleJualProdukSubmit = async (e) => {
    e.preventDefault()
    if (!produkForm.name) return alert("Wajib isi Nama Pembeli")
    if (cart.length === 0) return alert("Pilih minimal 1 produk")

    setProdukSubmitLoading(true)
    try {
      const items = cart.map(c => ({
        stok_barang_id: c.product.id,
        nama_barang: c.product.nama,
        harga_satuan: c.product.harga_satuan,
        jumlah: c.jumlah,
      }))

      const payload = {
        nama_lengkap: produkForm.name,
        nomor_telepon: produkForm.phone || '-',
        alamat: '-',
        jenis_layanan: 'Penjualan Produk',
        mode_pesanan: 'OFFLINE',
        items,
        nilai_pesanan: totalCart,
      }

      const res = await ordersAPI.createPublic(payload)
      if (res.success) {
        setProdukSuccess('Penjualan Berhasil Disimpan!')
        setTimeout(() => setProdukSuccess(''), 3000)
        setCart([])
        setProdukForm({ name: '', phone: '' })
        fetchOrders()
        fetchProducts()
        setActiveTab('list')
      } else {
        alert(res.message || 'Gagal menyimpan penjualan')
      }
    } catch (err) { alert('Error: ' + (err.message || 'Unknown')) }
    finally { setProdukSubmitLoading(false) }
  }

  const hitungTotal = () => {
    if (!priceList || !offlineForm.service) return 0;

    const copies = parseInt(offlineDetails.copies) || 1;
    const nama = offlineForm.service.nama.toLowerCase();
    const isCetak = nama.includes('cetak') || nama.includes('print');
    const isFotokopi = nama.includes('fotokopi') || nama.includes('fotocopy');
    const isLaminating = nama.includes('laminating');
    const isScan = nama.includes('scan');
    const isJilid = nama.includes('jilid') && !isCetak;

    let totalPerBundel = 0;
    const kertas = offlineDetails.paperSize.toLowerCase();

    if (isCetak) {
      const hargaBw = parseInt(priceList[`harga_cetak_${kertas}_bw`]) || 0;
      const hargaWarna = parseInt(priceList[`harga_cetak_${kertas}_color`]) || 0;

      if (offlineDetails.colorMode === 'Hitam Putih') {
        totalPerBundel += (parseInt(offlineDetails.totalPages) || 0) * hargaBw;
      } else if (offlineDetails.colorMode === 'Berwarna') {
        totalPerBundel += (parseInt(offlineDetails.totalPages) || 0) * hargaWarna;
      } else if (offlineDetails.colorMode === 'Campur') {
        totalPerBundel += (parseInt(offlineDetails.bwPages) || 0) * hargaBw;
        totalPerBundel += (parseInt(offlineDetails.colorPages) || 0) * hargaWarna;
      }

      if (offlineDetails.bindingType !== 'Tidak Ada') {
        const type = offlineDetails.bindingType.toLowerCase().split(' ')[0];
        totalPerBundel += parseInt(priceList[`harga_jilid_${type}`]) || 0;
      }
    } else if (isFotokopi) {
      const hargaBw = parseInt(priceList[`harga_fotokopi_${kertas}`]) || 0;
      const hargaWarna = parseInt(priceList[`harga_fotokopi_${kertas}_color`]) || 0;
      const harga = offlineDetails.colorMode === 'Berwarna' ? hargaWarna : hargaBw;
      totalPerBundel = (parseInt(offlineDetails.totalPages) || 0) * harga;
    } else if (isLaminating) {
      const hargaLaminating = parseInt(priceList[`harga_laminating_${kertas}`]) || 0;
      totalPerBundel = (parseInt(offlineDetails.totalPages) || 0) * hargaLaminating;
    } else if (isScan) {
      const hargaScan = parseInt(priceList['harga_scan']) || 0;
      totalPerBundel = (parseInt(offlineDetails.totalPages) || 0) * hargaScan;
    } else if (isJilid) {
      const type = offlineDetails.bindingType.toLowerCase().split(' ')[0];
      totalPerBundel = parseInt(priceList[`harga_jilid_${type}`]) || 0;
    }

    return totalPerBundel * copies;
  }

  const handleStatusChange = async (orderId, newStatus) => {
    if(!window.confirm(`Ubah status ke ${newStatus}?`)) return
    try {
      const res = await ordersAPI.updateStatus(orderId, newStatus)
      if (res.success) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (err) { alert('Gagal update status') }
  }

  const handleOfflineSubmit = async (e) => {
    e.preventDefault()
    if (!offlineForm.name || !offlineForm.service) return alert("Wajib isi Nama & Layanan")
    if (offlineDetails.colorMode === 'Campur' && offlineDetails.bwPages <= 0 && offlineDetails.colorPages <= 0) {
      return alert("Isi jumlah halaman Hitam Putih atau Berwarna!")
    }

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
          if (offlineDetails.bwPages > 0) items.push({
            nama_barang: `${offlineForm.service.nama} - ${offlineDetails.paperSize} (Hitam Putih)`,
            harga_satuan: hargaBw,
            jumlah: parseInt(offlineDetails.bwPages) * copies
          })
          if (offlineDetails.colorPages > 0) items.push({
            nama_barang: `${offlineForm.service.nama} - ${offlineDetails.paperSize} (Berwarna)`,
            harga_satuan: hargaWarna,
            jumlah: parseInt(offlineDetails.colorPages) * copies
          })
        } else {
          const harga = offlineDetails.colorMode === 'Berwarna' ? hargaWarna : hargaBw
          items.push({
            nama_barang: `${offlineForm.service.nama} - ${offlineDetails.paperSize} (${offlineDetails.colorMode})`,
            harga_satuan: harga,
            jumlah: (parseInt(offlineDetails.totalPages) || 1) * copies
          })
        }

        if (offlineDetails.bindingType !== 'Tidak Ada') {
          const type = offlineDetails.bindingType.toLowerCase().split(' ')[0]
          items.push({
            nama_barang: `Jilid ${offlineDetails.bindingType}`,
            harga_satuan: parseInt(priceList?.[`harga_jilid_${type}`]) || 0,
            jumlah: copies
          })
        }
      } else if (isFotokopi) {
        const hargaBw = parseInt(priceList?.[`harga_fotokopi_${kertas}`]) || 0
        const hargaWarna = parseInt(priceList?.[`harga_fotokopi_${kertas}_color`]) || 0
        const harga = offlineDetails.colorMode === 'Berwarna' ? hargaWarna : hargaBw
        items.push({
          nama_barang: `Fotokopi ${offlineDetails.paperSize} (${offlineDetails.colorMode})`,
          harga_satuan: harga,
          jumlah: (parseInt(offlineDetails.totalPages) || 1) * copies
        })
      } else if (isLaminating) {
        items.push({
          nama_barang: `Laminating ${offlineDetails.paperSize}`,
          harga_satuan: parseInt(priceList?.[`harga_laminating_${kertas}`]) || 0,
          jumlah: (parseInt(offlineDetails.totalPages) || 1) * copies
        })
      } else if (isScan) {
        items.push({
          nama_barang: `Scan`,
          harga_satuan: parseInt(priceList?.['harga_scan']) || 0,
          jumlah: (parseInt(offlineDetails.totalPages) || 1) * copies
        })
      } else if (isJilid) {
        const type = offlineDetails.bindingType.toLowerCase().split(' ')[0]
        items.push({
          nama_barang: `Jilid ${offlineDetails.bindingType}`,
          harga_satuan: parseInt(priceList?.[`harga_jilid_${type}`]) || 0,
          jumlah: copies
        })
      }

      const totalHarga = hitungTotal()

      const payload = {
        nama_lengkap: offlineForm.name,
        nomor_telepon: offlineForm.phone || '-',
        alamat: '-',
        jenis_layanan: offlineForm.service.nama,
        mode_pesanan: 'OFFLINE',
        items,
        catatan_pesanan: offlineForm.notes,
        nilai_pesanan: totalHarga
      }

      const res = await ordersAPI.createPublic(payload)
      if (res.success) {
        setSubmitSuccess('Pesanan Berhasil Disimpan!')
        setTimeout(() => setSubmitSuccess(''), 3000)
        setOfflineForm({ name: '', phone: '', service: null, notes: '' })
        setOfflineDetails({ copies: 1, totalPages: 1, paperSize: 'A4', colorMode: 'Hitam Putih', bindingType: 'Tidak Ada', bwPages: 0, colorPages: 0 })
        fetchOrders()
        setActiveTab('list')
      }
    } catch(err) { alert('Gagal input pesanan: ' + (err.message || 'Error')) }
    finally { setSubmitLoading(false) }
  }

  const isCetakService = offlineForm.service?.nama.toLowerCase().includes('cetak') || offlineForm.service?.nama.toLowerCase().includes('print')
  const isFotokopiService = offlineForm.service?.nama.toLowerCase().includes('fotokopi') || offlineForm.service?.nama.toLowerCase().includes('fotocopy')
  const isLaminatingService = offlineForm.service?.nama.toLowerCase().includes('laminating')
  const isScanService = offlineForm.service?.nama.toLowerCase().includes('scan')
  const isJilidService = offlineForm.service?.nama.toLowerCase().includes('jilid') && !isCetakService

  return (
    <>
      <div className="flex gap-2 mb-6">
         <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium ${activeTab === 'list' ? 'bg-olaTosca text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><List size={18}/> Daftar Pesanan</button>
         <button onClick={() => setActiveTab('input')} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium ${activeTab === 'input' ? 'bg-olaTosca text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><PlusCircle size={18}/> Kasir </button>
         <button onClick={() => setActiveTab('produk')} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium ${activeTab === 'produk' ? 'bg-olaTosca text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><ShoppingCart size={18}/> Jual Produk</button>
      </div>

      {/* === TAB 1: LIST === */}
      {activeTab === 'list' && (
        <Section dark={dark} title="Daftar Pesanan Masuk" search={search} setSearch={setSearch}>
          <div className="mb-4 flex justify-end">
             <button onClick={fetchOrders} className="text-sm flex items-center gap-1 text-gray-500 hover:text-olaTosca transition"><RefreshCw size={14}/> Refresh Data</button>
          </div>
          {loading ? (
            <div className="text-center py-8 opacity-50">Memuat data...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 opacity-50">Belum ada pesanan.</div>
          ) : (
            <>
              <GlassTable 
                headers={["ID", "Pelanggan", "Layanan", "File", "Total Harga", "Pembayaran", "Status", "Aksi"]} 
                columnWidths={["50px", "200px", "130px", "80px", "130px", "110px", "110px", "150px"]}
                dark={dark}
              >
                {orders.map(o => (
                  <React.Fragment key={o.id}>
                    <tr className={`border-t ${dark ? 'border-white/10' : 'border-slate-100'} ${expandedOrderId === o.id ? (dark ? 'bg-white/5' : 'bg-blue-50/50') : ''}`}>
                      <td className="font-mono text-xs opacity-70">#{o.id}</td>
                      
                      <td>
                        <div className="flex items-center gap-2 mb-0.5">
                           <div className="font-bold truncate max-w-[130px]">{o.pelanggan?.nama_lengkap}</div>
                           <span className={`text-[9px] px-1.5 py-0.5 rounded border ${o.mode_pesanan === 'ONLINE' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                             {o.mode_pesanan}
                           </span>
                        </div>
                        <div className="text-xs opacity-60">{o.pelanggan?.nomor_telepon}</div>
                      </td>

                      <td><div className="text-olaTosca font-medium text-sm">{o.jenis_layanan}</div></td>
                      <td>
                        {o.nama_file ? (
                          <a href={`${API_BASE_URL}/uploads/${o.nama_file}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs"><FileText size={12}/> File</a>
                        ) : <span className="text-xs opacity-40">-</span>}
                      </td>
                      
                      <td>
                         <div className="font-bold text-gray-700">Rp {o.nilai_pesanan?.toLocaleString('id-ID')}</div>
                      </td>

                      <td>
                        {o.mode_pesanan === 'ONLINE'
                          ? <PaymentBadge status={o.payment_status} />
                          : <span className="text-xs opacity-40">-</span>
                        }
                      </td>

                      <td><StatusBadge status={o.status}/></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)} className={`p-1 rounded hover:bg-black/10 transition ${expandedOrderId === o.id ? 'bg-black/10' : ''}`}>
                             {expandedOrderId === o.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                          </button>
                          <select 
                            value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className={`text-xs p-1 rounded border cursor-pointer ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}
                          >
                            <option value="MENUNGGU">MENUNGGU</option>
                            <option value="DIPROSES">DIPROSES</option>
                            <option value="SELESAI">SELESAI</option>
                            <option value="BATAL">BATAL</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                    {expandedOrderId === o.id && (
                      <tr className={`${dark ? 'bg-black/20' : 'bg-gray-50'}`}>
                        <td colSpan="8" className="p-4 pl-12">
                          <div className={`p-4 rounded-lg border text-sm max-w-2xl ${dark ? 'border-white/10 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                            <h4 className="font-bold text-xs uppercase opacity-50 mb-2">Rincian Pesanan:</h4>
                            {o.barangTerbeli && o.barangTerbeli.length > 0 ? (
                              <>
                                <ul className="space-y-1.5 mb-2">
                                  {o.barangTerbeli.map((item, idx) => (
                                    <li key={idx} className="flex justify-between border-b border-dashed border-gray-100 last:border-0 pb-1">
                                      <span>{item.nama_barang} <span className="text-gray-400">x{item.jumlah}</span></span>
                                      <span className="font-mono text-xs text-gray-600">
                                        {item.harga_satuan > 0
                                          ? `Rp ${(item.harga_satuan * item.jumlah).toLocaleString('id-ID')}`
                                          : '-'
                                        }
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="flex justify-between text-xs text-gray-400 pt-1">
                                  <span>Subtotal</span>
                                  <span className="font-bold text-gray-600">
                                    Rp {o.barangTerbeli.reduce((sum, item) => sum + (item.harga_satuan * item.jumlah), 0).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <p className="text-xs opacity-50">Tidak ada rincian item.</p>
                            )}
                            {o.catatan_pesanan && (
                              <div className="text-xs italic opacity-70 border-t pt-2 mt-2">
                                <span className="font-semibold">Catatan:</span> "{o.catatan_pesanan}"
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </GlassTable>
              <Pagination page={page} setPage={setPage} maxPage={pagination.totalPages} />
            </>
          )}
        </Section>
      )}

      {/* === TAB 2: INPUT KASIR === */}
      {activeTab === 'input' && (
        <Section dark={dark} title="Input Pesanan Langsung">
           <div className={`max-w-3xl mx-auto p-6 rounded-xl border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'}`}>
             
             {submitSuccess && (
               <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-200"><CheckCircle size={20}/> {submitSuccess}</div>
             )}

             <form onSubmit={handleOfflineSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold uppercase opacity-60 mb-1">Nama Pelanggan</label>
                     <input required type="text" value={offlineForm.name} onChange={e => setOfflineForm({...offlineForm, name: e.target.value})} className={`w-full p-2.5 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}/>
                   </div>
                   <div>
                     <label className="block text-xs font-bold uppercase opacity-60 mb-1">No. HP</label>
                     <input type="text" value={offlineForm.phone} onChange={e => setOfflineForm({...offlineForm, phone: e.target.value})} className={`w-full p-2.5 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}/>
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase opacity-60 mb-2">Pilih Layanan</label>
                   {services.length === 0 ? <div className="p-4 text-center text-sm">Memuat layanan...</div> : (
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                       {services.map(srv => (
                           <div key={srv.id} onClick={() => setOfflineForm({...offlineForm, service: srv})} className={`cursor-pointer border p-3 text-center rounded-lg text-sm transition ${offlineForm.service?.id === srv.id ? 'bg-olaTosca text-white border-olaTosca shadow' : 'hover:bg-gray-50'}`}>
                             {srv.nama}
                           </div>
                       ))}
                       </div>
                   )}
                </div>

                {offlineForm.service && (
                  <div className={`p-4 rounded-lg border ${dark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className="text-sm font-bold mb-4 opacity-80 border-b pb-2">Detail {offlineForm.service.nama}</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* JUMLAH RANGKAP — semua layanan */}
                      <div>
                        <label className="text-xs font-bold text-olaTosca block mb-1">
                          Jumlah Rangkap
                        </label>
                        <input type="number" min="1" value={offlineDetails.copies}
                          onChange={e => setOfflineDetails({...offlineDetails, copies: e.target.value})}
                          className={`w-full p-2 rounded border-2 border-olaTosca/30 focus:border-olaTosca ${dark ? 'bg-slate-800' : 'bg-white'}`}/>
                      </div>

                      {/* TOTAL HALAMAN/LEMBAR */}
                      {(isCetakService || isFotokopiService || isLaminatingService || isScanService) && offlineDetails.colorMode !== 'Campur' && (
                        <div>
                          <label className="text-xs font-bold text-blue-500 block mb-1">
                            {isCetakService || isFotokopiService ? 'Total Halaman' :
                             isLaminatingService ? 'Total Lembar' :
                             isScanService ? 'Total Lembar' :
                             'Total Halaman'}
                          </label>
                          <input type="number" min="1" value={offlineDetails.totalPages}
                            onChange={e => setOfflineDetails({...offlineDetails, totalPages: e.target.value})}
                            className={`w-full p-2 rounded border-2 border-blue-500/30 focus:border-blue-500 ${dark ? 'bg-slate-800' : 'bg-white'}`}/>
                        </div>
                      )}

                      {/* UKURAN KERTAS */}
                      {(isCetakService || isFotokopiService || isLaminatingService) && (
                        <div>
                          <label className="text-xs opacity-60 block mb-1">Ukuran Kertas</label>
                          <select value={offlineDetails.paperSize}
                            onChange={e => setOfflineDetails({...offlineDetails, paperSize: e.target.value})}
                            className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}>
                            <option>A4</option><option>F4</option>
                          </select>
                        </div>
                      )}

                      {/* WARNA — cetak dan fotokopi */}
                      {(isCetakService || isFotokopiService) && (
                        <div>
                          <label className="text-xs opacity-60 block mb-1">Warna</label>
                          <select value={offlineDetails.colorMode}
                            onChange={e => setOfflineDetails({...offlineDetails, colorMode: e.target.value})}
                            className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}>
                            <option>Hitam Putih</option>
                            <option>Berwarna</option>
                            {isCetakService && <option value="Campur">Campur (Custom)</option>}
                          </select>
                        </div>
                      )}

                      {/* JILID — cetak only */}
                      {isCetakService && (
                        <div className="md:col-span-2">
                          <label className="text-xs opacity-60 block mb-1">Jilid Sekalian?</label>
                          <select value={offlineDetails.bindingType}
                            onChange={e => setOfflineDetails({...offlineDetails, bindingType: e.target.value})}
                            className={`w-full md:w-1/2 p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}>
                            <option>Tidak Ada</option><option>Lakban Biasa</option><option>Softcover</option><option>Hardcover</option><option>Spiral</option>
                          </select>
                        </div>
                      )}

                      {/* JENIS JILID — jilid standalone */}
                      {isJilidService && (
                        <div>
                          <label className="text-xs opacity-60 block mb-1">Jenis Jilid</label>
                          <select value={offlineDetails.bindingType}
                            onChange={e => setOfflineDetails({...offlineDetails, bindingType: e.target.value})}
                            className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}>
                            <option value="Lakban Biasa">Lakban Biasa</option>
                            <option value="Softcover">Softcover (Jilid Buku)</option>
                            <option value="Hardcover">Hardcover (Skripsi)</option>
                            <option value="Spiral">Jilid Spiral Kawat</option>
                          </select>
                        </div>
                      )}

                    </div>

                    {/* CAMPUR MODE — cetak only */}
                    {isCetakService && offlineDetails.colorMode === 'Campur' && (
                      <div className={`mt-4 p-3 rounded border border-dashed ${dark ? 'bg-white/5 border-white/20' : 'bg-orange-50 border-orange-200'}`}>
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-orange-600">
                          <Calculator size={14}/> Detail Halaman per 1 Buku
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs opacity-60 block mb-1">Halaman Hitam Putih</label>
                            <input type="number" min="0" value={offlineDetails.bwPages}
                              onChange={e => setOfflineDetails({...offlineDetails, bwPages: e.target.value})}
                              className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}/>
                          </div>
                          <div>
                            <label className="text-xs opacity-60 block mb-1">Halaman Berwarna</label>
                            <input type="number" min="0" value={offlineDetails.colorPages}
                              onChange={e => setOfflineDetails({...offlineDetails, colorPages: e.target.value})}
                              className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}/>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LIVE HARGA */}
                    <div className="mt-6 pt-4 border-t border-dashed flex justify-between items-center">
                      <span className="text-sm font-bold opacity-60">Estimasi Total Harga:</span>
                      <span className="text-2xl font-black text-olaTosca">Rp {hitungTotal().toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                <div>
                   <label className="block text-xs font-bold uppercase opacity-60 mb-1">Catatan</label>
                   <textarea 
                     rows="2" 
                     value={offlineForm.notes} 
                     onChange={e => setOfflineForm({...offlineForm, notes: e.target.value})}
                     placeholder="Contoh: Halaman 1-5 dilaminating..."
                     className={`w-full p-2.5 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}
                   />
                </div>

                <button type="submit" disabled={submitLoading || !offlineForm.service} className="w-full py-4 bg-olaTosca text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2 text-lg shadow-lg">
                 {submitLoading ? 'Menyimpan...' : 'Simpan & Masukkan ke Kasir'}
                </button>
             </form>
          </div>
        </Section>
      )}

      {/* === TAB 3: JUAL PRODUK === */}
      {activeTab === 'produk' && (
        <Section dark={dark} title="Jual Produk">
          <div className={`max-w-3xl mx-auto p-6 rounded-xl border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'}`}>

            {produkSuccess && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-200">
                <CheckCircle size={20}/> {produkSuccess}
              </div>
            )}

            <form onSubmit={handleJualProdukSubmit} className="space-y-6">

              {/* DATA PEMBELI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase opacity-60 mb-1">Nama Pembeli</label>
                  <input required type="text" value={produkForm.name}
                    onChange={e => setProdukForm({...produkForm, name: e.target.value})}
                    className={`w-full p-2.5 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}/>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase opacity-60 mb-1">No. HP</label>
                  <input type="text" value={produkForm.phone}
                    onChange={e => setProdukForm({...produkForm, phone: e.target.value})}
                    className={`w-full p-2.5 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}/>
                </div>
              </div>

              {/* DROPDOWN CARI PRODUK */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs font-bold uppercase opacity-60 mb-2">Pilih Produk</label>
                <button
                  type="button"
                  onClick={() => setProdukDropdownOpen(!produkDropdownOpen)}
                  className={`w-full p-3 rounded border text-left flex justify-between items-center transition ${dark ? 'bg-slate-700 border-slate-600 hover:border-olaTosca' : 'bg-white border-gray-300 hover:border-olaTosca'}`}
                >
                  <span className="text-sm">{produkSearch ? `Cari: "${produkSearch}"` : 'Klik untuk pilih produk...'}</span>
                  <ChevronDown size={16} className={`transition ${produkDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* DROPDOWN PANEL */}
                {produkDropdownOpen && (
                  <>
                    {/* OVERLAY UNTUK CLOSE DROPDOWN */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => {
                        setProdukDropdownOpen(false)
                        setProdukSearch('')
                      }}
                    />
                    
                    <div className={`absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border shadow-lg ${dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                      {/* SEARCH INPUT */}
                      <input
                        type="text"
                        placeholder="Ketik nama produk..."
                        value={produkSearch}
                        onChange={e => setProdukSearch(e.target.value)}
                        autoFocus
                        className={`w-full p-3 border-b rounded-t text-sm focus:outline-none ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'}`}
                      />

                      {/* PRODUK LIST */}
                      <div className="max-h-64 overflow-y-auto">
                        {products.length === 0 ? (
                          <div className="p-4 text-center text-sm opacity-50">Tidak ada produk</div>
                        ) : products.filter(p => p.nama.toLowerCase().includes(produkSearch.toLowerCase())).length === 0 ? (
                          <div className="p-4 text-center text-sm opacity-50">Produk tidak ditemukan</div>
                        ) : (
                          products
                            .filter(p => p.nama.toLowerCase().includes(produkSearch.toLowerCase()))
                            .map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  addToCart(p)
                                  setProdukDropdownOpen(false)
                                  setProdukSearch('')
                                }}
                                className={`w-full px-4 py-3 text-left border-b text-sm transition hover:bg-olaTosca/10 flex justify-between items-center last:border-0 ${dark ? 'border-slate-700' : 'border-gray-100'}`}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{p.nama}</div>
                                  <div className="text-xs opacity-60">Rp {p.harga_satuan.toLocaleString('id-ID')}</div>
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded ${p.jumlah_stok > 5 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {p.jumlah_stok}
                                </div>
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* CART */}
              {cart.length > 0 && (
                <div className={`p-4 rounded-lg border ${dark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="text-sm font-bold mb-3 opacity-80">Keranjang ({cart.length} item)</h4>
                  <div className="space-y-2">
                    {cart.map(c => (
                      <div key={c.product.id} className="flex items-center justify-between gap-3">
                        <span className="text-sm flex-1 truncate">{c.product.nama}</span>
                        <div className="flex items-center gap-2">
                          <button type="button"
                            onClick={() => updateCartQty(c.product.id, c.jumlah - 1)}
                            className="w-7 h-7 rounded border flex items-center justify-center hover:bg-gray-100 text-sm font-bold">-</button>
                          <span className="w-8 text-center text-sm font-bold">{c.jumlah}</span>
                          <button type="button"
                            onClick={() => updateCartQty(c.product.id, c.jumlah + 1)}
                            className="w-7 h-7 rounded border flex items-center justify-center hover:bg-gray-100 text-sm font-bold">+</button>
                        </div>
                        <span className="text-sm font-medium w-24 text-right">
                          Rp {(c.product.harga_satuan * c.jumlah).toLocaleString('id-ID')}
                        </span>
                        <button type="button" onClick={() => removeFromCart(c.product.id)}
                          className="text-red-400 hover:text-red-600 transition">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-dashed flex justify-between items-center">
                    <span className="text-sm font-bold opacity-60">Total:</span>
                    <span className="text-2xl font-black text-olaTosca">
                      Rp {totalCart.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={produkSubmitLoading || cart.length === 0}
                className="w-full py-4 bg-olaTosca text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2 text-lg shadow-lg">
                {produkSubmitLoading ? 'Menyimpan...' : 'Selesaikan Penjualan'}
              </button>

            </form>
          </div>
        </Section>
      )}
    </>
  )
}