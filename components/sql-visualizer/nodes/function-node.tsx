'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Code2 } from 'lucide-react'
import type { FunctionNodeData } from '@/lib/sql-types'

interface FunctionNodeDataWithCallback extends FunctionNodeData {
  onViewCode?: (title: string, code: string) => void
}

function generateFunctionSQL(func: FunctionNodeData['function']): string {
  const schemaPrefix = func.schema !== 'public' ? `${func.schema}.` : ''
  return `CREATE OR REPLACE FUNCTION ${schemaPrefix}${func.name}(${func.parameters || ''})
RETURNS ${func.returnType}
LANGUAGE plpgsql
AS $$
${func.body}
$$;`
}

function FunctionNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as FunctionNodeDataWithCallback
  const { function: func, onViewCode } = nodeData

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-zinc-900 shadow-xl transition-all ${
        selected ? 'border-green-400 ring-2 ring-green-400/30' : 'border-green-500/60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-md border-b border-green-500/30 bg-green-500/20 px-3 py-2">
        <Code2 className="h-4 w-4 text-green-400" />
        <span className="font-semibold text-green-100">{func.name}</span>
        {onViewCode && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewCode(`Function: ${func.name}`, generateFunctionSQL(func))
            }}
            className="ml-auto rounded p-1 text-green-300 transition-colors hover:bg-green-500/30 hover:text-green-100"
            title="View SQL"
          >
            <Code2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1 p-2 text-xs">
        {func.parameters && (
          <div className="text-zinc-400">
            <span className="text-zinc-500">params: </span>
            <span className="text-green-200">
              {func.parameters.length > 30 
                ? func.parameters.substring(0, 30) + '...' 
                : func.parameters || 'none'}
            </span>
          </div>
        )}
        <div className="text-zinc-400">
          <span className="text-zinc-500">returns: </span>
          <span className="text-green-200">{func.returnType}</span>
        </div>
      </div>

      {/* Connection handle for triggers */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${func.name}-target`}
        className="!h-2 !w-2 !border-2 !border-orange-400 !bg-zinc-900"
      />
    </div>
  )
}

export const FunctionNode = memo(FunctionNodeComponent)
