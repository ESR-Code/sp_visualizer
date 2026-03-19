'use client'

import { Table2, List, Code2, Zap, Shield, Link, Eye, EyeOff } from 'lucide-react'
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
  { icon: <Zap className="h-3 w-3" />, label: 'Trigger', color: 'text-zinc-500', activeColor: 'text-orange-400', type: 'trigger' },
  { icon: <Shield className="h-3 w-3" />, label: 'Policy', color: 'text-zinc-500', activeColor: 'text-red-400', type: 'policy' },
  { icon: <Link className="h-3 w-3" />, label: 'Foreign Key', color: 'text-zinc-500', activeColor: 'text-blue-300', type: 'foreignKey' },
]

export type VisibilityState = Record<NodeType | 'foreignKey', boolean>

interface LegendProps {
  visibility: VisibilityState
  onToggle: (type: NodeType | 'foreignKey') => void
}

export function Legend({ visibility, onToggle }: LegendProps) {
  return (
    <div className="absolute bottom-4 right-4 z-10 rounded-lg border border-zinc-800 bg-zinc-900/95 p-3 shadow-xl backdrop-blur">
      <div className="mb-2 text-xs font-medium text-zinc-400">Toggle Visibility</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {items.map((item) => {
          const isVisible = visibility[item.type]
          return (
            <button
              key={item.label}
              onClick={() => onToggle(item.type)}
              className={`flex items-center gap-2 rounded px-1.5 py-0.5 transition-colors hover:bg-zinc-800 ${
                isVisible ? '' : 'opacity-50'
              }`}
            >
              <span className={isVisible ? item.activeColor : item.color}>
                {item.icon}
              </span>
              <span className={`text-xs ${isVisible ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {item.label}
              </span>
              {isVisible ? (
                <Eye className="ml-auto h-3 w-3 text-zinc-500" />
              ) : (
                <EyeOff className="ml-auto h-3 w-3 text-zinc-600" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
