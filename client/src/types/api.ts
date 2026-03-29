export type User = {
  id: string
  email: string
  name: string
  currency: string
  locale: string
}

export type Category = {
  id: string
  userId: string | null
  name: string
  icon: string
  color: string
  isDefault: boolean
  _count?: {
    expenses: number
  }
}

export type CreditCard = {
  id: string
  userId: string
  name: string
  lastFourDigits: string
  monthlyLimit: number
  cutOffDay: number
  paymentDueDay: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type Expense = {
  id: string
  userId: string
  amount: number
  name: string
  categoryId: string
  date: string
  paymentMethod: PaymentMethod
  creditCardId: string | null
  notes: string | null
  appliedMonth: number
  appliedYear: number
  appliedMonthLabel: string
  statementCloseDate: string | null
  paymentDueDate: string | null
  paymentMonthLabel: string | null
  category: Category
  creditCard: CreditCard | null
}

export type Income = {
  id: string
  userId: string
  amount: number
  source: string
  date: string
  isRecurring: boolean
  notes: string | null
}

export type PaymentMethod = 'DEBIT' | 'CREDIT' | 'CASH'

export type DashboardResponse = {
  totalIncome: number
  totalExpenses: number
  balance: number
  recentExpenses: Array<{
    id: string
    name: string
    amount: number
    date: string
    categoryName: string
    categoryColor: string
    paymentMethod: PaymentMethod
  }>
  creditCardAlerts: Array<{
    id: string
    name: string
    lastFourDigits: string
    currentSpending: number
    monthlyLimit: number
    paymentDueDay: number
  }>
  currency: string
}

export type AnalyticsResponse = {
  startDate: string
  endDate: string
  expenses: Expense[]
  incomes: Income[]
  categoryBreakdown: Array<{
    id: string
    name: string
    color: string
    total: number
    percentage: number
  }>
  creditCardUsage: Array<{
    id: string
    name: string
    lastFourDigits: string
    monthlyLimit: number
    spending: number
  }>
}
