import { useEffect, useState } from 'react'
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { formatCurrency, getSuggestedPaymentDate } from '@/lib/format'
import type { CreditCard as CreditCardType } from '@/types/api'
import { ConfirmDialog } from '@/components/confirm-dialog'
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
import { Switch } from '@/components/ui/switch'

const cardSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  lastFourDigits: z.string().regex(/^\d{4}$/, 'Ingrese exactamente 4 dígitos'),
  monthlyLimit: z.number().positive('El límite debe ser positivo'),
  cutOffDay: z.number().min(1).max(31),
  paymentDueDay: z.number().min(1).max(31),
})

type CardFormValues = {
  name: string
  lastFourDigits: string
  monthlyLimit: string
  cutOffDay: string
  paymentDueDay: string
}

type CardWithSpending = CreditCardType & {
  currentSpending: number
}

const emptyCardForm: CardFormValues = {
  name: '',
  lastFourDigits: '',
  monthlyLimit: '',
  cutOffDay: '',
  paymentDueDay: '',
}

function CardDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: CreditCardType | null
  onSubmit: (values: CardFormValues) => Promise<void>
}) {
  const [values, setValues] = useState<CardFormValues>(emptyCardForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      return
    }

    if (initialData) {
      setValues({
        name: initialData.name,
        lastFourDigits: initialData.lastFourDigits,
        monthlyLimit: String(initialData.monthlyLimit),
        cutOffDay: String(initialData.cutOffDay),
        paymentDueDay: String(initialData.paymentDueDay),
      })
      return
    }

    setValues(emptyCardForm)
  }, [initialData, open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = cardSchema.safeParse({
      name: values.name,
      lastFourDigits: values.lastFourDigits,
      monthlyLimit: Number(values.monthlyLimit),
      cutOffDay: Number(values.cutOffDay),
      paymentDueDay: Number(values.paymentDueDay),
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
          <DialogTitle>{initialData ? 'Editar tarjeta' : 'Nueva tarjeta'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Últimos 4 dígitos</Label>
              <Input
                value={values.lastFourDigits}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    lastFourDigits: event.target.value.replace(/\D/g, '').slice(0, 4),
                  }))
                }
              />
              {errors.lastFourDigits ? (
                <p className="text-sm text-destructive">{errors.lastFourDigits}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Límite mensual</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={values.monthlyLimit}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    monthlyLimit: event.target.value,
                  }))
                }
              />
              {errors.monthlyLimit ? (
                <p className="text-sm text-destructive">{errors.monthlyLimit}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Día de corte</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={values.cutOffDay}
                onChange={(event) =>
                  setValues((current) => ({ ...current, cutOffDay: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Día de pago</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={values.paymentDueDay}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    paymentDueDay: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter className="bg-transparent p-0 pt-2 sm:justify-end">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{initialData ? 'Guardar' : 'Crear tarjeta'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CardsPage() {
  const { token, user } = useAuth()
  const [items, setItems] = useState<CardWithSpending[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CreditCardType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CreditCardType | null>(null)

  async function loadCards() {
    try {
      const cards = await apiRequest<CreditCardType[]>('/credit-cards', { token })
      const withSpending = await Promise.all(
        cards.map(async (card) => {
          const spending = await apiRequest<CardWithSpending>(
            `/credit-cards/${card.id}/spending`,
            { token },
          )
          return { ...card, currentSpending: spending.currentSpending }
        }),
      )
      setItems(withSpending)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  useEffect(() => {
    void loadCards()
  }, [token])

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Nueva tarjeta
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((card) => {
          const usage = card.monthlyLimit > 0 ? (card.currentSpending / card.monthlyLimit) * 100 : 0
          const suggested = getSuggestedPaymentDate(card.paymentDueDay)

          return (
            <Card key={card.id} className="border-white/40 bg-card/90 shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {card.name} • ****{card.lastFourDigits}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Corte: {card.cutOffDay} • Pago: {card.paymentDueDay}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <CreditCard className="size-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{formatCurrency(card.currentSpending, user?.currency ?? 'LPS')}</span>
                    <span>{formatCurrency(card.monthlyLimit, user?.currency ?? 'LPS')}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${usage >= 80 ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${Math.min(usage, 100)}%` }}
                    />
                  </div>
                  {usage >= 80 ? (
                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-300">
                      Uso elevado de tarjeta
                    </p>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-border/70 bg-background/60 p-4 text-sm">
                  <p className="text-muted-foreground">Pago sugerido</p>
                  <p className="mt-1 font-medium">{suggested.date}</p>
                  <p className="text-muted-foreground">en {suggested.daysUntil} días</p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={card.isActive}
                      onCheckedChange={async () => {
                        try {
                          await apiRequest(`/credit-cards/${card.id}/toggle`, {
                            method: 'PATCH',
                            token,
                          })
                          toast.success('Estado actualizado')
                          await loadCards()
                        } catch (error) {
                          toast.error(getApiErrorMessage(error))
                        }
                      }}
                    />
                    <span className="text-sm">
                      {card.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => {
                        setEditing(card)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(card)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <CardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        onSubmit={async (values) => {
          try {
            await apiRequest(editing ? `/credit-cards/${editing.id}` : '/credit-cards', {
              method: editing ? 'PUT' : 'POST',
              token,
              body: {
                name: values.name,
                lastFourDigits: values.lastFourDigits,
                monthlyLimit: Number(values.monthlyLimit),
                cutOffDay: Number(values.cutOffDay),
                paymentDueDay: Number(values.paymentDueDay),
              },
            })
            toast.success(editing ? 'Tarjeta actualizada' : 'Tarjeta creada')
            await loadCards()
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
        title="Eliminar tarjeta"
        description="Si tiene gastos asociados, la API sugerirá desactivarla en su lugar."
        onConfirm={async () => {
          if (!deleteTarget) {
            return
          }

          try {
            await apiRequest(`/credit-cards/${deleteTarget.id}`, {
              method: 'DELETE',
              token,
            })
            toast.success('Tarjeta eliminada')
            await loadCards()
          } catch (error) {
            toast.error(getApiErrorMessage(error))
          }
        }}
      />
    </div>
  )
}
