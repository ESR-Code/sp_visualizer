'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Shield, Code2, Target } from 'lucide-react'
import type { PolicyNodeData } from '@/lib/sql-types'

interface PolicyNodeDataWithCallback extends PolicyNodeData {
  onViewCode?: (title: string, code: string) => void
  onSoloToggle?: (id: string) => void
  isSolo?: boolean
}

function generatePolicySQL(policy: PolicyNodeData['policy']): string {
  const tableRef = policy.tableSchema !== 'public' 
    ? `${policy.tableSchema}.${policy.tableName}` 
    : policy.tableName
  const permissive = policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'
  const roles = policy.roles.length > 0 ? policy.roles.join(', ') : 'PUBLIC'
  
  let sql = `CREATE POLICY "${policy.name}"
ON ${tableRef}
AS ${permissive}
FOR ${policy.operation}
TO ${roles}`

  if (policy.usingExpression) {
    sql += `\nUSING (${policy.usingExpression})`
  }
  
  if (policy.withCheckExpression) {
    sql += `\nWITH CHECK (${policy.withCheckExpression})`
  }
  
  return sql + ';'
}

function PolicyNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as any as PolicyNodeDataWithCallback
  const { policy, onViewCode, onSoloToggle, isSolo } = nodeData

  const truncateExpression = (expr?: string, maxLen = 40) => {
    if (!expr) return null
    return expr.length > maxLen ? expr.substring(0, maxLen) + '...' : expr
  }

  return (
    <div
      className={`min-w-[200px] max-w-[280px] rounded-lg border-2 bg-zinc-900 shadow-xl transition-all ${
        selected || isSolo ? 'border-red-400 ring-2' : 'border-red-500/60'
      } ${isSolo ? 'ring-amber-500/50' : 'ring-red-400/30'}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 rounded-t-md border-b px-3 py-2 transition-colors ${
        isSolo ? 'border-amber-500/30 bg-amber-500/20' : 'border-red-500/30 bg-red-500/20'
      }`}>
        <Shield className={`h-4 w-4 shrink-0 ${isSolo ? 'text-amber-400' : 'text-red-400'}`} />
        <span className={`truncate font-semibold ${isSolo ? 'text-amber-100' : 'text-red-100'}`}>{policy.name}</span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {onSoloToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSoloToggle(id)
              }}
              className={`rounded p-1 transition-colors ${
                isSolo 
                  ? 'bg-amber-500 text-white' 
                  : 'text-zinc-400 hover:bg-red-500/30 hover:text-red-100'
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
                onViewCode(`Policy: ${policy.name}`, generatePolicySQL(policy))
              }}
              className="rounded p-1 text-red-300 transition-colors hover:bg-red-500/30 hover:text-red-100"
              title="View SQL"
            >
              <Code2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1 p-2 text-xs">
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={`rounded px-1.5 py-0.5 ${
              policy.permissive
                ? 'bg-green-500/20 text-green-200'
                : 'bg-red-500/20 text-red-200'
            }`}
          >
            {policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'}
          </span>
          <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-200">
            {policy.operation}
          </span>
        </div>
        <div className="text-zinc-400">
          <span className="text-zinc-500">table: </span>
          <span className="text-red-200">{policy.tableName}</span>
        </div>
        {policy.roles.length > 0 && (
          <div className="text-zinc-400">
            <span className="text-zinc-500">roles: </span>
            <span className="text-zinc-300">{policy.roles.join(', ')}</span>
          </div>
        )}
        {policy.usingExpression && (
          <div className="text-zinc-400">
            <span className="text-zinc-500">using: </span>
            <code className="text-zinc-300">{truncateExpression(policy.usingExpression)}</code>
          </div>
        )}
      </div>

      {/* Connection handle to table */}
      <Handle
        type="source"
        position={Position.Top}
        id={`${policy.name}-table-source`}
        className="!h-2 !w-2 !border-2 !border-red-400 !bg-zinc-900"
        isConnectable={false}
      />
    </div>
  )
}

export const PolicyNode = memo(PolicyNodeComponent)
