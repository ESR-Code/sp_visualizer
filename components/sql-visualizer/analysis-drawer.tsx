'use client'

import { useState, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShieldAlert, Zap, RefreshCw, Search, AlertCircle, CheckCircle2, Info, RotateCcw, Activity, Layers } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { ParsedSchema } from '@/lib/sql-types'

interface AnalysisDrawerProps {
  isOpen: boolean
  onClose: () => void
  schema: ParsedSchema | null
}

const ANALYSIS_TYPES = [
  {
    id: 'rls',
    title: 'RLS Enablement Check',
    description: "Identifies tables that have RLS policies defined but are missing the 'ENABLE ROW LEVEL SECURITY' command, leaving data publicly accessible.",
    icon: ShieldAlert,
    color: 'text-red-400',
  },
  {
    id: 'performance',
    title: 'Performance Optimization',
    description: "Scans RLS policies for raw auth.uid() calls and suggests subquery wrapping to improve query execution speed via Postgres caching.",
    icon: Zap,
    color: 'text-amber-400',
  },
  {
    id: 'circular',
    title: 'Circular Dependencies',
    description: "Detects recursive foreign key relationships and deep reference loops that can cause system crashes or data integrity issues during deletions.",
    icon: RefreshCw,
    color: 'text-blue-400',
  },
  {
    id: 'trigger-loop',
    title: 'Infinite Trigger Loops',
    description: "Scans for triggers that update the same table they are defined on without proper guards, which can lead to nested call-stack exhaustion or timeout errors.",
    icon: RotateCcw,
    color: 'text-orange-400',
  },
  {
    id: 'indexes',
    title: 'Indexes',
    description: "Lists all detected B-Tree, GIST, and GIN indexes, helping you verify that your query-heavy columns are properly optimized for search and filtering.",
    icon: Layers,
    color: 'text-purple-400',
  },
  {
    id: 'missing-index',
    title: 'Missing Index Audit',
    description: "Analyzes foreign key constraints to find columns missing a B-Tree index, which is essential for fast joins and efficient cascading deletes.",
    icon: Search,
    color: 'text-emerald-400',
  },
]

export function AnalysisDrawer({ isOpen, onClose, schema }: AnalysisDrawerProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>(ANALYSIS_TYPES[0].id)

  const healthValue: number = 82 // Static for now

  const healthStatus = useMemo(() => {
    if (healthValue === 100) return { label: 'Perfect', color: 'bg-emerald-500', text: 'text-emerald-400', icon: CheckCircle2 }
    if (healthValue >= 80) return { label: 'Excellent', color: 'bg-blue-500', text: 'text-blue-400', icon: CheckCircle2 }
    if (healthValue >= 50) return { label: 'Average', color: 'bg-amber-500', text: 'text-amber-400', icon: AlertCircle }
    return { label: 'Danger', color: 'bg-red-500', text: 'text-red-400', icon: ShieldAlert }
  }, [healthValue])

  const currentAnalysis = useMemo(() => 
    ANALYSIS_TYPES.find(t => t.id === selectedAnalysis) || ANALYSIS_TYPES[0]
  , [selectedAnalysis])

  // Simple demo results for now (placeholders)
  const results = useMemo(() => {
    if (!schema) return []
    
    // In a real implementation, we'd run actual logic here
    // For now, I'll return some static advice based on the schema
    return [
      {
        title: 'Draft implementation',
        message: 'This analysis is being initialized. Real scanning of your schema will appear here shortly.',
        severity: 'info' as const
      }
    ]
  }, [schema, selectedAnalysis])

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] border-zinc-800 bg-zinc-950 p-0 sm:max-w-[600px]">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-zinc-800 p-6 pb-4">
            <SheetTitle className="text-xl font-bold text-zinc-100">General Analysis</SheetTitle>
            <SheetDescription className="text-zinc-500">
              Deep dive into your schema for security, performance, and integrity.
            </SheetDescription>
          </SheetHeader>

          <div className="p-6 pb-2">
            {/* Health Indicator */}
            <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`rounded-full p-1.5 ${healthStatus.color} bg-opacity-20 ${healthStatus.text}`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Overall Health</span>
                    <h4 className={`text-sm font-bold ${healthStatus.text}`}>{healthStatus.label}</h4>
                  </div>
                </div>
                <span className="text-2xl font-black text-zinc-100">{healthValue}%</span>
              </div>
              
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div 
                  className={`h-full ${healthStatus.color} shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-500`} 
                  style={{ width: `${healthValue}%` }} 
                />
              </div>
            </div>

            <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
              <SelectTrigger className="w-full border-zinc-800 bg-zinc-900 text-zinc-200">
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-200">
                {ANALYSIS_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="focus:bg-zinc-800 focus:text-white">
                    <div className="flex items-center gap-3">
                      <type.icon className={`h-4 w-4 ${type.color}`} />
                      <span>{type.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-4 rounded-lg bg-zinc-900/50 p-4 border border-zinc-800/50">
               <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-2">
                 <Info className="h-4 w-4 text-blue-400" />
                 About this check
               </h4>
               <p className="text-xs leading-relaxed text-zinc-400">
                 {currentAnalysis.description}
               </p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-6 pt-4">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Analysis Results</h3>
            
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-4 pr-4">
                {results.map((res, i) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                      <div>
                        <div className="text-sm font-medium text-zinc-200">{res.title}</div>
                        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{res.message}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
                  <div className="mb-3 rounded-full bg-zinc-900 p-3">
                    <currentAnalysis.icon className="h-6 w-6 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">Ready for deep scan</p>
                  <p className="mt-1 text-xs opacity-60">Full automated logic for {currentAnalysis.title} is coming in the next update.</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
