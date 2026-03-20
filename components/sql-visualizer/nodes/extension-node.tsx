import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Puzzle } from 'lucide-react'
import { ExtensionNodeData } from '@/lib/sql-types'

export const ExtensionNode = memo(({ data }: { data: ExtensionNodeData }) => {
  const { extension } = data

  return (
    <div className="min-w-[180px] rounded-lg border-2 border-indigo-500/30 bg-zinc-900 shadow-xl transition-all hover:border-indigo-500/50">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-indigo-500/10 px-3 py-2">
        <div className="rounded bg-indigo-500/20 p-1 text-indigo-400">
          <Puzzle className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-100">{extension.name}</h3>
          <p className="text-[10px] text-indigo-400/70 font-medium tracking-tight">EXTENSION</p>
        </div>
      </div>

      <div className="p-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-zinc-500">Schema</span>
            <span className="text-[11px] font-mono text-zinc-300">{extension.schema}</span>
          </div>
          {extension.version && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-zinc-500">Version</span>
              <span className="text-[11px] font-mono text-zinc-300">{extension.version}</span>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id={`${extension.name}-target`}
        className="!h-2 !w-2 !border-2 !border-zinc-900 !bg-indigo-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${extension.name}-source`}
        className="!h-2 !w-2 !border-2 !border-zinc-900 !bg-indigo-500"
      />
    </div>
  )
})

ExtensionNode.displayName = 'ExtensionNode'
