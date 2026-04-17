import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { statsAPI } from '../services/api'
import { TrendingUp, Users, ShoppingBag, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const statConfig = [
  { key: 'ordersToday',     label: 'Pesanan Hari Ini', icon: ShoppingBag, color: 'text-olaTosca',      bg: 'bg-olaTosca/10',      border: 'border-olaTosca/20' },
  { key: 'totalCustomers',  label: 'Total Pelanggan',  icon: Users,        color: 'text-olaBlue',       bg: 'bg-olaBlue/10',       border: 'border-olaBlue/20' },
  { key: 'revenue',         label: 'Total Pendapatan', icon: TrendingUp,   color: 'text-startupPurple', bg: 'bg-startupPurple/10', border: 'border-startupPurple/20' },
]

export default function Dashboard({ dark }) {
  const [stats, setStats] = useState({ ordersToday: 0, totalCustomers: 0, revenue: 'Rp0' })
  const [salesData, setSalesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await statsAPI.getDashboard()
      const data = response.data || response
      setStats({
        ordersToday: data.ordersToday || 0,
        totalCustomers: data.totalCustomers || 0,
        revenue: formatRupiah(data.totalRevenue || 0)
      })
      if (data.weeklySales?.length > 0) {
        setSalesData(data.weeklySales.map(item => ({
          day: item.day,
          dateLabel: item.dateLabel,
          displayLabel: item.day,
          sales: item.sales,
          orders: item.orders
        })))
      }
      setError('')
    } catch (err) {
      setError(err.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-foreground mb-1">{payload[0].payload.day}, {payload[0].payload.dateLabel}</p>
        <p className="text-muted-foreground">Pendapatan: <span className="text-olaTosca font-medium">{formatRupiah(payload[0].value)}</span></p>
        <p className="text-muted-foreground">Pesanan: <span className="text-foreground font-medium">{payload[0].payload.orders}</span></p>
      </div>
    )
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-80 bg-card border border-border rounded-xl animate-pulse" />
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">{error}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statConfig.map((cfg, i) => {
          const Icon = cfg.icon
          const value = stats[cfg.key]
          return (
            <motion.div
              key={cfg.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn('bg-card border rounded-xl p-5 flex items-start justify-between group', cfg.border)}
            >
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{cfg.label}</p>
                <p className="text-2xl font-bold text-foreground">{value}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cfg.bg)}>
                <Icon className={cn('w-5 h-5', cfg.color)} />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Penjualan Mingguan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">7 hari terakhir</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-olaTosca font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Live
          </div>
        </div>

        {salesData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, bottom: 5, left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06C7A7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06C7A7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                  tickFormatter={(v) => `Rp${(v/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#06C7A7"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                  dot={{ r: 3, fill: '#06C7A7', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#06C7A7', strokeWidth: 2, stroke: 'rgba(6,199,167,0.3)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
            Tidak ada data penjualan
          </div>
        )}
      </motion.div>

    </motion.div>
  )
}