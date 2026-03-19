'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Code2, Target } from 'lucide-react'
import type { FunctionNodeData } from '@/lib/sql-types'

interface FunctionNodeDataWithCallback extends FunctionNodeData {
  onViewCode?: (title: string, code: string) => void
  onSoloToggle?: (id: string) => void
  isSolo?: boolean
}

function generateFunctionSQL(func: FunctionNodeData['function']): string {
  const schemaPrefix = func.schema !== 'public' ? `${func.schema}.` : ''
  const indentedBody = func.body.split('\n').map(line => '  ' + line).join('\n')
  
  return `CREATE OR REPLACE FUNCTION ${schemaPrefix}${func.name}(${func.parameters || ''})
RETURNS ${func.returnType}
LANGUAGE plpgsql
AS $$
${indentedBody}
$$;`
}

function FunctionNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as any as FunctionNodeDataWithCallback
  const { function: func, onViewCode, onSoloToggle, isSolo } = nodeData

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-zinc-900 shadow-xl transition-all ${
        selected || isSolo ? 'border-green-400 ring-2' : 'border-green-500/60'
      } ${isSolo ? 'ring-amber-500/50' : 'ring-green-400/30'}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 rounded-t-md border-b px-3 py-2 transition-colors ${
        isSolo ? 'border-amber-500/30 bg-amber-500/20' : 'border-green-500/30 bg-green-500/20'
      }`}>
        <Code2 className={`h-4 w-4 ${isSolo ? 'text-amber-400' : 'text-green-400'}`} />
        <span className={`font-semibold ${isSolo ? 'text-amber-100' : 'text-green-100'}`}>{func.name}</span>
        <div className="ml-auto flex items-center gap-1">
          {onSoloToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSoloToggle(id)
              }}
              className={`rounded p-1 transition-colors ${
                isSolo 
                  ? 'bg-amber-500 text-white' 
                  : 'text-zinc-400 hover:bg-green-500/30 hover:text-green-100'
              }`}
              title={isSolo ? "Show All Nodes" : "Solo Node"}
            >
              <Target className="h-3.5 w-3.5" />
            </button>
          )}
          {onViewCode && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewCode(`Function: ${func.name}`, generateFunctionSQL(func))
              }}
              className="rounded p-1 text-green-300 transition-colors hover:bg-green-500/30 hover:text-green-100"
              title="View SQL"
            >
              <Code2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
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

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${func.name}-target`}
        className="!h-2 !w-2 !border-2 !border-orange-400 !bg-zinc-900"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${func.name}-source`}
        className="!h-2 !w-2 !border-2 !border-green-400 !bg-zinc-900"
        isConnectable={false}
      />
    </div>
  )
}

export const FunctionNode = memo(FunctionNodeComponent)
