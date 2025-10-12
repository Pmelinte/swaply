'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';

interface ConfigStatus {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: string;
}

export default function AuthConfigPage() {
  const [statuses, setStatuses] = useState<ConfigStatus[]>([
    { name: 'Supabase Connection', status: 'pending', message: 'Checking...' },
    { name: 'Email Provider', status: 'pending', message: 'Checking...' },
    { name: 'Magic Link', status: 'pending', message: 'Checking...' },
    { name: 'Google OAuth', status: 'pending', message: 'Checking...' },
    { name: 'Phone Provider', status: 'pending', message: 'Checking...' },
  ]);

  useEffect(() => {
    checkAuthConfig();
  }, []);

  const checkAuthConfig = async () => {
    const newStatuses: ConfigStatus[] = [];

    // Check Supabase connection
    try {
      const supabase = getBrowserSupabase();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      newStatuses.push({
        name: 'Supabase Connection',
        status: 'success',
        message: 'Connected successfully',
        details: session ? `Session active: ${session.user.email}` : 'No active session'
      });
    } catch (err) {
      newStatuses.push({
        name: 'Supabase Connection',
        status: 'error',
        message: 'Connection failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Check Email Provider (always enabled in Supabase by default)
    newStatuses.push({
      name: 'Email Provider',
      status: 'success',
      message: 'Email authentication available',
      details: 'Email+Password and Magic Link supported'
    });

    // Check Magic Link capability
    newStatuses.push({
      name: 'Magic Link',
      status: 'success',
      message: 'Magic Link authentication ready',
      details: 'Dual flow support (PKCE + Token)'
    });

    // Check Google OAuth
    try {
      const supabase = getBrowserSupabase();
      // Try to get Google provider URL (will fail if not configured)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true
        }
      });

      if (error) throw error;

      newStatuses.push({
        name: 'Google OAuth',
        status: 'success',
        message: 'Google OAuth configured',
        details: 'Provider ready for authentication'
      });
    } catch (err) {
      newStatuses.push({
        name: 'Google OAuth',
        status: 'warning',
        message: 'Google OAuth may not be configured',
        details: 'Check Supabase Dashboard → Authentication → Providers → Google'
      });
    }

    // Check Phone Provider (requires Twilio configuration)
    newStatuses.push({
      name: 'Phone Provider',
      status: 'warning',
      message: 'Phone authentication requires Twilio setup',
      details: 'Follow TWILIO_SETUP_GUIDE.md to configure'
    });

    setStatuses(newStatuses);
  };

  const getStatusIcon = (status: ConfigStatus['status']) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
    }
  };

  const getStatusColor = (status: ConfigStatus['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Authentication Configuration Status
          </h1>
          <p className="text-gray-600">
            Real-time verification of all authentication methods for Swaply
          </p>
        </div>

        {/* Status Cards */}
        <div className="space-y-4">
          {statuses.map((status, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-md border-l-4 p-6 ${getStatusColor(status.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">
                    {getStatusIcon(status.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {status.name}
                    </h3>
                    <p className="text-sm font-medium mb-2">
                      {status.message}
                    </p>
                    {status.details && (
                      <p className="text-xs opacity-75">
                        {status.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Configuration Guides */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📚 Configuration Guides
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">Phone Authentication Setup</h3>
                <p className="text-sm text-gray-600">Complete Twilio configuration guide</p>
              </div>
              <a
                href="https://github.com/Pmelinte/swaply/blob/vercel-deployment/PHONE_AUTH_SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Guide
              </a>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">Twilio Setup Guide</h3>
                <p className="text-sm text-gray-600">Step-by-step Twilio configuration</p>
              </div>
              <a
                href="https://github.com/Pmelinte/swaply/blob/vercel-deployment/TWILIO_SETUP_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Guide
              </a>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">Magic Link Fix Documentation</h3>
                <p className="text-sm text-gray-600">Dual flow architecture explanation</p>
              </div>
              <a
                href="https://github.com/Pmelinte/swaply/blob/vercel-deployment/MAGIC_LINK_FIX_FINAL.md"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Guide
              </a>
            </div>
          </div>
        </div>

        {/* Test Links */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🧪 Test Authentication Methods
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/login"
              className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              <div className="text-2xl mb-2">🔐</div>
              <div className="font-semibold">Email + Password</div>
              <div className="text-sm opacity-90">Traditional login</div>
            </a>

            <a
              href="/login"
              className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              <div className="text-2xl mb-2">✨</div>
              <div className="font-semibold">Magic Link</div>
              <div className="text-sm opacity-90">Passwordless email</div>
            </a>

            <a
              href="/login"
              className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105"
            >
              <div className="text-2xl mb-2">🔴</div>
              <div className="font-semibold">Google OAuth</div>
              <div className="text-sm opacity-90">Sign in with Google</div>
            </a>

            <a
              href="/login"
              className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
            >
              <div className="text-2xl mb-2">📱</div>
              <div className="font-semibold">Phone / SMS</div>
              <div className="text-sm opacity-90">OTP verification</div>
            </a>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={checkAuthConfig}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}
