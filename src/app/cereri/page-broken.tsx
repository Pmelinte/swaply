'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import SwapRequestModal from '@/components/SwapRequestModal';

interface SwapRequest {
  id: string;
  requested_item: {
    id: string;
    title: string;
    category: string;
    location: string;
    images: string[];
    exchange_preferences: any;
  };
  offered_item: {
    id: string;
    title: string;
    category: string;
    location: string;
    images: string[];
    exchange_preferences: any;
  };
  requester: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  owner: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  message: string;
  meeting_type: 'local' | 'travel' | 'courier';
  travel_suggestion?: any;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
}

export default function SwapRequestsPage() {
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadRequests();
    getCurrentUser();
  }, [filter, statusFilter]);

  const getCurrentUser = async () => {
    const supabase = getBrowserSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Check if swap_requests table exists
      let query = supabase
        .from('swap_requests')
        .select(`
          *,
          requested_item:objects!requested_item_id (
            id, title, category, location, images, exchange_preferences
          ),
          offered_item:objects!offered_item_id (
            id, title, category, location, images, exchange_preferences
          ),
          requester:user_profiles!requester_id (
            id, full_name, avatar_url
          ),
          owner:user_profiles!owner_id (
            id, full_name, avatar_url
          )
        `);

      // Apply user filter
      if (filter === 'received') {
        query = query.eq('owner_id', user.id);
      } else if (filter === 'sent') {
        query = query.eq('requester_id', user.id);
      } else {
        query = query.or(`owner_id.eq.${user.id},requester_id.eq.${user.id}`);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      if (error?.message?.includes('swap_requests')) {
        console.log('ℹ️ Swap requests table not yet created. Database setup needed.');
        setRequests([]); // Show empty state instead of error
      } else {
        console.error('Error loading swap requests:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const supabase = getBrowserSupabase();
      
      const { error } = await supabase
        .from('swap_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from('notifications')
          .insert([{
            user_id: request.requester.id,
            type: 'swap_response',
            title: newStatus === 'accepted' ? 'Cerere acceptată!' : 'Cerere respinsă',
            content: `Cererea pentru ${request.requested_item.title} a fost ${newStatus === 'accepted' ? 'acceptată' : 'respinsă'}`,
            metadata: { swap_request_id: requestId }
          }]);
      }

      loadRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Eroare la actualizarea cererii');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'În așteptare', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      accepted: { label: 'Acceptată', color: 'bg-green-100 text-green-800', icon: '✅' },
      rejected: { label: 'Respinsă', color: 'bg-red-100 text-red-800', icon: '❌' },
      completed: { label: 'Finalizată', color: 'bg-blue-100 text-blue-800', icon: '🎉' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'local': return '🤝';
      case 'travel': return '✈️';
      case 'courier': return '📦';
      default: return '🤝';
    }
  };

  const getMeetingTypeLabel = (type: string) => {
    switch (type) {
      case 'local': return 'Întâlnire locală';
      case 'travel': return 'Călătorie împreună';
      case 'courier': return 'Livrare curier';
      default: return 'Întâlnire locală';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Se încarcă cererile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📋 Cererile mele de schimb
        </h1>
        <p className="text-gray-600">
          Gestionează cererile de schimb primite și trimise
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* User Filter */}
          <div className="flex space-x-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toate ({requests.length})
            </button>
            <button
              onClick={() => setFilter('received')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'received' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Primite ({requests.filter(r => r.owner.id === currentUserId).length})
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'sent' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Trimise ({requests.filter(r => r.requester.id === currentUserId).length})
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toate statusurile</option>
              <option value="pending">În așteptare</option>
              <option value="accepted">Acceptate</option>
              <option value="rejected">Respinse</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => (
          <div 
            key={request.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  {request.requester.avatar_url ? (
                    <img 
                      src={request.requester.avatar_url} 
                      alt={request.requester.full_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-gray-600 text-lg">👤</span>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="font-semibold text-gray-900">
                    {request.owner.id === currentUserId ? (
                      <>
                        <span className="text-blue-600">{request.requester.full_name}</span> vrea să schimbe
                      </>
                    ) : (
                      <>
                        Ai cerut să schimbi cu <span className="text-blue-600">{request.owner.full_name}</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatDate(request.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {getStatusBadge(request.status)}
                <span className="text-lg">{getMeetingTypeIcon(request.meeting_type)}</span>
              </div>
            </div>

            {/* Swap Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Offered Item */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    {request.offered_item.images[0] ? (
                      <img 
                        src={request.offered_item.images[0]} 
                        alt={request.offered_item.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-500 text-xl">📦</span>
                    )}
                  </div>
                  <div className="font-medium text-sm">{request.offered_item.title}</div>
                  <div className="text-xs text-gray-600">{request.offered_item.location}</div>
                </div>

                {/* Arrow */}
                <div className="text-center">
                  <span className="text-2xl">⇄</span>
                  <div className="text-sm text-gray-600 mt-1">
                    {getMeetingTypeLabel(request.meeting_type)}
                  </div>
                </div>

                {/* Requested Item */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    {request.requested_item.images[0] ? (
                      <img 
                        src={request.requested_item.images[0]} 
                        alt={request.requested_item.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-500 text-xl">📦</span>
                    )}
                  </div>
                  <div className="font-medium text-sm">{request.requested_item.title}</div>
                  <div className="text-xs text-gray-600">{request.requested_item.location}</div>
                </div>
              </div>
            </div>

            {/* Message */}
            {request.message && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-800">{request.message}</div>
              </div>
            )}

            {/* Travel Suggestion */}
            {request.travel_suggestion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-600">✈️</span>
                  <span className="font-medium text-blue-800">Destinație propusă</span>
                </div>
                <div className="text-sm text-blue-700">
                  📍 {request.travel_suggestion.destination.city} • 
                  💰 {request.travel_suggestion.cost_estimate.total.min} - {request.travel_suggestion.cost_estimate.total.max} {request.travel_suggestion.cost_estimate.currency}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex space-x-3">
                {request.owner.id === currentUserId && request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(request.id, 'accepted')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      ✅ Acceptă
                    </button>
                    <button
                      onClick={() => handleStatusChange(request.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      ❌ Refuză
                    </button>
                  </>
                )}

                {request.status === 'accepted' && (
                  <button
                    onClick={() => {/* Navigate to chat */}}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    💬 Deschide chat
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedRequest(request)}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                👁️ Vezi detalii
              </button>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nu ai cereri de schimb
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'received' && 'Nu ai primit încă cereri de schimb pentru obiectele tale.'}
              {filter === 'sent' && 'Nu ai trimis încă cereri de schimb.'}
              {filter === 'all' && 'Nu ai cereri de schimb primite sau trimise.'}
            </p>
            <button
              onClick={() => {/* Navigate to browse */}}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔍 Explorează obiecte
            </button>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  📋 Detalii cerere schimb
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              {/* Request details content would go here */}
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">🚧</div>
                <p className="text-gray-600">
                  Detaliile complete vor fi implementate în următoarea versiune
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Închide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}