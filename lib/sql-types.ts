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
    onDelete?: string
    onUpdate?: string
  }
  enumType?: string
}

export interface ParsedTable {
  id: string
  name: string
  schema: string
  columns: Column[]
  rlsEnabled?: boolean
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
  isDisabled?: boolean
  updatedColumns?: string[]
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
  onDelete?: string
  onUpdate?: string
}

export interface EnumUsage {
  id: string
  enumName: string
  tableName: string
  columnName: string
}

export interface FunctionCall {
  id: string
  callerName: string
  callerSchema: string
  calleeName: string
  calleeSchema: string
}

export interface ParsedView {
  id: string
  name: string
  schema: string
  securityInvoker: boolean
  dependencies: string[]
  code: string
}

export interface ParsedExtension {
  id: string
  name: string
  schema: string
  version?: string
}

export interface ParsedSchema {
  tables: ParsedTable[]
  enums: ParsedEnum[]
  functions: ParsedFunction[]
  triggers: ParsedTrigger[]
  policies: ParsedPolicy[]
  foreignKeys: ForeignKeyRelation[]
  enumUsages: EnumUsage[]
  functionCalls: FunctionCall[]
  views: ParsedView[]
  extensions: ParsedExtension[]
}

// Node types for React Flow
export type NodeType = 'table' | 'enum' | 'function' | 'trigger' | 'policy' | 'group' | 'view' | 'extension'

export interface BaseNodeData {
  label: string
  onViewCode?: (title: string, code: string) => void
  onSoloToggle?: (id: string) => void
  isSolo?: boolean
}

export interface TableNodeData extends BaseNodeData {
  table: ParsedTable
  onImpactAnalysis?: (table: ParsedTable) => void
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

export interface ViewNodeData extends BaseNodeData {
  view: ParsedView
}

export interface ExtensionNodeData extends BaseNodeData {
  extension: ParsedExtension
}

// Edge types
export type EdgeType = 'foreignKey' | 'triggerTable' | 'triggerFunction' | 'enumUsage' | 'policyTable' | 'functionCall' | 'viewDependency'
