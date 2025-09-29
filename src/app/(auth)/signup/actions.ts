'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Signup Error:', error);
    // Redirecționăm utilizatorul înapoi cu un mesaj de eroare
    return redirect('/signup?error=Could not authenticate user');
  }

  // Redirecționăm utilizatorul către o pagină care îi spune să verifice email-ul.
  return redirect('/login?message=Check email to continue sign in process');
}