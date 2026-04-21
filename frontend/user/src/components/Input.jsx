import React from 'react'
import clsx from 'clsx'

export default function Input({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder = '',
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
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={clsx(
          // Base styles
          'w-full px-4 py-2.5 rounded-lg text-sm font-normal',
          'border transition-colors duration-200',
          'placeholder:text-neutral-light',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          
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
      />
      
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