import React from 'react'

export default function Pagination({ page, setPage, maxPage }) {
  if (maxPage <= 1) return null
  
  return (
    <div className="flex gap-2 justify-end mt-4">
      {[...Array(maxPage)].map((_, i) => (
        <button 
          key={i} 
          onClick={() => setPage(i + 1)} 
          className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-olaTosca' : 'bg-white/10'}`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  )
}
