'use client'

import { useState, useCallback, useRef } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { SqlInput } from '@/components/sql-visualizer/sql-input'
import { FlowDiagram, type FlowDiagramRef } from '@/components/sql-visualizer/flow-diagram'
import { parseSQL } from '@/lib/sql-parser'
import type { ParsedSchema } from '@/lib/sql-types'
import { Database, GitBranch, Download, Camera, FileCode, FileText, ChevronDown, BarChart3, HelpCircle } from 'lucide-react'
import { AnalysisDrawer } from '@/components/sql-visualizer/analysis-drawer'
import { DumpInstructionsModal } from '@/components/sql-visualizer/dump-instructions-modal'

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

  const [soloNodeId, setSoloNodeId] = useState<string | null>(null)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const flowRef = useRef<FlowDiagramRef>(null)

  const handleExportScreenshot = useCallback(() => {
    flowRef.current?.takeScreenshot()
  }, [])

  const handleExportJson = useCallback(() => {
    if (!schema) return
    const data = JSON.stringify(schema, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `schema-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [schema])

  const handleExportMarkdown = useCallback(() => {
    if (!schema) return
    // Simple markdown export for now
    let md = `# Schema: ${schema.tables.length} tables\n\n`
    schema.tables.forEach(t => {
      md += `## Table: ${t.name}\n`
      t.columns.forEach(c => md += `- ${c.name} (${c.type})\n`)
      md += '\n'
    })
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `schema-${new Date().toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
  }, [schema])

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
    setSoloNodeId(null) // Reset solo mode on new visualization
  }, [sqlCode])

  const handleClear = useCallback(() => {
    setSqlCode('')
    setSchema(null)
    setStats(null)
    setSoloNodeId(null)
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

        <div className="flex items-center gap-6">
          {/* Help Button */}
          <Button
            onClick={() => setIsHelpOpen(true)}
            variant="ghost"
            size="sm"
            className="text-zinc-500 hover:text-zinc-200"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            How to use
          </Button>

          {/* Solo Mode Indicator */}
          {soloNodeId && (
            <div className="flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Solo Mode: {schema?.tables.find(t => t.id === soloNodeId)?.name || 
                        schema?.enums.find(e => e.id === soloNodeId)?.name ||
                        schema?.functions.find(f => f.id === soloNodeId)?.name ||
                        schema?.triggers.find(tr => tr.id === soloNodeId)?.name ||
                        schema?.policies.find(p => p.id === soloNodeId)?.name || 'Isolated Node'}
              <button 
                onClick={() => setSoloNodeId(null)}
                className="ml-1 rounded-full p-0.5 hover:bg-amber-500/20"
                title="Exit Solo Mode"
              >
                <span className="sr-only">Exit</span>
                &times;
              </button>
            </div>
          )}

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

          {schema && (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsAnalysisOpen(true)}
                variant="outline" 
                className="h-9 border-zinc-700 bg-zinc-900 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <BarChart3 className="mr-2 h-4 w-4 text-blue-400" />
                Analysis
              </Button>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 border-zinc-700 bg-zinc-900 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                  <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-zinc-700 bg-zinc-900 text-zinc-200">
                <DropdownMenuItem 
                  onClick={handleExportScreenshot}
                  className="cursor-pointer focus:bg-zinc-800 focus:text-white"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Export Screenshot
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem 
                  onClick={handleExportJson}
                  className="cursor-pointer focus:bg-zinc-800 focus:text-white"
                >
                  <FileCode className="mr-2 h-4 w-4" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleExportMarkdown}
                  className="cursor-pointer focus:bg-zinc-800 focus:text-white"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          )}
        </div>
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
              <FlowDiagram 
                ref={flowRef}
                schema={schema} 
                soloNodeId={soloNodeId}
                onSoloToggle={(id) => setSoloNodeId(prev => prev === id ? null : id)}
              />
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

      <AnalysisDrawer
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        schema={schema}
      />
      <DumpInstructionsModal
        isOpen={isHelpOpen}
        onOpenChange={setIsHelpOpen}
      />
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
