import { ChatInterface } from '@/components/ChatInterface';
import { getServerSupabase } from '@/lib/supabase/server';
impo              <ChatInterface
                swapRequestId={id}
                currentUserId={currentUser.id}
                otherUserId={otherUser.id}
                otherUserName={otherUserName}
                otherUserAvatar={otherUser.user_metadata?.avatar_url}
              />direct } from 'next/navigation';

interface ChatPageProps {
  params: Promise<{
    id: string; // swap_request_id
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  
  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData?.user) {
    redirect('/login?next=/chat/' + id);
  }

  const currentUser = userData.user;

  // Get swap request details
  const { data: swapRequest, error: swapError } = await supabase
    .from('swap_requests')
    .select(`
      *,
      requester:requester_id (
        id,
        email,
        user_profiles (
          display_name,
          avatar_url
        )
      ),
      owner:owner_id (
        id,
        email,
        user_profiles (
          display_name,
          avatar_url
        )
      ),
      requested_object:requested_object_id (
        id,
        name,
        images
      ),
      offered_object:offered_object_id (
        id,
        name,
        images
      )
    `)
    .eq('id', params.id)
    .single();

  if (swapError || !swapRequest) {
    redirect('/?error=Conversația nu a fost găsită');
  }

  // Check if current user is part of this swap
  const isRequester = swapRequest.requester_id === currentUser.id;
  const isOwner = swapRequest.owner_id === currentUser.id;

  if (!isRequester && !isOwner) {
    redirect('/?error=Nu ai acces la această conversație');
  }

  // Determine other user
  const otherUser = isRequester ? swapRequest.owner : swapRequest.requester;
  const otherUserName = otherUser.user_profiles?.display_name || otherUser.email || 'Utilizator necunoscut';
  const otherUserAvatar = otherUser.user_profiles?.avatar_url;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with swap details */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.history.back()}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                ← Înapoi
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Negociere schimb
                </h1>
                <p className="text-sm text-gray-600">
                  {swapRequest.requested_object.name}
                  {swapRequest.offered_object && (
                    <> ↔ {swapRequest.offered_object.name}</>
                  )}
                </p>
              </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              swapRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              swapRequest.status === 'accepted' ? 'bg-green-100 text-green-800' :
              swapRequest.status === 'declined' ? 'bg-red-100 text-red-800' :
              swapRequest.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {swapRequest.status === 'pending' && '⏳ În așteptare'}
              {swapRequest.status === 'accepted' && '✅ Acceptat'}
              {swapRequest.status === 'declined' && '❌ Refuzat'}
              {swapRequest.status === 'completed' && '🎉 Finalizat'}
              {swapRequest.status === 'cancelled' && '🚫 Anulat'}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="h-[calc(100vh-200px)]">
              <ChatInterface
                swapRequestId={params.id}
                currentUserId={currentUser.id}
                otherUserId={otherUser.id}
                otherUserName={otherUserName}
                otherUserAvatar={otherUserAvatar}
              />
            </div>
          </div>

          {/* Swap Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              {/* Requested Object */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">📦 Obiect cerut</h3>
                <div className="space-y-2">
                  <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    {swapRequest.requested_object.images?.length > 0 ? (
                      <img
                        src={swapRequest.requested_object.images[0]}
                        alt={swapRequest.requested_object.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900">
                    {swapRequest.requested_object.name}
                  </h4>
                </div>
              </div>

              {/* Offered Object */}
              {swapRequest.offered_object && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">🔄 Obiect oferit</h3>
                  <div className="space-y-2">
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      {swapRequest.offered_object.images?.length > 0 ? (
                        <img
                          src={swapRequest.offered_object.images[0]}
                          alt={swapRequest.offered_object.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900">
                      {swapRequest.offered_object.name}
                    </h4>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">⚡ Acțiuni rapide</h3>
                
                {swapRequest.status === 'pending' && isOwner && (
                  <div className="space-y-2">
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                      ✅ Acceptă schimbul
                    </button>
                    <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                      ❌ Refuză schimbul
                    </button>
                  </div>
                )}

                {swapRequest.status === 'accepted' && (
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    🎉 Marchează ca finalizat
                  </button>
                )}

                <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                  📋 Vezi detalii complete
                </button>
                
                <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                  ⚠️ Raportează problema
                </button>
              </div>

              {/* Travel Integration */}
              {swapRequest.meeting_type === 'travel' && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">✈️ Schimb cu vacanță</h3>
                  <p className="text-sm text-purple-800 mb-3">
                    Acest schimb include o vacanță la destinația convenită.
                  </p>
                  <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                    🗺️ Planifică călătoria
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}