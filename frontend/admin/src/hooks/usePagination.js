import { useState, useMemo } from 'react'

export default function usePagination(data, size = 10) {
  const [page, setPage] = useState(1)
  const maxPage = Math.ceil(data.length / size)
  
  const currentData = useMemo(() => {
    const start = (page - 1) * size
    return data.slice(start, start + size)
  }, [data, page, size])
  
  return { page, setPage, maxPage, currentData }
}
