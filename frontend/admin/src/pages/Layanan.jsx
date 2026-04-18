import React, { useState, useEffect } from 'react'
import { servicesAPI } from '../services/api'
import { cn } from '@/lib/utils'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { 
  Printer, Book, Copy, Layers, Scan, Palette, 
  Edit3, Trash2, Search, RefreshCw, Plus, 
  Wrench, CheckCircle2, XCircle, Info
} from 'lucide-react'

// Icon Options Mapper
const ICON_MAP = {
  printer: { icon: Printer, label: 'Cetak/Print' },
  copy:    { icon: Copy, label: 'Fotokopi' },
  book:    { icon: Book, label: 'Jilid' },
  layers:  { icon: Layers, label: 'Laminating' },
  scan:    { icon: Scan, label: 'Scan' },
  palette: { icon: Palette, label: 'Desain' },
}

const ICON_OPTIONS = Object.entries(ICON_MAP).map(([key, val]) => ({
  value: key,
  label: val.label,
  IconComponent: val.icon
}))

// Status Badge Component
const ServiceStatusBadge = ({ isActive }) => (
  <span className={cn(
    'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tight inline-flex items-center gap-1',
    isActive 
      ? 'bg-olaTosca/10 text-olaTosca border-olaTosca/20' 
      : 'bg-muted text-muted-foreground border-border'
  )}>
    {isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
    {isActive ? 'Aktif' : 'Nonaktif'}
  </span>
)

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 transition"

export default function Layanan({ dark }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })

  const [formData, setFormData] = useState({ 
    nama: '', 
    deskripsi: '', 
    nama_icon: 'printer', 
    status_layanan: true 
  })

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
    if (!formData.nama || !formData.deskripsi) return alert('Nama & Deskripsi wajib diisi!')
    try {
      setSaving(true)
      if (editId) await servicesAPI.update(editId, formData)
      else await servicesAPI.create(formData)
      setModalOpen(false)
      fetchServices()
    } catch (err) {
      alert('Gagal menyimpan layanan')
    } finally {
      setSaving(false)
    }
  }

  const delService = async (id, name) => {
    if (!window.confirm(`Hapus layanan "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await servicesAPI.delete(id)
      fetchServices()
    } catch (err) { alert('Gagal menghapus layanan') }
  }

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Katalog Layanan</h2>
          <p className="text-xs text-muted-foreground">Konfigurasi jenis layanan cetak dan fotokopi yang tersedia.</p>
        </div>
        <button 
          onClick={openAdd} 
          className="flex items-center gap-2 px-4 py-2 bg-olaTosca hover:bg-olaTosca/90 text-white rounded-xl text-sm font-bold shadow-sm transition"
        >
          <Plus size={16} /> Tambah Layanan
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1) }} 
              placeholder="Cari nama layanan..." 
              className={inputClass + " pl-9"} 
            />
          </div>
          <button 
            onClick={fetchServices} 
            className="p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition"
          >
            <RefreshCw size={15} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-center gap-2">
            <Info size={14} /> {error}
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Layanan</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Icon</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-12 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan="5" className="p-12 text-center text-muted-foreground">Belum ada layanan terdaftar.</td></tr>
              ) : services.map(s => {
                const IconComp = ICON_MAP[s.nama_icon]?.icon || Wrench
                return (
                  <tr key={s.id} className="border-b border-border hover:bg-muted/20 transition group">
                    <td className="px-4 py-4 font-mono text-[10px] text-muted-foreground">#{s.id}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-foreground">{s.nama}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{s.deskripsi}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="p-1.5 rounded-md bg-olaBlue/5 border border-olaBlue/10 text-olaBlue">
                           <IconComp size={14} />
                        </div>
                        <span className="capitalize">{s.nama_icon}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <ServiceStatusBadge isActive={s.status_layanan} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-muted-foreground hover:text-olaBlue hover:bg-olaBlue/10 transition">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => delService(s.id, s.nama)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} setPage={setPage} maxPage={pagination.totalPages} />
      </div>

      {/* MODAL INPUT - UPGRADED LOOK */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Layanan' : 'Layanan Baru'} dark={dark}>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block tracking-widest">Nama Layanan</label>
            <input 
              value={formData.nama} 
              onChange={e => setFormData(f => ({ ...f, nama: e.target.value }))} 
              placeholder="Contoh: Print Dokumen" 
              className={inputClass}
            />
          </div>
          
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block tracking-widest">Deskripsi</label>
            <textarea 
              value={formData.deskripsi} 
              onChange={e => setFormData(f => ({ ...f, deskripsi: e.target.value }))} 
              placeholder="Jelaskan apa yang didapat pelanggan..." 
              className={inputClass}
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block tracking-widest">Icon Display</label>
              <select 
                value={formData.nama_icon}
                onChange={e => setFormData(f => ({ ...f, nama_icon: e.target.value }))}
                className={inputClass}
              >
                {ICON_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col justify-end pb-1.5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.status_layanan} 
                  onChange={e => setFormData(f => ({ ...f, status_layanan: e.target.checked }))}
                  className="w-4 h-4 text-olaTosca border-border rounded transition cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground group-hover:text-olaTosca transition">Status Aktif</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">Batal</button>
          <button 
            onClick={saveService} 
            disabled={saving} 
            className="px-6 py-2 rounded-xl bg-olaTosca text-white font-bold hover:bg-olaTosca/90 transition shadow-sm disabled:opacity-50 text-sm"
          >
            {saving ? 'Menyimpan...' : editId ? 'Perbarui Layanan' : 'Tambah Layanan'}
          </button>
        </div>
      </Modal>
    </div>
  )
}