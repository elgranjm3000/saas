'use client'
import React, { useState } from 'react';
import { Eye, EyeOff, Building2, User, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuthProvider';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    company_tax_id: '',
  });

  const { login } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(formData);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(
        error.response?.data?.message || 
        'Credenciales incorrectas. Inténtalo de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
      <div className="absolute top-40 right-40 w-24 h-24 bg-gray-200 rounded-full mix-blend-multiply filter blur-xl opacity-60"></div>
      
      <div className="relative w-full max-w-md z-10">
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-12 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-lg transform transition-transform duration-300 hover:scale-105">
              <Building2 className="w-9 h-9 text-white" />
            </div>
            
            <h1 className="text-3xl font-light text-gray-900 mb-3">
              Bienvenido
            </h1>
            <p className="text-gray-500 text-sm font-light">
              Accede a tu espacio de trabajo
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="group">
                <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider">
                  Usuario
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'username' ? 'transform scale-[1.01]' : ''
                }`}>
                  <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                    focusedField === 'username' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField('')}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm outline-none"
                    placeholder="Ingresa tu usuario"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Company Tax ID Field */}
              <div className="group">
                <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider">
                  NIT/RUC Empresa
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'company_tax_id' ? 'transform scale-[1.01]' : ''
                }`}>
                  <Building2 className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                    focusedField === 'company_tax_id' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    name="company_tax_id"
                    value={formData.company_tax_id}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('company_tax_id')}
                    onBlur={() => setFocusedField('')}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm outline-none"
                    placeholder="123456789-0"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'password' ? 'transform scale-[1.01]' : ''
                }`}>
                  <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                    focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm outline-none"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 outline-none"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg focus:ring-4 focus:ring-blue-200 disabled:transform-none disabled:shadow-none outline-none"
                >
                  <div className="flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                        <span>Iniciando sesión...</span>
                      </>
                    ) : (
                      <>
                        <span>Iniciar Sesión</span>
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="text-center pt-2">
                <a 
                  href="#" 
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200 font-medium outline-none focus:text-gray-700"
                  tabIndex={isLoading ? -1 : 0}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400 font-light">
            © 2024 ERP System • Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}