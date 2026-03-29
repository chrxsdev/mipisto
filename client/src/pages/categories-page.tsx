import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import type { Category } from '@/types/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  color: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Selecciona un color válido'),
})

export function CategoriesPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [values, setValues] = useState({
    name: '',
    color: '#406e8e',
  })
  const [saving, setSaving] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  useEffect(() => {
    void loadCategories()
  }, [token])

  async function loadCategories() {
    try {
      const response = await apiRequest<Category[]>('/categories', { token })
      setCategories(response)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  function resetForm() {
    setValues({
      name: '',
      color: '#406e8e',
    })
    setEditingCategoryId(null)
  }

  function openCreateDialog() {
    resetForm()
    setDialogOpen(true)
  }

  async function handleSaveCategory() {
    const result = categorySchema.safeParse(values)

    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Categoría inválida')
      return
    }

    setSaving(true)

    try {
      await apiRequest(editingCategoryId ? `/categories/${editingCategoryId}` : '/categories', {
        method: editingCategoryId ? 'PUT' : 'POST',
        token,
        body: result.data,
      })
      toast.success(
        editingCategoryId ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente',
      )
      resetForm()
      setDialogOpen(false)
      await loadCategories()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCategory(category: Category) {
    setDeletingCategoryId(category.id)

    try {
      await apiRequest(`/categories/${category.id}`, {
        method: 'DELETE',
        token,
      })
      toast.success('Categoría eliminada')
      await loadCategories()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setDeletingCategoryId(null)
    }
  }

  function handleEditCategory(category: Category) {
    setEditingCategoryId(category.id)
    setValues({
      name: category.name,
      color: category.color,
    })
    setDialogOpen(true)
  }

  return (
    <>
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader className="flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="space-y-1.5">
            <CardTitle>Categorías</CardTitle>
            <CardDescription>
              Crea y administra tus categorías sin necesidad de registrar un gasto.
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="size-4" />
            Nueva categoría
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => {
            const canDelete = !category.isDefault && (category._count?.expenses ?? 0) === 0
            const canEdit = !category.isDefault

            return (
              <div
                key={category.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {category.isDefault ? <Badge variant="outline">Predeterminada</Badge> : null}
                      <Badge variant="outline">
                        {(category._count?.expenses ?? 0) === 1
                          ? '1 gasto'
                          : `${category._count?.expenses ?? 0} gastos`}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {canEdit ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                      disabled={saving || deletingCategoryId === category.id}
                    >
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                  ) : null}
                  {!category.isDefault ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canDelete || deletingCategoryId === category.id}
                      onClick={() => void handleDeleteCategory(category)}
                    >
                      <Trash2 className="size-4" />
                      {deletingCategoryId === category.id ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategoryId ? 'Editar categoría' : 'Nueva categoría'}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              await handleSaveCategory()
            }}
          >
            <div className="space-y-2">
              <Label>{editingCategoryId ? 'Editar nombre' : 'Nombre'}</Label>
              <Input
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Ej. Salud, Viajes, Mascotas"
              />
            </div>
            <div className="space-y-2">
              <Label>{editingCategoryId ? 'Editar color' : 'Color'}</Label>
              <Input
                type="color"
                value={values.color}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    color: event.target.value,
                  }))
                }
                className="h-11"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? editingCategoryId
                    ? 'Guardando...'
                    : 'Creando...'
                  : editingCategoryId
                    ? 'Guardar'
                    : 'Agregar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
