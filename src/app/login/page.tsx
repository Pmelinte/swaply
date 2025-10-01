"use client";

import { getBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  async function signInWithGoogle() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/swap/new` },
    });
  }

  async function signInWithMagicLink(formData: FormData) {
    const email = String(formData.get("email") || "");
    const supabase = getBrowserSupabase();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/swap/new` },
    });
    alert("Verifică emailul pentru linkul de logare.");
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Autentificare</h1>

      <form action={signInWithMagicLink} className="space-y-2">
        <input
          type="email"
          name="email"
          required
          placeholder="email@exemplu.com"
          className="w-full border rounded px-3 py-2"
        />
        <button className="rounded bg-black text-white px-3 py-2" type="submit">
          Continuă prin email (magic link)
        </button>
      </form>

      <div>
        <button onClick={signInWithGoogle} className="rounded bg-gray-900 text-white px-3 py-2">
          Continuă cu Google
        </button>
      </div>
    </main>
  );
}
