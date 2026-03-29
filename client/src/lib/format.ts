import { addMonths, differenceInCalendarDays, endOfMonth, format, isBefore } from 'date-fns'
import { es } from 'date-fns/locale'

const localesByCurrency = {
  USD: 'en-US',
  LPS: 'es-HN',
} as const

const dateLocales = {
  USD: es,
  LPS: es,
} as const

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})/

type DateParts = {
  year: number
  month: number
  day: number
}

function withSafeDay(date: Date, day: number) {
  const maxDay = endOfMonth(date).getDate()
  return new Date(date.getFullYear(), date.getMonth(), Math.min(day, maxDay))
}

export function getDateParts(value: string | Date): DateParts {
  if (value instanceof Date) {
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    }
  }

  const directMatch = value.match(dateOnlyPattern)

  if (directMatch) {
    return {
      year: Number(directMatch[1]),
      month: Number(directMatch[2]),
      day: Number(directMatch[3]),
    }
  }

  const date = new Date(value)

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

export function parseCalendarDate(value: string | Date) {
  const { year, month, day } = getDateParts(value)
  return new Date(year, month - 1, day)
}

export function formatCurrency(amount: number, currencyCode: string) {
  const locale = localesByCurrency[currencyCode as keyof typeof localesByCurrency] ?? 'es-HN'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function toLocalDateInputValue(value: string | Date = new Date()) {
  const { year, month, day } = getDateParts(value)

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function formatDate(value: string | Date) {
  return format(parseCalendarDate(value), 'dd/MM/yyyy', { locale: es })
}

export function formatMonthLabel(value: string | Date, currency = 'LPS') {
  const locale = dateLocales[currency as keyof typeof dateLocales] ?? es
  const { year, month } = getDateParts(value)
  return format(new Date(year, month - 1, 1), 'MMM yyyy', { locale })
}

export function getCreditExpenseSchedule(
  value: string | Date,
  cutOffDay: number,
  paymentDueDay: number,
  currency = 'LPS',
) {
  const expenseDate = parseCalendarDate(value)
  const expenseMonthStart = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1)
  const expenseMonthCutOff = withSafeDay(expenseMonthStart, cutOffDay)
  const statementBaseDate =
    expenseDate.getTime() >= expenseMonthCutOff.getTime()
      ? addMonths(expenseMonthStart, 1)
      : expenseMonthStart
  const statementCloseDate = withSafeDay(statementBaseDate, cutOffDay)
  const paymentDate = withSafeDay(addMonths(statementBaseDate, 1), paymentDueDay)

  return {
    appliedMonthLabel: formatMonthLabel(statementBaseDate, currency),
    statementCloseDate,
    paymentDate,
    paymentMonthLabel: formatMonthLabel(paymentDate, currency),
  }
}

export function getSuggestedPaymentDate(paymentDueDay: number) {
  const now = new Date()
  const currentMonthDate = withSafeDay(now, paymentDueDay)
  const targetBase = isBefore(now, currentMonthDate) ? now : addMonths(now, 1)
  const targetDate = withSafeDay(targetBase, paymentDueDay - 3 <= 0 ? paymentDueDay : paymentDueDay - 3)

  return {
    date: format(targetDate, 'dd MMM yyyy', { locale: es }),
    daysUntil: differenceInCalendarDays(targetDate, now),
  }
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk.charAt(0).toUpperCase())
    .join('')
}
