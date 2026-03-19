import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Eye, Code, Target } from 'lucide-react'
import type { ViewNodeData } from '@/lib/sql-types'

function ViewNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as any as ViewNodeData
  const { view, onViewCode, onSoloToggle, isSolo } = nodeData

  return (
    <div className={`w-[320px] rounded-lg border-2 bg-zinc-950/90 shadow-xl backdrop-blur transition-all ${
      selected || isSolo ? 'border-teal-400 ring-2 ring-teal-400/30' : 'border-teal-500/50'
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-2 rounded-t-md px-3 py-2 border-b transition-colors ${
        isSolo ? 'border-amber-500/30 bg-amber-500/20' : 'bg-teal-500/10 border-teal-500/20'
      }`}>
        <Eye className={`h-4 w-4 ${isSolo ? 'text-amber-400' : 'text-teal-400'}`} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className={`font-semibold truncate ${isSolo ? 'text-amber-100' : 'text-zinc-100'}`}>{view.name}</span>
          <span className={`text-[10px] ${isSolo ? 'text-amber-400/70' : 'text-zinc-400'}`}>{view.schema}</span>
        </div>
        <div className="flex items-center gap-1">
          {onSoloToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSoloToggle(id as any)
              }}
              className={`rounded p-1 transition-colors ${
                isSolo 
                  ? 'bg-amber-500 text-white' 
                  : 'text-zinc-400 hover:bg-teal-500/30 hover:text-teal-100'
              }`}
              title={isSolo ? "Show All Nodes" : "Solo Node"}
            >
              <Target className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onViewCode?.(`${view.schema}.${view.name}`, view.code)}
            className={`rounded p-1 transition-colors ${
              isSolo ? 'text-amber-400/70 hover:bg-amber-500/30 hover:text-amber-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
            title="View SQL"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {view.securityInvoker ? (
          <div className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-300">
            Security Invoker: ON
          </div>
        ) : (
          <div className="text-xs text-zinc-500 italic">Standard View</div>
        )}
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${view.name}-target`}
        className="!h-2 !w-2 !border-2 !border-teal-400 !bg-zinc-900"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${view.name}-source`}
        className="!h-2 !w-2 !border-2 !border-teal-400 !bg-zinc-900"
        isConnectable={false}
      />
    </div>
  )
}

export const ViewNode = memo(ViewNodeComponent)
