'use client'

import { useCallback, useMemo, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { toPng } from 'html-to-image'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type ReactFlowInstance,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Search } from 'lucide-react'

import { TableNode } from './nodes/table-node'
import { EnumNode } from './nodes/enum-node'
import { FunctionNode } from './nodes/function-node'
import { TriggerNode } from './nodes/trigger-node'
import { PolicyNode } from './nodes/policy-node'
import { ViewNode } from './nodes/view-node'
import { Legend, type VisibilityState } from './legend'
import { CodeModal } from './code-modal'
import { ImpactModal } from './impact-modal'
import type { ParsedSchema, NodeType, ParsedTable } from '@/lib/sql-types'
import { generateNodesAndEdges, applyDagreLayout } from '@/lib/layout-engine'

const nodeTypes = {
  table: TableNode,
  enum: EnumNode,
  function: FunctionNode,
  trigger: TriggerNode,
  policy: PolicyNode,
  view: ViewNode,
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
  view: true,
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
  viewDependency: 'view',
}

export interface FlowDiagramRef {
  takeScreenshot: () => void
}

export const FlowDiagram = forwardRef<FlowDiagramRef, FlowDiagramProps>(
  ({ schema, soloNodeId, onSoloToggle }, ref) => {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [visibility, setVisibility] = useState<VisibilityState>(defaultVisibility)
  const [preSoloVisibility, setPreSoloVisibility] = useState<VisibilityState | null>(null)
  const preSoloNodeLayoutRef = useRef<Node[] | null>(null)
  const [soloCategory, setSoloCategory] = useState<NodeType | 'foreignKey' | null>(null)
  const [codeModal, setCodeModal] = useState<{ isOpen: boolean; title: string; code: string }>({
    isOpen: false,
    title: '',
    code: '',
  })
  const [impactModal, setImpactModal] = useState<{ isOpen: boolean; table: ParsedTable | null }>({
    isOpen: false,
    table: null,
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
  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Layout updates when entering/exiting solo mode
  useEffect(() => {
    if (!rfInstance) return

    if (soloNodeId) {
      if (!preSoloNodeLayoutRef.current) {
        // Save the COMPLETE current state of all nodes before we start moving things
        preSoloNodeLayoutRef.current = nodes
      }
      
      const relatedIds = new Set<string>([soloNodeId])
      edges.forEach((e) => {
        if (e.source === soloNodeId) relatedIds.add(e.target)
        else if (e.target === soloNodeId) relatedIds.add(e.source)
      })

      const soloNodes = nodes.filter((n) => relatedIds.has(n.id))
      // Un-parent them so they layout strictly relative to 0,0 area, ignoring their container offset
      const unparentedNodes = soloNodes.map((n) => ({ ...n, parentId: undefined }))
      const soloEdges = edges.filter((e) => relatedIds.has(e.source) && relatedIds.has(e.target))

      // Use a wider layout for solo mode to ensure no overlaps
      const layoutedNodes = applyDagreLayout(unparentedNodes, soloEdges, 'LR')

      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          const lNode = layoutedNodes.find((ln) => ln.id === n.id)
          if (lNode) {
            return {
              ...n,
              position: lNode.position,
              parentId: undefined, // free it from the group frame temporarily
            }
          }
          return n
        })
      )
      
      // Delay fitView slightly to allow React Flow to process the new positions
      const timeoutId = setTimeout(() => {
        rfInstance.fitView({ 
          nodes: nodes.filter(n => relatedIds.has(n.id)), 
          padding: 0.2, 
          duration: 800 
        })
      }, 100)
      return () => clearTimeout(timeoutId)
      
    } else if (preSoloNodeLayoutRef.current) {
      // Revert solo layout to the saved complete set of nodes
      setNodes(preSoloNodeLayoutRef.current)
      preSoloNodeLayoutRef.current = null
      
      const timeoutId = setTimeout(() => {
        rfInstance.fitView({ padding: 0.2, duration: 800 })
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [soloNodeId, rfInstance, setNodes]) // We don't depend on 'nodes' or 'edges' to avoid loops, as we only care about the moment soloNodeId changes.

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
    setSoloCategory(null)
    setPreSoloVisibility(null)
    setVisibility((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }, [])

  const onSoloVisibility = useCallback((type: NodeType | 'foreignKey') => {
    if (soloCategory === type) {
      // Revert solo
      setVisibility(preSoloVisibility || defaultVisibility)
      setSoloCategory(null)
      setPreSoloVisibility(null)
    } else {
      // Enter new solo
      if (!soloCategory) {
        setPreSoloVisibility(visibility)
      }
      setSoloCategory(type)
      setVisibility({
        table: false,
        enum: false,
        function: false,
        trigger: false,
        policy: false,
        view: false,
        foreignKey: false,
        group: true,
        [type]: true,
      })
    }
  }, [soloCategory, preSoloVisibility, visibility])

  const onViewCode = useCallback((title: string, code: string) => {
    setCodeModal({ isOpen: true, title, code })
  }, [])

  const onImpactAnalysis = useCallback((table: ParsedTable) => {
    setImpactModal({ isOpen: true, table })
  }, [])

  useImperativeHandle(ref, () => ({
    takeScreenshot: () => {
      const element = document.querySelector('.react-flow') as HTMLElement
      if (!element) return

      // Hide controls and background patterns for the screenshot if needed
      // Or just capture the whole thing
      toPng(element, {
        backgroundColor: '#09090b', // zinc-950
        cacheBust: true,
        style: {
          transform: 'scale(1)',
        },
        filter: (node) => {
          const element = node as HTMLElement
          return !element.classList?.contains('no-export') && 
                 !element.classList?.contains('react-flow__controls') && 
                 !element.classList?.contains('react-flow__minimap')
        }
      })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = `sql-flow-${new Date().toISOString().split('T')[0]}.png`
        link.href = dataUrl
        link.click()
      })
      .catch((err) => {
        console.error('Failed to take screenshot:', err)
      })
    }
  }), [rfInstance])

  const isEmpty = !schema || (
    schema.tables.length === 0 &&
    schema.enums.length === 0 &&
    schema.functions.length === 0 &&
    schema.triggers.length === 0 &&
    schema.policies.length === 0 &&
    schema.views.length === 0
  )

  // Add callbacks and solo state to node data
  const nodesWithCallbacks = filteredNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onViewCode,
      onSoloToggle,
      onImpactAnalysis,
      isSolo: soloNodeId === node.id,
    },
  }))

  // Search logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return filteredNodes.filter(
      (node) => 
        (node.data.label as string)?.toLowerCase().includes(query) || 
        node.type?.toLowerCase().includes(query)
    )
  }, [searchQuery, filteredNodes])

  const handleNodeClickFromSearch = useCallback((node: Node) => {
    if (!rfInstance) return
    const { position, measured } = node
    
    // Calculate absolute position if the node is inside a parent frame
    let absX = position.x
    let absY = position.y
    let currentParentId = node.parentId
    
    while (currentParentId) {
      const parentNode = rfInstance.getNode(currentParentId)
      if (parentNode) {
        absX += parentNode.position.x
        absY += parentNode.position.y
        currentParentId = parentNode.parentId
      } else {
        break
      }
    }

    // Target position is absolute pos + half width/height
    let w = 200
    let h = 100
    if (measured && measured.width && measured.height) {
      w = measured.width
      h = measured.height
    } else if (node.width && node.height) {
      w = node.width
      h = node.height
    }
    
    const x = absX + w / 2
    const y = absY + h / 2

    rfInstance.setCenter(x, y, { duration: 800, zoom: 1.2 })
    setSearchQuery('')
  }, [rfInstance])

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

  return (
    <div className="relative h-full w-full">
      {/* Search Bar UI */}
      {!isEmpty && (
        <div className="no-export absolute left-1/2 top-4 z-20 w-80 -translate-x-1/2">
          <div className="relative flex items-center shadow-lg">
            <Search className="absolute left-3 h-4 w-4 text-zinc-400" />
            <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onFocus={() => setIsSearchFocused(true)}
               onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
               placeholder="Search nodes by name or type..."
               className="w-full rounded-md border border-zinc-700 bg-zinc-800/95 py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none backdrop-blur placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          {searchQuery && isSearchFocused && (
            <div className="mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-zinc-700 bg-zinc-800/95 py-1 shadow-lg backdrop-blur custom-scrollbar">
              <div className="border-b border-zinc-700/50 px-3 py-1.5 text-xs font-medium text-zinc-400 mb-1">
                 Found {searchResults.length} item{searchResults.length !== 1 ? 's' : ''}
              </div>
              {searchResults.length === 0 ? (
                <div className="px-3 py-2 text-sm italic text-zinc-500">No matches found.</div>
              ) : (
                searchResults.map((node) => {
                   let colorClass = 'text-zinc-500'
                   let bgClass = 'bg-zinc-900'
                   switch (node.type) {
                     case 'table': colorClass = 'text-blue-400'; bgClass = 'bg-blue-400/10'; break
                     case 'enum': colorClass = 'text-purple-400'; bgClass = 'bg-purple-400/10'; break
                     case 'function': colorClass = 'text-green-400'; bgClass = 'bg-green-400/10'; break
                     case 'trigger': colorClass = 'text-orange-400'; bgClass = 'bg-orange-400/10'; break
                     case 'policy': colorClass = 'text-red-400'; bgClass = 'bg-red-400/10'; break
                     case 'view': colorClass = 'text-teal-400'; bgClass = 'bg-teal-400/10'; break
                   }
                   
                   return (
                     <button
                       key={node.id}
                       onClick={() => handleNodeClickFromSearch(node)}
                       className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-zinc-700/50"
                     >
                       <span className="truncate pr-3 text-sm text-zinc-200 font-medium">{node.data.label as string}</span>
                       <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider ${colorClass} ${bgClass}`}>
                         {node.type}
                       </span>
                     </button>
                   )
                })
              )}
            </div>
          )}
        </div>
      )}

      <ReactFlow
        onInit={setRfInstance}
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
              case 'view':
                return '#14b8a6'
              default:
                return '#71717a'
            }
          }}
          className="!border-zinc-700 !bg-zinc-900"
          maskColor="rgba(0, 0, 0, 0.7)"
          position="top-right"
        />
      </ReactFlow>
      <div className="no-export">
        <Legend 
          visibility={visibility} 
          onToggle={onToggleVisibility} 
          onSolo={onSoloVisibility} 
          soloCategory={soloCategory}
        />
      </div>
      <button
        onClick={onResetLayout}
        className="no-export absolute left-4 top-4 z-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        Reset Layout
      </button>
      <CodeModal
        isOpen={codeModal.isOpen}
        onClose={() => setCodeModal({ isOpen: false, title: '', code: '' })}
        title={codeModal.title}
        code={codeModal.code}
      />
      <ImpactModal
        isOpen={impactModal.isOpen}
        onClose={() => setImpactModal({ isOpen: false, table: null })}
        schema={schema}
        table={impactModal.table}
      />
    </div>
  )
})

FlowDiagram.displayName = 'FlowDiagram'
