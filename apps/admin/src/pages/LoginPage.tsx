import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2, Newspaper } from 'lucide-react'
import { useAuth } from '@/stores/auth'
import { getApiError } from '@/lib/api'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: ({ email, password }: LoginFormData) => login(email, password),
    onSuccess: () => navigate('/', { replace: true }),
    onError: (error) => {
      setError('root', {
        message: getApiError(error) || 'Credenciales incorrectas',
      })
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portal Editorial</h1>
          <p className="text-sm text-gray-500 mt-1">Panel de administración</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@tudominio.com"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors outline-none
                    focus:ring-2 focus:ring-brand-500 focus:border-transparent
                    ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm transition-colors outline-none
                      focus:ring-2 focus:ring-brand-500 focus:border-transparent
                      ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Error global */}
              {errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{errors.root.message}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full btn-primary py-2.5 disabled:opacity-60"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Panel privado — Solo para administradores autorizados
        </p>
      </div>
    </div>
  )
}

