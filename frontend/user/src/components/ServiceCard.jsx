import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function ServiceCard({ 
  icon: Icon, 
  title, 
  description, 
  linkTo = '/order',
  delay = 0 
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { delay, duration: 0.45 } }
      }}
      whileHover={{ scale: 1.02 }}
      className="p-6 border rounded-xl hover:shadow-xl transition"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-olaLight">
          <Icon className="w-6 h-6 text-olaBlue" />
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-500 mt-1">{description}</div>
        </div>
      </div>
      <div className="mt-4">
        <Link to={linkTo} className="text-olaTosca font-medium">
          Pesan Sekarang →
        </Link>
      </div>
    </motion.div>
  )
}
