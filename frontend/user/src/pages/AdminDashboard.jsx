/* Animated Admin Dashboard mock */
import React from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Box } from 'lucide-react'
import { motion } from 'framer-motion'

const orders = [
  {id:1, name:'Budi', service:'Cetak Dokumen', status:'Menunggu', total:'Rp20.000'},
  {id:2, name:'Siti', service:'Jilid', status:'Diproses', total:'Rp35.000'},
  {id:3, name:'Andi', service:'Fotokopi', status:'Selesai', total:'Rp10.000'},
]

export default function AdminDashboard(){
  return (
    <div className="min-h-[80vh] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6">
      <aside className="w-64 p-4 border rounded-lg">
        <div className="font-semibold mb-4">Admin Ola ATK</div>
        <nav className="flex flex-col gap-2">
          <Link to="/admin" className="flex items-center gap-2"><BarChart2 className="w-4 h-4"/> Dashboard</Link>
          <Link to="/admin/orders" className="flex items-center gap-2"><Box className="w-4 h-4"/> Daftar Pesanan</Link>
          <Link to="/services" className="flex items-center gap-2">Layanan</Link>
        </nav>
      </aside>

      <div className="flex-1">
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{staggerChildren:0.08}} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div className="p-4 border rounded-lg" whileHover={{scale:1.02}}>Pesanan Hari Ini<div className="text-2xl font-bold">{orders.length}</div></motion.div>
          <motion.div className="p-4 border rounded-lg" whileHover={{scale:1.02}}>Total Pelanggan<div className="text-2xl font-bold">42</div></motion.div>
          <motion.div className="p-4 border rounded-lg" whileHover={{scale:1.02}}>Pendapatan<div className="text-2xl font-bold">Rp5.000.000</div></motion.div>
        </motion.div>

        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="p-4 border rounded-lg">
          <div className="font-semibold mb-3">Daftar Pesanan</div>
          <table className="w-full text-left">
            <thead className="text-sm text-gray-500">
              <tr><th>ID</th><th>Nama</th><th>Layanan</th><th>Status</th><th>Total</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t">
                  <td className="py-2">{o.id}</td>
                  <td>{o.name}</td>
                  <td>{o.service}</td>
                  <td>{o.status}</td>
                  <td>{o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  )
}
