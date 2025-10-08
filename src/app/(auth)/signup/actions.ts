"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

// Schema pentru validarea datelor de înregistrare
const SignUpSchema = z.object({
  name: z.string().min(2, 'Numele trebuie să aibă minim 2 caractere').max(100, 'Numele este prea lung'),
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Parola trebuie să aibă minim 6 caractere').max(100, 'Parola este prea lungă'),
  confirmPassword: z.string(),
  location: z.string().optional(),
  terms: z.string().refine(val => val === 'on', 'Trebuie să accepți termenii și condițiile')
}).refine(data => data.password === data.confirmPassword, {
  message: "Parolele nu se potrivesc",
  path: ["confirmPassword"]
});

export async function signUp(formData: FormData) {
  try {
    // Convertesc FormData în obiect
    const rawData = Object.fromEntries(formData);
    
    // Validez datele
    const validationResult = SignUpSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ');
      return redirect(`/signup?error=${encodeURIComponent(errors)}`);
    }

    const { name, email, password, location } = validationResult.data;

    // Încerc să creez contul cu Supabase
    const supabase = await getServerSupabase();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          location: location || 'România',
          created_at: new Date().toISOString(),
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      
      // Mesaje de eroare prietenoase
      let errorMessage = 'A apărut o eroare la înregistrare';
      
      if (error.message.includes('already registered')) {
        errorMessage = 'Acest email este deja înregistrat. Încearcă să te conectezi.';
      } else if (error.message.includes('password')) {
        errorMessage = 'Parola nu îndeplinește cerințele. Încearcă o parolă mai puternică.';
      } else if (error.message.includes('email')) {
        errorMessage = 'Email-ul nu este valid. Verifică și încearcă din nou.';
      }
      
      return redirect(`/signup?error=${encodeURIComponent(errorMessage)}`);
    }

    // Succes! Redirectez la pagina de confirmare
    if (data.user && !data.user.email_confirmed_at) {
      return redirect(`/login?success=${encodeURIComponent('Cont creat cu succes! Verifică-ți email-ul pentru activare.')}`);
    }

    // Dacă email-ul este confirmat automat, redirectez la dashboard
    return redirect(`/?success=${encodeURIComponent('Bine ai venit pe Swaply! Contul tău a fost creat cu succes.')}`);

  } catch (error) {
    console.error('Unexpected signup error:', error);
    return redirect(`/signup?error=${encodeURIComponent('A apărut o eroare neașteptată. Încearcă din nou.')}`);
  }
}

// Funcție legacy pentru compatibilitate
export async function signupUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await getServerSupabase();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Signup Error:", error);
    return redirect("/signup?error=Could not authenticate user");
  }

  return redirect("/login?message=Check email to continue sign in process");
}