'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { List, Code2 } from 'lucide-react'
import type { EnumNodeData } from '@/lib/sql-types'

interface EnumNodeDataWithCallback extends EnumNodeData {
  onViewCode?: (title: string, code: string) => void
}

function generateEnumSQL(enumData: EnumNodeData['enum']): string {
  const values = enumData.values.map(v => `  '${v}'`).join(',\n')
  return `CREATE TYPE ${enumData.schema !== 'public' ? `${enumData.schema}.` : ''}${enumData.name} AS ENUM (\n${values}\n);`
}

function EnumNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as EnumNodeDataWithCallback
  const { enum: enumData, onViewCode } = nodeData
  
  // Show only first 3 values, indicate if there are more
  const displayedValues = enumData.values.slice(0, 3)
  const remainingCount = enumData.values.length - 3

  return (
    <div
      className={`min-w-[160px] rounded-lg border-2 bg-zinc-900 shadow-xl transition-all ${
        selected ? 'border-purple-400 ring-2 ring-purple-400/30' : 'border-purple-500/60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-md border-b border-purple-500/30 bg-purple-500/20 px-3 py-2">
        <List className="h-4 w-4 text-purple-400" />
        <span className="font-semibold text-purple-100">{enumData.name}</span>
        {onViewCode && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewCode(`Enum: ${enumData.name}`, generateEnumSQL(enumData))
            }}
            className="ml-auto rounded p-1 text-purple-300 transition-colors hover:bg-purple-500/30 hover:text-purple-100"
            title="View SQL"
          >
            <Code2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Values - show first 3 only */}
      <div className="p-2">
        <div className="flex flex-wrap gap-1">
          {displayedValues.map((value) => (
            <span
              key={value}
              className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-200"
            >
              {value}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
              +{remainingCount} more
            </span>
          )}
        </div>
      </div>

      {/* Connection handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${enumData.name}-source`}
        className="!h-2 !w-2 !border-2 !border-purple-400 !bg-zinc-900"
      />
    </div>
  )
}

export const EnumNode = memo(EnumNodeComponent)
