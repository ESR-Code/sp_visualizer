import {
  ParsedSchema,
  ParsedTable,
  ParsedEnum,
  ParsedFunction,
  ParsedTrigger,
  ParsedPolicy,
  ForeignKeyRelation,
  EnumUsage,
  FunctionCall,
  Column,
} from './sql-types'

// Generate unique IDs
let idCounter = 0
const generateId = (prefix: string) => `${prefix}-${++idCounter}`

// Reset counter for fresh parsing
export function resetIdCounter() {
  idCounter = 0
}

// Parse CREATE TABLE statements
function parseTables(sql: string): { tables: ParsedTable[]; foreignKeys: ForeignKeyRelation[] } {
  const tables: ParsedTable[] = []
  const foreignKeys: ForeignKeyRelation[] = []
  
  // Match CREATE TABLE statements
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["']?([^"'\s.]+)["']?\.)?["']?([^"'\s(]+)["']?\s*\(([\s\S]*?)\)\s*(?:PARTITION\s+BY\s+[\s\S]*?)?;/gi
  
  let match
  while ((match = tableRegex.exec(sql)) !== null) {
    const schema = match[1] || 'public'
    const tableName = match[2]
    const columnsBlock = match[3]
    
    const columns: Column[] = []
    
    // Parse individual column definitions
    const lines = columnsBlock.split(',').map(l => l.trim()).filter(l => l.length > 0)
    
    for (const line of lines) {
      // Skip constraint definitions
      if (/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT)/i.test(line)) {
        // Check for table-level foreign key constraints
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\(\s*["']?(\w+)["']?\s*\)\s*REFERENCES\s+(?:["']?(\w+)["']?\.)?["']?(\w+)["']?\s*\(\s*["']?(\w+)["']?\s*\)/i)
        if (fkMatch) {
          foreignKeys.push({
            id: generateId('fk'),
            sourceTable: tableName,
            sourceColumn: fkMatch[1],
            targetTable: fkMatch[3],
            targetColumn: fkMatch[4],
          })
        }
        continue
      }
      
      // Parse column: name type [constraints...]
      const colMatch = line.match(/^["']?([^"'\s]+)["']?\s+([^"'\s]+(?:\s*\([^)]+\))?(?:\s*\[\s*\])?)/i)
      if (!colMatch) continue
      
      const colName = colMatch[1]
      const colType = colMatch[2]
      
      const column: Column = {
        name: colName,
        type: colType,
        isPrimaryKey: /PRIMARY\s+KEY/i.test(line),
        isNotNull: /NOT\s+NULL/i.test(line) || /PRIMARY\s+KEY/i.test(line),
        defaultValue: undefined,
        references: undefined,
        enumType: undefined,
      }
      
      // Check for DEFAULT value
      const defaultMatch = line.match(/DEFAULT\s+([^,\s]+(?:\([^)]*\))?)/i)
      if (defaultMatch) {
        column.defaultValue = defaultMatch[1]
      }
      
      // Check for inline REFERENCES
      const refMatch = line.match(/REFERENCES\s+(?:["']?(\w+)["']?\.)?["']?(\w+)["']?\s*\(\s*["']?(\w+)["']?\s*\)/i)
      if (refMatch) {
        column.references = {
          table: refMatch[2],
          column: refMatch[3],
        }
        foreignKeys.push({
          id: generateId('fk'),
          sourceTable: tableName,
          sourceColumn: colName,
          targetTable: refMatch[2],
          targetColumn: refMatch[3],
        })
      }
      
      columns.push(column)
    }
    
    tables.push({
      id: generateId('table'),
      name: tableName,
      schema,
      columns,
    })
  }
  
  return { tables, foreignKeys }
}

// Parse CREATE TYPE ... AS ENUM statements
function parseEnums(sql: string): ParsedEnum[] {
  const enums: ParsedEnum[] = []
  
  const enumRegex = /CREATE\s+TYPE\s+(?:["']?([^"'\s.]+)["']?\.)?["']?([^"'\s(]+)["']?\s+AS\s+ENUM\s*\(([\s\S]*?)\)\s*;/gi
  
  let match
  while ((match = enumRegex.exec(sql)) !== null) {
    const schema = match[1] || 'public'
    const enumName = match[2]
    const valuesStr = match[3]
    
    // Parse enum values
    const values = valuesStr
      .split(',')
      .map(v => v.trim().replace(/^['"]|['"]$/g, ''))
      .filter(v => v.length > 0)
    
    enums.push({
      id: generateId('enum'),
      name: enumName,
      schema,
      values,
    })
  }
  
  return enums
}

// Parse CREATE FUNCTION statements
function parseFunctions(sql: string): ParsedFunction[] {
  const functions: ParsedFunction[] = []
  
  // Match CREATE FUNCTION (supports quoted identifiers and return types)
  const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:["']?([^"'\s.]+)["']?\.)?["']?([^"'\s(]+)["']?\s*\(([\s\S]*?)\)\s*RETURNS\s+["']?([^"';]+?)["']?(?=$|\s|;|LANGUAGE|AS)/gi
  
  let match
  while ((match = funcRegex.exec(sql)) !== null) {
    const schema = match[1] || 'public'
    const funcName = match[2]
    const params = match[3].trim()
    let returnType = match[4].trim()
    
    // Find body to show in "View SQL"
    let body = ''
    // Search for body after the signature
    const remainingSql = sql.substring(funcRegex.lastIndex - match[0].length)
    const nextStatementIndex = remainingSql.substring(match[0].length).search(/CREATE\s+(TABLE|FUNCTION|TRIGGER|POLICY|TYPE)/i)
    const searchLimit = nextStatementIndex !== -1 ? nextStatementIndex + match[0].length : remainingSql.length
    const bodyMatch = remainingSql.substring(0, searchLimit).match(/AS\s+(\$\$[\s\S]*?\$\$|'[\s\S]*?')/i)
    
    if (bodyMatch) {
      body = bodyMatch[1].replace(/^\$\$|^\$|\$\$$|\$$/g, '').trim()
    }
    
    functions.push({
      id: generateId('func'),
      name: funcName,
      schema,
      parameters: params,
      returnType,
      body,
    })
  }
  
  return functions
}

// Parse CREATE TRIGGER statements
function parseTriggers(sql: string): ParsedTrigger[] {
  const triggers: ParsedTrigger[] = []
  
  const triggerRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+["']?([^"'\s]+)["']?\s+(BEFORE|AFTER|INSTEAD\s+OF)\s+([\s\S]+?)\s+ON\s+(?:["']?([^"'\s.]+)["']?\.)?["']?([^"'\s]+)["']?[\s\S]*?EXECUTE\s+(?:FUNCTION|PROCEDURE)\s+(?:["']?([^"'\s.]+)["']?\.)?["']?([^"'\s(]+)["']?\s*\(([\s\S]*?)\)/gi
  
  let match
  while ((match = triggerRegex.exec(sql)) !== null) {
    const triggerName = match[1]
    const timing = match[2].replace(/\s+/g, ' ').toUpperCase() as ParsedTrigger['timing']
    
    // Parse multiple events
    const eventText = match[3].toUpperCase()
    const events: ParsedTrigger['events'] = []
    if (eventText.includes('INSERT')) events.push('INSERT')
    if (eventText.includes('UPDATE')) events.push('UPDATE')
    if (eventText.includes('DELETE')) events.push('DELETE')
    
    const tableSchema = match[4] || 'public'
    const tableName = match[5]
    const funcSchema = match[6] || 'public'
    const funcName = match[7]
    
    triggers.push({
      id: generateId('trigger'),
      name: triggerName,
      timing,
      events,
      tableName,
      tableSchema,
      functionName: funcName,
      functionSchema: funcSchema,
    })
  }
  
  return triggers
}

// Parse CREATE POLICY statements
function parsePolicies(sql: string): ParsedPolicy[] {
  const policies: ParsedPolicy[] = []
  
  const policyRegex = /CREATE\s+POLICY\s+["']?([^"'\s]+)["']?\s+ON\s+(?:["']?([^"'\s.]+)["']?\.)?["']?([^"'\s]+)["']?\s*(?:AS\s+(PERMISSIVE|RESTRICTIVE)\s+)?(?:FOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)\s+)?(?:TO\s+([\w,"'\s,]+)\s+)?(?:USING\s*\(([\s\S]*?)\))?(?:\s+WITH\s+CHECK\s*\(([\s\S]*?)\))?\s*;/gi
  
  let match
  while ((match = policyRegex.exec(sql)) !== null) {
    const policyName = match[1]
    const tableSchema = match[2] || 'public'
    const tableName = match[3]
    const permissive = match[4]?.toUpperCase() !== 'RESTRICTIVE'
    const operation = (match[5]?.toUpperCase() || 'ALL') as ParsedPolicy['operation']
    const rolesStr = match[6] || 'public'
    const usingExpr = match[7]?.trim()
    const withCheckExpr = match[8]?.trim()
    
    const roles = rolesStr.split(',').map(r => r.trim()).filter(r => r.length > 0)
    
    policies.push({
      id: generateId('policy'),
      name: policyName,
      tableName,
      tableSchema,
      permissive,
      operation,
      roles,
      usingExpression: usingExpr,
      withCheckExpression: withCheckExpr,
    })
  }
  
  return policies
}

// Parse ALTER TABLE ... DISABLE TRIGGER statements
function parseDisabledTriggers(sql: string, triggers: ParsedTrigger[]) {
  const disableRegex = /ALTER\s+TABLE\s+(?:["']?([^"'\s.]+)["']?\.)?["']?([^"'\s]+)["']?\s+DISABLE\s+TRIGGER\s+["']?([^"'\s;]+)["']?/gi
  
  let match
  while ((match = disableRegex.exec(sql)) !== null) {
    const tableName = match[2]
    const triggerName = match[3]
    
    const trigger = triggers.find(t => t.name === triggerName && t.tableName === tableName)
    if (trigger) {
      trigger.isDisabled = true
    }
  }
}

// Find enum usages in table columns
function findEnumUsages(tables: ParsedTable[], enums: ParsedEnum[]): EnumUsage[] {
  const enumUsages: EnumUsage[] = []
  const enumNames = new Set(enums.map(e => e.name.toLowerCase()))
  
  for (const table of tables) {
    for (const column of table.columns) {
      const colTypeLower = column.type.toLowerCase()
      if (enumNames.has(colTypeLower)) {
        column.enumType = column.type
        enumUsages.push({
          id: generateId('enum-usage'),
          enumName: column.type,
          tableName: table.name,
          columnName: column.name,
        })
      }
    }
  }
  
  return enumUsages
}

// Find function calls within function bodies
function findFunctionCalls(functions: ParsedFunction[]): FunctionCall[] {
  const functionCalls: FunctionCall[] = []
  
  for (const caller of functions) {
    if (!caller.body) continue
    
    for (const callee of functions) {
      // Avoid linking to self unless recursive (optional)
      if (caller.id === callee.id) continue
      
      // Look for callee name followed by parenthesis
      // Handles: callee(), schema.callee(), PERFORM callee(), etc.
      const escapedCallee = callee.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const escapedSchema = callee.schema.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      
      // Regex to find function calls:
      // 1. Optional schema prefix
      // 2. Callee name
      // 3. Opening parenthesis
      const callPattern = new RegExp(`(?:["']?${escapedSchema}["']?\\.)?["']?${escapedCallee}["']?\\s*\\(`, 'gi')
      
      if (callPattern.test(caller.body)) {
        functionCalls.push({
          id: generateId('func-call'),
          callerName: caller.name,
          callerSchema: caller.schema,
          calleeName: callee.name,
          calleeSchema: callee.schema,
        })
      }
    }
  }
  
  return functionCalls
}

// Main parser function
export function parseSQL(sql: string): ParsedSchema {
  resetIdCounter()
  
  // Remove comments
  const cleanedSql = sql
    .replace(/--.*$/gm, '') // Single line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
  
  const { tables, foreignKeys } = parseTables(cleanedSql)
  const enums = parseEnums(cleanedSql)
  const functions = parseFunctions(cleanedSql)
  const triggers = parseTriggers(cleanedSql)
  const policies = parsePolicies(cleanedSql)
  
  // Mark disabled triggers
  parseDisabledTriggers(cleanedSql, triggers)
  
  const enumUsages = findEnumUsages(tables, enums)
  const functionCalls = findFunctionCalls(functions)
  
  return {
    tables,
    enums,
    functions,
    triggers,
    policies,
    foreignKeys,
    enumUsages,
    functionCalls,
  }
}

// Example SQL for testing
export const exampleSQL = `-- Create enum type for user status
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'banned');

-- Create enum type for post status
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status user_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  status post_status DEFAULT 'draft',
  author_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger for posts table  
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY users_select_own ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for posts
CREATE POLICY posts_select_published ON posts
  FOR SELECT
  USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY posts_insert_own ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY posts_update_own ON posts
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- RLS Policy for comments
CREATE POLICY comments_select_all ON comments
  FOR SELECT
  USING (true);

CREATE POLICY comments_insert_authenticated ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
`;
