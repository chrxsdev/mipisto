import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { apiRequest, ApiError } from '@/lib/api'
import type { User } from '@/types/api'

type AuthContextValue = {
  token: string | null
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (input: { email: string; password: string }) => Promise<void>
  register: (input: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const TOKEN_KEY = 'mi-pisto-token'

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(
    () => window.localStorage.getItem(TOKEN_KEY),
  )
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function bootstrap() {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const profile = await apiRequest<User>('/auth/me', { token })
        if (!ignore) {
          setUser(profile)
        }
      } catch (error) {
        if (!ignore) {
          window.localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setUser(null)
        }

        if (error instanceof ApiError && error.status !== 401) {
          console.error(error)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      ignore = true
    }
  }, [token])

  async function login(input: { email: string; password: string }) {
    const response = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: input,
    })

    window.localStorage.setItem(TOKEN_KEY, response.token)
    setToken(response.token)
    setUser(response.user)
  }

  async function register(input: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }) {
    const response = await apiRequest<{ token: string; user: User }>(
      '/auth/register',
      {
        method: 'POST',
        body: input,
      },
    )

    window.localStorage.setItem(TOKEN_KEY, response.token)
    setToken(response.token)
    setUser(response.user)
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  async function refreshUser() {
    if (!token) {
      return
    }

    const profile = await apiRequest<User>('/auth/me', { token })
    setUser(profile)
  }

  function updateUser(nextUser: User) {
    setUser(nextUser)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}
