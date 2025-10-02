import { signupUser } from './actions';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Creează un cont nou
        </h1>
        <form className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label
              htmlFor="email"
              className="mb-1 text-sm font-medium text-gray-600"
            >
              Adresa de e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="nume@exemplu.com"
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="password"
              className="mb-1 text-sm font-medium text-gray-600"
            >
              Parolă
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="rounded-md border border-gray-300 px-3 py-2 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum 6 caractere.
            </p>
          </div>
          <button
            formAction={signupUser}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Înregistrare
          </button>
        </form>
      </div>
    </div>
  );
}