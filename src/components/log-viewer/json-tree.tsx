// components/log-viewer/json-tree.tsx
'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface JsonTreeProps {
  data: unknown
  level?: number
}

export function JsonTree({ data, level = 0 }: JsonTreeProps) {
  if (data === null || data === undefined) {
    return <span className="text-gray-500">null</span>
  }
  
  if (typeof data === 'string') {
    return <span className="text-purple-500">\"{data}\"</span>
  }
  
  if (typeof data === 'number') {
    return <span className="text-blue-500">{data}</span>
  }
  
  if (typeof data === 'boolean') {
    return <span className="text-orange-500">{data.toString()}</span>
  }
  
  if (Array.isArray(data)) {
    return <ExpandableItem 
      name={`Array(${data.length})`}
      preview={arrayPreview(data)}
    >
      <div className="pl-4">
        {data.map((item, index) => (
          <div key={index}>
            <span className="text-gray-700">{index}: </span>
            <JsonTree data={item} level={level + 1} />
          </div>
        ))}
      </div>
    </ExpandableItem>
  }
  
  // Object
  const entries = Object.entries(data)
  
  return <ExpandableItem 
    name={`Object{${entries.length}}`}
    preview={objectPreview(data)}
  >
    <div className="pl-4">
      {entries.map(([key, value]) => (
        <div key={key}>
          <span className="text-gray-700">{key}: </span>
          <JsonTree data={value} level={level + 1} />
        </div>
      ))}
    </div>
  </ExpandableItem>
}

function ExpandableItem({ 
  name, 
  preview, 
  children 
}: { 
  name: string, 
  preview: string, 
  children: React.ReactNode 
}) {
  const [expanded, setExpanded] = useState(true)
  
  return (
    <div className="my-1">
      <div 
        className="flex items-center cursor-pointer select-none" 
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 
          <ChevronDown className="w-4 h-4 text-gray-700" /> : 
          <ChevronRight className="w-4 h-4 text-gray-700" />
        }
        <span>{name}</span>
        <span className="text-gray-500 ml-1 italic">{preview}</span>
      </div>
      {expanded && children}
    </div>
  )
}

function arrayPreview(data: unknown[]) {
  if (data.length === 0) return '[]'
  
  const preview = data.slice(0, 2).map(item => {
    if (item === null) return 'null'
    if (typeof item === 'object') return Array.isArray(item) ? `Array(${item.length})` : 'Object'
    if (typeof item === 'string') return `"${item.substring(0, 10)}${item.length > 10 ? '...' : ''}"`
    return String(item)
  }).join(', ') + (data.length > 2 ? ', ...' : '')
  
  return `[${preview}]`
}

function objectPreview(data: object) {
  const keys = Object.keys(data)
  if (keys.length === 0) return '{}'
  
  const preview = keys.slice(0, 2).join(', ') + (keys.length > 2 ? ', ...' : '')
  return `{${preview}}`
}
