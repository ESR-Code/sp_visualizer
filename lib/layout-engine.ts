import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'
import type { ParsedSchema } from './sql-types'

const NODE_DIMENSIONS = {
  table: { width: 250, height: 200 },
  enum: { width: 180, height: 100 },
  function: { width: 200, height: 100 },
  trigger: { width: 200, height: 120 },
  policy: { width: 240, height: 120 },
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
      data: { label: table.name, table },
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

  // Create policy nodes
  schema.policies.forEach((policy) => {
    nodes.push({
      id: policy.id,
      type: 'policy',
      position: { x: 0, y: 0 },
      data: { label: policy.name, policy },
    })
  })

  // Create edges for foreign keys
  schema.foreignKeys.forEach((fk) => {
    const sourceTable = schema.tables.find((t) => t.name === fk.sourceTable)
    const targetTable = schema.tables.find((t) => t.name === fk.targetTable)

    if (sourceTable && targetTable) {
      edges.push({
        id: fk.id,
        source: sourceTable.id,
        target: targetTable.id,
        sourceHandle: `${fk.sourceTable}-${fk.sourceColumn}-source`,
        targetHandle: `${fk.targetTable}-${fk.targetColumn}-target`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        label: `${fk.sourceColumn} → ${fk.targetColumn}`,
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#18181b', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
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
        targetHandle: `${usage.tableName}-enum-target`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '2,4' },
        label: usage.columnName,
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#18181b', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
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
      })
    }
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
  direction: 'TB' | 'LR' = 'TB'
): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 })

  nodes.forEach((node) => {
    const dimensions = NODE_DIMENSIONS[node.type as keyof typeof NODE_DIMENSIONS] || {
      width: 200,
      height: 100,
    }
    g.setNode(node.id, { width: dimensions.width, height: dimensions.height })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    const dimensions = NODE_DIMENSIONS[node.type as keyof typeof NODE_DIMENSIONS] || {
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
}
