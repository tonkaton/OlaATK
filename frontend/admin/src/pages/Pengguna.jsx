import React, { useState, useEffect } from 'react'
import { usersAPI } from '../services/api'
import { cn } from '@/lib/utils'
import { 
  Users, Search, RefreshCw, Trash2, MapPin, 
  Mail, Phone, UserCheck, UserMinus 
} from 'lucide-react'

// Helper Badge buat status akun
const AccountBadge = ({ hasAccount }) => (
  <span className={cn(
    'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tight',
    hasAccount 
      ? 'bg-olaBlue/10 text-olaBlue border-olaBlue/20' 
      : 'bg-muted text-muted-foreground border-border'
  )}>
    {hasAccount ? 'Registered' : 'Guest'}
  </span>
)

export default function Pengguna({ dark }) {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getAll(page, search)
      setUsers(response.pelanggan || [])
      setPagination(response.pagination || { total: 0, totalPages: 0, limit: 10 })
      setError('')
    } catch (err) {
      setError(err.message || 'Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus data pelanggan "${name}"? Tindakan ini permanen.`)) return
    try {
      await usersAPI.delete(id)
      fetchUsers()
    } catch (err) {
      alert(err.message || 'Gagal menghapus pengguna')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Database Pengguna</h2>
          <p className="text-xs text-muted-foreground">Kelola data pengguna dan riwayat pendaftaran akun.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-olaTosca bg-olaTosca/5 px-3 py-1.5 rounded-lg border border-olaTosca/20">
          <Users size={14} /> Total: {pagination.total}
        </div>
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
              placeholder="Cari nama, nomor telepon, atau alamat..." 
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 transition" 
            />
          </div>
          <button 
            onClick={fetchUsers} 
            className="p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition"
          >
            <RefreshCw size={15} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["ID", "Informasi Pelanggan", "Kontak", "Alamat", "Status Akun", "Aksi"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-sm text-muted-foreground">Memuat data...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-sm text-muted-foreground">Data pelanggan tidak ditemukan.</td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-border hover:bg-muted/20 transition group">
                  <td className="px-4 py-4 font-mono text-[10px] text-muted-foreground">#{u.id}</td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-foreground">{u.nama_lengkap}</div>
                    {u.akunPelanggan && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Mail size={10} /> {u.akunPelanggan.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <Phone size={12} className="text-olaBlue" />
                      {u.nomor_telepon}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-[200px]">
                      <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                      <span className="truncate">{u.alamat || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <AccountBadge hasAccount={!!u.akunPelanggan} />
                  </td>
                  <td className="px-4 py-4">
                    <button 
                      onClick={() => handleDelete(u.id, u.nama_lengkap)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      title="Hapus Pelanggan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/5">
            <p className="text-[11px] text-muted-foreground">
              Menampilkan halaman <span className="font-bold text-foreground">{page}</span> dari <span className="font-bold text-foreground">{pagination.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1} 
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-40 transition"
              >
                Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} 
                disabled={page === pagination.totalPages} 
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}