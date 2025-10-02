"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

// Schema pentru validarea datelor obiectului
const ObjectSchema = z.object({
  name: z.string().min(3, 'Numele trebuie să aibă minim 3 caractere').max(120, 'Numele este prea lung'),
  category: z.string().min(1, 'Categoria este obligatorie'),
  description: z.string().min(10, 'Descrierea trebuie să aibă minim 10 caractere').max(2000, 'Descrierea este prea lungă'),
  condition: z.string().min(1, 'Starea obiectului este obligatorie'),
  estimated_value: z.string().optional(),
  desired_items: z.string().min(5, 'Specifică ce vrei în schimb (minim 5 caractere)').max(1000, 'Textul este prea lung'),
  location: z.string().min(2, 'Locația este obligatorie').max(120, 'Locația este prea lungă'),
  exchange_local: z.string().optional(),
  exchange_courier: z.string().optional(),
  exchange_travel: z.string().optional(),
  images: z.string().optional(), // JSON string cu array de URL-uri Cloudinary
});

export async function addObject(formData: FormData) {
  try {
    // Convertesc FormData în obiect
    const rawData = Object.fromEntries(formData);
    
    // Procesez checkbox-urile pentru preferințele de schimb
    const exchangePreferences = {
      local: formData.has('exchange_local'),
      courier: formData.has('exchange_courier'),
      travel: formData.has('exchange_travel'),
    };

    // Validez datele
    const validationResult = ObjectSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ');
      return redirect(`/obiecte/nou?error=${encodeURIComponent(errors)}`);
    }

    // Verific utilizatorul autentificat
    const supabase = await getServerSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      return redirect('/login?next=/obiecte/nou&error=Trebuie să fii autentificat');
    }

    const user = userData.user;

    // Procesez imaginile (pentru moment folosesc array gol, voi implementa upload-ul Cloudinary ulterior)
    const images: string[] = [];
    
    // TODO: Implementare upload Cloudinary
    // const uploadedImages = await uploadImagesToCloudinary(formData.getAll('images'));
    // images.push(...uploadedImages);

    // Procesez valoarea estimată
    const estimatedValue = validationResult.data.estimated_value 
      ? parseFloat(validationResult.data.estimated_value) 
      : null;

    // Creez payload-ul pentru baza de date
    const objectData = {
      user_id: user.id,
      name: validationResult.data.name,
      category: validationResult.data.category,
      description: validationResult.data.description,
      condition: validationResult.data.condition,
      estimated_value: estimatedValue,
      desired_items: validationResult.data.desired_items,
      location: validationResult.data.location,
      exchange_preferences: exchangePreferences,
      images: images,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    // Salvez în baza de date
    const { data, error } = await supabase
      .from('objects')
      .insert([objectData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return redirect(`/obiecte/nou?error=${encodeURIComponent('Eroare la salvarea obiectului. Încearcă din nou.')}`);
    }

    // Redirect la pagina obiectului creat cu mesaj de succes
    return redirect(`/?success=${encodeURIComponent('Obiectul a fost adăugat cu succes!')}`);

  } catch (error) {
    console.error('Unexpected error:', error);
    return redirect(`/obiecte/nou?error=${encodeURIComponent('A apărut o eroare neașteptată. Încearcă din nou.')}`);
  }
}

// Funcție pentru upload imagini pe Cloudinary (va fi implementată)
async function uploadImagesToCloudinary(files: FormDataEntryValue[]): Promise<string[]> {
  const uploadedUrls: string[] = [];
  
  // TODO: Implementare efectivă upload Cloudinary
  // for (const file of files) {
  //   if (file instanceof File && file.size > 0) {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  //     
  //     const response = await fetch(
  //       `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
  //       { method: 'POST', body: formData }
  //     );
  //     
  //     const data = await response.json();
  //     if (data.secure_url) {
  //       uploadedUrls.push(data.secure_url);
  //     }
  //   }
  // }
  
  return uploadedUrls;
}