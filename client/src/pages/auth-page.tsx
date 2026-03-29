import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { getApiErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.email('Ingrese un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme su contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type AuthPageProps = {
  mode: 'login' | 'register'
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const auth = useAuth()
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isRegister = mode === 'register'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = isRegister
      ? registerSchema.safeParse(values)
      : loginSchema.safeParse(values)

    if (!result.success) {
      const nextErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'form')
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message
        }
      })
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setLoading(true)

    try {
      if (isRegister) {
        await auth.register(result.data as z.infer<typeof registerSchema>)
      } else {
        await auth.login(result.data as z.infer<typeof loginSchema>)
      }
      navigate('/dashboard')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 lg:p-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-background lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden border-r border-border p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <img src="/logo.png" alt="Mi Pisto" className="size-11 object-contain" />
            <div className="mt-12 max-w-md space-y-5">
              <h1 className="text-5xl font-semibold tracking-tight text-balance">
                Tu dinero merece atención.
              </h1>
              <p className="max-w-md text-base leading-7 text-muted-foreground">
                Organiza y trackea ingresos, gastos y tarjetas con una experiencia más serena,
                moderna y enfocada en decisiones.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <div className="space-y-5 text-center">
              <img src="/logo.png" alt="Mi Pisto" className="mx-auto size-16 object-contain" />
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                  {isRegister ? 'Nuevo acceso' : 'Acceso seguro'}
                </p>
                <h2 className="text-3xl font-semibold sm:text-4xl">
                  {isRegister ? 'Crear cuenta' : 'Bienvenido de nuevo'}
                </h2>
                <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
                  {isRegister
                    ? 'Empieza a ordenar tus finanzas personales.'
                    : 'Ingresa para revisar tus números.'}
                </p>
              </div>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {isRegister ? (
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={values.name}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Tu nombre"
                  />
                  {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input
                  value={values.email}
                  type="email"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="correo@ejemplo.com"
                />
                {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  value={values.password}
                  type="password"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="******"
                />
                {errors.password ? (
                  <p className="text-sm text-destructive">{errors.password}</p>
                ) : null}
              </div>

              {isRegister ? (
                <div className="space-y-2">
                  <Label>Confirmar contraseña</Label>
                  <Input
                    value={values.confirmPassword}
                    type="password"
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="******"
                  />
                  {errors.confirmPassword ? (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  ) : null}
                </div>
              ) : null}

              <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
                {loading ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Ingresar'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isRegister ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}{' '}
              <Link
                to={isRegister ? '/login' : '/register'}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {isRegister ? 'Inicia sesión' : 'Regístrate'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
