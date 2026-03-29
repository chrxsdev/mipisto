import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  Wallet,
} from 'lucide-react'
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
import { useAuth } from '@/context/auth-context'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getYearOptions, MONTH_OPTIONS, PAYMENT_METHOD_LABELS } from '@/lib/constants'
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getDateParts,
  getSuggestedPaymentDate,
} from '@/lib/format'
import type { AnalyticsResponse, DashboardResponse, Expense } from '@/types/api'
import { ChartFrame } from '@/components/chart-frame'
import { LoadingScreen } from '@/components/loading-screen'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SummaryCard } from '@/components/summary-card'

function resolveExpenseTimelineDate(expense: Expense) {
  return expense.statementCloseDate ?? expense.date
}

function buildTimeline(data: AnalyticsResponse) {
  const groups = new Map<string, { label: string; income: number; expenses: number }>()

  data.incomes.forEach((income) => {
    const { year, month } = getDateParts(income.date)
    const key = `${year}-${String(month).padStart(2, '0')}`
    const current = groups.get(key) ?? {
      label: formatMonthLabel(`${key}-01`),
      income: 0,
      expenses: 0,
    }

    current.income += income.amount
    groups.set(key, current)
  })

  data.expenses.forEach((expense) => {
    const timelineDate = resolveExpenseTimelineDate(expense)
    const { year, month } = getDateParts(timelineDate)
    const key = `${year}-${String(month).padStart(2, '0')}`
    const current = groups.get(key) ?? {
      label: formatMonthLabel(`${key}-01`),
      income: 0,
      expenses: 0,
    }

    current.expenses += expense.amount
    groups.set(key, current)
  })

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value)
}

