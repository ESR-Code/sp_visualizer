'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Zap, Code2, Target } from 'lucide-react'
import type { TriggerNodeData } from '@/lib/sql-types'

interface TriggerNodeDataWithCallback extends TriggerNodeData {
  onViewCode?: (title: string, code: string) => void
  onSoloToggle?: (id: string) => void
  isSolo?: boolean
}

function generateTriggerSQL(trigger: TriggerNodeData['trigger']): string {
  const events = trigger.events.join(' OR ')
  const tableRef = trigger.tableSchema !== 'public' 
    ? `${trigger.tableSchema}.${trigger.tableName}` 
    : trigger.tableName
  const funcRef = trigger.functionSchema !== 'public'
    ? `${trigger.functionSchema}.${trigger.functionName}`
    : trigger.functionName
  
  return `CREATE TRIGGER ${trigger.name}
${trigger.timing} ${events}
ON ${tableRef}
FOR EACH ROW
EXECUTE FUNCTION ${funcRef}();`
}

function TriggerNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as any as TriggerNodeDataWithCallback
  const { trigger, onViewCode, onSoloToggle, isSolo } = nodeData

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-zinc-900 shadow-xl transition-all ${
        selected || isSolo ? 'border-orange-400 ring-2' : 'border-orange-500/60'
      } ${isSolo ? 'ring-amber-500/50' : 'ring-orange-400/30'}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 rounded-t-md border-b px-3 py-2 transition-colors ${
        isSolo ? 'border-amber-500/30 bg-amber-500/20' : 'border-orange-500/30 bg-orange-500/20'
      }`}>
        <Zap className={`h-4 w-4 ${isSolo ? 'text-amber-400' : 'text-orange-400'}`} />
        <span className={`font-semibold ${isSolo ? 'text-amber-100' : 'text-orange-100'}`}>{trigger.name}</span>
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
                  : 'text-zinc-400 hover:bg-orange-500/30 hover:text-orange-100'
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
                onViewCode(`Trigger: ${trigger.name}`, generateTriggerSQL(trigger))
              }}
              className="rounded p-1 text-orange-300 transition-colors hover:bg-orange-500/30 hover:text-orange-100"
              title="View SQL"
            >
              <Code2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1 p-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-orange-200">
            {trigger.timing}
          </span>
          <span className="text-zinc-400">{trigger.events.join(' | ')}</span>
        </div>
        <div className="text-zinc-400">
          <span className="text-zinc-500">on: </span>
          <span className="text-orange-200">{trigger.tableName}</span>
        </div>
        <div className="text-zinc-400">
          <span className="text-zinc-500">exec: </span>
          <span className="text-green-300">{trigger.functionName}()</span>
        </div>
      </div>

      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${trigger.name}-table-source`}
        className="!h-2 !w-2 !border-2 !border-orange-400 !bg-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${trigger.name}-function-source`}
        className="!h-2 !w-2 !border-2 !border-green-400 !bg-zinc-900"
      />
    </div>
  )
}

export const TriggerNode = memo(TriggerNodeComponent)
