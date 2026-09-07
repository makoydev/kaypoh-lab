import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'solid' | 'accent' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
  active?: boolean
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  ghost: 'bg-transparent text-fog-300 hover:bg-white/[0.06] hover:text-fog-100',
  solid: 'bg-ink-600 text-fog-100 hover:bg-ink-500',
  accent: 'bg-accent text-ink-950 hover:bg-cyan-300 shadow-[0_0_24px_-6px_rgba(34,211,238,0.7)]',
  outline: 'border border-white/10 bg-white/[0.03] text-fog-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-fog-100',
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-7 px-2.5 text-[11px] gap-1.5',
  md: 'h-9 px-3.5 text-xs gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'size-9',
  'icon-sm': 'size-7',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'outline', size = 'md', active, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        active && 'border-accent/50 bg-accent/15 text-accent hover:bg-accent/20',
        className,
      )}
      {...rest}
    />
  )
})
