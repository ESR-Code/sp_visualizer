'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Info, Terminal, Database, Laptop, HelpCircle, Lightbulb, Code2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DumpInstructionsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function DumpInstructionsModal({ isOpen, onOpenChange }: DumpInstructionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 p-0 text-zinc-100 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
               <HelpCircle className="h-6 w-6" />
             </div>
             <div>
               <DialogTitle className="text-xl font-bold tracking-tight text-white">How to Get Your Database Dump File</DialogTitle>
               <DialogDescription className="text-sm text-zinc-400 mt-1">
                 Follow these steps to export your schema and start visualizing your database.
               </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] px-6 pb-8">
           <div className="space-y-6 pt-2">
             <div className="rounded-lg border border-blue-900/20 bg-blue-900/5 p-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-300">
                  <Info className="h-4 w-4" />
                  📜 Instructions
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  To use this viewer, you need a <code className="text-zinc-200">.sql</code> file containing your database schema. Follow the steps below based on your environment:
                </p>
             </div>

             <Accordion type="single" collapsible className="w-full space-y-3">
               <AccordionItem value="dashboard" className="border-zinc-800 rounded-lg bg-zinc-900/30 px-4">
                 <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-100 font-sans">1. From Supabase Dashboard (No CLI required)</span>
                    </div>
                 </AccordionTrigger>
                 <AccordionContent className="pb-6 pt-2 text-zinc-400 space-y-4 leading-relaxed border-t border-zinc-800/50 mt-2">
                   <p className="text-sm">If you don't want to use terminal commands, you can generate your schema directly from the browser:</p>
                   <ol className="list-decimal list-inside space-y-3 text-xs pl-2">
                     <li><span className="font-semibold text-zinc-200">Open the SQL Editor:</span> Go to the SQL Editor tab in your Supabase sidebar.</li>
                     <li>
                        <span className="font-semibold text-zinc-200">Use the AI Assistant:</span> Click on "New Query" and type this into the Supabase AI:
                        <div className="mt-2 rounded bg-black/60 p-3 italic text-zinc-300 border border-zinc-700/50">
                          "Generate a SQL script that creates all my current tables, indexes, and RLS policies in the public schema."
                        </div>
                     </li>
                     <li><span className="font-semibold text-zinc-200">Run and Copy:</span> The AI will generate a script of your entire database structure. Click <span className="text-emerald-400">Run</span> to verify it, then copy the text and save it as a <code className="text-zinc-300">.sql</code> file.</li>
                   </ol>
                   <div className="rounded-md bg-zinc-950 p-4 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">Alternative (Table-by-Table):</span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                        <li>Navigate to <span className="text-zinc-200">Database &gt; Tables</span>.</li>
                        <li>Select a table and click <span className="text-zinc-200">Definition</span>.</li>
                        <li>Copy the <code className="text-zinc-300">CREATE TABLE</code> and <code className="text-zinc-300">INDEX</code> statements.</li>
                      </ul>
                   </div>
                 </AccordionContent>
               </AccordionItem>

               <AccordionItem value="prod-cli" className="border-zinc-800 rounded-lg bg-zinc-900/30 px-4">
                 <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                        <Terminal className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-100 font-sans">2. From Supabase Production (CLI)</span>
                    </div>
                 </AccordionTrigger>
                 <AccordionContent className="pb-6 pt-2 text-zinc-400 space-y-4 leading-relaxed border-t border-zinc-800/50 mt-2 overflow-hidden">
                    <p className="text-sm">The most reliable way to get a clean schema dump from a live project is using the Supabase CLI.</p>
                    <div className="space-y-3 max-w-full">
                       <div className="max-w-full overflow-hidden">
                         <span className="text-xs font-semibold text-zinc-200 block mb-2">1. Login to Supabase:</span>
                         <pre className="rounded bg-black/60 p-3 text-xs text-emerald-400 border border-zinc-700/50 overflow-x-auto max-w-full custom-scrollbar">supabase login</pre>
                       </div>
                       <div className="max-w-full overflow-hidden">
                         <span className="text-xs font-semibold text-zinc-200 block mb-2">2. Export the Schema:</span>
                         <pre className="rounded bg-black/60 p-3 text-xs text-emerald-400 border border-zinc-700/50 overflow-x-auto max-w-full custom-scrollbar">supabase db dump --project-ref your-project-ref -f schema.sql --schema-only</pre>
                       </div>
                    </div>
                    <div className="rounded border-l-2 border-amber-500 bg-amber-500/5 p-3 text-[11px]">
                      <span className="font-bold text-amber-500">Note:</span> The <code className="text-zinc-200">--schema-only</code> flag ensures you only export the structure, not your private user data.
                    </div>
                 </AccordionContent>
               </AccordionItem>

               <AccordionItem value="local" className="border-zinc-800 rounded-lg bg-zinc-900/30 px-4">
                 <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                        <Code2 className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-100 font-sans">3. From Local Supabase Development</span>
                    </div>
                 </AccordionTrigger>
                 <AccordionContent className="pb-6 pt-2 text-zinc-400 space-y-4 leading-relaxed border-t border-zinc-800/50 mt-2 overflow-hidden">
                   <p className="text-sm">If you are running Supabase locally via Docker, use this command to grab your current working schema:</p>
                   <pre className="rounded bg-black/60 p-3 text-xs text-emerald-400 border border-zinc-700/50 overflow-x-auto max-w-full custom-scrollbar">supabase db dump -f local_schema.sql --local --schema-only</pre>
                 </AccordionContent>
               </AccordionItem>

               <AccordionItem value="pgdump" className="border-zinc-800 rounded-lg bg-zinc-900/30 px-4">
                 <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                        <Database className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-100 font-sans">4. Using Standard PostgreSQL (pg_dump)</span>
                    </div>
                 </AccordionTrigger>
                 <AccordionContent className="pb-6 pt-2 text-zinc-400 space-y-4 leading-relaxed border-t border-zinc-800/50 mt-2 overflow-hidden">
                   <p className="text-sm">If you don't have the CLI, you can use the standard utility. You'll need your Connection String from Project Settings.</p>
                   <pre className="rounded bg-zinc-950 p-4 text-[11px] text-zinc-300 border border-zinc-700/50 overflow-x-auto max-w-full custom-scrollbar whitespace-pre-wrap leading-relaxed">
                     pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-REF].supabase.co:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-privileges &gt; schema.sql
                   </pre>
                 </AccordionContent>
               </AccordionItem>
             </Accordion>

             <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-amber-500 uppercase tracking-wider">
                  <Lightbulb className="h-4 w-4" />
                  💡 Pro Tips for Best Results:
                </h4>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <span className="text-xs font-semibold text-zinc-200">Always use --schema-only:</span>
                      <p className="text-[11px] text-zinc-400">This app is a schema viewer; it doesn't need (and shouldn't have) your actual row data.</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-xs font-semibold text-zinc-200">Check your schemas:</span>
                      <p className="text-[11px] text-zinc-400">By default, commands export the public schema. For custom schemas (e.g., 'auth'), ensure they are included in settings.</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-xs font-semibold text-zinc-200">pg_cron:</span>
                      <p className="text-[11px] text-zinc-400">Cron jobs aren't included in standard dumps. You'll need to add those manually if you want to see them in the analysis.</p>
                   </div>
                </div>
             </div>
           </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
