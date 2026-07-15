import React, { useState, useEffect, useCallback } from 'react'
import jsPDF from 'jspdf'
import { productsAPI, statsAPI } from '../services/api'
import { Plus, Pencil, Trash2, Package, X, Download, RefreshCw, BarChart2, List } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { key: '7d',  label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: '3m',  label: '3 Bulan' },
  { key: '6m',  label: '6 Bulan' },
  { key: '1y',  label: '1 Tahun' },
]

const BAR_COLORS = ['#06C7A7','#6C63FF','#3B82F6','#F59E0B','#EF4444','#EC4899','#14B8A6','#84CC16','#F97316','#8B5CF6']

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0)

const SATUAN_OPTIONS = ['PCS', 'RIM', 'BOX', 'PAK', 'LBR', 'DUS']

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-olaTosca/40 focus:border-olaTosca/60 transition disabled:opacity-50"

const tabs = [
  { key: 'produk',  label: 'Produk',  icon: List },
  { key: 'laporan', label: 'Laporan', icon: BarChart2 },
]

// ─────────────────────────────────────────────
// PDF HELPERS
// ─────────────────────────────────────────────
const M = 15
const toLocalDateKey = (d) =>
  `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`

function pdfHeader(doc, title, subtitle) {
  doc.setFillColor(6, 199, 167)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(title, M, 14)

  doc.setFillColor(245, 248, 250)
  doc.rect(0, 22, 210, 11, 'F')
  doc.setTextColor(130, 130, 130)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(subtitle, M, 29)
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 210 - M, 29, { align: 'right' })

  doc.setDrawColor(6, 199, 167)
  doc.setLineWidth(0.5)
  doc.line(0, 33, 210, 33)

  return 42
}

