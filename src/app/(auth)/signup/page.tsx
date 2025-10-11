'use client';

import { useState, Suspense } from 'react';
import { signUp } from './actions';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (password !== confirmPassword) {
      setIsLoading(false);
      router.push('/signup?error=' + encodeURIComponent('Parolele nu se potrivesc'));
      return;
    }
    
    await signUp(formData);
    setIsLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/login?success=' + encodeURIComponent('Înregistrarea cu Google va fi disponibilă în curând'));
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔄</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Înregistrează-te pe Swaply
          </h1>
          <p className="text-gray-600">
            Creează-ți contul și începe să schimbi obiecte
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <div className="text-red-700 text-sm">
                <p>{error}</p>
                {error.includes('deja înregistrat') && (
                  <Link 
                    href="/login" 
                    className="inline-block mt-2 text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Conectează-te aici →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nume complet *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="ex: Ion Popescu"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="ex: ion@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Parola *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                required
                minLength={6}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Minim 6 caractere"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmă parola *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={6}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Repetă parola"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Locația ta
            </label>
            <select
              id="location"
              name="location"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">Alege orașul...</option>
              <option value="București">București</option>
              <option value="Cluj-Napoca">Cluj-Napoca</option>
              <option value="Timișoara">Timișoara</option>
              <option value="Iași">Iași</option>
              <option value="Constanța">Constanța</option>
              <option value="Craiova">Craiova</option>
              <option value="Brașov">Brașov</option>
              <option value="Galați">Galați</option>
              <option value="Ploiești">Ploiești</option>
              <option value="Oradea">Oradea</option>
              <option value="Altul">Altul</option>
            </select>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              required
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
              Sunt de acord cu{' '}
              <Link href="/termeni" className="text-blue-600 hover:underline">
                Termenii și Condițiile
              </Link>{' '}
              și{' '}
              <Link href="/confidentialitate" className="text-blue-600 hover:underline">
                Politica de Confidențialitate
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Se înregistrează...
              </div>
            ) : (
              '🚀 Creează Cont'
            )}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">sau</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Înregistrează-te cu Google
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Ai deja cont?{' '}
            <Link 
              href="/login" 
              className="text-blue-600 hover:underline font-medium"
            >
              Conectează-te aici
            </Link>
          </p>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">🎁 Ce vei putea face:</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Adaugi obiecte cu AI pricing automat</li>
            <li>• Găsești match-uri perfecte cu algoritm inteligent</li>
            <li>• Comunici direct cu alți utilizatori</li>
            <li>• Primești notificări pentru potriviri noi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}