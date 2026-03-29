import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type SummaryCardProps = {
  title: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: 'success' | 'danger' | 'primary' | 'secondary'
}

const toneClasses = {
  success: 'border-secondary/20 bg-secondary/10 text-secondary',
  danger: 'border-destructive/20 bg-destructive/10 text-destructive',
  primary: 'border-primary/20 bg-primary/10 text-primary',
  secondary: 'border-border bg-accent text-accent-foreground',
}

export function SummaryCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
}: SummaryCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-2">
          <span className="inline-flex rounded-md border border-border bg-background px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-muted-foreground">
            Resumen
          </span>
          <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        </div>
        <div
          className={cn(
            'relative rounded-md border p-3',
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="pt-4 text-[1.95rem] font-semibold tracking-tight">{value}</div>
        {hint ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
