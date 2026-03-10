import React from 'react'
import { motion } from 'framer-motion'
import { ListChecks } from 'lucide-react'

export default function StatCard({ title, value, dark, icon: Icon = ListChecks }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={`p-4 rounded-2xl backdrop-blur flex items-center justify-between ${dark ? 'bg-white/6' : 'bg-white/60'} shadow-lg-soft`}
    >
      <div>
        <div className={`text-sm ${dark ? 'text-white/90' : 'text-slate-600'}`}>{title}</div>
        <div className={`text-2xl font-bold mt-1 ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
      </div>
      <div className="p-3 rounded-lg bg-white/10">
        <Icon className="w-5 h-5 text-olaTosca" />
      </div>
    </motion.div>
  )
}
