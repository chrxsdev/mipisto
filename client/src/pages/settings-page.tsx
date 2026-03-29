import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { CURRENCIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const settingsSchema = z.object({
  currency: z.enum(['USD', 'LPS']),
})

export function SettingsPage() {
  const { token, user, updateUser } = useAuth()
  const [currency, setCurrency] = useState(user?.currency ?? 'LPS')
  const [saving, setSaving] = useState(false)

  if (!user) {
    return null
  }

  const currentUser = user

  async function handleSave() {
    const result = settingsSchema.safeParse({ currency })

    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Moneda inválida')
      return
    }

    setSaving(true)

    try {
      const response = await apiRequest<{ currency: string; locale: string }>(
        '/user/settings',
        {
          method: 'PUT',
          token,
          body: result.data,
        },
      )

      updateUser({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        currency: response.currency,
        locale: response.locale,
      })
      toast.success('Configuración actualizada correctamente')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Moneda</CardTitle>
        <CardDescription>
          Selecciona cómo quieres ver tus montos en toda la aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Moneda preferida</p>
          <Select
            value={currency}
            onValueChange={(value) => {
              if (value) {
                setCurrency(value)
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una moneda">
                {CURRENCIES.find((item) => item.value === currency)?.label ??
                  'Selecciona una moneda'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <p className="text-sm text-muted-foreground">Vista previa</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatCurrency(1234567, currency)}
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </CardContent>
    </Card>
  )
}
