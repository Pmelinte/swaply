import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        error: "Not authenticated",
        users: null 
      });
    }

    // Only allow admin access (you can customize this check)
    const isAdmin = session.user.email === 'pmelinte@gmail.com';
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: "Access denied - admin only",
        currentUser: session.user.email 
      });
    }

    // Get all users (admin only)
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json({ error: error.message });
    }

    const userSummary = users.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      metadata: user.user_metadata
    }));

    return NextResponse.json({ 
      users: userSummary,
      count: users.users.length,
      searchEmail: 'pmelinte@gmail.com',
      found: users.users.find(u => u.email === 'pmelinte@gmail.com') || null
    });

  } catch (error) {
    return NextResponse.json({ 
      error: "Server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}