import React from 'react'

export default function GlassTable({ headers, children, dark, columnWidths }) {
  // Use fixed table layout when columnWidths are specified to enforce them
  const tableStyle = columnWidths 
    ? { width: '100%', tableLayout: 'fixed' }
    : { width: '100%' }

  return (
    <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
      <table className="text-sm" style={tableStyle}>
        <thead className="opacity-70">
          <tr>
            {headers.map((h, i) => (
              <th 
                key={i} 
                className="text-left pb-2 pr-4 whitespace-nowrap"
                style={columnWidths && columnWidths[i] ? { width: columnWidths[i] } : {}}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`border-t ${dark ? 'border-white/30' : 'border-slate-200'}`}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                ...child.props,
                children: React.Children.map(child.props.children, (td, index) => {
                  if (React.isValidElement(td) && td.type === 'td') {
                    const existingClassName = td.props.className || ''
                    const newClassName = `pr-4 py-2 ${existingClassName}`
                    
                    return React.cloneElement(td, { 
                      ...td.props,
                      className: newClassName,
                      style: { overflowWrap: 'break-word', ...td.props.style }
                    })
                  }
                  return td
                })
              })
            }
            return child
          })}
        </tbody>
      </table>
    </div>
  )
}
