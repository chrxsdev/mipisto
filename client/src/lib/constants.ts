import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  LayoutDashboard,
  Settings,
  Tags,
} from 'lucide-react'
import type { PaymentMethod } from '@/types/api'

export const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const MONTH_OPTIONS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function getYearOptions(baseYear = new Date().getFullYear(), total = 10) {
  return Array.from({ length: total }, (_value, index) => String(baseYear - index))
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
  CASH: 'Efectivo',
}

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'DEBIT', label: 'Débito' },
  { value: 'CREDIT', label: 'Crédito' },
  { value: 'CASH', label: 'Efectivo' },
] as const

export const CURRENCIES = [
  { value: 'USD', label: 'Dólar' },
  { value: 'LPS', label: 'Lempira Hondureño' },
] as const

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ingresos', label: 'Ingresos', icon: ArrowDownCircle },
  { to: '/gastos', label: 'Gastos', icon: ArrowUpCircle },
  { to: '/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
] as const