function pdfTable(doc, headers, rows, colWidths, y) {
  const ROW_H = 8, HEADER_H = 10
  const totalW = colWidths.reduce((a, b) => a + b, 0)

  const drawHeader = (startY) => {
    doc.setFillColor(6, 199, 167)
    doc.rect(M, startY, totalW, HEADER_H, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    let x = M
    headers.forEach((h, i) => { doc.text(h, x + 3, startY + 7); x += colWidths[i] })
    return startY + HEADER_H
  }

  y = drawHeader(y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)

  rows.forEach((row, ri) => {
    if (y + ROW_H > 282) {
      doc.addPage()
      y = drawHeader(20)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
    }
    if (ri % 2 === 0) {
      doc.setFillColor(247, 250, 252)
      doc.rect(M, y, totalW, ROW_H, 'F')
    }
    doc.setTextColor(30, 30, 30)
    let x = M
    row.forEach((cell, ci) => {
      const text = String(cell ?? '-')
      const maxW = colWidths[ci] - 6
      let t = text
      while (doc.getTextWidth(t) > maxW && t.length > 1) t = t.slice(0, -1)
      if (t !== text) t = t.slice(0, -1) + '..'
      doc.text(t, x + 3, y + 5.5)
      x += colWidths[ci]
    })
    doc.setDrawColor(220, 225, 230)
    doc.setLineWidth(0.2)
    doc.line(M, y + ROW_H, M + totalW, y + ROW_H)
    y += ROW_H
  })

  return y + 6
}

// ─────────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────────
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1 max-w-[160px] leading-tight">{d.nama}</p>
      <p className="text-muted-foreground">Terjual: <span className="text-olaTosca font-medium">{d.totalTerjual ?? d.totalJumlah} unit</span></p>
      {d.jumlah_stok !== undefined && (
        <p className="text-muted-foreground">Sisa stok: <span className="text-foreground font-medium">{d.jumlah_stok} unit</span></p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function Produk({ dark }) {
  const [activeTab, setActiveTab] = useState('produk')

  // ── State produk
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 })

  // ── State modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId]       = useState(null)
  const [formData, setFormData]   = useState({ nama: '', jumlah_stok: '', harga_satuan: '', satuan: 'PCS', isi_per_satuan: '' })
  const [saving, setSaving]       = useState(false)

  // ── State laporan
  const [period, setPeriod]               = useState('30d')
  const [periodData, setPeriodData]       = useState([])
  const [periodLoading, setPeriodLoading] = useState(true)

  useEffect(() => { fetchProducts() }, [page, search])

  useEffect(() => {
    if (activeTab === 'laporan') fetchPeriodData()
  }, [activeTab, period])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await productsAPI.getAll(page, search)
      setProducts(response.stokBarang || [])
      setPagination(response.pagination || { total: 0, totalPages: 0, limit: 10 })
      setError('')
    } catch (err) {
      setError(err.message || 'Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }

  const fetchPeriodData = useCallback(async () => {
    try {
      setPeriodLoading(true)
      const data = await statsAPI.getTopProducts(period, 10, true)
      setPeriodData(data.topProducts || [])
    } catch (e) {
      console.error(e)
    } finally {
      setPeriodLoading(false)
    }
  }, [period])

  const openAdd = () => {
    setFormData({ nama: '', jumlah_stok: '', harga_satuan: '', satuan: 'PCS', isi_per_satuan: '' })
    setEditId(null)
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setFormData({ nama: p.nama, jumlah_stok: p.jumlah_stok, harga_satuan: p.harga_satuan, satuan: p.satuan || 'PCS', isi_per_satuan: p.isi_per_satuan ?? '' })
    setEditId(p.id)
    setModalOpen(true)
  }

  const saveProduct = async () => {
    if (!formData.nama || !formData.jumlah_stok || !formData.harga_satuan) {
      setError('Semua field harus diisi'); return
    }
    try {
      setSaving(true)
      const data = {
        nama:            formData.nama,
        jumlah_stok:     parseInt(formData.jumlah_stok),
        harga_satuan:    parseFloat(formData.harga_satuan),
        satuan:          formData.satuan,
        isi_per_satuan:  formData.isi_per_satuan !== '' ? parseInt(formData.isi_per_satuan) : undefined,
      }
      if (editId !== null) await productsAPI.update(editId, data)
      else await productsAPI.create(data)
      setModalOpen(false)
      fetchProducts()
      setError('')
    } catch (err) {
      setError(err.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const delProduct = async (id) => {
    if (!window.confirm('Hapus produk ini?')) return
    try {
      await productsAPI.delete(id)
      fetchProducts()
    } catch (err) {
      setError(err.message || 'Gagal menghapus')
    }
  }

  // ── Summary
  const totalUnit    = products.reduce((s, p) => s + p.jumlah_stok, 0)
  const totalNilai   = products.reduce((s, p) => s + p.jumlah_stok * p.harga_satuan, 0)
  const totalTerjual = products.reduce((s, p) => s + (p.totalTerjual || 0), 0)

  const chartDataAllTime = [...products]
    .filter(p => (p.totalTerjual || 0) > 0)
    .sort((a, b) => (b.totalTerjual || 0) - (a.totalTerjual || 0))
    .slice(0, 5)

  // ── PDF Stok
  const downloadStokPDF = () => {
    const doc = new jsPDF()
    let y = pdfHeader(doc, 'Laporan Stok Produk', `${pagination.total} produk terdaftar`)

    const cards = [
      { label: 'Total Produk',   value: `${pagination.total} item` },
      { label: 'Total Terjual',  value: `${totalTerjual} ${products.length > 0 ? (products[0].satuan?.toLowerCase() || 'unit') : 'unit'}` },
      { label: 'Nilai Stok',    value: formatRupiah(totalNilai) },
    ]
    const cardW = (210 - M * 2) / cards.length
    cards.forEach((card, i) => {
      const x = M + i * cardW
      doc.setFillColor(240, 253, 250)
      doc.setDrawColor(6, 199, 167)
      doc.setLineWidth(0.3)
      doc.roundedRect(x, y, cardW - 3, 18, 2, 2, 'FD')
      doc.setTextColor(130, 130, 130)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text(card.label.toUpperCase(), x + 4, y + 6)
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(card.value, x + 4, y + 14)
    })
    y += 24

    y = pdfTable(doc,
      ['Nama Produk', 'Masuk', 'Terjual', 'Sisa', 'Harga', 'Satuan', 'Nilai Stok'],
      products.map(p => {
        const terjual = p.totalTerjual || 0
        const sisa    = p.jumlah_stok
        const satuanLabel = p.isi_per_satuan ? `${p.isi_per_satuan} / ${p.satuan}` : (p.satuan || 'PCS')
        return [p.nama, `${terjual + sisa}`, `${terjual}`, `${sisa}`, formatRupiah(p.harga_satuan), satuanLabel, formatRupiah(sisa * p.harga_satuan)]
      }),
      [48, 18, 18, 18, 28, 24, 26],
      y
    )
    doc.save(`laporan-stok-${toLocalDateKey(new Date())}.pdf`)
  }

  // ── PDF Periode
  const downloadPeriodPDF = () => {
    const doc = new jsPDF()
    const periodLabel = PERIOD_OPTIONS.find(p => p.key === period)?.label || period
    const totalTerjualPeriod = periodData.reduce((s, p) => s + (p.totalJumlah || 0), 0)
    const totalRevenuePeriod = periodData.reduce((s, p) => s + (p.totalRevenue || 0), 0)
    let y = pdfHeader(doc, 'Laporan Penjualan Produk', `Periode: ${periodLabel} · ${periodData.length} produk · ${totalTerjualPeriod} unit terjual · ${formatRupiah(totalRevenuePeriod)}`)

    const cards = [
      { label: 'Produk Terjual', value: `${periodData.length} item` },
      { label: 'Total Terjual',  value: `${totalTerjualPeriod} unit` },
      { label: 'Total Revenue',  value: formatRupiah(totalRevenuePeriod) },
    ]
    const cardW = (210 - M * 2) / cards.length
    cards.forEach((card, i) => {
      const x = M + i * cardW
      doc.setFillColor(240, 253, 250)
      doc.setDrawColor(6, 199, 167)
      doc.setLineWidth(0.3)
      doc.roundedRect(x, y, cardW - 3, 18, 2, 2, 'FD')
      doc.setTextColor(130, 130, 130)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text(card.label.toUpperCase(), x + 4, y + 6)
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(String(card.value), x + 4, y + 14)
    })
    y += 24

    y = pdfTable(doc,
      ['#', 'Nama Produk', 'Harga', 'Satuan', 'Terjual', 'Revenue (Rp)'],
      periodData.map((p, i) => [
        i + 1,
        p.nama,
        p.harga_satuan ? formatRupiah(p.harga_satuan) : '-',
        p.satuan_beli || 'PCS',
        `${p.totalJumlah}`,
        formatRupiah(p.totalRevenue),
      ]),
      [10, 70, 32, 22, 25, 41],
      y
    )
    doc.save(`penjualan-produk-${period}-${toLocalDateKey(new Date())}.pdf`)
  }

  return (
    <>
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Produk & Stok</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{pagination.total} produk terdaftar</p>
        </div>
        {activeTab === 'produk' && (
          <div className="flex items-center gap-2">
            <button onClick={downloadStokPDF} disabled={loading || products.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-40">
              <Download className="w-4 h-4" /> PDF Stok
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-3 py-2 bg-olaTosca hover:bg-olaTosca/90 text-white text-sm font-medium rounded-lg transition">
              <Plus className="w-4 h-4" /> Tambah Produk
            </button>
          </div>
        )}
      </div>

      {/* ── TAB SWITCH ── */}
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

      {/* ══════════════════════════════════════════
          TAB: PRODUK
      ══════════════════════════════════════════ */}
      {activeTab === 'produk' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Produk',    value: pagination.total + ' item', color: 'text-foreground' },
              { label: 'Total Unit Sisa', value: totalUnit + ' unit',        color: 'text-olaTosca' },
              { label: 'Total Terjual',   value: totalTerjual + ' unit',     color: 'text-olaBlue' },
              { label: 'Nilai Stok',      value: formatRupiah(totalNilai),   color: 'text-startupPurple' },
            ].map((card, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                <p className={cn('text-sm font-bold', card.color)}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Chart all time */}
          {chartDataAllTime.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Terlaris — All Time</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Total penjualan sejak awal (exclude BATAL)</p>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataAllTime} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nama" width={110} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                      tickFormatter={v => v.length > 14 ? v.slice(0, 14) + '..' : v} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="totalTerjual" radius={[0, 4, 4, 0]}>
                      {chartDataAllTime.map((_, idx) => (
                        <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabel */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari produk..." className={inputClass} />
            </div>

            {error && (
              <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">{error}</div>
            )}

            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Belum ada produk</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Nama Produk', 'Masuk', 'Terjual', 'Sisa', 'Harga', 'Satuan', 'Aksi'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => {
                      const terjual = p.totalTerjual || 0
                      const sisa    = p.jumlah_stok
                      const masuk   = terjual + sisa
                      return (
                        <tr key={p.id} className={cn('border-b border-border last:border-0 hover:bg-muted/20 transition', i % 2 !== 0 && 'bg-muted/10')}>
                          <td className="px-4 py-3 font-medium text-foreground">{p.nama}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground font-medium">{masuk} unit</td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border',
                              terjual > 0 ? 'bg-olaBlue/10 text-olaBlue border-olaBlue/20' : 'bg-muted text-muted-foreground border-border'
                            )}>
                              {terjual} unit
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border',
                              sisa > 10 ? 'bg-olaTosca/10 text-olaTosca border-olaTosca/20' :
                              sisa > 0  ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                          'bg-destructive/10 text-destructive border-destructive/20'
                            )}>
                              {sisa} unit
                            </span>
                          </td>
                          <td className="px-4 py-3 text-foreground text-xs">{formatRupiah(p.harga_satuan)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {p.isi_per_satuan ? `${p.isi_per_satuan} / ${p.satuan}` : p.satuan || 'PCS'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(p)}
                                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => delProduct(p.id)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Halaman {page} dari {pagination.totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition">
                    ← Prev
                  </button>
                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                    className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: LAPORAN
      ══════════════════════════════════════════ */}
      {activeTab === 'laporan' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Penjualan Per Periode</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {PERIOD_OPTIONS.find(p => p.key === period)?.label} · {periodData.length} produk terjual · status Selesai
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={downloadPeriodPDF} disabled={periodLoading || periodData.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-40">
                <Download size={13} /> PDF
              </button>
              <button onClick={fetchPeriodData} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {PERIOD_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => setPeriod(opt.key)}
                className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  period === opt.key ? 'bg-olaTosca text-white shadow-sm' : 'bg-accent text-muted-foreground hover:text-foreground'
                )}>
                {opt.label}
              </button>
            ))}
          </div>

          {periodLoading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-olaTosca border-t-transparent rounded-full animate-spin" />
            </div>
          ) : periodData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodData.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nama" width={110} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                      tickFormatter={v => v.length > 14 ? v.slice(0, 14) + '..' : v} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="totalJumlah" radius={[0, 4, 4, 0]}>
                      {periodData.slice(0, 8).map((_, idx) => (
                        <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {periodData.slice(0, 10).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/10 border border-border/50">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                      i === 0 ? 'bg-amber-400/20 text-amber-400' :
                      i === 1 ? 'bg-slate-400/20 text-slate-400' :
                      i === 2 ? 'bg-orange-400/20 text-orange-400' :
                                'bg-accent text-muted-foreground'
                    )}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{p.nama}</p>
                      <p className="text-[10px] text-muted-foreground">{formatRupiah(p.totalRevenue)}</p>
                    </div>
                    <span className="text-xs font-bold text-olaTosca shrink-0">{p.totalJumlah}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
              Belum ada penjualan pada periode ini
            </div>
          )}
        </div>
      )}

      {/* ── MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">
                {editId !== null ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Nama Produk</label>
                <input value={formData.nama} onChange={e => setFormData(f => ({ ...f, nama: e.target.value }))}
                  placeholder="Contoh: Kertas HVS A4" className={inputClass} disabled={saving} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Jumlah Stok</label>
                <input value={formData.jumlah_stok} onChange={e => setFormData(f => ({ ...f, jumlah_stok: e.target.value }))}
                  placeholder="0" type="number" min="0" className={inputClass} disabled={saving} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Harga Satuan (Rp)</label>
                <input value={formData.harga_satuan} onChange={e => setFormData(f => ({ ...f, harga_satuan: e.target.value }))}
                  placeholder="0" type="number" min="0" className={inputClass} disabled={saving} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Satuan</label>
                <select value={formData.satuan} onChange={e => setFormData(f => ({ ...f, satuan: e.target.value, isi_per_satuan: e.target.value === 'PCS' ? '' : f.isi_per_satuan }))}
                  className={inputClass} disabled={saving}>
                  {SATUAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {formData.satuan !== 'PCS' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Isi per {formData.satuan} (PCS)</label>
                  <input value={formData.isi_per_satuan} onChange={e => setFormData(f => ({ ...f, isi_per_satuan: e.target.value }))}
                    placeholder="Contoh: 500" type="number" min="1" className={inputClass} disabled={saving} />
                </div>
              )}
            </div>
            {error && (
              <div className="mt-3 p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-xs">{error}</div>
            )}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalOpen(false)} disabled={saving}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent text-foreground transition disabled:opacity-50">
                Batal
              </button>
              <button onClick={saveProduct} disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-olaTosca hover:bg-olaTosca/90 text-white font-medium transition disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}