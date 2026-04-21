import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import clsx from 'clsx'

export default function ServiceCard({ 
  number,
  title, 
  description, 
  tags = [],
  icon,
  linkTo = '/order',
  delay = 0,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className={clsx(
        'flex flex-col lg:flex-row lg:items-center gap-6',
        'border-b border-border py-10 group',
        'hover:bg-light-gray transition-colors -mx-6 px-6 md:-mx-12 md:px-12 lg:-mx-20 lg:px-20',
        'cursor-pointer relative overflow-hidden',
        className
      )}
    >
      {/* Number */}
      <div className="font-display text-[2rem] font-medium text-dark w-16 shrink-0">
        {number}.
      </div>
      
      {/* Title */}
      <div className="font-display text-[2rem] font-medium text-dark w-full lg:w-1/3 tracking-tight">
        {title}
      </div>
      
      {/* Content */}
      <div className="flex-grow flex flex-col gap-4">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <span 
                key={idx}
                className="border border-border rounded-full px-3 py-1 text-xs text-dark"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Description */}
        <p className="text-neutral-text text-base max-w-lg leading-relaxed">
          {description}
        </p>
        
        {/* CTA Link (optional, shows on hover) */}
        {linkTo && (
          <Link 
            to={linkTo}
            className="inline-flex items-center gap-2 text-sm font-normal text-dark opacity-0 group-hover:opacity-100 transition-opacity mt-2"
          >
            Pesan Sekarang
            <Icon icon="solar:arrow-right-linear" className="text-lg group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
      
      {/* Icon (optional, bottom right) */}
      {icon && (
        <div className="absolute bottom-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Icon icon={icon} className="text-[8rem] text-dark" />
        </div>
      )}
    </motion.div>
  )
}