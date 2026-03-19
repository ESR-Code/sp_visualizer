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
      <div className="relative flex-1 overflow-hidden p-2">
        <div 
          ref={highlightRef}
          className="absolute inset-2 overflow-auto whitespace-pre rounded-md border border-zinc-800 bg-zinc-900 p-3 font-mono text-sm pointer-events-none"
        >
          {highlightSQL(value)}
          {/* Extra space at bottom to match textarea */}
          <div className="h-20" />
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={`-- Paste your SQL here...`}
          className="absolute inset-2 h-full w-full resize-none rounded-md border border-transparent bg-transparent p-3 font-mono text-sm text-transparent caret-white focus:outline-none overflow-auto"
          spellCheck={false}
        />
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
