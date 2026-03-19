import React, { useState, useEffect } from 'react'
import Section from '../components/Section'
import GlassTable from '../components/GlassTable'
import Pagination from '../components/Pagination'
import { API_BASE_URL } from '../config/constants'
import { ordersAPI, servicesAPI } from '../services/api'
import { 
  PlusCircle, List, FileText, ChevronDown, ChevronUp, CheckCircle, RefreshCw, AlertCircle, Calculator
} from 'lucide-react'

// Helper Badge Status
const StatusBadge = ({ status }) => {
  const colors = {
    'MENUNGGU': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'DIPROSES': 'bg-blue-100 text-blue-800 border-blue-200',
    'SELESAI': 'bg-green-100 text-green-800 border-green-200',
    'BATAL': 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colors[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  )
}

export default function Pesanan({ dark }) {
  const [activeTab, setActiveTab] = useState('list') // 'list' | 'input'
  
  // --- STATE LIST ---
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  
  // --- STATE INPUT KASIR ---
  const [services, setServices] = useState([]) 
  const [offlineForm, setOfflineForm] = useState({ name: '', phone: '', service: null, notes: '' })
  
  // [UPDATE] Nambah state bwPages & colorPages buat mode Campur (SAMA KEK USER)
  const [offlineDetails, setOfflineDetails] = useState({ 
    copies: 1, 
    paperSize: 'A4', 
    colorMode: 'Hitam Putih', 
    bindingType: 'Tidak Ada',
    bwPages: 0,
    colorPages: 0
  })
  
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [serviceError, setServiceError] = useState('')

  useEffect(() => {
    fetchOrders()
    if (activeTab === 'input') {
        fetchServices()
    }
  }, [page, search, activeTab])

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
      if (activeServices.length === 0) {
          setServiceError('Tidak ada layanan aktif. Silakan aktifkan di menu Layanan.')
      } else {
          setServiceError('')
      }
    } catch (err) { 
      console.error("Error fetch services:", err)
      setServiceError('Gagal memuat layanan.') 
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    if(!window.confirm(`Ubah status ke ${newStatus}?`)) return
    try {
      const res = await ordersAPI.updateStatus(orderId, newStatus)
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      }
    } catch (err) { alert('Gagal update status') }
  }

  const handleOfflineSubmit = async (e) => {
    e.preventDefault()
    if (!offlineForm.name || !offlineForm.service) return alert("Wajib isi Nama & Layanan")
    
    // Validasi Campur
    if (offlineDetails.colorMode === 'Campur' && offlineDetails.bwPages <= 0 && offlineDetails.colorPages <= 0) {
        return alert("Isi jumlah halaman Hitam Putih atau Berwarna!")
    }

    setSubmitLoading(true)
    try {
      const items = []
      const copies = parseInt(offlineDetails.copies)

      // [LOGIC PENTING] Generator Item Cerdas (Sama persis logic User)
      if (offlineDetails.colorMode === 'Campur') {
          // Item Hitam Putih
          if (offlineDetails.bwPages > 0) {
            items.push({
                nama_barang: `${offlineForm.service.nama} - ${offlineDetails.paperSize} (Hitam Putih)`,
                harga_satuan: 0,
                jumlah: parseInt(offlineDetails.bwPages) * copies
            })
          }
          // Item Berwarna
          if (offlineDetails.colorPages > 0) {
            items.push({
                nama_barang: `${offlineForm.service.nama} - ${offlineDetails.paperSize} (Berwarna)`,
                harga_satuan: 0,
                jumlah: parseInt(offlineDetails.colorPages) * copies
            })
          }
      } else {
          // Mode Biasa
          items.push({
            nama_barang: `${offlineForm.service.nama} - ${offlineDetails.paperSize} (${offlineDetails.colorMode})`,
            harga_satuan: 0,
            jumlah: copies
          })
      }

      // Item Jilid
      if(offlineDetails.bindingType !== 'Tidak Ada') {
         items.push({
           nama_barang: `Jilid ${offlineDetails.bindingType}`,
           harga_satuan: 0,
           jumlah: copies // PERBAIKAN: Langsung tembak variable copies
         })
      }

      const payload = {
        nama_lengkap: offlineForm.name,
        nomor_telepon: offlineForm.phone || '-',
        alamat: '-',
        jenis_layanan: offlineForm.service.nama,
        mode_pesanan: 'OFFLINE',
        items,
        catatan_pesanan: offlineForm.notes,
        nilai_pesanan: 0
      }

      const res = await ordersAPI.createPublic(payload)
      if (res.success) {
        setSubmitSuccess('Pesanan Offline Masuk!')
        setTimeout(() => setSubmitSuccess(''), 3000)
        
        // Reset Form
        setOfflineForm({ name: '', phone: '', service: null, notes: '' })
        setOfflineDetails({ copies: 1, paperSize: 'A4', colorMode: 'Hitam Putih', bindingType: 'Tidak Ada', bwPages: 0, colorPages: 0 })
        
        fetchOrders()
        setActiveTab('list')
      }
    } catch(err) { 
        alert('Gagal input pesanan: ' + (err.message || 'Error')) 
    }
    finally { setSubmitLoading(false) }
  }

  return (
    <>
      {/* HEADER TABS */}
      <div className="flex gap-2 mb-6">
         <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium ${activeTab === 'list' ? 'bg-olaTosca text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
         >
           <List size={18}/> Daftar Pesanan
         </button>
         <button 
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium ${activeTab === 'input' ? 'bg-olaTosca text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
         >
           <PlusCircle size={18}/> Kasir Offline
         </button>
      </div>

      {/* === TAB 1: LIST PESANAN === */}
      {activeTab === 'list' && (
        <Section dark={dark} title="Daftar Pesanan Masuk" search={search} setSearch={setSearch}>
          <div className="mb-4 flex justify-end">
             <button onClick={fetchOrders} className="text-sm flex items-center gap-1 text-gray-500 hover:text-olaTosca transition">
                <RefreshCw size={14}/> Refresh Data
             </button>
          </div>
          {loading ? (
            <div className="text-center py-8 opacity-50">Memuat data...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 opacity-50">Belum ada pesanan.</div>
          ) : (
            <>
              <GlassTable 
                headers={["ID", "Pelanggan", "Layanan", "File", "Mode", "Status", "Aksi"]} 
                columnWidths={["50px", "200px", "150px", "100px", "100px", "120px", "150px"]}
                dark={dark}
              >
                {orders.map(o => (
                  <React.Fragment key={o.id}>
                    <tr className={`border-t ${dark ? 'border-white/10' : 'border-slate-100'} ${expandedOrderId === o.id ? (dark ? 'bg-white/5' : 'bg-blue-50/50') : ''}`}>
                      <td className="font-mono text-xs opacity-70">#{o.id}</td>
                      <td>
                        <div className="font-bold">{o.pelanggan?.nama_lengkap}</div>
                        <div className="text-xs opacity-60">{o.pelanggan?.nomor_telepon}</div>
                      </td>
                      <td>
                         <div className="text-olaTosca font-medium text-sm">{o.jenis_layanan}</div>
                      </td>
                      <td>
                        {o.nama_file ? (
                          <a href={`${API_BASE_URL}/uploads/${o.nama_file}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs">
                              <FileText size={12}/> File
                          </a>
                        ) : <span className="text-xs opacity-40">-</span>}
                      </td>
                      <td>
                         <span className={`text-[10px] px-2 py-0.5 rounded border ${o.mode_pesanan === 'ONLINE' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                           {o.mode_pesanan}
                         </span>
                      </td>
                      <td><StatusBadge status={o.status}/></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)} className={`p-1 rounded hover:bg-black/10 transition ${expandedOrderId === o.id ? 'bg-black/10' : ''}`}>
                             {expandedOrderId === o.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                          </button>
                          <select 
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
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
                        <td colSpan="7" className="p-4 pl-12">
                           <div className={`p-4 rounded-lg border text-sm max-w-2xl ${dark ? 'border-white/10 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                              <h4 className="font-bold text-xs uppercase opacity-50 mb-2">Rincian Barang:</h4>
                              <ul className="space-y-1 mb-3">
                                {o.barangTerbeli?.map((item, idx) => (
                                  <li key={idx} className="flex justify-between border-b border-dashed border-gray-100 last:border-0 pb-1">
                                    <span>{item.nama_barang}</span>
                                    <span className="font-mono bg-gray-100 px-1 rounded text-gray-600 text-xs">x{item.jumlah}</span>
                                  </li>
                                ))}
                              </ul>
                              {o.catatan_pesanan && (
                                <div className="text-xs italic opacity-70 border-t pt-2">
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

      {/* === TAB 2: INPUT KASIR (OFFLINE) === */}
      {activeTab === 'input' && (
        <Section dark={dark} title="Input Pesanan Offline (Kasir)">
           <div className={`max-w-3xl mx-auto p-6 rounded-xl border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'}`}>
              
             {submitSuccess && (
               <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-200">
                   <CheckCircle size={20}/> {submitSuccess}
               </div>
             )}

             <form onSubmit={handleOfflineSubmit} className="space-y-6">
                {/* DATA PELANGGAN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold uppercase opacity-60 mb-1">Nama Pelanggan</label>
                     <input 
                       required type="text" placeholder="Contoh: Pak Budi"
                       value={offlineForm.name} onChange={e => setOfflineForm({...offlineForm, name: e.target.value})}
                       className={`w-full p-2.5 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold uppercase opacity-60 mb-1">No. HP (Opsional)</label>
                     <input 
                       type="text" placeholder="08..."
                       value={offlineForm.phone} onChange={e => setOfflineForm({...offlineForm, phone: e.target.value})}
                       className={`w-full p-2.5 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}
                     />
                   </div>
                </div>
                <hr className={`border-t ${dark ? 'border-white/10' : 'border-gray-100'}`}/>

                {/* PILIH LAYANAN */}
                <div>
                   <label className="block text-xs font-bold uppercase opacity-60 mb-2">Pilih Layanan</label>
                   
                   {serviceError ? (
                       <div className="p-4 text-center text-sm text-red-500 bg-red-50 rounded border border-red-200">{serviceError}</div>
                   ) : services.length === 0 ? (
                       <div className={`p-4 text-center text-sm rounded border border-dashed ${dark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-500'}`}>
                          Memuat layanan...
                       </div>
                   ) : (
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                       {services.map(srv => (
                           <div 
                           key={srv.id} onClick={() => setOfflineForm({...offlineForm, service: srv})}
                           className={`cursor-pointer border p-3 text-center rounded-lg text-sm transition flex flex-col items-center gap-2 ${offlineForm.service?.id === srv.id ? 'bg-olaTosca text-white border-olaTosca shadow' : dark ? 'border-gray-600 hover:bg-white/5' : 'hover:bg-gray-50 opacity-80 hover:opacity-100'}`}
                           >
                           {srv.nama}
                           </div>
                       ))}
                       </div>
                   )}
                </div>

                {/* DETAIL ITEM DINAMIS */}
                {offlineForm.service && (
                   <div className={`p-4 rounded-lg border ${dark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                      <h4 className="text-sm font-bold mb-3 opacity-80">Detail {offlineForm.service.nama}</h4>

                      {/* BUNGKUS DALAM 1 GRID RAPI (2 Kolom di Desktop) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         
                         {/* 1. JUMLAH RANGKAP (Selalu Muncul) */}
                         <div>
                            <label className="text-xs opacity-60 block mb-1">
                               {offlineDetails.colorMode === 'Campur' ? 'Jumlah Rangkap (Bundel)' : 'Jumlah (Lembar/Buku)'}
                            </label>
                            <input type="number" min="1" value={offlineDetails.copies} onChange={e => setOfflineDetails({...offlineDetails, copies: e.target.value})} className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}/>
                         </div>

                         {/* 2. JIKA LAYANAN ADALAH CETAK/PRINT */}
                         {(offlineForm.service.nama.toLowerCase().includes('cetak') || offlineForm.service.nama.toLowerCase().includes('print')) && (
                            <>
                               <div>
                                  <label className="text-xs opacity-60 block mb-1">Kertas</label>
                                  <select value={offlineDetails.paperSize} onChange={e => setOfflineDetails({...offlineDetails, paperSize: e.target.value})} className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}>
                                    <option>A4</option><option>F4</option><option>A3</option>
                                  </select>
                               </div>
                               
                               <div>
                                  <label className="text-xs opacity-60 block mb-1">Warna</label>
                                  <select value={offlineDetails.colorMode} onChange={e => setOfflineDetails({...offlineDetails, colorMode: e.target.value})} className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}>
                                    <option>Hitam Putih</option>
                                    <option>Berwarna</option>
                                    <option value="Campur">Campur (Custom)</option>
                                  </select>
                               </div>

                               <div>
                                  <label className="text-xs opacity-60 block mb-1">Jilid Sekalian?</label>
                                  <select value={offlineDetails.bindingType} onChange={e => setOfflineDetails({...offlineDetails, bindingType: e.target.value})} className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}>
                                    <option>Tidak Ada</option><option>Lakban Biasa</option><option>Softcover</option><option>Hardcover</option>
                                  </select>
                               </div>
                            </>
                         )}

                         {/* 3. JIKA LAYANAN HANYA JILID SAJA */}
                         {offlineForm.service.nama.toLowerCase().includes('jilid') && !offlineForm.service.nama.toLowerCase().includes('cetak') && (
                            <div>
                               <label className="text-xs opacity-60 block mb-1">Jenis Jilid</label>
                               <select value={offlineDetails.bindingType} onChange={e => setOfflineDetails({...offlineDetails, bindingType: e.target.value})} className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}>
                                 <option value="Lakban Biasa">Lakban Biasa</option>
                                 <option value="Softcover">Softcover (Jilid Buku)</option>
                                 <option value="Hardcover">Hardcover (Skripsi)</option>
                                 <option value="Spiral">Jilid Spiral Kawat</option>
                               </select>
                            </div>
                         )}
                      </div>

                      {/* DETAIL CAMPUR (Muncul Paling Bawah Full Width kalau pilih Campur) */}
                      {(offlineForm.service.nama.toLowerCase().includes('cetak') || offlineForm.service.nama.toLowerCase().includes('print')) && offlineDetails.colorMode === 'Campur' && (
                          <div className={`mt-4 p-3 rounded border border-dashed ${dark ? 'bg-white/5 border-white/20' : 'bg-orange-50 border-orange-200'}`}>
                              <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase opacity-70">
                                  <Calculator size={14}/> Detail Halaman per 1 Bundel
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-xs opacity-60 block mb-1">Halaman Hitam Putih</label>
                                      <input type="number" min="0" value={offlineDetails.bwPages} onChange={e => setOfflineDetails({...offlineDetails, bwPages: e.target.value})} className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}/>
                                  </div>
                                  <div>
                                      <label className="text-xs opacity-60 block mb-1">Halaman Berwarna</label>
                                      <input type="number" min="0" value={offlineDetails.colorPages} onChange={e => setOfflineDetails({...offlineDetails, colorPages: e.target.value})} className={`w-full p-2 rounded border ${dark ? 'bg-slate-800' : 'bg-white'}`}/>
                                  </div>
                              </div>
                          </div>
                      )}
                   </div>
                )}

                <div>
                   <label className="block text-xs font-bold uppercase opacity-60 mb-1">Catatan</label>
                   <textarea 
                     rows="2" value={offlineForm.notes} onChange={e => setOfflineForm({...offlineForm, notes: e.target.value})}
                     className={`w-full p-2.5 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}
                   />
                </div>
                <button 
                 type="submit" disabled={submitLoading || !offlineForm.service}
                 className="w-full py-3 bg-olaTosca text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2"
                >
                 {submitLoading ? 'Menyimpan...' : 'Simpan Pesanan'}
                </button>
             </form>
          </div>
        </Section>
      )}
    </>
  )
}