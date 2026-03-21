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
import { ShieldAlert, Zap, RefreshCw, Search, AlertCircle, CheckCircle2, Info, RotateCcw, Activity, Layers, Copy, ClipboardCheck } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { highlightSQL } from '@/lib/sql-highlighter'
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
    description: "Wrapping auth.uid() in a subquery allows Postgres to cache the ID, preventing it from being re-executed for every row.",
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
interface AnalysisResult {
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  before?: string
  after?: string
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-zinc-400 hover:text-zinc-100 transition-colors"
      onClick={handleCopy}
    >
      {copied ? <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

export function AnalysisDrawer({ isOpen, onClose, schema }: AnalysisDrawerProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>(ANALYSIS_TYPES[0].id)

  const allAnalysisResults = useMemo(() => {
    if (!schema) return {} as Record<string, AnalysisResult[]>
    
    const results: Record<string, AnalysisResult[]> = {
      rls: [],
      performance: [],
      circular: [],
      'trigger-loop': [],
      indexes: [],
      'missing-index': []
    }

    // 1. RLS Check
    const tablesWithPolicies = new Set(schema.policies.map(p => p.tableName))
    results.rls = schema.tables
      .filter(t => tablesWithPolicies.has(t.name) && !t.rlsEnabled)
      .map(t => ({
        title: `Security Alert: ${t.name}`,
        message: `This table has policies defined but Row Level Security is not enabled. Data remains publicly accessible until RLS is activated.`,
        severity: 'error',
        after: `ALTER TABLE "${t.name}" ENABLE ROW LEVEL SECURITY;`
      }))

    // 2. Performance
    const wrapUid = (expr: string) => expr.replace(/(?<!\(\s*select\s+)auth\.uid\(\)/gi, '(select auth.uid())');
    const hasRawUid = (expr: string) => /(?<!\(\s*select\s+)auth\.uid\(\)/i.test(expr);
    results.performance = schema.policies
      .filter(p => {
        const exprs = [p.usingExpression, p.withCheckExpression].filter(Boolean) as string[]
        return exprs.some(hasRawUid)
      })
      .map(p => {
        const roleStr = p.roles.length > 0 ? `TO ${p.roles.join(', ')}` : ''
        const asType = p.permissive ? '' : 'AS RESTRICTIVE '
        const beforeParts = []
        if (p.usingExpression) beforeParts.push(`  USING (${p.usingExpression})`)
        if (p.withCheckExpression) beforeParts.push(`  WITH CHECK (${p.withCheckExpression})`)
        const afterParts = []
        if (p.usingExpression) afterParts.push(`  USING (${wrapUid(p.usingExpression)})`)
        if (p.withCheckExpression) afterParts.push(`  WITH CHECK (${wrapUid(p.withCheckExpression)})`)

        return {
          title: `Policy: ${p.name}`,
          message: `Wrapping auth.uid() in a subquery allows Postgres to cache the ID, preventing it from being re-executed for every row.`,
          severity: 'warning',
          before: `CREATE POLICY "${p.name}" ON "${p.tableName}"\n${asType}FOR ${p.operation} ${roleStr}\n${beforeParts.join('\n')};`,
          after: `CREATE POLICY "${p.name}" ON "${p.tableName}"\n${asType}FOR ${p.operation} ${roleStr}\n${afterParts.join('\n')};`
        }
      })

    // 3. Circular Dependencies
    const fkGraph: Record<string, string[]> = {}
    schema.foreignKeys.forEach(fk => {
      if (!fkGraph[fk.sourceTable]) fkGraph[fk.sourceTable] = []
      fkGraph[fk.sourceTable].push(fk.targetTable)
    })

    const foundCycles: string[][] = []
    const visited = new Set<string>()
    const recStack = new Set<string>()

    const findCycle = (node: string, path: string[]) => {
      visited.add(node)
      recStack.add(node)
      path.push(node)

      const neighbors = fkGraph[node] || []
      for (const neighbor of neighbors) {
        if (neighbor === node) {
          foundCycles.push([node, node])
          continue
        }
        if (!visited.has(neighbor)) {
          findCycle(neighbor, [...path])
        } else if (recStack.has(neighbor)) {
          const cycleStartIdx = path.indexOf(neighbor)
          if (cycleStartIdx !== -1) {
            foundCycles.push([...path.slice(cycleStartIdx), neighbor])
          }
        }
      }
      recStack.delete(node)
    }

    Object.keys(fkGraph).forEach(table => {
      if (!visited.has(table)) findCycle(table, [])
    })

    // Remove duplicates
    const uniqueCycles = Array.from(new Set(foundCycles.map(c => c.join('->'))))
      .map(s => s.split('->'))

    results.circular = uniqueCycles.filter(cycle => {
      const hasDeferrableOrNullableLink = cycle.some((table, i) => {
        if (i === cycle.length - 1) return false
        const nextTable = cycle[i + 1]
        const fk = schema!.foreignKeys.find(f => 
          f.sourceTable.toLowerCase() === table.toLowerCase() && 
          f.targetTable.toLowerCase() === nextTable.toLowerCase()
        )
        
        const isDeferrable = fk?.isDeferrable && fk?.initiallyDeferred
        
        // Find the column involved to check nullability
        const sourceTable = schema!.tables.find(t => t.name.toLowerCase() === table.toLowerCase())
        const sourceCol = sourceTable?.columns.find(c => c.name.toLowerCase() === fk?.sourceColumn.toLowerCase())
        const isNullable = sourceCol && !sourceCol.isNotNull

        return isDeferrable || isNullable
      })
      return !hasDeferrableOrNullableLink
    }).map(cycle => {
      const isSelf = cycle.length === 2 && cycle[0] === cycle[1]
      const isDirect = cycle.length === 3 && cycle[0] === cycle[2]
      
      const getFkCol = (source: string, target: string) => {
        const fk = schema!.foreignKeys.find(f => 
          f.sourceTable.toLowerCase() === source.toLowerCase() && 
          f.targetTable.toLowerCase() === target.toLowerCase()
        )
        return fk ? fk.sourceColumn : 'foreign_key_column'
      }

      if (isSelf) {
        return {
          title: `Self-Reference: ${cycle[0]}`,
          message: `Table '${cycle[0]}' references itself. This is common in parent/child hierarchies (like categories) and is usually safe.`,
          severity: 'info',
          after: `-- Recommendation: Ensure the self-referencing column is NULLABLE\nALTER TABLE "${cycle[0]}" ALTER COLUMN "${getFkCol(cycle[0], cycle[0])}" DROP NOT NULL;`
        }
      }
      if (isDirect) {
        const colA = getFkCol(cycle[0], cycle[1])
        return {
          title: `Direct Cycle: ${cycle[0]} ↔ ${cycle[1]}`,
          message: `Mutual dependency detected between '${cycle[0]}' and '${cycle[1]}'. High Risk for Inserts: Initial data creation will deadlock unless triggers or deferred constraints are used.`,
          severity: 'error',
          after: `-- Solution 1: Use DEFERRABLE Constraints\nALTER TABLE "${cycle[0]}" \n  ADD CONSTRAINT "${cycle[0]}_${colA}_fkey" \n  FOREIGN KEY ("${colA}") REFERENCES "${cycle[1]}"("id")\n  DEFERRABLE INITIALLY DEFERRED;\n\n-- Solution 2: Make the column NULLABLE\nALTER TABLE "${cycle[0]}" ALTER COLUMN "${colA}" DROP NOT NULL;`
        }
      }
      
      const firstCol = getFkCol(cycle[0], cycle[1])
      return {
        title: `Indirect Loop: ${cycle.join(' → ')}`,
        message: `A multi-table circular dependency was detected. High Risk for Cascading Deletes: Deleting records in any stage of this chain could cause system instability or unexpected data loss.`,
        severity: 'error',
        after: `-- Solution: Use DEFERRABLE constraints for the cycle entry point\nALTER TABLE "${cycle[0]}" \n  ADD CONSTRAINT "${cycle[0]}_${firstCol}_fkey" \n  FOREIGN KEY ("${firstCol}") REFERENCES "${cycle[1]}"("id")\n  DEFERRABLE INITIALLY DEFERRED;`
      }
    })

    // 4. Trigger Loops
    results['trigger-loop'] = (schema!.triggers || [])
      .filter(trig => {
        const func = schema!.functions.find(f => f.name.toLowerCase() === trig.functionName.toLowerCase())
        if (!func) return false
        
        const body = func.body.toLowerCase()
        const tName = trig.tableName.toLowerCase()
        const selfUpdatePattern = new RegExp(`(?:UPDATE|INSERT\\s+INTO|DELETE\\s+FROM)\\s+["']?${tName}["']?`, 'i')
        
        const hasSelfUpdate = selfUpdatePattern.test(body)
        const hasDepthGuard = body.includes('pg_trigger_depth()')
        const hasWhenGuard = !!trig.whenClause
        
        // It's a risk only if it updates itself and lacks any safety guards
        return hasSelfUpdate && !hasDepthGuard && !hasWhenGuard
      })
      .map(trig => ({
        title: `Infinite Loop Risk: ${trig.name}`,
        message: `This trigger on '${trig.tableName}' performs a mutation (INSERT/UPDATE/DELETE) on the same table without safety guards like 'WHEN' or 'pg_trigger_depth()'. This will likely cause infinite recursion.`,
        severity: 'error'
      }))

    // 5. Indexes
    results.indexes = (schema!.indexes || []).map(idx => ({
       title: `Index: ${idx.name}`,
       message: `${idx.isUnique ? 'Unique ' : ''}${idx.method.toUpperCase()} index on table '${idx.tableName}' involving columns (${idx.columns.join(', ')})${idx.where ? ` WHERE ${idx.where}` : ''}.`,
       severity: 'info'
    }))

    // 6. Missing Index
    schema!.foreignKeys.forEach(fk => {
      const table = schema!.tables.find(t => t.name.toLowerCase() === fk.sourceTable.toLowerCase())
      if (table?.columns.find(c => c.name.toLowerCase() === fk.sourceColumn.toLowerCase())?.isPrimaryKey) return
      
      const hasIndex = (schema!.indexes || []).some(idx => 
        idx.tableName.toLowerCase() === fk.sourceTable.toLowerCase() && 
        idx.columns.some(col => col.toLowerCase() === fk.sourceColumn.toLowerCase())
      )
      
      if (!hasIndex) {
        results['missing-index'].push({
          title: `Missing Index: ${fk.sourceTable}.${fk.sourceColumn}`,
          message: `The foreign key column '${fk.sourceColumn}' is missing an index. Foreign keys should be indexed to ensure fast joins and efficient cascading deletions.`,
          severity: 'warning',
          after: `CREATE INDEX ON "${fk.sourceTable}" ("${fk.sourceColumn}");`
        })
      }
    })

    return results
  }, [schema])

  const results = allAnalysisResults[selectedAnalysis] || []

  const healthValue = useMemo(() => {
    if (!schema) return 100
    let score = 100
    const r = allAnalysisResults
    
    // Weighted Penalties
    if (r.rls?.length) score -= Math.min(40, r.rls.length * 20)
    if (r['trigger-loop']?.length) score -= Math.min(40, r['trigger-loop'].length * 25)
    if (r.circular?.length) score -= Math.min(30, r.circular.length * 15)
    if (r.performance?.length) score -= Math.min(15, r.performance.length * 5)
    if (r['missing-index']?.length) score -= Math.min(15, r['missing-index'].length * 3)
    
    return Math.max(0, score)
  }, [schema, allAnalysisResults])

  const healthStatus = useMemo(() => {
    if (healthValue === 100) return { label: 'Perfect', color: 'bg-emerald-500', text: 'text-emerald-400', icon: CheckCircle2 }
    if (healthValue >= 80) return { label: 'Excellent', color: 'bg-blue-500', text: 'text-blue-400', icon: CheckCircle2 }
    if (healthValue >= 50) return { label: 'Average', color: 'bg-amber-500', text: 'text-amber-400', icon: AlertCircle }
    return { label: 'At Risk', color: 'bg-red-500', text: 'text-red-400', icon: ShieldAlert }
  }, [healthValue])

  const currentAnalysis = useMemo(() => 
    ANALYSIS_TYPES.find(t => t.id === selectedAnalysis) || ANALYSIS_TYPES[0]
  , [selectedAnalysis])

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
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Analysis Results {results.length > 0 && `(${results.length})`}
            </h3>
            
            <ScrollArea className="h-[calc(100vh-440px)] w-full">
              <div className="space-y-6 pb-20">
                {results.length > 0 ? (
                  results.map((res, i) => (
                    <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:bg-zinc-900/60 transition-colors w-full overflow-hidden">
                      <div className="flex items-start gap-4">
                        {res.severity === 'error' ? (
                          <ShieldAlert className="mt-1 h-4 w-4 text-red-500 shrink-0" />
                        ) : res.severity === 'warning' ? (
                          <AlertCircle className="mt-1 h-4 w-4 text-amber-500 shrink-0" />
                        ) : res.severity === 'info' ? (
                          <Info className="mt-1 h-4 w-4 text-blue-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="text-sm font-medium text-zinc-200 break-words">
                            {`${i + 1}. `}{res.title}
                          </div>
                          <p className="mt-1 text-xs text-zinc-500 leading-relaxed font-normal break-words">{res.message}</p>
                          
                          {res.before && (
                             <div className="mt-5 space-y-3">
                               <div className="flex items-center justify-between gap-4">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400/80">Current Statement</span>
                               </div>
                               <div className="rounded-lg border border-red-900/30 bg-red-900/10 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto text-zinc-300 custom-scrollbar">
                                 {highlightSQL(res.before)}
                               </div>
                             </div>
                          )}

                          {res.after && (
                             <div className="mt-6 space-y-3">
                               <div className="flex items-center justify-between gap-4">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Optimized Recommendation</span>
                                  <div className="shrink-0 pr-0.5">
                                    <CopyButton text={res.after} />
                                  </div>
                               </div>
                               <div className="rounded-lg border border-emerald-900/30 bg-emerald-900/10 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto text-zinc-100 custom-scrollbar">
                                 {highlightSQL(res.after)}
                               </div>
                             </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
                    <div className="mb-3 rounded-full bg-zinc-900 p-3">
                      <currentAnalysis.icon className="h-6 w-6 opacity-20" />
                    </div>
                    <p className="text-sm font-medium">No issues found</p>
                    <p className="mt-1 text-xs opacity-60">Scanning is complete and your schema looks good for this check.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
