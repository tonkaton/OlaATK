import React from 'react'
import clsx from 'clsx'
import { Icon } from '@iconify/react'

export default function Select({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [],
  placeholder = 'Pilih...',
  required = false,
  className = '',
  error = '',
  disabled = false,
  helperText = '',
  ...props 
}) {
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-normal text-neutral-text mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={clsx(
            // Base styles
            'w-full px-4 py-2.5 rounded-lg text-sm font-normal appearance-none',
            'border transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            
            // Placeholder style (when value is empty)
            !value && 'text-neutral-light',
            
            // State styles
            error 
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
              : 'border-border focus:ring-dark/10 focus:border-dark',
            
            // Disabled state
            disabled 
              ? 'bg-light-muted text-neutral-light cursor-not-allowed' 
              : 'bg-white text-dark',
            
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon 
            icon="solar:alt-arrow-down-linear" 
            className={clsx(
              'text-lg transition-colors',
              disabled ? 'text-neutral-light' : 'text-dark'
            )}
          />
        </div>
      </div>
      
      {/* Helper text or error message */}
      {(helperText && !error) && (
        <p className="mt-1.5 text-xs text-neutral-light">{helperText}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}