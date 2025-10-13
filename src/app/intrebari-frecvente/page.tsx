import { redirect } from 'next/navigation';

// Force dynamic rendering for redirects
export const dynamic = 'force-dynamic';

export default function Page() { 
  redirect('/info/intrebari-frecvente'); 
}