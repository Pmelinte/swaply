import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { hasCompletedOnboarding } from '@/lib/personalization';
import ColdStartWizard from '@/components/ColdStartWizard';

export default async function OnboardingPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user already completed onboarding
  const completed = await hasCompletedOnboarding(user.id);
  if (completed) {
    redirect('/obiecte');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ColdStartWizard
        userId={user.id}
        onComplete={() => {
          // Redirect handled by ColdStartWizard
          window.location.href = '/obiecte';
        }}
        onSkip={() => {
          window.location.href = '/obiecte';
        }}
      />
    </div>
  );
}
