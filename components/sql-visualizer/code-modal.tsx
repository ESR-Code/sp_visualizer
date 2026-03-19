'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { highlightSQL } from '@/lib/sql-highlighter'

interface CodeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  code: string
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
