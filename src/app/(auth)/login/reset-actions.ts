"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function resetPassword(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    
    if (!email) {
      return redirect('/login?error=' + encodeURIComponent('Email-ul este obligatoriu'));
    }

    const supabase = await getServerSupabase();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return redirect('/login?error=' + encodeURIComponent('A apărut o eroare. Verifică email-ul și încearcă din nou.'));
    }

    return redirect('/login?success=' + encodeURIComponent('Link de resetare trimis pe email! Verifică inbox-ul.'));
    
  } catch (error) {
    console.error('Unexpected reset password error:', error);
    return redirect('/login?error=' + encodeURIComponent('A apărut o eroare neașteptată. Încearcă din nou.'));
  }
}