'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Table2, Key, Link, Code2, Target, Zap } from 'lucide-react'
import type { TableNodeData } from '@/lib/sql-types'



function generateTableSQL(table: TableNodeData['table']): string {
  const lines: string[] = []
  lines.push(`CREATE TABLE ${table.schema !== 'public' ? `${table.schema}.` : ''}${table.name} (`)
  
  const columnDefs = table.columns.map((col) => {
    let def = `  ${col.name} ${col.enumType || col.type}`
    if (col.isPrimaryKey) def += ' PRIMARY KEY'
    if (col.isNotNull) def += ' NOT NULL'
    if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`
    if (col.references) {
      def += ` REFERENCES ${col.references.table}(${col.references.column})`
    }
    return def
  })
  
  lines.push(columnDefs.join(',\n'))
  lines.push(');')
  
  return lines.join('\n')
}

function TableNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as any as TableNodeData
  const { table, onViewCode, onSoloToggle, onImpactAnalysis, isSolo } = nodeData

  return (
    <div
      className={`min-w-[220px] rounded-lg border-2 bg-zinc-900 shadow-xl transition-all ${
        selected || isSolo ? 'border-blue-400 ring-2' : 'border-blue-500/60'
      } ${isSolo ? 'ring-amber-500/50' : 'ring-blue-400/30'}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 rounded-t-md border-b px-3 py-2 transition-colors ${
        isSolo ? 'border-amber-500/30 bg-amber-500/20' : 'border-blue-500/30 bg-blue-500/20'
      }`}>
        <Table2 className={`h-4 w-4 ${isSolo ? 'text-amber-400' : 'text-blue-400'}`} />
        <span className={`font-semibold ${isSolo ? 'text-amber-100' : 'text-blue-100'}`}>{table.name}</span>
        {table.schema !== 'public' && (
          <span className={`text-xs ${isSolo ? 'text-amber-300/70' : 'text-blue-300/70'}`}>{table.schema}</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {onImpactAnalysis && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onImpactAnalysis(table)
              }}
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-amber-500/30 hover:text-amber-100"
              title="Impact Analysis"
            >
              <Zap className="h-3.5 w-3.5" />
            </button>
          )}
          {onSoloToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSoloToggle(id)
              }}
              className={`rounded p-1 transition-colors ${
                isSolo 
                  ? 'bg-amber-500 text-white' 
                  : 'text-zinc-400 hover:bg-blue-500/30 hover:text-blue-100'
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
                onViewCode(`Table: ${table.name}`, generateTableSQL(table))
              }}
              className="rounded p-1 text-blue-300 transition-colors hover:bg-blue-500/30 hover:text-blue-100"
              title="View SQL"
            >
              <Code2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Columns */}
      <div className="divide-y divide-zinc-800">
        {table.columns.map((column, index) => (
          <div
            key={column.name}
            className="relative flex items-center gap-2 px-3 py-1.5 text-sm"
          >
            {/* Target handle - always present so FK edges can connect */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${table.name}-${column.name}-target`}
              className="!h-2 !w-2 !border-2 !border-blue-400 !bg-zinc-900"
              style={{ top: '50%' }}
              isConnectable={false}
            />
            
            <div className="flex items-center gap-1.5">
              {column.isPrimaryKey && <Key className="h-3 w-3 text-amber-400" />}
              {column.references && <Link className="h-3 w-3 text-blue-400" />}
            </div>
            
            <span className={`${column.isPrimaryKey ? 'font-medium text-zinc-100' : 'text-zinc-300'}`}>
              {column.name}
            </span>
            
            <span className="ml-auto text-zinc-500">
              {column.enumType || column.type}
            </span>

            {/* Source handle - always present so FK edges can connect */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${table.name}-${column.name}-source`}
              className="!h-2 !w-2 !border-2 !border-blue-400 !bg-zinc-900"
              style={{ top: '50%' }}
              isConnectable={false}
            />
          </div>
        ))}
      </div>

      {/* Connection handles for triggers, policies, enums */}
      <Handle
        type="target"
        position={Position.Top}
        id={`${table.name}-trigger-target`}
        className="!h-2 !w-2 !border-2 !border-orange-400 !bg-zinc-900"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id={`${table.name}-policy-target`}
        className="!h-2 !w-2 !border-2 !border-red-400 !bg-zinc-900"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${table.name}-view-target`}
        className="!h-2 !w-2 !border-2 !border-teal-400 !bg-zinc-900"
        style={{ top: '24px' }}
        isConnectable={false}
      />
    </div>
  )
}

export const TableNode = memo(TableNodeComponent)
