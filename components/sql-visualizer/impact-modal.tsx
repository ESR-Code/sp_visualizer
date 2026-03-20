'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, Table2, Eye, Zap, Shield, Link2, RefreshCw } from 'lucide-react'
import type { ParsedSchema, ParsedTable } from '@/lib/sql-types'

interface ImpactModalProps {
  isOpen: boolean
  onClose: () => void
  schema: ParsedSchema | null
  table: ParsedTable | null
}

interface CascadeImpact {
  tableName: string
  columnName: string
  action: 'DELETE' | 'UPDATE'
  type: string
}

export function ImpactModal({ isOpen, onClose, schema, table }: ImpactModalProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>('')

  // Set initial selected column when table changes/opens
  useMemo(() => {
    if (table && table.columns.length > 0) {
      setSelectedColumn(table.columns[0].name)
    }
  }, [table])

  const tableImpacts = useMemo(() => {
    if (!schema || !table) return []

    const impacts: { type: string; name: string; reason: string; icon: any; color: string }[] = []

    // 1. Foreign Keys pointing to this table
    schema.foreignKeys.forEach((fk) => {
      if (fk.targetTable === table.name) {
        impacts.push({
          type: 'Foreign Key',
          name: `${fk.sourceTable}.${fk.sourceColumn}`,
          reason: `References ${table.name}.${fk.targetColumn}`,
          icon: Link2,
          color: 'text-blue-400',
        })
      }
    })

    // 2. Views depending on this table
    schema.views.forEach((view) => {
      if (view.dependencies.includes(table.name)) {
        impacts.push({
          type: 'View',
          name: view.name,
          reason: `Depends on ${table.name}`,
          icon: Eye,
          color: 'text-teal-400',
        })
      }
    })

    // 3. Triggers on this table
    schema.triggers.forEach((trigger) => {
      if (trigger.tableName === table.name) {
        impacts.push({
          type: 'Trigger',
          name: trigger.name,
          reason: `Defined on ${table.name}`,
          icon: Zap,
          color: 'text-orange-400',
        })
      }
    })

    // 4. Policies on this table
    schema.policies.forEach((policy) => {
      if (policy.tableName === table.name) {
        impacts.push({
          type: 'Policy',
          name: policy.name,
          reason: `Applied to ${table.name}`,
          icon: Shield,
          color: 'text-red-400',
        })
      }
    })

    return impacts
  }, [schema, table])

  const columnImpacts = useMemo(() => {
    if (!schema || !table || !selectedColumn) return []

    const impacts: { type: string; name: string; reason: string; icon: any; color: string }[] = []

    // Foreign Keys pointing to this specific column
    schema.foreignKeys.forEach((fk) => {
      if (fk.targetTable === table.name && fk.targetColumn === selectedColumn) {
        impacts.push({
          type: 'Foreign Key',
          name: `${fk.sourceTable}.${fk.sourceColumn}`,
          reason: `References ${table.name}.${selectedColumn}`,
          icon: Link2,
          color: 'text-blue-400',
        })
      }
    })

    return impacts
  }, [schema, table, selectedColumn])

  const cascadeImpacts = useMemo(() => {
    if (!schema || !table) return []
    const impacts: CascadeImpact[] = []
    
    schema.foreignKeys.forEach(fk => {
      if (fk.targetTable === table.name) {
        if (fk.onDelete && fk.onDelete !== 'NO ACTION' && fk.onDelete !== 'RESTRICT') {
          impacts.push({
            tableName: fk.sourceTable,
            columnName: fk.sourceColumn,
            action: 'DELETE',
            type: fk.onDelete
          })
        }
        if (fk.onUpdate && fk.onUpdate !== 'NO ACTION' && fk.onUpdate !== 'RESTRICT') {
          impacts.push({
            tableName: fk.sourceTable,
            columnName: fk.sourceColumn,
            action: 'UPDATE',
            type: fk.onUpdate
          })
        }
      }
    })
    
    return impacts
  }, [schema, table])

  if (!table) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-amber-500/20 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle className="text-xl font-bold text-zinc-100">
              Impact Analysis: {table.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs defaultValue="table" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 border border-zinc-800 bg-zinc-950/50">
            <TabsTrigger value="table" className="data-[state=active]:bg-zinc-800 text-zinc-100">
              Drop Table
            </TabsTrigger>
            <TabsTrigger value="column" className="data-[state=active]:bg-zinc-800 text-zinc-100">
              Drop Field
            </TabsTrigger>
            <TabsTrigger value="cascade" className="data-[state=active]:bg-zinc-800 text-zinc-100">
              Cascade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-6">
            <div className="mb-4 text-sm text-zinc-400">
              The following entities will be affected if you drop the table <code className="text-zinc-200">{table.name}</code>:
            </div>
            <ScrollArea className="h-[300px] rounded-md border border-zinc-800 bg-zinc-950/30 p-4">
              {tableImpacts.length === 0 ? (
                <div className="flex h-full items-center justify-center text-zinc-500 italic">
                  No direct dependencies found for this table.
                </div>
              ) : (
                <div className="space-y-3">
                  {tableImpacts.map((impact, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                      <div className={`mt-0.5 rounded-full bg-zinc-800 p-1.5 ${impact.color}`}>
                        <impact.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">{impact.name}</span>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-zinc-500">
                            {impact.type}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">{impact.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="column" className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="text-sm text-zinc-400">
                Select a field to analyze its impact:
              </div>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger className="w-[200px] border-zinc-700 bg-zinc-800">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900">
                  {table.columns.map((col) => (
                    <SelectItem key={col.name} value={col.name} className="text-zinc-200 focus:bg-zinc-800 focus:text-white">
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[250px] rounded-md border border-zinc-800 bg-zinc-950/30 p-4">
              {columnImpacts.length === 0 ? (
                <div className="flex h-full items-center justify-center text-zinc-500 italic text-center px-4">
                  {selectedColumn ? `No direct dependencies found for column "${selectedColumn}".` : 'Please select a column to see its dependencies.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {columnImpacts.map((impact, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
                      <div className={`mt-0.5 rounded-full bg-zinc-800 p-1.5 ${impact.color}`}>
                        <impact.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">{impact.name}</span>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-zinc-500">
                            {impact.type}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">{impact.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="cascade" className="mt-6">
            <div className="mb-4 text-sm text-zinc-400">
              Relationships that trigger automatic actions when data in <code className="text-zinc-200">{table.name}</code> is modified:
            </div>

            {cascadeImpacts.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-6">
                  {/* Delete Cascades */}
                  {cascadeImpacts.some(i => i.action === 'DELETE') && (
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-red-400 uppercase">
                        <AlertTriangle className="h-3 w-3" />
                        On Delete Impacts
                      </h4>
                      <div className="grid gap-2">
                        {cascadeImpacts.filter(i => i.action === 'DELETE').map((impact, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                            <div className="flex items-center gap-3">
                              <div className="rounded bg-red-500/10 p-1.5 text-red-500">
                                <Table2 className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-zinc-100">{impact.tableName}</div>
                                <div className="text-xs text-zinc-500">via {impact.columnName}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-red-500/30 bg-red-500/5 text-[10px] text-red-400">
                              {impact.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Update Cascades */}
                  {cascadeImpacts.some(i => i.action === 'UPDATE') && (
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400 uppercase">
                        <RefreshCw className="h-3 w-3" />
                        On Update Impacts
                      </h4>
                      <div className="grid gap-2">
                        {cascadeImpacts.filter(i => i.action === 'UPDATE').map((impact, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                            <div className="flex items-center gap-3">
                              <div className="rounded bg-blue-500/10 p-1.5 text-blue-500">
                                <Table2 className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-zinc-100">{impact.tableName}</div>
                                <div className="text-xs text-zinc-500">via {impact.columnName}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5 text-[10px] text-blue-400">
                              {impact.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 text-zinc-500">
                <div className="mb-2 rounded-full bg-zinc-900 p-3">
                  <RefreshCw className="h-6 w-6 opacity-20" />
                </div>
                <p className="text-sm">No cascading actions defined for this table</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
