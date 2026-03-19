'use client'

import { useState } from 'react'
import { Table2, List, Code2, Zap as TriggerIcon, Shield, Link, Eye, EyeOff, ChevronDown, ChevronUp, Layers } from 'lucide-react'
import type { NodeType } from '@/lib/sql-types'

interface LegendItem {
  icon: React.ReactNode
  label: string
  color: string
  activeColor: string
  type: NodeType | 'foreignKey'
}

const items: LegendItem[] = [
  { icon: <Table2 className="h-3 w-3" />, label: 'Table', color: 'text-zinc-500', activeColor: 'text-blue-400', type: 'table' },
  { icon: <List className="h-3 w-3" />, label: 'Enum', color: 'text-zinc-500', activeColor: 'text-purple-400', type: 'enum' },
  { icon: <Code2 className="h-3 w-3" />, label: 'Function', color: 'text-zinc-500', activeColor: 'text-green-400', type: 'function' },
  { icon: <TriggerIcon className="h-3 w-3" />, label: 'Trigger', color: 'text-zinc-500', activeColor: 'text-orange-400', type: 'trigger' },
  { icon: <Shield className="h-3 w-3" />, label: 'Policy', color: 'text-zinc-500', activeColor: 'text-red-400', type: 'policy' },
  { icon: <Eye className="h-3 w-3" />, label: 'View', color: 'text-zinc-500', activeColor: 'text-teal-400', type: 'view' },
  { icon: <Link className="h-3 w-3" />, label: 'Foreign Key', color: 'text-zinc-500', activeColor: 'text-blue-300', type: 'foreignKey' },
]

export type VisibilityState = Record<NodeType | 'foreignKey', boolean>

interface LegendProps {
  visibility: VisibilityState
  onToggle: (type: NodeType | 'foreignKey') => void
  onSolo: (type: NodeType | 'foreignKey') => void
  soloCategory: NodeType | 'foreignKey' | null
}

export function Legend({ visibility, onToggle, onSolo, soloCategory }: LegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={`absolute bottom-4 right-4 z-10 rounded-lg border border-zinc-800 bg-zinc-900/95 shadow-xl backdrop-blur transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-3 w-56'}`}>
      <div 
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <Layers className="h-3.5 w-3.5 text-zinc-500" />
          {!isCollapsed && <span>Toggle Visibility</span>}
        </div>
        <button className="text-zinc-500 hover:text-zinc-300">
          {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="mt-3 grid gap-1">
          {items.map((item) => {
            const isVisible = visibility[item.type]
            const isSoloed = soloCategory === item.type
            return (
              <div key={item.label} className="flex gap-1 group">
                <button
                  onClick={() => onToggle(item.type)}
                  className={`flex items-center gap-2 flex-grow rounded px-2 py-1.5 transition-colors hover:bg-zinc-800 ${
                    isVisible ? '' : 'opacity-40'
                  }`}
                  title="Toggle Visibility"
                >
                  <span className={isVisible ? item.activeColor : item.color}>
                    {item.icon}
                  </span>
                  <span className={`text-xs ${isVisible ? 'text-zinc-200' : 'text-zinc-500 font-medium'}`}>
                    {item.label}
                  </span>
                  {isVisible ? (
                    <Eye className="ml-auto h-3.5 w-3.5 text-zinc-600" />
                  ) : (
                    <EyeOff className="ml-auto h-3.5 w-3.5 text-zinc-700" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSolo(item.type)
                  }}
                  className={`rounded px-2 font-medium text-[10px] tracking-wider uppercase transition-all ${
                    isSoloed
                      ? 'opacity-100 bg-amber-500/20 text-amber-400'
                      : 'opacity-0 group-hover:opacity-100 text-zinc-500 hover:bg-zinc-800 hover:text-amber-400'
                  }`}
                  title={isSoloed ? "Un-solo this category" : "Solo this category"}
                >
                  {isSoloed ? 'Soloed' : 'Solo'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
