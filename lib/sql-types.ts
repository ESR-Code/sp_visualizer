// Types for parsed SQL entities

export interface Column {
  name: string
  type: string
  isPrimaryKey: boolean
  isNotNull: boolean
  defaultValue?: string
  references?: {
    table: string
    column: string
  }
  enumType?: string
}

export interface ParsedTable {
  id: string
  name: string
  schema: string
  columns: Column[]
}

export interface ParsedEnum {
  id: string
  name: string
  schema: string
  values: string[]
}

export interface ParsedFunction {
  id: string
  name: string
  schema: string
  parameters: string
  returnType: string
  body: string
}

export interface ParsedTrigger {
  id: string
  name: string
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF'
  events: ('INSERT' | 'UPDATE' | 'DELETE')[]
  tableName: string
  tableSchema: string
  functionName: string
  functionSchema: string
}

export interface ParsedPolicy {
  id: string
  name: string
  tableName: string
  tableSchema: string
  permissive: boolean
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  roles: string[]
  usingExpression?: string
  withCheckExpression?: string
}

export interface ForeignKeyRelation {
  id: string
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
}

export interface EnumUsage {
  id: string
  enumName: string
  tableName: string
  columnName: string
}

export interface ParsedSchema {
  tables: ParsedTable[]
  enums: ParsedEnum[]
  functions: ParsedFunction[]
  triggers: ParsedTrigger[]
  policies: ParsedPolicy[]
  foreignKeys: ForeignKeyRelation[]
  enumUsages: EnumUsage[]
}

// Node types for React Flow
export type NodeType = 'table' | 'enum' | 'function' | 'trigger' | 'policy'

export interface BaseNodeData {
  label: string
}

export interface TableNodeData extends BaseNodeData {
  table: ParsedTable
}

export interface EnumNodeData extends BaseNodeData {
  enum: ParsedEnum
}

export interface FunctionNodeData extends BaseNodeData {
  function: ParsedFunction
}

export interface TriggerNodeData extends BaseNodeData {
  trigger: ParsedTrigger
}

export interface PolicyNodeData extends BaseNodeData {
  policy: ParsedPolicy
}

// Edge types
export type EdgeType = 'foreignKey' | 'triggerTable' | 'triggerFunction' | 'enumUsage' | 'policyTable'
