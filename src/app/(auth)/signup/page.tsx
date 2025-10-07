export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Înregistrare</h1>
        <p className="text-gray-600 text-center mb-6">Creează-ți contul pentru a începe să faci schimburi</p>
        
        <div className="text-center text-gray-500">
          <p>Pagina de înregistrare va fi disponibilă în curând</p>
          <p className="mt-4">
            Ai deja cont?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Conectează-te aici
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
