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
  group: ({ data }: { data: { label: string } }) => (
    <div className="h-full w-full rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 p-4">
      <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">{data.label}</div>
    </div>
  ),
}

interface FlowDiagramProps {
  schema: ParsedSchema | null
  soloNodeId: string | null
  onSoloToggle: (id: string) => void
}

const defaultVisibility: VisibilityState = {
  table: true,
  enum: true,
  function: true,
  trigger: true,
  policy: true,
  foreignKey: true,
  group: true,
}

// Edge type mappings
const edgeTypeToNodeType: Record<string, NodeType | 'foreignKey'> = {
  foreignKey: 'foreignKey',
  triggerTable: 'trigger',
  triggerFunction: 'trigger',
  enumUsage: 'enum',
  policyTable: 'policy',
}

export function FlowDiagram({ schema, soloNodeId, onSoloToggle }: FlowDiagramProps) {
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
    const layoutedNodes = applyDagreLayout(nodes, edges, 'LR')

    return { initialNodes: layoutedNodes, initialEdges: edges }
  }, [schema])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes/edges when schema changes
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Get related node IDs if in solo mode
  const soloRelatedNodeIds = useMemo(() => {
    if (!soloNodeId) return null
    
    const relatedIds = new Set<string>([soloNodeId])
    
    // Find direct connections
    edges.forEach(edge => {
      if (edge.source === soloNodeId) {
        relatedIds.add(edge.target)
      } else if (edge.target === soloNodeId) {
        relatedIds.add(edge.source)
      }
    })
    
    return relatedIds
  }, [soloNodeId, edges])

  // Filter nodes based on visibility and solo mode
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      // Always hide group nodes when their children are hidden, show otherwise
      if (node.type === 'group') {
        if (!soloRelatedNodeIds) return visibility.group
        // In solo mode, hide the group unless a child is visible
        return false
      }
      
      // If in solo mode, only show the solo node and its related nodes
      if (soloRelatedNodeIds && !soloRelatedNodeIds.has(node.id)) {
        return false
      }
      
      const nodeType = node.type as NodeType
      return visibility[nodeType]
    })
  }, [nodes, visibility, soloRelatedNodeIds])

  // Filter edges based on visibility and solo mode
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id))
    
    return edges.filter((edge) => {
      // Check if both source and target nodes are visible
      const sourceVisible = visibleNodeIds.has(edge.source)
      const targetVisible = visibleNodeIds.has(edge.target)
      
      if (!sourceVisible || !targetVisible) return false
      
      // If in solo mode, only show edges connected to the solo node
      if (soloNodeId && edge.source !== soloNodeId && edge.target !== soloNodeId) {
        return false
      }
      
      // Check edge type visibility
      const edgeType = edge.data?.type as string
      if (edgeType && edgeTypeToNodeType[edgeType]) {
        return visibility[edgeTypeToNodeType[edgeType]]
      }
      
      return true
    })
  }, [edges, filteredNodes, visibility, soloNodeId])

  const onResetLayout = useCallback(() => {
    if (!schema) return
    const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(schema)
    const layoutedNodes = applyDagreLayout(newNodes, newEdges, 'LR')
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
            Paste your SQL code in the left panel and click &quot;Visualize&quot;
          </p>
        </div>
      </div>
    )
  }

  // Add callbacks and solo state to node data
  const nodesWithCallbacks = filteredNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onViewCode,
      onSoloToggle,
      isSolo: soloNodeId === node.id,
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
          position="top-right"
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
