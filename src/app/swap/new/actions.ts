"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  category: z.string().max(60).optional(),
  location: z.string().max(120).optional(),
  images: z.string().optional(), // JSON string cu array de URL-uri
});

export async function createSwap(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    redirect("/swap/new?error=invalid");
  }

  const supabase = await getServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    redirect("/login?next=/swap/new");
  }

  const images = (() => {
    try {
      const arr = JSON.parse(parsed.data.images ?? "[]");
      return Array.isArray(arr) ? arr.slice(0, 6) : [];
    } catch {
      return [];
    }
  })();

  const payload = {
    user_id: user!.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    category: parsed.data.category ?? null,
    location: parsed.data.location ?? null,
    images,
  };

  const { error } = await supabase.from("swaps").insert(payload);
  if (error) {
    redirect("/swap/new?error=" + encodeURIComponent(error.message));
  }
  redirect("/");
}
