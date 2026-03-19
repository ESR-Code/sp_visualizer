'use client'

import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Play, FileCode2 } from 'lucide-react'
import { exampleSQL } from '@/lib/sql-parser'
import { highlightSQL } from '@/lib/sql-highlighter'

interface SqlInputProps {
  value: string
  onChange: (value: string) => void
  onVisualize: () => void
  onClear: () => void
}

export function SqlInput({ value, onChange, onVisualize, onClear }: SqlInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const loadExample = () => {
    onChange(exampleSQL)
  }

  // Sync scroll between textarea and highlight div
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  useEffect(() => {
    handleScroll()
  }, [value])

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">SQL Input</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadExample}
            className="text-zinc-400 hover:text-zinc-100"
          >
            Load Example
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-zinc-400 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 p-4 overflow-hidden">
        <div className="flex h-full w-full rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden">
          {/* Line Numbers Sidebar */}
          <div 
            ref={(el) => {
              if (el) {
                // Keep line numbers scroll in sync with textarea vertically
                el.scrollTop = textareaRef.current?.scrollTop || 0
              }
            }}
            className="w-12 shrink-0 select-none bg-zinc-950/20 py-3 text-right font-mono text-[11px] text-zinc-600 border-r border-zinc-800/50 overflow-hidden"
          >
            {value.split('\n').map((_, i) => (
              <div key={i} className="px-2 leading-6 h-6">{i + 1}</div>
            ))}
            <div className="h-20" />
          </div>

          {/* Code Editor Area */}
          <div className="relative flex-1 overflow-hidden">
            {/* Highlighter Layer */}
            <div 
              ref={highlightRef}
              className="pointer-events-none absolute inset-0 overflow-hidden p-3"
            >
              {highlightSQL(value)}
              <div className="h-20" />
            </div>
            
            {/* Textarea Layer */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={(e) => {
                handleScroll()
                // Also manually sync the line numbers div because it doesn't have a ref we can easily target in handleScroll without extra state
                const gutter = e.currentTarget.parentElement?.previousElementSibling as HTMLDivElement
                if (gutter) gutter.scrollTop = e.currentTarget.scrollTop
              }}
              placeholder={`-- Paste your SQL here...`}
              spellCheck={false}
              wrap="off"
              className="absolute inset-0 h-full w-full bg-transparent p-3 font-mono text-sm leading-6 text-transparent caret-white focus:outline-none resize-none overflow-auto custom-scrollbar whitespace-pre"
            />
          </div>
        </div>
      </div>

      {/* Footer with Visualize Button */}
      <div className="border-t border-zinc-800 p-3">
        <Button
          onClick={onVisualize}
          className="w-full bg-blue-600 text-white hover:bg-blue-500"
          disabled={!value.trim()}
        >
          <Play className="mr-2 h-4 w-4" />
          Visualize Schema
        </Button>
      </div>
    </div>
  )
}
