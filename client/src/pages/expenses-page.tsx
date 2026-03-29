import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import {
  getYearOptions,
  MONTH_OPTIONS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
} from '@/lib/constants'
import {
  formatCurrency,
  formatDate,
  getCreditExpenseSchedule,
  toLocalDateInputValue,
} from '@/lib/format'
import type { Category, CreditCard, Expense, PaymentMethod } from '@/types/api'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DatePicker } from '@/components/date-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const expenseSchema = z
  .object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    amount: z.number().positive('El monto debe ser positivo'),
    categoryId: z.string().min(1, 'La categoría es obligatoria'),
    date: z.string().min(1, 'La fecha es obligatoria'),
    paymentMethod: z.enum(['DEBIT', 'CREDIT', 'CASH']),
    creditCardId: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.paymentMethod !== 'CREDIT' || Boolean(data.creditCardId), {
    path: ['creditCardId'],
    message: 'Seleccione la tarjeta de crédito',
  })

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  color: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Seleccione un color válido'),
})

type ExpenseFormValues = {
  name: string
  amount: string
  categoryId: string
  date: string
  paymentMethod: PaymentMethod
  creditCardId: string
  notes: string
}

const emptyExpenseForm: ExpenseFormValues = {
  name: '',
  amount: '',
  categoryId: '',
  date: toLocalDateInputValue(),
  paymentMethod: 'DEBIT',
  creditCardId: '',
  notes: '',
}

function QuickCategoryDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (category: Category) => Promise<void>
}) {
  const { token } = useAuth()
  const [values, setValues] = useState({ name: '', color: '#928c6f' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva categoría rápida</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            const result = categorySchema.safeParse(values)

            if (!result.success) {
              const nextErrors: Record<string, string> = {}
              result.error.issues.forEach((issue) => {
                nextErrors[String(issue.path[0])] = issue.message
              })
              setErrors(nextErrors)
              return
            }

            try {
              const category = await apiRequest<Category>('/categories', {
                method: 'POST',
                token,
                body: {
                  name: values.name,
                  color: values.color,
                },
              })
              toast.success('Categoría creada')
              setValues({ name: '', color: '#928c6f' })
              await onCreated(category)
              onOpenChange(false)
            } catch (error) {
              toast.error(getApiErrorMessage(error))
            }
          }}
        >
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
            />
            {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              type="color"
              value={values.color}
              onChange={(event) =>
                setValues((current) => ({ ...current, color: event.target.value }))
              }
              className="h-11"
            />
          </div>
          <DialogFooter className="bg-transparent p-0 pt-2 sm:justify-end">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear categoría</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ExpenseDialog({
  open,
  onOpenChange,
  initialData,
  categories,
  cards,
  onCreatedCategory,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: Expense | null
  categories: Category[]
  cards: CreditCard[]
  onCreatedCategory: (category: Category) => Promise<void>
  onSubmit: (values: ExpenseFormValues) => Promise<void>
}) {
  const [values, setValues] = useState<ExpenseFormValues>(emptyExpenseForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const selectedCard = cards.find((card) => card.id === values.creditCardId)
  const creditSchedule =
    values.paymentMethod === 'CREDIT' && selectedCard && values.date
      ? getCreditExpenseSchedule(
          values.date,
          selectedCard.cutOffDay,
          selectedCard.paymentDueDay,
        )
      : null

  useEffect(() => {
    if (!open) {
      return
    }

    if (initialData) {
      setValues({
        name: initialData.name,
        amount: String(initialData.amount),
        categoryId: initialData.categoryId,
        date: toLocalDateInputValue(initialData.date),
        paymentMethod: initialData.paymentMethod,
        creditCardId: initialData.creditCardId ?? '',
        notes: initialData.notes ?? '',
      })
      return
    }

    setValues({
      ...emptyExpenseForm,
      categoryId: categories[0]?.id ?? '',
    })
  }, [categories, initialData, open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = expenseSchema.safeParse({
      name: values.name,
      amount: Number(values.amount),
      categoryId: values.categoryId,
      date: values.date,
      paymentMethod: values.paymentMethod,
      creditCardId: values.creditCardId || undefined,
      notes: values.notes,
    })

    if (!result.success) {
      const nextErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        nextErrors[String(issue.path[0])] = issue.message
      })
      setErrors(nextErrors)
      return
    }

    setErrors({})
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{initialData ? 'Editar gasto' : 'Nuevo gasto'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={values.name}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, name: event.target.value }))
                  }
                />
                {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
              </div>

              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.amount}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, amount: event.target.value }))
                  }
                />
                {errors.amount ? <p className="text-sm text-destructive">{errors.amount}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={values.categoryId}
                  onValueChange={(value) =>
                    setValues((current) => ({ ...current, categoryId: value ?? '' }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una categoría">
                      {categories.find((category) => category.id === values.categoryId)?.name ??
                        'Selecciona una categoría'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId ? (
                  <p className="text-sm text-destructive">{errors.categoryId}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label className="opacity-0">Nueva</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setCategoryDialogOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  Crear
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <DatePicker
                  value={values.date}
                  onChange={(value) => setValues((current) => ({ ...current, date: value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select
                  value={values.paymentMethod}
                  onValueChange={(value) =>
                    setValues((current) => ({
                      ...current,
                      paymentMethod: value as PaymentMethod,
                      creditCardId: value === 'CREDIT' ? current.creditCardId : '',
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {PAYMENT_METHOD_LABELS[values.paymentMethod]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {values.paymentMethod === 'CREDIT' ? (
              <>
                <div className="space-y-2">
                  <Label>Tarjeta de crédito</Label>
                  <Select
                    value={values.creditCardId}
                    onValueChange={(value) =>
                      setValues((current) => ({ ...current, creditCardId: value ?? '' }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una tarjeta">
                        {selectedCard
                          ? `${selectedCard.name} • ****${selectedCard.lastFourDigits}`
                          : 'Selecciona una tarjeta'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name} • ****{card.lastFourDigits}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.creditCardId ? (
                    <p className="text-sm text-destructive">{errors.creditCardId}</p>
                  ) : null}
                </div>

                {creditSchedule ? (
                  <div className="rounded-3xl border border-border/70 bg-background/60 p-4 text-sm">
                    <p className="font-medium">Aplicación del gasto</p>
                    <p className="mt-2 text-muted-foreground">
                      Mes aplicado: <span className="font-medium text-foreground">{creditSchedule.appliedMonthLabel}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Fecha de corte: <span className="font-medium text-foreground">{formatDate(creditSchedule.statementCloseDate)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Fecha de pago: <span className="font-medium text-foreground">{formatDate(creditSchedule.paymentDate)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Mes de pago: <span className="font-medium text-foreground">{creditSchedule.paymentMonthLabel}</span>
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={values.notes}
                onChange={(event) =>
                  setValues((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Detalle opcional"
              />
            </div>

            <DialogFooter className="bg-transparent p-0 pt-2 sm:justify-end">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{initialData ? 'Guardar' : 'Crear gasto'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <QuickCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCreated={async (category) => {
          await onCreatedCategory(category)
          setValues((current) => ({ ...current, categoryId: category.id }))
        }}
      />
    </>
  )
}

export function ExpensesPage() {
  const { token, user } = useAuth()
  const yearOptions = getYearOptions()
  const [month, setMonth] = useState('all')
  const [year, setYear] = useState('all')
  const [categoryId, setCategoryId] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState<'all' | PaymentMethod>('all')
  const [items, setItems] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  async function loadLookups() {
    try {
      const [categoriesResponse, cardsResponse] = await Promise.all([
        apiRequest<Category[]>('/categories', { token }),
        apiRequest<CreditCard[]>('/credit-cards/active', { token }),
      ])
      setCategories(categoriesResponse)
      setCards(cardsResponse)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function loadExpenses() {
    const searchParams = new URLSearchParams()

    if (month !== 'all') {
      searchParams.set('month', month)
    }

    if (year !== 'all') {
      searchParams.set('year', year)
    }

    if (categoryId !== 'all') {
      searchParams.set('categoryId', categoryId)
    }

    if (paymentMethod !== 'all') {
      searchParams.set('paymentMethod', paymentMethod)
    }

    try {
      const response = await apiRequest<Expense[]>(
        `/expenses${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`,
        { token },
      )
      setItems(response)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  useEffect(() => {
    void loadLookups()
  }, [token])

  useEffect(() => {
    void loadExpenses()
  }, [categoryId, month, paymentMethod, token, year])

  const total = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

          <Select
            value={categoryId}
            onValueChange={(value) => {
              if (value) {
                setCategoryId(value)
              }
            }}
          >
            <SelectTrigger className="w-full xl:w-56">
              <SelectValue>
                {categoryId === 'all'
                  ? 'Todas las categorías'
                  : categories.find((category) => category.id === categoryId)?.name ??
                    'Todas las categorías'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={paymentMethod}
            onValueChange={(value) => {
              if (value) {
                setPaymentMethod(value as typeof paymentMethod)
              }
            }}
          >
            <SelectTrigger className="w-full xl:w-44">
              <SelectValue>
                {paymentMethod === 'all'
                  ? 'Todos los métodos'
                  : PAYMENT_METHOD_LABELS[paymentMethod]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los métodos</SelectItem>
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Nuevo gasto
        </Button>
      </div>

      <Card className="border-white/40 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle>Total filtrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-destructive">
            {formatCurrency(total, user?.currency ?? 'LPS')}
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/40 bg-card/90 shadow-soft">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Método de pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{formatCurrency(item.amount, user?.currency ?? 'LPS')}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-transparent"
                      style={{
                        backgroundColor: `${item.category.color}20`,
                        color: item.category.color,
                      }}
                    >
                      {item.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="secondary">
                        {PAYMENT_METHOD_LABELS[item.paymentMethod]}
                        {item.paymentMethod === 'CREDIT' && item.creditCard ? (
                          <span className="ml-2">****{item.creditCard.lastFourDigits}</span>
                        ) : null}
                      </Badge>
                      {item.paymentMethod === 'CREDIT' ? (
                        <div className="text-xs text-muted-foreground">
                          <p>Mes aplicado: {item.appliedMonthLabel}</p>
                          {item.statementCloseDate ? (
                            <p>Corte: {formatDate(item.statementCloseDate)}</p>
                          ) : null}
                          {item.paymentDueDate ? (
                            <p>Pago: {formatDate(item.paymentDueDate)}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(item)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        categories={categories}
        cards={cards}
        onCreatedCategory={async (category) => {
          setCategories((current) =>
            [...current, category].sort((a, b) => a.name.localeCompare(b.name)),
          )
        }}
        onSubmit={async (values) => {
          try {
            await apiRequest(editing ? `/expenses/${editing.id}` : '/expenses', {
              method: editing ? 'PUT' : 'POST',
              token,
              body: {
                name: values.name,
                amount: Number(values.amount),
                categoryId: values.categoryId,
                date: values.date,
                paymentMethod: values.paymentMethod,
                creditCardId: values.creditCardId || undefined,
                notes: values.notes,
              },
            })
            toast.success(editing ? 'Gasto actualizado' : 'Gasto creado')
            await loadExpenses()
          } catch (error) {
            toast.error(getApiErrorMessage(error))
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        title="Eliminar gasto"
        description="Esta acción no se puede deshacer."
        onConfirm={async () => {
          if (!deleteTarget) {
            return
          }

          try {
            await apiRequest(`/expenses/${deleteTarget.id}`, {
              method: 'DELETE',
              token,
            })
            toast.success('Gasto eliminado')
            await loadExpenses()
          } catch (error) {
            toast.error(getApiErrorMessage(error))
          }
        }}
      />
    </div>
  )
}
