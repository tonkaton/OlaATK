import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell,
} from 'recharts'
import jsPDF from 'jspdf'
import { statsAPI, ordersAPI } from '../services/api'
import {
  BarChart2, Calendar, TrendingUp, Clock,
  ChevronLeft, ChevronRight, RefreshCw, Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { key: '1d',  label: 'Hari Ini' },
  { key: '7d',  label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: '3m',  label: '3 Bulan' },
  { key: '6m',  label: '6 Bulan' },
  { key: '1y',  label: '1 Tahun' },
]

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const BAR_COLORS = ['#06C7A7','#6C63FF','#3B82F6','#F59E0B','#EF4444','#EC4899','#14B8A6','#84CC16','#F97316','#8B5CF6']

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0)

const tabs = [
  { key: 'grafik',   label: 'Grafik',          icon: BarChart2 },
  { key: 'kalender', label: 'Kalender',          icon: Calendar },
  { key: 'terlaris', label: 'Terlaris',          icon: TrendingUp },
  { key: 'riwayat',  label: 'Riwayat Hari Ini', icon: Clock },
]

// ─────────────────────────────────────────────
// HELPER: local date key (fix timezone WIB)
// ─────────────────────────────────────────────
function toLocalDateKey(d) {
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`
}

// ─────────────────────────────────────────────
// PDF HELPERS
// ─────────────────────────────────────────────
const M = 15        // margin kiri/kanan
const G = [6,199,167]   // olaTosca
const DARK = [30,30,30]
const GRAY = [130,130,130]
const LIGHT_BG = [247,250,252]
const LINE_C = [220,225,230]

function pdfHeader(doc, title, subtitle) {
  // Header bar
  doc.setFillColor(...G)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(title, M, 14)

  // Subheader bar
  doc.setFillColor(245, 248, 250)
  doc.rect(0, 22, 210, 11, 'F')
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(subtitle, M, 29)
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 210 - M, 29, { align: 'right' })

  // Thin separator
  doc.setDrawColor(...G)
  doc.setLineWidth(0.5)
  doc.line(0, 33, 210, 33)

  return 42 // startY setelah header
}

function pdfSummaryRow(doc, cards, y) {
  const totalW = 210 - M * 2
  const cardW  = totalW / cards.length
  cards.forEach((card, i) => {
    const x = M + i * cardW
    doc.setFillColor(240, 253, 250)
    doc.setDrawColor(...G)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, cardW - 3, 18, 2, 2, 'FD')
    doc.setTextColor(...GRAY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(card.label.toUpperCase(), x + 4, y + 6)
    doc.setTextColor(...DARK)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(String(card.value), x + 4, y + 14)
  })
  return y + 24
}

function pdfTable(doc, headers, rows, colWidths, y) {
  const ROW_H    = 8
  const HEADER_H = 10
  const totalW   = colWidths.reduce((a, b) => a + b, 0)

  const drawHeader = (startY) => {
    doc.setFillColor(...G)
    doc.rect(M, startY, totalW, HEADER_H, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    let x = M
    headers.forEach((h, i) => {
      doc.text(h, x + 3, startY + 7)
      x += colWidths[i]
    })
    return startY + HEADER_H
  }

  y = drawHeader(y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)

  rows.forEach((row, ri) => {
    if (y + ROW_H > 282) {
      doc.addPage()
      y = pdfHeader(doc, headers.join(' | '), '') // minimal header on new page
      y = drawHeader(20)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
    }

    if (ri % 2 === 0) {
      doc.setFillColor(...LIGHT_BG)
      doc.rect(M, y, totalW, ROW_H, 'F')
    }

    doc.setTextColor(...DARK)
    let x = M
    row.forEach((cell, ci) => {
      const text   = String(cell ?? '-')
      const maxW   = colWidths[ci] - 6
      let truncated = text
      doc.setFontSize(7.5)
      while (doc.getTextWidth(truncated) > maxW && truncated.length > 1) {
        truncated = truncated.slice(0, -1)
      }
      if (truncated !== text) truncated = truncated.slice(0, -1) + '..'
      doc.text(truncated, x + 3, y + 5.5)
      x += colWidths[ci]
    })

    doc.setDrawColor(...LINE_C)
    doc.setLineWidth(0.2)
    doc.line(M, y + ROW_H, M + totalW, y + ROW_H)
    y += ROW_H
  })

  return y + 6
}

// ─────────────────────────────────────────────
// TOOLTIPS & BADGES
// ─────────────────────────────────────────────
const AreaTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{d.displayLabel}</p>
      <p className="text-muted-foreground">Pendapatan: <span className="text-olaTosca font-medium">{formatRupiah(payload[0].value)}</span></p>
      <p className="text-muted-foreground">Pesanan: <span className="text-foreground font-medium">{d.orders}</span></p>
    </div>
  )
}

const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs max-w-[180px]">
      <p className="font-semibold text-foreground mb-1 leading-tight">{d.nama}</p>
      <p className="text-muted-foreground">Terjual: <span className="text-olaTosca font-medium">{d.totalJumlah}x</span></p>
      <p className="text-muted-foreground">Revenue: <span className="text-foreground font-medium">{formatRupiah(d.totalRevenue)}</span></p>
    </div>
  )
}

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

// ─────────────────────────────────────────────
// TAB: GRAFIK
// ─────────────────────────────────────────────
function TabGrafik() {
  const [period, setPeriod]       = useState('7d')
  const [salesData, setSalesData] = useState([])
  const [salesDetail, setSalesDetail] = useState([])
  const [meta, setMeta]           = useState({ periodRevenue: 0, periodOrders: 0 })
  const [loading, setLoading]     = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await statsAPI.getDashboard(period)
      setMeta({ periodRevenue: data.periodRevenue || 0, periodOrders: data.periodOrders || 0 })
      setSalesDetail(data.salesDetail || [])
      
      const raw = data.salesData || data.weeklySales || []
      
      setSalesData(raw.map(item => {
        let label = item.displayLabel || item.day;
        
        // Parsing format '2026-W08' menjadi rentang tanggal '16 Feb - 22 Feb'
        if (typeof label === 'string' && label.includes('-W')) {
          const [yearStr, weekStr] = label.split('-W');
          const year = parseInt(yearStr, 10);
          const week = parseInt(weekStr, 10);
          
          // Kalkulasi awal minggu (Senin) berdasarkan ISO week
          const jan4 = new Date(year, 0, 4);
          const day = jan4.getDay() || 7;
          const monday = new Date(year, 0, 4 - day + 1);
          const startDate = new Date(monday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
          
          // Akhir minggu (Minggu)
          const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
          
          const formatOptions = { day: 'numeric', month: 'short' };
          const startFmt = startDate.toLocaleDateString('id-ID', formatOptions);
          const endFmt = endDate.toLocaleDateString('id-ID', formatOptions);
          
          label = `${startFmt} - ${endFmt}`;
        }

        return {
          displayLabel: label,
          sales:        item.sales,
          orders:       item.orders,
        }
      }))
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  const downloadPDF = () => {
    const doc = new jsPDF()
    const periodLabel = PERIOD_OPTIONS.find(p => p.key === period)?.label || period
    let y = pdfHeader(doc, 'Laporan Keuangan', `Periode: ${periodLabel} · ${meta.periodOrders} pesanan · ${formatRupiah(meta.periodRevenue)}`)
    y = pdfSummaryRow(doc, [
      { label: 'Total Revenue Periode', value: formatRupiah(meta.periodRevenue) },
      { label: 'Jumlah Pesanan',        value: `${meta.periodOrders} pesanan` },
    ], y)

    // ── Tabel Ringkasan per Periode ──
    y = pdfTable(doc,
      ['Periode', 'Pendapatan (Rp)', 'Pesanan'],
      salesData.map(d => [d.displayLabel, formatRupiah(d.sales), d.orders]),
      [80, 65, 35],
      y
    )

    // ── Rincian Produk per Tanggal ──
    const detailItems = salesDetail.flatMap(d =>
      d.products.map((p, i) => [
        i === 0 ? d.displayLabel : '',
        p.nama,
        formatRupiah(p.harga_satuan),
        p.totalJumlah,
        p.satuan_beli || 'PCS',
        formatRupiah(p.totalRevenue),
      ])
    )

    if (detailItems.length > 0) {
      // Spacer
      y += 4

      // Section title
      doc.setFillColor(6, 199, 167)
      doc.rect(15, y, 180, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text('Rincian Produk per Tanggal', 18, y + 5)
      y += 11

      y = pdfTable(doc,
        ['Tanggal', 'Nama Produk', 'Harga', 'Jml', 'Satuan', 'Revenue (Rp)'],
        detailItems,
        [30, 65, 28, 12, 18, 27],
        y
      )
    }

    doc.save(`laporan-keuangan-${period}-${toLocalDateKey(new Date())}.pdf`)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Grafik Keuangan</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {PERIOD_OPTIONS.find(p => p.key === period)?.label} · {formatRupiah(meta.periodRevenue)} · {meta.periodOrders} pesanan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadPDF} disabled={loading || salesData.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-40">
            <Download size={13} /> PDF
          </button>
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {PERIOD_OPTIONS.map(opt => (
          <button key={opt.key} onClick={() => setPeriod(opt.key)}
            className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all',
              period === opt.key ? 'bg-olaTosca text-white shadow-sm' : 'bg-accent text-muted-foreground hover:text-foreground'
            )}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-olaTosca border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, bottom: 5, left: 10, right: 10 }}>
              <defs>
                <linearGradient id="posGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06C7A7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06C7A7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="displayLabel" 
                minTickGap={20} 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                axisLine={{ stroke: '#334155' }} 
                tickLine={false} 
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => `Rp${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<AreaTooltip />} />
              <Area type="monotone" dataKey="sales" stroke="#06C7A7" strokeWidth={2} fill="url(#posGradient)" dot={{ r: 3, fill: '#06C7A7' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB: KALENDER
// ─────────────────────────────────────────────
function TabKalender() {
  const now = new Date()
  const [calYear, setCalYear]         = useState(now.getFullYear())
  const [calMonth, setCalMonth]       = useState(now.getMonth() + 1)
  const [calData, setCalData]         = useState(null)
  const [loading, setLoading]         = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)

  const fetchCalendar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await statsAPI.getCalendar(calYear, calMonth)
      setCalData(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [calYear, calMonth])

  useEffect(() => { fetchCalendar() }, [fetchCalendar])

  const moveMonth = (dir) => {
    setSelectedDay(null)
    if (dir === -1) {
      if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12) } else setCalMonth(m => m - 1)
    } else {
      if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1) } else setCalMonth(m => m + 1)
    }
  }

  const downloadPDF = () => {
    if (!calData) return
    const doc = new jsPDF()
    const bulan = `${MONTHS_ID[calMonth - 1]} ${calYear}`
    let y = pdfHeader(doc, `Rekap Keuangan — ${bulan}`, `${calData.totalOrders} pesanan · ${formatRupiah(calData.totalSales)}`)
    y = pdfSummaryRow(doc, [
      { label: 'Total Pesanan',    value: calData.totalOrders },
      { label: 'Total Pendapatan', value: formatRupiah(calData.totalSales) },
    ], y)
    y = pdfTable(doc,
      ['Tanggal', 'Pesanan', 'Pendapatan (Rp)'],
      calData.dailyData.map(d => [d.date, d.orders, formatRupiah(d.sales)]),
      [65, 30, 85],
      y
    )
    doc.save(`rekap-${calYear}-${calMonth.toString().padStart(2,'0')}.pdf`)
  }

  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay()
  const daysInMonth    = new Date(calYear, calMonth, 0).getDate()
  const dayMap         = new Map((calData?.dailyData || []).map(d => [d.date, d]))
  const maxSales       = Math.max(...(calData?.dailyData?.map(d => d.sales) || [1]), 1)
  const leadingEmpty   = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const todayKey       = toLocalDateKey(now)

  const cells = [
    ...Array(leadingEmpty).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const key = `${calYear}-${calMonth.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`
      return { day, key, data: dayMap.get(key) || null }
    }),
  ]

  const selectedData = selectedDay ? dayMap.get(selectedDay) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl border border-border">
            <button onClick={() => moveMonth(-1)} className="p-1.5 rounded-lg hover:bg-background shadow-sm transition text-muted-foreground hover:text-foreground">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm font-bold text-foreground w-24 sm:w-32 text-center uppercase tracking-widest">
              {MONTHS_ID[calMonth - 1]} {calYear}
            </span>
            <button onClick={() => moveMonth(1)} className="p-1.5 rounded-lg hover:bg-background shadow-sm transition text-muted-foreground hover:text-foreground">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {calData && (
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Revenue</p>
                <p className="text-sm font-black text-olaTosca">{formatRupiah(calData.totalSales)}</p>
              </div>
            )}
            <button onClick={downloadPDF} disabled={!calData || calData.dailyData?.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-40">
              <Download size={13} /> PDF
            </button>
            <button onClick={fetchCalendar} className="p-2.5 rounded-xl border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition">
              <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground uppercase pb-2">{d}</div>
          ))}
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} className="h-9" />
            const isToday    = cell.key === todayKey
            const isSelected = selectedDay === cell.key
            const intensity  = cell.data ? Math.max(0.1, cell.data.sales / maxSales) : 0
            return (
              <button
                key={cell.key}
                onClick={() => cell.data && setSelectedDay(isSelected ? null : cell.key)}
                disabled={!cell.data}
                className={cn(
                  'relative h-16 flex flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-200 border',
                  isSelected
                    ? 'bg-olaTosca text-white border-olaTosca shadow-lg shadow-olaTosca/25 scale-105 z-10'
                    : cell.data
                      ? 'border-transparent hover:border-olaTosca/30 hover:scale-105'
                      : 'bg-muted/10 border-transparent opacity-40 cursor-default',
                  isToday && !isSelected && 'ring-2 ring-olaTosca ring-offset-2 ring-offset-card'
                )}
                style={!isSelected && cell.data ? { backgroundColor: `rgba(6,199,167,${intensity * 0.4})` } : {}}
              >
                <span className={cn('text-xs sm:text-sm font-bold', isSelected ? 'text-white' : isToday ? 'text-olaTosca' : 'text-foreground')}>
                  {cell.day}
                </span>
                {cell.data && (
                  <span className={cn('text-[9px] sm:text-[10px] font-semibold mt-0.5', isSelected ? 'text-white/80' : 'text-muted-foreground')}>
                    {cell.data.orders}x
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="lg:col-span-5">
        <AnimatePresence mode="wait">
          {selectedDay && selectedData ? (
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm sticky top-6"
            >
              <div className="flex items-start justify-between border-b border-border/60 pb-4 mb-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Detail Transaksi</p>
                  <p className="text-sm font-bold text-foreground">
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-olaTosca/10 flex items-center justify-center text-olaTosca">
                  <Calendar size={18} />
                </div>
              </div>
              <div className="mb-6">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Pendapatan</p>
                <p className="text-3xl font-black text-olaTosca">{formatRupiah(selectedData.sales)}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1">Dari {selectedData.orders} pesanan selesai</p>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase sticky top-0 bg-card py-1">Rincian Layanan</p>
                {selectedData.details.map((d, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground truncate pr-3 flex-1">{d.jenis}</span>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-foreground">{formatRupiah(d.nilai)}</span>
                      </div>
                    </div>
                    {d.produk && d.produk.length > 0 && (
                      <div className="mt-1.5 ml-1 pl-2 border-l-2 border-olaTosca/30 space-y-0.5">
                        {d.produk.map((p, pIdx) => (
                          <p key={pIdx} className="text-[10px] text-muted-foreground">
                            {p.jumlah} {p.nama} — {formatRupiah(p.harga_satuan * p.jumlah)}
                          </p>
                        ))}
                      </div>
                    )}
                    {d.kembalian > 0 && (
                      <p className="text-[9px] text-muted-foreground mt-1">Kembalian {formatRupiah(d.kembalian)}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/60 rounded-2xl bg-muted/5"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <BarChart2 size={20} className="text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-foreground mb-1">Pilih Tanggal</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Klik pada tanggal yang memiliki highlight warna untuk melihat rincian pendapatan.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB: TERLARIS
// ─────────────────────────────────────────────
function TabTerlaris() {
  const [period, setPeriod]           = useState('30d')
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading]         = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await statsAPI.getTopProducts(period)
      setTopProducts(data.topProducts || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  const downloadPDF = () => {
    const doc = new jsPDF()
    const periodLabel = PERIOD_OPTIONS.find(p => p.key === period)?.label || period
    let y = pdfHeader(doc, 'Laporan Produk & Layanan Terlaris', `Periode: ${periodLabel} · ${topProducts.length} item`)
    y = pdfTable(doc,
      ['#', 'Nama Produk / Layanan', 'Terjual', 'Revenue (Rp)'],
      topProducts.map((p, i) => [i + 1, p.nama, `${p.totalJumlah}`, formatRupiah(p.totalRevenue)]),
      [12, 93, 25, 50],
      y
    )
    doc.save(`produk-terlaris-${period}-${toLocalDateKey(new Date())}.pdf`)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Produk Terlaris</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Berdasarkan total pesanan SELESAI</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {PERIOD_OPTIONS.filter(p => p.key !== '1d').map(opt => (
            <button key={opt.key} onClick={() => setPeriod(opt.key)}
              className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all',
                period === opt.key ? 'bg-olaTosca text-white' : 'bg-accent text-muted-foreground hover:text-foreground'
              )}>
              {opt.label}
            </button>
          ))}
          <button onClick={downloadPDF} disabled={loading || topProducts.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-40">
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-56 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-olaTosca border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts.slice(0, 8)} layout="vertical" margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nama" width={90} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v.slice(0, 12) + (v.length > 12 ? '..' : '')} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="totalJumlah" radius={[0, 4, 4, 0]}>
                  {topProducts.slice(0, 8).map((_, idx) => <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {topProducts.slice(0, 10).map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/10 border border-border/50">
                <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.nama}</p>
                  <p className="text-[10px] text-muted-foreground">{formatRupiah(p.totalRevenue)}</p>
                </div>
                <span className="text-xs font-bold text-olaTosca">{p.totalJumlah}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TAB: RIWAYAT HARI INI
// ─────────────────────────────────────────────
function TabRiwayat() {
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchRiwayat = useCallback(async () => {
    try {
      setLoading(true)
      const res = await ordersAPI.getAll(1, '', '', 100)
      const all = res.pesanan || res.data?.pesanan || []
      const todayStr = toLocalDateKey(new Date())
      setOrders(all.filter(o => toLocalDateKey(new Date(o.created_at)) === todayStr))
      setLastUpdate(new Date())
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchRiwayat()
    const interval = setInterval(fetchRiwayat, 30000)
    return () => clearInterval(interval)
  }, [fetchRiwayat])

  const revenue      = orders.filter(o => o.status === 'SELESAI').reduce((s, o) => s + (o.nilai_pesanan || 0), 0)
  const countOnline  = orders.filter(o => o.mode_pesanan === 'ONLINE').length
  const countOffline = orders.filter(o => o.mode_pesanan === 'OFFLINE').length

  const downloadPDF = () => {
    const doc = new jsPDF()
    const todayFormatted = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    let y = pdfHeader(doc, 'Riwayat Transaksi Harian', todayFormatted)
    y = pdfSummaryRow(doc, [
      { label: 'Total Transaksi', value: orders.length },
      { label: 'Revenue Selesai', value: formatRupiah(revenue) },
      { label: 'Online',          value: countOnline },
      { label: 'Offline',         value: countOffline },
    ], y)
    y = pdfTable(doc,
      ['Waktu', 'Pelanggan', 'Layanan', 'Total (Rp)', 'Status'],
      orders.map(o => [
        new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        o.pelanggan?.nama_lengkap || '-',
        o.jenis_layanan,
        formatRupiah(o.nilai_pesanan),
        o.status,
      ]),
      [20, 38, 55, 38, 29],
      y
    )
    doc.save(`riwayat-${toLocalDateKey(new Date())}.pdf`)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Transaksi', val: orders.length,          color: 'text-foreground' },
          { label: 'Revenue',   val: formatRupiah(revenue),  color: 'text-olaTosca' },
          { label: 'Online',    val: countOnline,             color: 'text-olaBlue' },
          { label: 'Offline',   val: countOffline,            color: 'text-orange-500' },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border p-4 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={cn('text-lg font-bold', s.color)}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Transaksi Hari Ini</h3>
            {lastUpdate && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Update: {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadPDF} disabled={loading || orders.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-40">
              <Download size={13} /> PDF
            </button>
            <button onClick={fetchRiwayat} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Waktu</th>
                <th className="px-4 py-3 text-left">Pelanggan</th>
                <th className="px-4 py-3 text-left">Layanan</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada transaksi hari ini.</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="border-b border-border hover:bg-muted/20 transition last:border-0">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{o.pelanggan?.nama_lengkap || '-'}</td>
                  <td className="px-4 py-3 text-olaBlue">{o.jenis_layanan}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">{formatRupiah(o.nilai_pesanan)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function PointOfSales({ dark }) {
  const [activeTab, setActiveTab] = useState('grafik')

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit border border-border">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
              activeTab === t.key ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
            )}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
          {activeTab === 'grafik'   && <TabGrafik />}
          {activeTab === 'kalender' && <TabKalender />}
          {activeTab === 'terlaris' && <TabTerlaris />}
          {activeTab === 'riwayat'  && <TabRiwayat />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}