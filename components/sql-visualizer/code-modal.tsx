'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CodeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  code: string
}

// Simple SQL syntax highlighter
function highlightSQL(code: string): React.ReactNode[] {
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
          <span key={`${lineIndex}-${tokenIndex++}`} className="text-purple-300">
            {numberMatch[0]}
          </span>
        )
        remaining = remaining.slice(numberMatch[0].length)
        continue
      }

      // Check for keywords
      let foundKeyword = false
      for (const keyword of keywords) {
        const regex = new RegExp(`^(${keyword})\\b`, 'i')
        const match = remaining.match(regex)
        if (match) {
          tokens.push(
            <span key={`${lineIndex}-${tokenIndex++}`} className="text-blue-400 font-medium">
              {match[0]}
            </span>
          )
          remaining = remaining.slice(match[0].length)
          foundKeyword = true
          break
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

      // Whitespace or anything else
      tokens.push(
        <span key={`${lineIndex}-${tokenIndex++}`} className="text-zinc-300">
          {remaining[0]}
        </span>
      )
      remaining = remaining.slice(1)
    }

    return (
      <div key={lineIndex} className="flex">
        <span className="w-10 shrink-0 select-none pr-4 text-right text-zinc-600">
          {lineIndex + 1}
        </span>
        <span className="flex-1">{tokens}</span>
      </div>
    )
  })
}

export function CodeModal({ isOpen, onClose, title, code }: CodeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl border-zinc-700 bg-zinc-900 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm">
          {highlightSQL(code)}
        </div>
      </DialogContent>
    </Dialog>
  )
}
