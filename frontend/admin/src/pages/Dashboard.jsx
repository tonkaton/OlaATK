import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import StatCard from '../components/StatCard'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { statsAPI } from '../services/api'

export default function Dashboard({ dark }) {
  const [stats, setStats] = useState({
    ordersToday: 0,
    totalCustomers: 0,
    revenue: 'Rp0'
  })
  const [salesData, setSalesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats from backend
      const response = await statsAPI.getDashboard()
      const data = response.data || response

      setStats({
        ordersToday: data.ordersToday || 0,
        totalCustomers: data.totalCustomers || 0,
        revenue: formatRupiah(data.totalRevenue || 0)
      })

      // Set weekly sales data for the graph
      if (data.weeklySales && data.weeklySales.length > 0) {
        setSalesData(data.weeklySales.map(item => ({
          day: item.day,
          dateLabel: item.dateLabel,
          displayLabel: `${item.day}\n${item.dateLabel}`,
          sales: item.sales,
          orders: item.orders
        })))
      }
      
      setError('')
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg ${dark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <p className="font-semibold">{payload[0].payload.day}, {payload[0].payload.dateLabel}</p>
          <p className="text-sm">Pendapatan: {formatRupiah(payload[0].value)}</p>
          <p className="text-sm">Pesanan: {payload[0].payload.orders}</p>
        </div>
      )
    }
    return null
  }

  const CustomXAxisTick = ({ x, y, payload, index, visibleTicksCount }) => {
    const lines = payload.value.split('\n')
    const isLastTick = index === visibleTicksCount - 1
    const xOffset = isLastTick ? 3 : 0
    
    return (
      <g transform={`translate(${x + xOffset},${y})`}>
        <text x={0} y={0} textAnchor="middle" fill={dark ? '#E6E6E6' : '#334155'} fontSize="13">
          <tspan x="0" dy="10">{lines[0]}</tspan>
          <tspan x="0" dy="15" fontSize="11" opacity="0.7">{lines[1]}</tspan>
        </text>
      </g>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {error && (
        <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard title="Pesanan Hari Ini" value={stats.ordersToday} dark={dark} />
            <StatCard title="Total Pelanggan" value={stats.totalCustomers} dark={dark} />
            <StatCard title="Total Pendapatan" value={stats.revenue} dark={dark} />
          </div>
          
          <div className={`p-3 sm:p-6 rounded-2xl ${dark ? 'bg-white/6' : 'bg-white/60'} backdrop-blur`}>
            <h3 className="font-semibold mb-4 text-sm sm:text-base">Grafik Penjualan Mingguan (7 Hari Terakhir)</h3>
            {salesData.length > 0 ? (
              <div className="h-[320px] -ml-2 sm:ml-0">
                <ResponsiveContainer>
                  <LineChart data={salesData} margin={{ top: 5, bottom: 0, left: 25, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={dark ? 0.15 : 0.25} />
                    <XAxis dataKey="displayLabel" tick={<CustomXAxisTick />} height={60} />
                    <YAxis stroke={dark ? '#E6E6E6' : '#334155'} width={60} className="text-xs sm:text-sm" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="sales" stroke="#06C7A7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-gray-500">
                Tidak ada data penjualan
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
