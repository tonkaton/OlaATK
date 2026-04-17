import React, { useState, useEffect } from 'react'
import Section from '../components/Section'
import GlassTable from '../components/GlassTable'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { servicesAPI } from '../services/api'
import { Printer, Book, Copy, Layers, Scan, Palette, Edit3, Trash2 } from 'lucide-react'

// Icon Options biar Admin gak Typo
const ICON_OPTIONS = [
  { value: 'printer', label: 'Printer (Cetak)', icon: <Printer size={16}/> },
  { value: 'copy', label: 'Copy (Fotokopi)', icon: <Copy size={16}/> },
  { value: 'book', label: 'Book (Jilid)', icon: <Book size={16}/> },
  { value: 'layers', label: 'Layers (Laminating)', icon: <Layers size={16}/> },
  { value: 'scan', label: 'Scan (Digitalisasi)', icon: <Scan size={16}/> },
  { value: 'palette', label: 'Palette (Desain)', icon: <Palette size={16}/> },
]

export default function Layanan({ dark }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  
  // Default Icon 'printer' biar aman
  const [formData, setFormData] = useState({ 
    nama: '', 
    deskripsi: '', 
    nama_icon: 'printer', 
    status_layanan: true 
  })
  
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })

  useEffect(() => {
    fetchServices()
  }, [page, search])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await servicesAPI.getAll(page, search)
      setServices(response.dataLayanan || [])
      setPagination(response.pagination || { total: 0, totalPages: 0, limit: 10 })
      setError('')
    } catch (err) {
      setError('Gagal mengambil data layanan')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setFormData({ nama: '', deskripsi: '', nama_icon: 'printer', status_layanan: true })
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (s) => {
    setFormData({ 
      nama: s.nama, 
      deskripsi: s.deskripsi,
      nama_icon: s.nama_icon || 'printer',
      status_layanan: s.status_layanan
    })
    setEditId(s.id)
    setModalOpen(true)
  }

  const saveService = async () => {
    if (!formData.nama || !formData.deskripsi) return setError('Nama & Deskripsi wajib diisi')

    try {
      setSaving(true)
      const serviceData = { ...formData }

      if (editId !== null) {
        await servicesAPI.update(editId, serviceData)
      } else {
        await servicesAPI.create(serviceData)
      }
      
      setModalOpen(false)
      fetchServices()
      setError('')
    } catch (err) {
      setError('Gagal menyimpan layanan')
    } finally {
      setSaving(false)
    }
  }

  const delService = async (id) => {
    if (!window.confirm('Hapus layanan ini?')) return
    try {
      await servicesAPI.delete(id)
      fetchServices()
    } catch (err) { setError('Gagal menghapus layanan') }
  }

  // Helper render icon di tabel
  const renderIcon = (name) => {
    const opt = ICON_OPTIONS.find(o => o.value === name)
    return opt ? <div className="flex items-center gap-2" title={name}>{opt.icon} <span className="text-xs opacity-70">{name}</span></div> : name
  }

  return (
    <Section dark={dark} title="Manajemen Layanan" search={search} setSearch={setSearch}>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      <button onClick={openAdd} className="px-4 py-2 rounded-lg bg-olaTosca text-white mb-4 hover:opacity-90 transition shadow-sm font-medium">
        + Tambah Layanan Baru
      </button>
      
      {loading ? (
        <div className="text-center py-10 opacity-50">Memuat data...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-10 opacity-50">Belum ada layanan.</div>
      ) : (
        <>
          <GlassTable 
            headers={["Nama Layanan", "Deskripsi", "Icon Display", "Status", "Aksi"]} 
            columnWidths={["20%", "35%", "15%", "15%", "15%"]}
            dark={dark}
          >
            {services.map(s => (
              <tr key={s.id} className={`border-t ${dark ? 'border-white/10' : 'border-gray-100'}`}>
                <td className="font-medium">{s.nama}</td>
                <td className="text-sm opacity-80">{s.deskripsi}</td>
                <td className="text-sm">{renderIcon(s.nama_icon)}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${s.status_layanan ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.status_layanan ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </td>
                <td className="flex gap-2">
                  <button onClick={() => openEdit(s)} className={`p-1.5 rounded hover:bg-black/10 transition text-blue-500`}>
                    <Edit3 size={16}/>
                  </button>
                  <button onClick={() => delService(s.id)} className={`p-1.5 rounded hover:bg-black/10 transition text-red-500`}>
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </GlassTable>
          
          <Pagination page={page} setPage={setPage} maxPage={pagination.totalPages} />
        </>
      )}

      {/* MODAL INPUT */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Layanan' : 'Tambah Layanan'} dark={dark}>
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold uppercase opacity-60 mb-1 block">Nama Layanan</label>
                <input 
                  value={formData.nama} 
                  onChange={e => setFormData(f => ({ ...f, nama: e.target.value }))} 
                  placeholder="Contoh: Print Dokumen" 
                  className={`w-full p-2 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}
                />
            </div>
            
            <div>
                <label className="text-xs font-bold uppercase opacity-60 mb-1 block">Deskripsi Singkat</label>
                <textarea 
                  value={formData.deskripsi} 
                  onChange={e => setFormData(f => ({ ...f, deskripsi: e.target.value }))} 
                  placeholder="Contoh: Cetak A4/F4 Hitam Putih & Warna" 
                  className={`w-full p-2 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}
                  rows="2"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold uppercase opacity-60 mb-1 block">Icon Tampilan</label>
                    <select 
                        value={formData.nama_icon}
                        onChange={e => setFormData(f => ({ ...f, nama_icon: e.target.value }))}
                        className={`w-full p-2 rounded border ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}
                    >
                        {ICON_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center mt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                        type="checkbox" 
                        checked={formData.status_layanan} 
                        onChange={e => setFormData(f => ({ ...f, status_layanan: e.target.checked }))}
                        className="w-5 h-5 text-olaTosca rounded"
                        />
                        <span className="font-medium">Tampilkan Layanan</span>
                    </label>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 border-t pt-4 border-gray-100/20">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border hover:bg-gray-100 transition text-sm">Batal</button>
          <button onClick={saveService} disabled={saving} className="px-4 py-2 rounded bg-olaTosca text-white font-bold hover:opacity-90 transition text-sm">
            {saving ? 'Menyimpan...' : 'Simpan Data'}
          </button>
        </div>
      </Modal>
    </Section>
  )
}