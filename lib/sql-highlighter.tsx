'use client'

import React from 'react'

const keywords = [
  'CREATE', 'TABLE', 'TYPE', 'ENUM', 'FUNCTION', 'TRIGGER', 'POLICY',
  'AS', 'ON', 'FOR', 'EACH', 'ROW', 'EXECUTE', 'PROCEDURE', 'RETURNS',
  'LANGUAGE', 'BEGIN', 'END', 'IF', 'THEN', 'ELSE', 'RETURN', 'NEW', 'OLD',
  'INSERT', 'UPDATE', 'DELETE', 'SELECT', 'FROM', 'WHERE', 'AND', 'OR',
  'NOT', 'NULL', 'PRIMARY', 'KEY', 'REFERENCES', 'DEFAULT', 'UNIQUE',
  'CONSTRAINT', 'CHECK', 'FOREIGN', 'CASCADE', 'SET', 'TO', 'WITH',
  'USING', 'GRANT', 'REVOKE', 'ALL', 'PUBLIC', 'BEFORE', 'AFTER',
  'INSTEAD', 'OF', 'PERMISSIVE', 'RESTRICTIVE', 'SECURITY', 'DEFINER',
  'INVOKER', 'VOLATILE', 'STABLE', 'IMMUTABLE', 'STRICT', 'PARALLEL',
  'SAFE', 'UNSAFE', 'RESTRICTED', 'COST', 'ROWS', 'DECLARE', 'CASE',
  'WHEN', 'COALESCE', 'EXISTS', 'IN', 'REPLACE', 'ALTER', 'DROP', 'ADD',
  'COLUMN', 'INDEX', 'SCHEMA', 'OWNER', 'ENABLE', 'DISABLE', 'FORCE',
  'VIEW', 'MATERIALIZED', 'REFRESH', 'CONCURRENTLY', 'BOOLEAN', 'INTEGER',
  'TEXT', 'VARCHAR', 'UUID', 'TIMESTAMP', 'TIMESTAMPTZ', 'DATE', 'TIME',
  'NUMERIC', 'SERIAL', 'BIGSERIAL', 'BIGINT', 'SMALLINT', 'REAL',
  'DOUBLE', 'PRECISION', 'JSONB', 'JSON', 'ARRAY', 'BYTEA'
]

export function highlightSQL(code: string, showLineNumbers = true): React.ReactNode[] {
  const lines = code.split('\n')
  
  return lines.map((line, lineIndex) => {
    const tokens: React.ReactNode[] = []
    let remaining = line
    let tokenIndex = 0

    while (remaining.length > 0) {
      // Check for comments
      if (remaining.startsWith('--')) {
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`} className="text-zinc-500">
            {remaining}
          </span>
        )
        remaining = ''
        continue
      }

      // Check for strings
      const stringMatch = remaining.match(/^'([^']*)'/)
      if (stringMatch) {
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`} className="text-amber-300">
            {stringMatch[0]}
          </span>
        )
        remaining = remaining.slice(stringMatch[0].length)
        continue
      }

      // Check for numbers
      const numberMatch = remaining.match(/^\d+(\.\d+)?/)
      if (numberMatch) {
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`} className="text-purple-400">
            {numberMatch[0]}
          </span>
        )
        remaining = remaining.slice(numberMatch[0].length)
        continue
      }

      // Check for keywords
      let foundKeyword = false
      const keywordMatch = remaining.match(/^([a-zA-Z_]\w*)/i)
      if (keywordMatch) {
        const potentialKeyword = keywordMatch[1].toUpperCase()
        if (keywords.includes(potentialKeyword)) {
          tokens.push(
            <span key={`${lineIndex}-${tokenIndex++}`} className="text-blue-400 font-medium">
              {keywordMatch[0]}
            </span>
          )
          remaining = remaining.slice(keywordMatch[0].length)
          foundKeyword = true
        }
      }
      if (foundKeyword) continue

      // Check for identifiers (schema.table or plain identifiers)
      const identifierMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)
      if (identifierMatch) {
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`} className="text-green-300">
            {identifierMatch[0]}
          </span>
        )
        remaining = remaining.slice(identifierMatch[0].length)
        continue
      }

      // Check for operators and punctuation
      const operatorMatch = remaining.match(/^[(),.;:=<>!+\-*/$$$${}]/)
      if (operatorMatch) {
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`} className="text-zinc-400">
            {operatorMatch[0]}
          </span>
        )
        remaining = remaining.slice(operatorMatch[0].length)
        continue
      }

      // Whitespace
      const spaceMatch = remaining.match(/^\s+/)
      if (spaceMatch) {
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`}>
            {spaceMatch[0]}
          </span>
        )
        remaining = remaining.slice(spaceMatch[0].length)
        continue
      }

      // Fallback for anything else
      tokens.push(
        <span key={`${lineIndex}-${tokenIndex++}`} className="text-zinc-300">
          {remaining[0]}
        </span>
      )
      remaining = remaining.slice(1)
    }

    if (showLineNumbers) {
      return (
        <div key={lineIndex} className="flex min-h-[1.5rem]">
          <span className="w-10 shrink-0 select-none pr-4 text-right text-zinc-600">
            {lineIndex + 1}
          </span>
          <span className="flex-1 whitespace-pre-wrap">{tokens}</span>
        </div>
      )
    }

    return (
      <div key={lineIndex} className="min-h-[1.5rem] whitespace-pre-wrap">
        {tokens}
      </div>
    )
  })
}
