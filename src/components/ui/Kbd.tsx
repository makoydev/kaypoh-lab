import type { ReactNode } from 'react'

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/10 bg-ink-700 px-1 font-mono text-[10px] text-fog-300">
      {children}
    </kbd>
  )
}
