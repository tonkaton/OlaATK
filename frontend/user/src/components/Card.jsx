import React from 'react'
import { motion } from 'framer-motion'

export default function Card({ 
  children, 
  className = '', 
  hover = false,
  ...props 
}) {
  const baseClasses = 'p-6 rounded-2xl bg-white shadow-lg-soft border'
  const hoverClasses = hover ? 'hover:shadow-xl transition-shadow' : ''
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
