import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import clsx from 'clsx'

export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  icon,
  iconPosition = 'right',
  className = '',
  disabled = false,
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-full font-normal transition-colors duration-200'
  
  const variantClasses = {
    primary: 'bg-dark text-white hover:bg-dark-lighter disabled:bg-neutral-light disabled:text-neutral-text',
    outline: 'border border-dark text-dark hover:bg-dark hover:text-white disabled:border-border disabled:text-neutral-light',
    ghost: 'text-dark hover:bg-light-gray disabled:text-neutral-light',
    light: 'bg-light-gray text-dark hover:bg-border disabled:bg-light-muted'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  
  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && 'cursor-not-allowed',
    className
  )
  
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      type={type}
      onClick={onClick}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <Icon icon={icon} className="text-lg" />
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <Icon icon={icon} className="text-lg transition-transform group-hover:translate-x-0.5" />
      )}
    </motion.button>
  )
}