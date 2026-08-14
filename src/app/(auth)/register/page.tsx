'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Lock, User, Building2, CheckCircle, FileText } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    admin_username: '',
    admin_email: '',
    admin_password: '',
    company_name: '',
    legal_name: '',
    tax_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar la empresa')
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setError(err.message || 'Error al registrar la empresa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-xl shadow-gray-500/10 p-8">
          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-16 w-auto object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-light text-gray-900 mb-2">Crear Cuenta</h1>
            <p className="text-gray-500 text-sm">Registra tu empresa y tu usuario administrador</p>
          </div>

          {success && (
            <div className="mb-6 bg-green-50/80 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-600 text-sm font-medium">
                  ¡Empresa creada exitosamente! Redirigiendo al login...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50/80 border border-red-200 rounded-2xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la empresa</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="company_name"
                  required
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  placeholder="Mi Empresa S.A."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre legal</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="legal_name"
                  required
                  value={formData.legal_name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  placeholder="Mi Empresa, C.A."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RIF / NIT</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="tax_id"
                  required
                  value={formData.tax_id}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  placeholder="J-12345678-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario admin</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="admin_username"
                  required
                  value={formData.admin_username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  placeholder="juanperez"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="admin_email"
                  required
                  value={formData.admin_email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  placeholder="juan@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  name="admin_password"
                  required
                  minLength={8}
                  value={formData.admin_password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Mínimo 8 caracteres</p>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
