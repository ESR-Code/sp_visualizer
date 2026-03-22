import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'
import type { ParsedSchema, ParsedPolicy } from './sql-types'

const NODE_DIMENSIONS = {
  table: { width: 250, height: 200 },
  enum: { width: 180, height: 100 },
  function: { width: 220, height: 120 },
  trigger: { width: 200, height: 120 },
  policy: { width: 300, height: 160 },
  view: { width: 320, height: 150 },
  extension: { width: 180, height: 100 },
}

export function generateNodesAndEdges(schema: ParsedSchema): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Create table nodes
  schema.tables.forEach((table) => {
    nodes.push({
      id: table.id,
      type: 'table',
      position: { x: 0, y: 0 },
      data: { 
        label: table.name, 
        table, 
        rlsEnabled: table.rlsEnabled 
      },
    })
  })

  // Create enum nodes
  schema.enums.forEach((enumData) => {
    nodes.push({
      id: enumData.id,
      type: 'enum',
      position: { x: 0, y: 0 },
      data: { label: enumData.name, enum: enumData },
    })
  })

  // Create function nodes
  schema.functions.forEach((func) => {
    nodes.push({
      id: func.id,
      type: 'function',
      position: { x: 0, y: 0 },
      data: { label: func.name, function: func },
    })
  })

  // Create trigger nodes
  schema.triggers.forEach((trigger) => {
    nodes.push({
      id: trigger.id,
      type: 'trigger',
      position: { x: 0, y: 0 },
      data: { label: trigger.name, trigger },
    })
  })

  // Group policies by table
  const policiesByTable = new Map<string, ParsedPolicy[]>()
  schema.policies.forEach((policy) => {
    if (!policiesByTable.has(policy.tableName)) {
      policiesByTable.set(policy.tableName, [])
    }
    policiesByTable.get(policy.tableName)!.push(policy)
  })

  // Create policy groups and nodes
  policiesByTable.forEach((policies, tableName) => {
    const groupId = `group-policies-${tableName}`
    
    // Create the group node
    nodes.push({
      id: groupId,
      type: 'group',
      data: { label: `RLS Policies: ${tableName}` },
      position: { x: 0, y: 0 },
    })

    // Create policy nodes as children of the group
    policies.forEach((policy) => {
      nodes.push({
        id: policy.id,
        type: 'policy',
        parentId: groupId,
        position: { x: 20, y: 40 }, // Initial relative position, will be refined in layout
        data: { label: policy.name, policy },
      })
    })
  })

  // Create view nodes
  schema.views.forEach((view) => {
    nodes.push({
      id: view.id,
      type: 'view',
      position: { x: 0, y: 0 },
      data: { label: view.name, view },
    })
  })
  
  // Create extension nodes
  schema.extensions.forEach((ext) => {
    nodes.push({
      id: ext.id,
      type: 'extension',
      position: { x: 0, y: 0 },
      data: { label: ext.name, extension: ext },
    })
  })

  // Create edges for foreign keys
  schema.foreignKeys.forEach((fk) => {
    const sourceTable = schema.tables.find((t) => t.name === fk.sourceTable)
    const targetTable = schema.tables.find((t) => t.name === fk.targetTable)

    if (sourceTable && targetTable) {
      const sourceCol = sourceTable.columns.find(c => c.name === fk.sourceColumn)
      const targetCol = targetTable.columns.find(c => c.name === fk.targetColumn)
      
      let cardinality = 'N:1' // Most common FK relation
      if (sourceCol?.isPrimaryKey && targetCol?.isPrimaryKey) {
        cardinality = '1:1'
      } else if (sourceCol?.isPrimaryKey && !targetCol?.isPrimaryKey) {
        cardinality = '1:N'
      } else if (!sourceCol?.isPrimaryKey && !targetCol?.isPrimaryKey) {
        cardinality = 'N:N' // Rare for direct FK, but can happen if neither is primary (but likely unique)
      }

      edges.push({
        id: fk.id,
        source: sourceTable.id,
        target: targetTable.id,
        sourceHandle: `${fk.sourceTable}-${fk.sourceColumn}-source`,
        targetHandle: `${fk.targetTable}-${fk.targetColumn}-target`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        label: `${cardinality} (${fk.sourceColumn} → ${fk.targetColumn})`,
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#18181b', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
        data: { type: 'foreignKey' },
      })
    }
  })

  // Create edges for triggers → tables
  schema.triggers.forEach((trigger) => {
    const targetTable = schema.tables.find((t) => t.name === trigger.tableName)
    if (targetTable) {
      edges.push({
        id: `${trigger.id}-table`,
        source: trigger.id,
        target: targetTable.id,
        sourceHandle: `${trigger.name}-table-source`,
        targetHandle: `${trigger.tableName}-trigger-target`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#f97316', strokeWidth: 2, strokeDasharray: '5,5' },
        data: { type: 'triggerTable' },
      })
    }
  })

  // Create edges for triggers → functions
  schema.triggers.forEach((trigger) => {
    const targetFunc = schema.functions.find((f) => f.name === trigger.functionName)
    if (targetFunc) {
      edges.push({
        id: `${trigger.id}-function`,
        source: trigger.id,
        target: targetFunc.id,
        sourceHandle: `${trigger.name}-function-source`,
        targetHandle: `${trigger.functionName}-target`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#22c55e', strokeWidth: 2 },
        label: 'executes',
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#18181b', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
        data: { type: 'triggerFunction' },
      })
    }
  })

  // Create edges for enum usages
  schema.enumUsages.forEach((usage) => {
    const sourceEnum = schema.enums.find(
      (e) => e.name.toLowerCase() === usage.enumName.toLowerCase()
    )
    const targetTable = schema.tables.find((t) => t.name === usage.tableName)

    if (sourceEnum && targetTable) {
      edges.push({
        id: usage.id,
        source: sourceEnum.id,
        target: targetTable.id,
        sourceHandle: `${sourceEnum.name}-source`,
        targetHandle: `${usage.tableName}-${usage.columnName}-target`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '2,4' },
        label: usage.columnName,
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#18181b', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
        data: { type: 'enumUsage' },
      })
    }
  })

  // Create edges for policies → tables
  schema.policies.forEach((policy) => {
    const targetTable = schema.tables.find((t) => t.name === policy.tableName)
    if (targetTable) {
      edges.push({
        id: `${policy.id}-table`,
        source: policy.id,
        target: targetTable.id,
        sourceHandle: `${policy.name}-table-source`,
        targetHandle: `${policy.tableName}-policy-target`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,5' },
        data: { type: 'policyTable' },
      })
    }
  })

  // Create edges for views → dependencies
  schema.views.forEach((view) => {
    view.dependencies.forEach((depName) => {
      const targetTable = schema.tables.find((t) => t.name.toLowerCase() === depName.toLowerCase())
      const targetView = schema.views.find((v) => v.name.toLowerCase() === depName.toLowerCase())

      if (targetTable) {
        edges.push({
          id: `view-dep-${view.id}-${targetTable.id}`,
          source: view.id,
          target: targetTable.id,
          sourceHandle: `${view.name}-source`,
          targetHandle: `${targetTable.name}-view-target`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#14b8a6', strokeWidth: 2, strokeDasharray: '4,4' },
          data: { type: 'viewDependency' },
        })
      } else if (targetView && targetView.id !== view.id) { // Avoid self referencing just in case
        edges.push({
          id: `view-dep-${view.id}-${targetView.id}`,
          source: view.id,
          target: targetView.id,
          sourceHandle: `${view.name}-source`,
          targetHandle: `${targetView.name}-target`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#14b8a6', strokeWidth: 2, strokeDasharray: '4,4' },
          data: { type: 'viewDependency' },
        })
      }
    })
  })

  // Create edges for function → function calls
  schema.functionCalls.forEach((call) => {
    const callerFunc = schema.functions.find((f) => f.name === call.callerName && f.schema === call.callerSchema)
    const calleeFunc = schema.functions.find((f) => f.name === call.calleeName && f.schema === call.calleeSchema)
    
    if (callerFunc && calleeFunc) {
      edges.push({
        id: call.id,
        source: callerFunc.id,
        target: calleeFunc.id,
        sourceHandle: `${callerFunc.name}-source`,
        targetHandle: `${calleeFunc.name}-target`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#22c55e', strokeWidth: 2, strokeDasharray: '4,4' },
        label: 'calls',
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#18181b', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
      })
    }
  })

  return { nodes, edges }
}

