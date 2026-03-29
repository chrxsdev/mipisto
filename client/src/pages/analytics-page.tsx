import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { useAuth } from '@/context/auth-context'
import { formatCurrency, formatMonthLabel, getDateParts } from '@/lib/format'
import type { AnalyticsResponse } from '@/types/api'
import { ChartFrame } from '@/components/chart-frame'
import { LoadingScreen } from '@/components/loading-screen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Period = 'weekly' | 'monthly' | 'annual'

function buildTimeline(data: AnalyticsResponse, period: Period) {
  const formatter = (value: string) => {
    const { year, month, day } = getDateParts(value)
    if (period === 'weekly') {
      return `${day}/${month}`
    }

    if (period === 'annual') {
      return String(year)
    }

    return formatMonthLabel(value)
  }

  const groups = new Map<string, { label: string; income: number; expenses: number }>()

  data.incomes.forEach((income) => {
    const { year, month, day } = getDateParts(income.date)
    const key =
      period === 'weekly'
        ? `${year}-${month}-${day}`
        : period === 'annual'
          ? String(year)
          : `${year}-${month}`

    const current = groups.get(key) ?? {
      label: formatter(income.date),
      income: 0,
      expenses: 0,
    }
    current.income += income.amount
    groups.set(key, current)
  })

  data.expenses.forEach((expense) => {
    const { year, month, day } = getDateParts(expense.date)
    const key =
      period === 'weekly'
        ? `${year}-${month}-${day}`
        : period === 'annual'
          ? String(year)
          : `${year}-${month}`

    const current = groups.get(key) ?? {
      label: formatter(expense.date),
      income: 0,
      expenses: 0,
    }
    current.expenses += expense.amount
    groups.set(key, current)
  })

  return Array.from(groups.values())
}

const chartAxisProps = {
  axisLine: { stroke: 'var(--color-border)' },
  tickLine: { stroke: 'var(--color-border)' },
  tick: { fill: 'var(--color-foreground)', fontSize: 12 },
}

const chartTooltipProps = {
  contentStyle: {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '18px',
    color: 'var(--color-foreground)',
  },
  labelStyle: { color: 'var(--color-foreground)', fontWeight: 600 },
  itemStyle: { color: 'var(--color-foreground)' },
}

function getSeriesTextColor(name: string) {
  return name === 'Gastos' || name === 'Límite mensual'
    ? 'var(--color-destructive)'
    : 'var(--color-chart-2)'
}

function ChartTooltipContent({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string }>
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-[18px] border border-border bg-card px-3 py-2 shadow-soft">
      {label ? <p className="mb-2 text-sm font-semibold text-foreground">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((item) => {
          const name = String(item.name ?? '')
          const color = getSeriesTextColor(name)

          return (
            <div key={name} className="flex items-center justify-between gap-4 text-sm">
              <span style={{ color }}>{name}</span>
              <span style={{ color }}>
                {formatCurrency(Number(item.value ?? 0), currency)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function renderPieLabel({
  name,
  percent,
  x,
  y,
  textAnchor,
}: {
  name?: string
  percent?: number
  x?: number
  y?: number
  textAnchor?: string
}) {
  return (
    <text
      x={x}
      y={y}
      fill="var(--color-foreground)"
      fontSize={12}
      textAnchor={
        textAnchor === 'start' || textAnchor === 'end' || textAnchor === 'middle'
          ? textAnchor
          : 'middle'
      }
      dominantBaseline="central"
    >
      {`${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  )
}

export function AnalyticsPage() {
  const { token, user } = useAuth()
  const [period, setPeriod] = useState<Period>('monthly')
  const [data, setData] = useState<AnalyticsResponse | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadAnalytics() {
      try {
        const response = await apiRequest<AnalyticsResponse>(
          `/analytics?period=${period}`,
          { token },
        )
        if (!ignore) {
          setData(response)
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      }
    }

    void loadAnalytics()

    return () => {
      ignore = true
    }
  }, [period, token])

  const timeline = useMemo(() => {
    if (!data) {
      return []
    }

    return buildTimeline(data, period)
  }, [data, period])

  if (!data || !user) {
    return <LoadingScreen label="Cargando analítica..." />
  }

  return (
    <div className="space-y-6">
      <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
        <TabsList>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
          <TabsTrigger value="annual">Anual</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0 border-white/40 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle>Ingresos vs Gastos</CardTitle>
          </CardHeader>
          <CardContent className="h-80 min-w-0">
            <ChartFrame>
              {({ width, height }) => (
                <BarChart width={width} height={height} data={timeline}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" {...chartAxisProps} />
                <YAxis {...chartAxisProps} />
                <Tooltip content={<ChartTooltipContent currency={user.currency} />} />
                <Bar
                  dataKey="income"
                  name="Ingresos"
                  fill="var(--color-chart-5)"
                  radius={[10, 10, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Gastos"
                  fill="var(--color-chart-1)"
                  radius={[10, 10, 0, 0]}
                />
                </BarChart>
              )}
            </ChartFrame>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-white/40 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="h-80 min-w-0">
            {data.categoryBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No hay gastos en este período
              </div>
            ) : (
              <ChartFrame>
                {({ width, height }) => (
                  <PieChart width={width} height={height}>
                  <Pie
                    data={data.categoryBreakdown}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    label={renderPieLabel}
                  >
                    {data.categoryBreakdown.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    {...chartTooltipProps}
                    formatter={(value) => formatCurrency(Number(value ?? 0), user.currency)}
                  />
                  </PieChart>
                )}
              </ChartFrame>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-white/40 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle>Tendencia de Gastos</CardTitle>
          </CardHeader>
          <CardContent className="h-80 min-w-0">
            {timeline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No hay datos para mostrar
              </div>
            ) : (
              <ChartFrame>
                {({ width, height }) => (
                  <LineChart width={width} height={height} data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" {...chartAxisProps} />
                  <YAxis {...chartAxisProps} />
                  <Tooltip content={<ChartTooltipContent currency={user.currency} />} />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Gastos"
                    stroke="var(--color-chart-1)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--color-chart-1)' }}
                  />
                  </LineChart>
                )}
              </ChartFrame>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-white/40 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle>Uso de Tarjetas de Crédito</CardTitle>
          </CardHeader>
          <CardContent className="h-80 min-w-0">
            {data.creditCardUsage.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No hay tarjetas de crédito
              </div>
            ) : (
              <ChartFrame>
                {({ width, height }) => (
                  <BarChart width={width} height={height} data={data.creditCardUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" {...chartAxisProps} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tickFormatter={(value) => String(value).slice(0, 12)}
                    {...chartAxisProps}
                  />
                  <Tooltip content={<ChartTooltipContent currency={user.currency} />} />
                  <Bar
                    dataKey="monthlyLimit"
                    name="Límite mensual"
                    fill="var(--color-chart-4)"
                    radius={[10, 10, 10, 10]}
                  />
                  <Bar
                    dataKey="spending"
                    name="Consumo"
                    fill="var(--color-chart-2)"
                    radius={[10, 10, 10, 10]}
                  />
                  </BarChart>
                )}
              </ChartFrame>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
