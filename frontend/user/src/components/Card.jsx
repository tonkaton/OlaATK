import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function Card({ 
  children, 
  className = '', 
  variant = 'default',
  hover = false,
  padding = 'md',
  animate = true,
  ...props 
}) {
  const baseClasses = 'rounded-xl bg-white border transition-all duration-200'
  
  const variantClasses = {
    default: 'border-border',
    subtle: 'border-border-light',
    dark: 'bg-neutral-bg border-dark-border text-white',
    ghost: 'border-transparent bg-light-gray',
  }
  
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8 md:p-12',
  }
  
  const hoverClasses = hover 
    ? 'hover:bg-light-gray hover:shadow-soft cursor-pointer' 
    : ''
  
  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hoverClasses,
    className
  )
  
  const CardComponent = (
    <div className={classes} {...props}>
      {children}
    </div>
  )
  
  // Conditional animation
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {CardComponent}
      </motion.div>
    )
  }
  
  return CardComponent
}