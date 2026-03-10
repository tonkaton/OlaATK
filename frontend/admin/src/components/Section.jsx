import React from 'react'
import { motion } from 'framer-motion'

export default function Section({ dark, title, search, setSearch, children }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={`p-6 rounded-2xl backdrop-blur ${dark ? 'bg-white/15' : 'bg-white/60'}`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="font-bold">{title}</h2>
        {setSearch && (
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Cari..." 
            className="px-3 py-1 rounded bg-white/90 text-slate-900 w-full sm:w-auto"
          />
        )}
      </div>
      {children}
    </motion.div>
  )
}
