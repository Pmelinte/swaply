import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { getModerationQueue, approveObject, rejectObject } from '@/lib/fraud';

export default async function ModerationQueuePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin (you'll need to implement this check)
  // For now, assuming any logged-in user can access
  
  const queue = await getModerationQueue({ status: 'pending', limit: 50 });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🛡️ Moderation Queue
          </h1>
          <p className="text-gray-600">
            Review flagged objects and fraud signals
          </p>
        </div>

        {queue.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              All Clear!
            </h3>
            <p className="text-gray-600">
              No items in moderation queue
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {item.object_title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Object ID: {item.object_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      item.priority_score >= 80 ? 'bg-red-100 text-red-800' :
                      item.priority_score >= 60 ? 'bg-orange-100 text-orange-800' :
                      item.priority_score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      Priority: {item.priority_score}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Fraud Signals:</h4>
                  <div className="space-y-2">
                    {item.signal_summary && typeof item.signal_summary === 'object' && 
                      Object.entries(item.signal_summary).map(([type, data]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <span className="text-sm font-medium text-gray-700">
                            {type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            data.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            data.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            data.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {data.severity}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="flex gap-3">
                  <form action={async () => {
                    'use server';
                    await reviewModerationItem(item.id, 'approved', user.id);
                    redirect('/admin/moderare');
                  }}>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      ✅ Approve
                    </button>
                  </form>

                  <form action={async () => {
                    'use server';
                    await reviewModerationItem(item.id, 'rejected', user.id);
                    redirect('/admin/moderare');
                  }}>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                    >
                      ❌ Reject
                    </button>
                  </form>

                  <form action={async () => {
                    'use server';
                    await reviewModerationItem(item.id, 'escalated', user.id);
                    redirect('/admin/moderare');
                  }}>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold"
                    >
                      ⚠️ Escalate
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
