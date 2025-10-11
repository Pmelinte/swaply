'use client';

import { useState, useEffect } from 'react';

const SwapRequestsPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading since we don't have the swap_requests table yet
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Cereri de schimb
          </h1>
          
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nu există cereri de schimb
            </h3>
            <p className="text-gray-500 mb-6">
              Database-ul este în curs de configurare. Tabelele pentru cereri de schimb vor fi disponibile în curând.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
              <h4 className="font-medium text-blue-900 mb-2">🔧 Status configurare:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Profiles - Disponibil</li>
                <li>✅ Objects - Disponibil</li>
                <li>✅ Messages - Disponibil</li>
                <li>⏳ Swap Requests - În configurare</li>
                <li>⏳ Categories - În configurare</li>
                <li>⏳ Notifications - În configurare</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapRequestsPage;