import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoadingScreenProps = {
  label?: string
  fullscreen?: boolean
  className?: string
}

export function LoadingScreen({
  label = 'Cargando...',
  fullscreen = false,
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex min-h-[240px] w-full items-center justify-center px-6 py-10',
        fullscreen && 'min-h-screen',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
