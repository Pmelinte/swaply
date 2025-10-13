import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { requestDataExport, requestDataDeletion, getConsentLog, updateConsent } from '@/lib/gdpr';

export default async function PrivacySettingsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const consents = await getConsentLog(user.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔒 Privacy & GDPR Settings
          </h1>
          <p className="text-gray-600">
            Manage your personal data and privacy preferences
          </p>
        </div>

        {/* Data Export */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📦</span> Export Your Data
          </h2>
          <p className="text-gray-600 mb-4">
            Request a complete copy of all your data stored on Swaply.
            You'll receive a download link via email within 48 hours.
          </p>
          <form action={async () => {
            'use server';
            await requestDataExport(user.id);
            redirect('/setari/privacy?success=export-requested');
          }}>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              📥 Request Data Export
            </button>
          </form>
        </div>

        {/* Data Deletion */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-red-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🗑️</span> Delete Your Account
          </h2>
          <p className="text-gray-600 mb-4">
            Permanently delete your account and all associated data.
            <strong className="text-red-600"> This action cannot be undone.</strong>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Your name will be replaced with "Deleted User" and your email will be anonymized.
            All personal information will be permanently removed.
          </p>
          <form action={async (formData: FormData) => {
            'use server';
            const confirmationCode = formData.get('confirmation_code') as string;
            await requestDataDeletion(user.id, confirmationCode);
            redirect('/logout');
          }}>
            <div className="mb-4">
              <label htmlFor="confirmation_code" className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE" to confirm
              </label>
              <input
                type="text"
                id="confirmation_code"
                name="confirmation_code"
                required
                placeholder="DELETE"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              🗑️ Delete My Account
            </button>
          </form>
        </div>

        {/* Consent Management */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚙️</span> Privacy Preferences
          </h2>
          <p className="text-gray-600 mb-6">
            Control how we use your data and communicate with you.
          </p>

          <div className="space-y-4">
            {[
              { 
                type: 'marketing_emails', 
                title: '📧 Marketing Emails',
                description: 'Receive promotional emails and special offers'
              },
              { 
                type: 'analytics', 
                title: '📊 Analytics',
                description: 'Help us improve by sharing usage analytics'
              },
              { 
                type: 'third_party_sharing', 
                title: '🔗 Third-Party Sharing',
                description: 'Share data with trusted partners for better service'
              },
              { 
                type: 'communications', 
                title: '💬 Communications',
                description: 'Receive notifications about swaps and messages'
              }
            ].map(({ type, title, description }) => {
              const consent = consents.find(c => c.consent_type === type);
              const isGranted = consent?.granted || false;

              return (
                <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <form action={async () => {
                    'use server';
                    await updateConsent(user.id, type, !isGranted);
                    redirect('/setari/privacy');
                  }}>
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        isGranted
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {isGranted ? '✓ Enabled' : '✗ Disabled'}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>

        {/* Consent History */}
        {consents.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span> Consent History
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consents.map((consent) => (
                    <tr key={consent.consent_type}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {consent.consent_type.replace(/_/g, ' ').toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          consent.granted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {consent.granted ? 'Granted' : 'Withdrawn'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(consent.consent_given_at).toLocaleDateString('ro-RO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
