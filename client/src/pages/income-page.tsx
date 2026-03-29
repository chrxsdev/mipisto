import { useEffect, useState } from 'react'
import { Pencil, Plus, Repeat, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getYearOptions, MONTH_OPTIONS } from '@/lib/constants'
import { formatCurrency, formatDate, toLocalDateInputValue } from '@/lib/format'
import type { Income } from '@/types/api'
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
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const incomeSchema = z.object({
  source: z.string().min(1, 'La fuente es obligatoria'),
  amount: z.number().positive('El monto debe ser positivo'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  isRecurring: z.boolean(),
  notes: z.string().optional(),
})

type IncomeFormValues = {
  source: string
  amount: string
  date: string
  isRecurring: boolean
  notes: string
}

const emptyIncomeForm: IncomeFormValues = {
  source: '',
  amount: '',
  date: toLocalDateInputValue(),
  isRecurring: false,
  notes: '',
}

function IncomeDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: Income | null
  onSubmit: (values: IncomeFormValues) => Promise<void>
}) {
  const [values, setValues] = useState<IncomeFormValues>(emptyIncomeForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      return
    }

    if (initialData) {
      setValues({
        source: initialData.source,
        amount: String(initialData.amount),
        date: toLocalDateInputValue(initialData.date),
        isRecurring: initialData.isRecurring,
        notes: initialData.notes ?? '',
      })
      return
    }

    setValues(emptyIncomeForm)
  }, [initialData, open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = incomeSchema.safeParse({
      source: values.source,
      amount: Number(values.amount),
      date: values.date,
      isRecurring: values.isRecurring,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar ingreso' : 'Nuevo ingreso'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Fuente</Label>
            <Input
              value={values.source}
              onChange={(event) =>
                setValues((current) => ({ ...current, source: event.target.value }))
              }
            />
            {errors.source ? <p className="text-sm text-destructive">{errors.source}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-2">
              <Label>Fecha</Label>
              <DatePicker
                value={values.date}
                onChange={(value) => setValues((current) => ({ ...current, date: value }))}
              />
              {errors.date ? <p className="text-sm text-destructive">{errors.date}</p> : null}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-3xl border border-border/70 bg-background/60 p-4">
            <div>
              <p className="font-medium">Ingreso recurrente</p>
              <p className="text-sm text-muted-foreground">
                Márcalo si se repite mes a mes.
              </p>
            </div>
            <Switch
              checked={values.isRecurring}
              onCheckedChange={(checked) =>
                setValues((current) => ({ ...current, isRecurring: Boolean(checked) }))
              }
            />
          </div>

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
            <Button type="submit">{initialData ? 'Guardar' : 'Crear ingreso'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function IncomePage() {
  const { token, user } = useAuth()
  const yearOptions = getYearOptions()
  const [month, setMonth] = useState('all')
  const [year, setYear] = useState('all')
  const [items, setItems] = useState<Income[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Income | null>(null)

  async function loadIncome() {
    try {
      const searchParams = new URLSearchParams()

      if (month !== 'all') {
        searchParams.set('month', month)
      }

      if (year !== 'all') {
        searchParams.set('year', year)
      }

      const response = await apiRequest<Income[]>(
        `/income${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`,
        { token },
      )
      setItems(response)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  useEffect(() => {
    void loadIncome()
  }, [month, token, year])

  const total = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Nuevo ingreso
        </Button>
      </div>

      <Card className="border-white/40 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle>Total filtrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-secondary text-3xl font-semibold">
            {formatCurrency(total, user?.currency ?? 'LPS')}
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/40 bg-card/90 shadow-soft">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fuente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Recurrente</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.source}</TableCell>
                  <TableCell>{formatCurrency(item.amount, user?.currency ?? 'LPS')}</TableCell>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>
                    {item.isRecurring ? (
                      <Badge>
                        <Repeat className="mr-1 size-3" />
                        Recurrente
                      </Badge>
                    ) : null}
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

      <IncomeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        onSubmit={async (values) => {
          try {
            await apiRequest(editing ? `/income/${editing.id}` : '/income', {
              method: editing ? 'PUT' : 'POST',
              token,
              body: {
                source: values.source,
                amount: Number(values.amount),
                date: values.date,
                isRecurring: values.isRecurring,
                notes: values.notes,
              },
            })
            toast.success(editing ? 'Ingreso actualizado' : 'Ingreso creado')
            await loadIncome()
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
        title="Eliminar ingreso"
        description="Esta acción no se puede deshacer."
        onConfirm={async () => {
          if (!deleteTarget) {
            return
          }

          try {
            await apiRequest(`/income/${deleteTarget.id}`, {
              method: 'DELETE',
              token,
            })
            toast.success('Ingreso eliminado')
            await loadIncome()
          } catch (error) {
            toast.error(getApiErrorMessage(error))
          }
        }}
      />
    </div>
  )
}
