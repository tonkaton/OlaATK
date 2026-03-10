import React from 'react'
import { motion } from 'framer-motion'

export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  ...props 
}) {
  const baseClasses = 'rounded-lg font-medium transition-transform'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-olaTosca to-olaBlue text-white hover:scale-[1.03]',
    secondary: 'border border-gray-200 text-gray-700 hover:scale-[1.02]',
    outline: 'border border-olaBlue text-olaBlue hover:bg-olaLight',
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  }
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
  
  return (
    <motion.button
      whileHover={!disabled ? { scale: variant === 'primary' ? 1.03 : 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      type={type}
      onClick={onClick}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  )
}
