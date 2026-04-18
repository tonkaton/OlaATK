import React, { useState, useEffect, useRef } from 'react'
import { accountsAPI, usersAPI } from '../services/api'
import { cn } from '@/lib/utils'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { 
  UserCircle, Mail, Phone, Calendar, Key, 
  Trash2, Edit3, Search, RefreshCw, Plus, 
  ShieldCheck, MapPin, ChevronDown, Info 
} from 'lucide-react'

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 transition disabled:opacity-50 disabled:cursor-not-allowed"

export default function AkunPelanggan({ dark }) {
  const [search, setSearch] = useState("")
  const [accounts, setAccounts] = useState([])
  const [pelangganList, setPelangganList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({ 
    id_pelanggan: '', 
    nama_lengkap: '',
    alamat: '',
    email: '', 
    nomor_telepon: '', 
    password: '' 
  })

  useEffect(() => {
    fetchAccounts()
    fetchPelanggan()
  }, [page, search])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await accountsAPI.getAll(page, search)
      setAccounts(response.akunPelanggan || [])
      setPagination(response.pagination || { total: 0, totalPages: 0, limit: 10 })
      setError('')
    } catch (err) {
      setError('Gagal memuat daftar akun.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPelanggan = async () => {
    try {
      const response = await usersAPI.getAll(1, '', 1000)
      setPelangganList(response.pelanggan || [])
    } catch (err) { console.error(err) }
  }

  const openAdd = () => {
    setFormData({ id_pelanggan: '', nama_lengkap: '', alamat: '', email: '', nomor_telepon: '', password: '' })
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (acc) => {
    setFormData({
      id_pelanggan: acc.id_pelanggan,
      nama_lengkap: acc.pelanggan?.nama_lengkap || '',
      alamat: acc.pelanggan?.alamat || '',
      email: acc.email,
      nomor_telepon: acc.nomor_telepon,
      password: ''
    })
    setEditId(acc.id)
    setModalOpen(true)
  }

  const saveAccount = async () => {
    if (!formData.email || !formData.nomor_telepon || !formData.nama_lengkap) 
      return alert("Field Nama, Email, dan Telepon wajib diisi!")
    
    if (editId === null && (!formData.password?.trim() || !formData.id_pelanggan))
      return alert("Pilih pelanggan dan isi password untuk akun baru!")

    try {
      setSaving(true)
      const payload = {
        email: formData.email.trim(),
        nomor_telepon: formData.nomor_telepon.trim(),
        alamat: formData.alamat?.trim() || null,
        ...(formData.password.trim() && { hashed_password: formData.password.trim() })
      }

      if (editId) {
        await accountsAPI.update(editId, payload)
        // Sync data pelanggan juga jika nama/alamat berubah
        await usersAPI.update(formData.id_pelanggan, { 
          nama_lengkap: formData.nama_lengkap.trim(), 
          alamat: payload.alamat 
        })
      } else {
        payload.id_pelanggan = parseInt(formData.id_pelanggan)
        await accountsAPI.create(payload)
      }

      setModalOpen(false)
      fetchAccounts()
    } catch (err) {
      alert(err.message || "Gagal menyimpan akun")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Hapus akses akun untuk "${email}"? Pelanggan tetap ada, tapi akses login akan hilang.`)) return
    try {
      await accountsAPI.delete(id)
      fetchAccounts()
    } catch (err) { alert("Gagal menghapus akun") }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Akses Akun Pelanggan</h2>
          <p className="text-xs text-muted-foreground">Kelola kredensial login dan verifikasi data akun pelanggan.</p>
        </div>
        <button 
          onClick={openAdd} 
          className="flex items-center gap-2 px-4 py-2 bg-olaTosca hover:bg-olaTosca/90 text-white rounded-xl text-sm font-bold shadow-sm transition"
        >
          <Plus size={16} /> Tambah Akun
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} 
              placeholder="Cari email atau nomor telepon..." className={inputClass + " pl-9"} 
            />
          </div>
          <button onClick={fetchAccounts} className="p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground transition">
            <RefreshCw size={15} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-center gap-2">
            <Info size={14} /> {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Akun / Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pemilik (Profil)</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kontak</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Terdaftar</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-12 text-center text-muted-foreground">Menyingkronkan data...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan="5" className="p-12 text-center text-muted-foreground">Tidak ada akun ditemukan.</td></tr>
              ) : accounts.map(acc => (
                <tr key={acc.id} className="border-b border-border hover:bg-muted/20 transition group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-olaTosca/10 text-olaTosca">
                        <ShieldCheck size={16} />
                      </div>
                      <div className="font-bold text-foreground leading-tight">{acc.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                       <UserCircle size={14} className="text-muted-foreground" />
                       {acc.pelanggan?.nama_lengkap || 'Unknown'}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin size={10} /> {acc.pelanggan?.alamat || 'Alamat belum diatur'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                       <Phone size={12} /> {acc.nomor_telepon}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                       <Calendar size={12} /> {new Date(acc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(acc)} className="p-2 rounded-lg text-muted-foreground hover:text-olaTosca hover:bg-olaTosca/10 transition">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(acc.id, acc.email)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} maxPage={pagination.totalPages} />
      </div>

      {/* Modal Upgrade */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Konfigurasi Akun' : 'Buat Akun Baru'} dark={dark}>
        <div className="space-y-4 pt-2">
          {editId === null && (
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block tracking-widest">Pilih Pelanggan Existing</label>
              <div className="relative">
                <select 
                  value={formData.id_pelanggan} 
                  onChange={e => {
                    const sel = pelangganList.find(p => p.id === parseInt(e.target.value))
                    setFormData(f => ({ ...f, id_pelanggan: e.target.value, nama_lengkap: sel?.nama_lengkap || '', alamat: sel?.alamat || '' }))
                  }}
                  className={inputClass + " appearance-none cursor-pointer"}
                >
                  <option value="">-- Cari Pelanggan --</option>
                  {pelangganList.map(p => <option key={p.id} value={p.id}>{p.nama_lengkap} ({p.nomor_telepon})</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block tracking-widest text-olaBlue">Nama Lengkap</label>
              <input value={formData.nama_lengkap} onChange={e => setFormData(f => ({ ...f, nama_lengkap: e.target.value }))} className={inputClass} readOnly={!editId} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block tracking-widest">Email Akses</label>
              <input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="user@olaatk.com" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block tracking-widest">Alamat (Sinkron)</label>
            <textarea value={formData.alamat} onChange={e => setFormData(f => ({ ...f, alamat: e.target.value }))} className={inputClass} rows="2" readOnly={!editId} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block tracking-widest">No. Telepon</label>
              <input type="tel" value={formData.nomor_telepon} onChange={e => setFormData(f => ({ ...f, nomor_telepon: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block tracking-widest text-destructive">Security Password</label>
              <div className="relative">
                <input type="password" value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} className={inputClass + " pr-9"} placeholder={editId ? "••••••" : "Min. 6 Karakter"} />
                <Key size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
          {editId && <p className="text-[10px] text-muted-foreground italic">*Kosongkan password jika tidak ingin mengganti.</p>}
        </div>

        <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">Batal</button>
          <button 
            onClick={saveAccount} disabled={saving} 
            className="px-6 py-2 rounded-xl bg-olaTosca text-white font-bold hover:bg-olaTosca/90 transition shadow-sm disabled:opacity-50 text-sm"
          >
            {saving ? 'Processing...' : editId ? 'Simpan Perubahan' : 'Aktifkan Akun'}
          </button>
        </div>
      </Modal>
    </div>
  )
}