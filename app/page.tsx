'use client'

import { useState, useCallback } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { SqlInput } from '@/components/sql-visualizer/sql-input'
import { FlowDiagram } from '@/components/sql-visualizer/flow-diagram'
import { parseSQL } from '@/lib/sql-parser'
import type { ParsedSchema } from '@/lib/sql-types'
import { Database, GitBranch } from 'lucide-react'

export default function Home() {
  const [sqlCode, setSqlCode] = useState('')
  const [schema, setSchema] = useState<ParsedSchema | null>(null)
  const [stats, setStats] = useState<{
    tables: number
    enums: number
    functions: number
    triggers: number
    policies: number
    foreignKeys: number
  } | null>(null)

  const handleVisualize = useCallback(() => {
    if (!sqlCode.trim()) return

    const parsed = parseSQL(sqlCode)
    setSchema(parsed)
    setStats({
      tables: parsed.tables.length,
      enums: parsed.enums.length,
      functions: parsed.functions.length,
      triggers: parsed.triggers.length,
      policies: parsed.policies.length,
      foreignKeys: parsed.foreignKeys.length,
    })
  }, [sqlCode])

  const handleClear = useCallback(() => {
    setSqlCode('')
    setSchema(null)
    setStats(null)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">
              Supabase SQL Flow Visualizer
            </h1>
            <p className="text-xs text-zinc-500">
              Visualize your database schema, triggers, functions, and policies
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex items-center gap-4">
            <StatBadge label="Tables" value={stats.tables} color="bg-blue-500" />
            <StatBadge label="Enums" value={stats.enums} color="bg-purple-500" />
            <StatBadge label="Functions" value={stats.functions} color="bg-green-500" />
            <StatBadge label="Triggers" value={stats.triggers} color="bg-orange-500" />
            <StatBadge label="Policies" value={stats.policies} color="bg-red-500" />
            <StatBadge label="FK Relations" value={stats.foreignKeys} color="bg-blue-300" />
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <SqlInput
              value={sqlCode}
              onChange={setSqlCode}
              onVisualize={handleVisualize}
              onClear={handleClear}
            />
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-zinc-800 transition-colors hover:bg-zinc-700" />

          <ResizablePanel defaultSize={70}>
            <div className="h-full bg-zinc-950">
              <FlowDiagram schema={schema} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-center border-t border-zinc-800 py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <GitBranch className="h-3 w-3" />
          <span>Supports CREATE TABLE, CREATE TYPE (ENUM), CREATE FUNCTION, CREATE TRIGGER, CREATE POLICY</span>
        </div>
      </footer>
    </div>
  )
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  if (value === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-zinc-400">
        {value} {label}
      </span>
    </div>
  )
}