function buildSpendingOverview(data: AnalyticsResponse) {
  const totalIncome = data.incomes.reduce((sum, income) => sum + income.amount, 0)
  const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const available = Math.max(totalIncome - totalExpenses, 0)

  return [
    {
      id: 'expenses',
      name: 'Gastos',
      total: totalExpenses,
      color: 'var(--color-destructive)',
    },
    {
      id: 'available',
      name: 'Disponible',
      total: available,
      color: 'var(--color-chart-2)',
    },
  ].filter((entry) => entry.total > 0)
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

export function DashboardPage() {
  const { token } = useAuth()
  const yearOptions = getYearOptions()
  const [month, setMonth] = useState('all')
  const [year, setYear] = useState('all')
  const [summary, setSummary] = useState<DashboardResponse | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      try {
        const response = await apiRequest<DashboardResponse>('/dashboard', { token })
        if (!ignore) {
          setSummary(response)
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      } finally {
        if (!ignore) {
          setLoadingSummary(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      ignore = true
    }
  }, [token])

  useEffect(() => {
    let ignore = false
    setLoadingAnalytics(true)

    async function loadAnalytics() {
      const searchParams = new URLSearchParams()

      if (month !== 'all') {
        searchParams.set('month', month)
      }

      if (year !== 'all') {
        searchParams.set('year', year)
      }

      try {
        const response = await apiRequest<AnalyticsResponse>(
          `/analytics${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`,
          { token },
        )
        if (!ignore) {
          setAnalytics(response)
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      } finally {
        if (!ignore) {
          setLoadingAnalytics(false)
        }
      }
    }

    void loadAnalytics()

    return () => {
      ignore = true
    }
  }, [month, token, year])

  const timeline = useMemo(() => {
    if (!analytics) {
      return []
    }

    return buildTimeline(analytics)
  }, [analytics])

  const spendingOverview = useMemo(() => {
    if (!analytics) {
      return []
    }

    return buildSpendingOverview(analytics)
  }, [analytics])

  if (loadingSummary || !summary) {
    return <LoadingScreen label="Cargando dashboard..." />
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Ingresos del año"
          value={formatCurrency(summary.totalIncome, summary.currency)}
          hint="Acumulado del año a la fecha"
          icon={ArrowDownCircle}
          tone="success"
        />
        <SummaryCard
          title="Gastos del año"
          value={formatCurrency(summary.totalExpenses, summary.currency)}
          hint="Acumulado del año a la fecha"
          icon={ArrowUpCircle}
          tone="danger"
        />
        <SummaryCard
          title="Disponible"
          value={formatCurrency(summary.balance, summary.currency)}
          hint="Balance del año a la fecha"
          icon={Wallet}
          tone={summary.balance >= 0 ? 'primary' : 'danger'}
        />
      </div>

      <Card className="border-white/40 bg-card/90 shadow-soft">
        <CardHeader className="gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Analítica</CardTitle>
            <p className="text-sm text-muted-foreground">
              Filtra por mes y año, o deja Todos para ver el panorama completo.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={month}
              onValueChange={(value) => {
                if (value) {
                  setMonth(value)
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue>
                  {month === 'all'
                    ? 'Todos los meses'
                    : MONTH_OPTIONS[Number(month) - 1] ?? 'Selecciona un mes'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {MONTH_OPTIONS.map((label, index) => (
                  <SelectItem key={label} value={String(index + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={year}
              onValueChange={(value) => {
                if (value) {
                  setYear(value)
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue>{year === 'all' ? 'Todos los años' : year}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {yearOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {loadingAnalytics || !analytics ? (
        <LoadingScreen label="Cargando analítica..." className="min-h-80" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="min-w-0 border-white/40 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Ingresos vs gastos por mes</CardTitle>
              </CardHeader>
              <CardContent className="h-80 min-w-0">
                {timeline.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No hay datos para mostrar
                  </div>
                ) : (
                  <ChartFrame>
                    {({ width, height }) => (
                      <BarChart width={width} height={height} data={timeline}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="label" {...chartAxisProps} />
                        <YAxis {...chartAxisProps} />
                        <Tooltip content={<ChartTooltipContent currency={summary.currency} />} />
                        <Bar
                          dataKey="income"
                          name="Ingresos"
                          fill="var(--color-chart-5)"
                          radius={[10, 10, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          name="Gastos"
                          fill="var(--color-destructive)"
                          radius={[10, 10, 0, 0]}
                        />
                      </BarChart>
                    )}
                  </ChartFrame>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 border-white/40 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Gastos por Categoría</CardTitle>
              </CardHeader>
              <CardContent className="h-80 min-w-0">
                {analytics.categoryBreakdown.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No hay gastos en este período
                  </div>
                ) : (
                  <ChartFrame>
                    {({ width, height }) => (
                      <PieChart width={width} height={height}>
                        <Pie
                          data={analytics.categoryBreakdown}
                          dataKey="total"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={110}
                          label={renderPieLabel}
                        >
                          {analytics.categoryBreakdown.map((entry) => (
                            <Cell key={entry.id} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          {...chartTooltipProps}
                          formatter={(value) =>
                            formatCurrency(Number(value ?? 0), summary.currency)
                          }
                        />
                      </PieChart>
                    )}
                  </ChartFrame>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 border-white/40 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Tendencia mensual de gastos</CardTitle>
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
                        <Tooltip content={<ChartTooltipContent currency={summary.currency} />} />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          name="Gastos"
                          stroke="var(--color-destructive)"
                          strokeWidth={3}
                          dot={{ fill: 'var(--color-destructive)' }}
                        />
                      </LineChart>
                    )}
                  </ChartFrame>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 border-white/40 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Tendencia mensual de ingresos</CardTitle>
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
                        <Tooltip content={<ChartTooltipContent currency={summary.currency} />} />
                        <Line
                          type="monotone"
                          dataKey="income"
                          name="Ingresos"
                          stroke="var(--color-chart-5)"
                          strokeWidth={3}
                          dot={{ fill: 'var(--color-chart-5)' }}
                        />
                      </LineChart>
                    )}
                  </ChartFrame>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Card className="w-full max-w-4xl border-white/40 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Gastos vs disponible</CardTitle>
              </CardHeader>
              <CardContent className="h-80 min-w-0">
                {spendingOverview.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No hay datos suficientes en este período
                  </div>
                ) : (
                  <ChartFrame className="mx-auto max-w-130">
                    {({ width, height }) => (
                      <PieChart width={width} height={height}>
                        <Pie
                          data={spendingOverview}
                          dataKey="total"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          label={renderPieLabel}
                        >
                          {spendingOverview.map((entry) => (
                            <Cell key={entry.id} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          {...chartTooltipProps}
                          formatter={(value) =>
                            formatCurrency(Number(value ?? 0), summary.currency)
                          }
                        />
                      </PieChart>
                    )}
                  </ChartFrame>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="min-w-0 border-white/40 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Uso de Tarjetas de Crédito</CardTitle>
              </CardHeader>
              <CardContent className="h-80 min-w-0">
                {analytics.creditCardUsage.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No hay tarjetas de crédito
                  </div>
                ) : (
                  <ChartFrame>
                    {({ width, height }) => (
                      <BarChart
                        width={width}
                        height={height}
                        data={analytics.creditCardUsage}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" {...chartAxisProps} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={120}
                          tickFormatter={(value) => String(value).slice(0, 12)}
                          {...chartAxisProps}
                        />
                        <Tooltip content={<ChartTooltipContent currency={summary.currency} />} />
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

            <Card className="border-white/40 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Alertas de Tarjetas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.creditCardAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay tarjetas activas para mostrar alertas.
                  </p>
                ) : (
                  summary.creditCardAlerts.map((card) => {
                    const usage =
                      card.monthlyLimit > 0
                        ? (card.currentSpending / card.monthlyLimit) * 100
                        : 0
                    const suggestion = getSuggestedPaymentDate(card.paymentDueDay)

                    return (
                      <div
                        key={card.id}
                        className="rounded-3xl border border-border/70 bg-background/60 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">
                              {card.name} • ****{card.lastFourDigits}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(card.currentSpending, summary.currency)} /{' '}
                              {formatCurrency(card.monthlyLimit, summary.currency)}
                            </p>
                          </div>
                          <Badge variant={usage >= 80 ? 'destructive' : 'secondary'}>
                            {usage.toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${usage >= 80 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${Math.min(usage, 100)}%` }}
                          />
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarClock className="size-4" />
                          Pago sugerido: {suggestion.date}
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/40 bg-card/90 shadow-soft">
            <CardHeader>
              <CardTitle>Gastos Recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: expense.categoryColor }}
                    />
                    <div>
                      <p className="font-medium">{expense.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.categoryName} • {formatDate(expense.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                    </Badge>
                    <p className="font-semibold text-destructive">
                      -{formatCurrency(expense.amount, summary.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
