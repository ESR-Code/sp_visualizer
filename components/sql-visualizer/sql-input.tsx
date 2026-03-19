'use client'

import { Button } from '@/components/ui/button'
import { Trash2, Play, FileCode2 } from 'lucide-react'
import { exampleSQL } from '@/lib/sql-parser'

interface SqlInputProps {
  value: string
  onChange: (value: string) => void
  onVisualize: () => void
  onClear: () => void
}

export function SqlInput({ value, onChange, onVisualize, onClear }: SqlInputProps) {
  const loadExample = () => {
    onChange(exampleSQL)
  }

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

      {/* Textarea */}
      <div className="flex-1 overflow-hidden p-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Paste your Supabase SQL code here...

Example:
CREATE TYPE user_status AS ENUM ('active', 'inactive');

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  status user_status DEFAULT 'active'
);

CREATE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update
  BEFORE UPDATE ON users
  EXECUTE FUNCTION update_timestamp();

CREATE POLICY users_select ON users
  FOR SELECT
  USING (auth.uid() = id);`}
          className="h-full w-full resize-none rounded-md border border-zinc-800 bg-zinc-900 p-3 font-mono text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
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
