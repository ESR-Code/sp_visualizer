'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { TableNode } from './nodes/table-node'
import { EnumNode } from './nodes/enum-node'
import { FunctionNode } from './nodes/function-node'
import { TriggerNode } from './nodes/trigger-node'
import { PolicyNode } from './nodes/policy-node'
import { Legend, type VisibilityState } from './legend'
import { CodeModal } from './code-modal'
import type { ParsedSchema, NodeType } from '@/lib/sql-types'
import { generateNodesAndEdges, applyDagreLayout } from '@/lib/layout-engine'

const nodeTypes = {
  table: TableNode,
  enum: EnumNode,
  function: FunctionNode,
  trigger: TriggerNode,
  policy: PolicyNode,
}

interface FlowDiagramProps {
  schema: ParsedSchema | null
}

const defaultVisibility: VisibilityState = {
  table: true,
  enum: true,
  function: true,
  trigger: true,
  policy: true,
  foreignKey: true,
}

// Edge type mappings
const edgeTypeToNodeType: Record<string, NodeType | 'foreignKey'> = {
  foreignKey: 'foreignKey',
  triggerTable: 'trigger',
  triggerFunction: 'trigger',
  enumUsage: 'enum',
  policyTable: 'policy',
}

export function FlowDiagram({ schema }: FlowDiagramProps) {
  const [visibility, setVisibility] = useState<VisibilityState>(defaultVisibility)
  const [codeModal, setCodeModal] = useState<{ isOpen: boolean; title: string; code: string }>({
    isOpen: false,
    title: '',
    code: '',
  })

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!schema) {
      return { initialNodes: [], initialEdges: [] }
    }

    const { nodes, edges } = generateNodesAndEdges(schema)
    const layoutedNodes = applyDagreLayout(nodes, edges, 'TB')

    return { initialNodes: layoutedNodes, initialEdges: edges }
  }, [schema])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes/edges when schema changes
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Filter nodes based on visibility
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const nodeType = node.type as NodeType
      return visibility[nodeType]
    })
  }, [nodes, visibility])

  // Filter edges based on visibility
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id))
    
    return edges.filter((edge) => {
      // Check if both source and target nodes are visible
      const sourceVisible = visibleNodeIds.has(edge.source)
      const targetVisible = visibleNodeIds.has(edge.target)
      
      if (!sourceVisible || !targetVisible) return false
      
      // Check edge type visibility
      const edgeType = edge.data?.type as string
      if (edgeType && edgeTypeToNodeType[edgeType]) {
        return visibility[edgeTypeToNodeType[edgeType]]
      }
      
      return true
    })
  }, [edges, filteredNodes, visibility])

  const onResetLayout = useCallback(() => {
    if (!schema) return
    const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(schema)
    const layoutedNodes = applyDagreLayout(newNodes, newEdges, 'TB')
    setNodes(layoutedNodes)
    setEdges(newEdges)
  }, [schema, setNodes, setEdges])

  const onToggleVisibility = useCallback((type: NodeType | 'foreignKey') => {
    setVisibility((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }, [])

  const onViewCode = useCallback((title: string, code: string) => {
    setCodeModal({ isOpen: true, title, code })
  }, [])

  const isEmpty = !schema || (
    schema.tables.length === 0 &&
    schema.enums.length === 0 &&
    schema.functions.length === 0 &&
    schema.triggers.length === 0 &&
    schema.policies.length === 0
  )

  if (isEmpty) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
        <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
          <p className="text-lg font-medium text-zinc-400">No SQL schema to visualize</p>
          <p className="mt-2 text-sm text-zinc-500">
            Paste your Supabase SQL code in the left panel and click &quot;Visualize&quot;
          </p>
        </div>
      </div>
    )
  }

  // Add onViewCode to node data
  const nodesWithCallbacks = filteredNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onViewCode,
    },
  }))

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#27272a" gap={20} />
        <Controls
          className="!border-zinc-700 !bg-zinc-900 [&>button]:!border-zinc-700 [&>button]:!bg-zinc-800 [&>button:hover]:!bg-zinc-700 [&>button>svg]:!fill-zinc-300"
        />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'table':
                return '#3b82f6'
              case 'enum':
                return '#a855f7'
              case 'function':
                return '#22c55e'
              case 'trigger':
                return '#f97316'
              case 'policy':
                return '#ef4444'
              default:
                return '#71717a'
            }
          }}
          className="!border-zinc-700 !bg-zinc-900"
          maskColor="rgba(0, 0, 0, 0.7)"
        />
      </ReactFlow>
      <Legend visibility={visibility} onToggle={onToggleVisibility} />
      <button
        onClick={onResetLayout}
        className="absolute left-4 top-4 z-10 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
      >
        Reset Layout
      </button>
      <CodeModal
        isOpen={codeModal.isOpen}
        onClose={() => setCodeModal({ isOpen: false, title: '', code: '' })}
        title={codeModal.title}
        code={codeModal.code}
      />
    </div>
  )
}