export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'LR'
): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'LR',
    nodesep: 120, // Increased
    ranksep: 200, // Increased
    align: 'DL',  // Better horizontal alignment
    marginx: 50,
    marginy: 50,
  })

  // Find connected versus isolated nodes (considering groups)
  const connectedNodeIds = new Set<string>()
  edges.forEach((edge) => {
    let sId = edge.source
    let tId = edge.target
    const sNode = nodes.find(n => n.id === sId)
    const tNode = nodes.find(n => n.id === tId)
    if (sNode?.parentId && sNode.parentId !== 'isolated-group') sId = sNode.parentId
    if (tNode?.parentId && tNode.parentId !== 'isolated-group') tId = tNode.parentId
    
    connectedNodeIds.add(sId)
    connectedNodeIds.add(tId)
  })

  const connectedNodes = nodes.filter((node) => 
    connectedNodeIds.has(node.id) || 
    (node.parentId && node.parentId !== 'isolated-group' && connectedNodeIds.has(node.parentId))
  )
  const isolatedNodes = nodes.filter((node) => 
    !connectedNodeIds.has(node.id) && 
    (!node.parentId || node.parentId === 'isolated-group' || !connectedNodeIds.has(node.parentId))
  )

  // Build a type lookup for nodes
  const nodeTypeMap = new Map<string, string>()
  nodes.forEach((node) => {
    nodeTypeMap.set(node.id, node.type || 'unknown')
  })

  // Pre-calculate group dimensions if they are not measured
  const groupChildrenMap = new Map<string, Node[]>()
  nodes.forEach(n => {
    if (n.parentId) {
      if (!groupChildrenMap.has(n.parentId)) groupChildrenMap.set(n.parentId, [])
      groupChildrenMap.get(n.parentId)!.push(n)
    }
  })

  // Add connected nodes (or their parents if they are grouped) to the graph
  connectedNodes.forEach((node) => {
    // If node is a child of a group, we handle layout via the group node in Dagre
    if (node.parentId && node.parentId !== 'isolated-group') {
      return
    }

    let width = node.measured?.width || node.width
    let height = node.measured?.height || node.height
    
    // Priority 2: Use intelligent estimates for new nodes
    if (!width || !height) {
      if (node.type === 'group' && node.id.startsWith('group-policies-')) {
        const children = groupChildrenMap.get(node.id) || []
        const padding = 50
        const policyWidth = NODE_DIMENSIONS.policy.width
        const policyHeight = NODE_DIMENSIONS.policy.height
        const gap = 30
        
        width = policyWidth + padding * 2
        height = 80 + children.length * (policyHeight + gap) // 80 for header
        
        // Update the node style so React Flow knows the dimensions
        node.style = { ...node.style, width, height }
      } else {
        const base = NODE_DIMENSIONS[node.type as keyof typeof NODE_DIMENSIONS] || { width: 200, height: 100 }
        width = base.width
        height = base.height
  
        // If it's a table, estimate height based on row count
        if (node.type === 'table' && (node.data as any)?.table?.columns) {
          height = Math.max(height, 60 + (node.data as any).table.columns.length * 36)
        }
      }
    }

    g.setNode(node.id, { width, height })
  })

  // Create layout-specific edges to control column placement
  // Goal: Enums (col 1) → Tables (col 2) → Triggers/Policies (col 3) → Functions (col 4)
  //
  // To achieve this with LR layout:
  //   - Enum → Table edges: keep as-is (enum left, table right) ✓
  //   - Trigger → Table edges: REVERSE to Table → Trigger (table left, trigger right) 
  //   - Trigger → Function edges: keep as-is (trigger left, function right) ✓
  //   - Policy → Table edges: REVERSE to Table → Policy (table left, policy right)
  //   - FK edges (Table → Table): keep as-is ✓
  //   - Function → Function call edges: keep as-is ✓
  edges.forEach((edge) => {
    let sourceId = edge.source
    let targetId = edge.target
    
    // If nodes are in groups, use the group ID for dagre layout
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)
    
    if (sourceNode?.parentId && sourceNode.parentId !== 'isolated-group') sourceId = sourceNode.parentId
    if (targetNode?.parentId && targetNode.parentId !== 'isolated-group') targetId = targetNode.parentId

    // Avoid self-loops in dagre if both ends ended up in the same group
    if (sourceId === targetId) return

    const sourceType = nodeTypeMap.get(edge.source)
    const targetType = nodeTypeMap.get(edge.target)

    // Only add edges for connected nodes that are in the dagre graph
    if (!g.hasNode(sourceId) || !g.hasNode(targetId)) return

    // Reverse trigger→table and policy→table so tables rank before them
    if (
      (sourceType === 'trigger' && targetType === 'table') ||
      (sourceType === 'policy' && targetType === 'table')
    ) {
      // Reversed: table → trigger/policy (puts table LEFT, trigger/policy RIGHT)
      g.setEdge(targetId, sourceId, { weight: 2 })
    } else {
      // Keep normal direction
      g.setEdge(sourceId, targetId, { weight: 1 })
    }
  })

  dagre.layout(g)

  const results: Node[] = nodes.filter(n => g.hasNode(n.id)).map((node) => {
    const nodeWithPosition = g.node(node.id)
    const dimensions = node.type === 'group' && node.id.startsWith('group-policies-') 
      ? { width: Number(node.style?.width) || 300, height: Number(node.style?.height) || 200 }
      : NODE_DIMENSIONS[node.type as keyof typeof NODE_DIMENSIONS] || {
        width: 200,
        height: 100,
      }

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      },
    }
  })

  // Position children relative to their groups
  nodes.forEach(node => {
    if (node.parentId && node.parentId.startsWith('group-policies-')) {
      const parent = results.find(n => n.id === node.parentId)
      if (parent) {
        const children = groupChildrenMap.get(parent.id) || []
        const index = children.findIndex(c => c.id === node.id)
        const padding = 50
        const policyHeight = NODE_DIMENSIONS.policy.height
        const gap = 30
        
        results.push({
          ...node,
          position: {
            x: padding,
            y: 80 + index * (policyHeight + gap),
          }
        })
      }
    }
  })

  // Arrange isolated nodes in a separate section below the main layout
  if (isolatedNodes.length > 0) {
    const maxY = results.length > 0 
      ? Math.max(...results.map(n => n.position.y + (NODE_DIMENSIONS[n.type as keyof typeof NODE_DIMENSIONS]?.height || 200)))
      : 0
    const minX = results.length > 0 ? Math.min(...results.map(n => n.position.x)) : 0
    const maxX = results.length > 0 
      ? Math.max(...results.map(n => n.position.x + (NODE_DIMENSIONS[n.type as keyof typeof NODE_DIMENSIONS]?.width || 200)))
      : 800

    const sectionY = maxY + 200
    const itemGap = 50
    const groupPadding = 60
    const itemsPerRow = Math.max(3, Math.floor((maxX - minX + groupPadding * 2) / 260))
    const groupId = 'isolated-group'

    // Calculate group dimensions first
    const rows = Math.ceil(isolatedNodes.length / itemsPerRow)
    const maxHeight = 140
    const groupWidth = Math.max(groupPadding * 2 + itemsPerRow * 200 + (itemsPerRow - 1) * itemGap, 800)
    const groupHeight = groupPadding + 50 + rows * (maxHeight + itemGap)

    // IMPORTANT: Push the group node FIRST (parent must come before children in React Flow)
    results.push({
      id: groupId,
      type: 'group',
      data: { label: 'Isolated Components (No Relationships)' },
      position: { x: minX, y: sectionY },
      style: { width: groupWidth, height: groupHeight },
    })

    // Then push isolated nodes as children of the group
    isolatedNodes.forEach((node, index) => {
      const row = Math.floor(index / itemsPerRow)
      const col = index % itemsPerRow
      const dims = NODE_DIMENSIONS[node.type as keyof typeof NODE_DIMENSIONS] || {
        width: 200,
        height: 100,
      }

      results.push({
        ...node,
        parentId: groupId,
        position: {
          x: groupPadding + col * (dims.width + itemGap),
          y: 50 + row * (dims.height + itemGap),
        },
      })
    })
  }

  return results
}
