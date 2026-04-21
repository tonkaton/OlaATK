import React from 'react'
import clsx from 'clsx'

export default function MarqueeSection({ 
  images = [], 
  speed = 30,
  direction = 'left',
  className = '' 
}) {
  // Duplicate images buat seamless infinite loop
  const duplicatedImages = [...images, ...images]
  
  return (
    <div className={clsx('w-full overflow-hidden relative', className)}>
      <div 
        className="flex gap-6"
        style={{
          width: 'max-content',
          animation: `marquee-${direction} ${speed}s linear infinite`
        }}
      >
        {duplicatedImages.map((img, idx) => (
          <div
            key={idx}
            className="w-64 h-48 md:w-72 md:h-56 shrink-0 rounded-xl overflow-hidden"
          >
            <img
              src={img}
              alt={`OlaATK showcase ${(idx % images.length) + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      
      {/* Gradient fade pada sisi kiri & kanan */}
      <div className="absolute top-0 left-0 h-full w-20 md:w-32 bg-gradient-to-r from-light to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 right-0 h-full w-20 md:w-32 bg-gradient-to-l from-light to-transparent pointer-events-none z-10" />
    </div>
  )
}