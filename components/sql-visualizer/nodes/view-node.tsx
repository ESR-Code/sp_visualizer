import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Eye, Code } from 'lucide-react'
import type { ViewNodeData } from '@/lib/sql-types'

function ViewNodeComponent({ data }: { data: ViewNodeData }) {
  const { view, onViewCode } = data

  return (
    <div className="w-[320px] rounded-lg border-2 border-teal-500/50 bg-zinc-950/90 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-md bg-teal-500/10 px-3 py-2 border-b border-teal-500/20">
        <Eye className="h-4 w-4 text-teal-400" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="font-semibold text-zinc-100 truncate">{view.name}</span>
          <span className="text-[10px] text-zinc-400">{view.schema}</span>
        </div>
        <button
          onClick={() => onViewCode?.(`${view.schema}.${view.name}`, view.code)}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          title="View SQL"
        >
          <Code className="h-3 w-3" />
        </button>
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
