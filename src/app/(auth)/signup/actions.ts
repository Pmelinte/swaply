"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = getServerSupabase();

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