'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import LevelProgressBar from '@/components/LevelProgressBar';
import BadgeShowcase from '@/components/BadgeShowcase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalObjects: number;
  totalSwaps: number;
  completedSwaps: number;
  pendingSwaps: number;
  averageRating: number | null;
  totalViews: number;
  favoriteCount: number;
}

interface SwapsByMonth {
  month: string;
  count: number;
}

interface ObjectsByCategory {
  category: string;
  count: number;
}

const CATEGORY_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export default function DashboardPage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalObjects: 0,
    totalSwaps: 0,
    completedSwaps: 0,
    pendingSwaps: 0,
    averageRating: null,
    totalViews: 0,
    favoriteCount: 0,
  });
  const [swapsByMonth, setSwapsByMonth] = useState<SwapsByMonth[]>([]);
  const [objectsByCategory, setObjectsByCategory] = useState<ObjectsByCategory[]>([]);
  const [recentObjects, setRecentObjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    setUserId(user.id);
    await loadDashboardData(user.id);
  };

  const loadDashboardData = async (uid: string) => {
    try {
      // Load basic stats
      const [objectsRes, swapsRes, ratingsRes] = await Promise.all([
        // Total objects
        supabase
          .from('objects')
          .select('id, category, created_at', { count: 'exact' })
          .eq('user_id', uid),
        
        // Total swaps
        supabase
          .from('swap_requests')
          .select('id, status, created_at', { count: 'exact' })
          .or(`requester_id.eq.${uid},owner_id.eq.${uid}`),
        
        // User level (includes average rating)
        supabase
          .from('user_levels')
          .select('average_rating')
          .eq('user_id', uid)
          .single(),
      ]);

      if (objectsRes.error) throw objectsRes.error;
      if (swapsRes.error) throw swapsRes.error;

      const objects = objectsRes.data || [];
      const swaps = swapsRes.data || [];
      const completedSwaps = swaps.filter(s => s.status === 'completed');
      const pendingSwaps = swaps.filter(s => s.status === 'pending');

      setStats({
        totalObjects: objects.length,
        totalSwaps: swaps.length,
        completedSwaps: completedSwaps.length,
        pendingSwaps: pendingSwaps.length,
        averageRating: ratingsRes.data?.average_rating || null,
        totalViews: 0, // Would need views tracking
        favoriteCount: 0, // Would need favorites tracking
      });

      // Process swaps by month (last 6 months)
      const monthlySwaps: Record<string, number> = {};
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleString(language === 'ro' ? 'ro-RO' : 'en-US', { 
          month: 'short',
          year: '2-digit'
        });
        monthlySwaps[monthKey] = 0;
      }

      completedSwaps.forEach(swap => {
        const date = new Date(swap.created_at);
        const monthKey = date.toLocaleString(language === 'ro' ? 'ro-RO' : 'en-US', {
          month: 'short',
          year: '2-digit'
        });
        if (monthKey in monthlySwaps) {
          monthlySwaps[monthKey]++;
        }
      });

      setSwapsByMonth(
        Object.entries(monthlySwaps).map(([month, count]) => ({ month, count }))
      );

      // Process objects by category
      const categoryCount: Record<string, number> = {};
      objects.forEach(obj => {
        const cat = obj.category || 'Altele';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      setObjectsByCategory(
        Object.entries(categoryCount)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
      );

      // Load recent objects
      const { data: recent } = await supabase
        .from('objects')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(4);

      setRecentObjects(recent || []);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'ro' ? 'Se încarcă dashboard-ul...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  if (!userId) return null;

  const successRate = stats.totalSwaps > 0 
    ? Math.round((stats.completedSwaps / stats.totalSwaps) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'ro' ? '📊 Dashboard-ul Meu' : '📊 My Dashboard'}
          </h1>
          <p className="text-gray-600">
            {language === 'ro' 
              ? 'Vizualizează statisticile și progresul tău'
              : 'View your statistics and progress'}
          </p>
        </div>

        {/* Level Progress */}
        <div className="mb-8">
          <LevelProgressBar userId={userId} showDetails={true} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Objects */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'ro' ? 'Obiecte Postate' : 'Objects Posted'}
                </p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalObjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                📦
              </div>
            </div>
          </div>

          {/* Total Swaps */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'ro' ? 'Schimburi Totale' : 'Total Swaps'}
                </p>
                <p className="text-3xl font-bold text-green-600">{stats.totalSwaps}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                🔄
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'ro' ? 'Rată de Succes' : 'Success Rate'}
                </p>
                <p className="text-3xl font-bold text-purple-600">{successRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                📈
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {language === 'ro' ? 'Rating Mediu' : 'Average Rating'}
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : '-'}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
                ⭐
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Swaps by Month */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {language === 'ro' ? 'Schimburi pe Lună' : 'Swaps per Month'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={swapsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name={language === 'ro' ? 'Schimburi' : 'Swaps'}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Objects by Category */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {language === 'ro' ? 'Obiecte pe Categorie' : 'Objects by Category'}
            </h3>
            {objectsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={objectsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => 
                      `${category} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {objectsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                {language === 'ro' ? 'Nu există obiecte încă' : 'No objects yet'}
              </div>
            )}
          </div>
        </div>

        {/* Recent Objects */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {language === 'ro' ? 'Obiecte Recente' : 'Recent Objects'}
            </h3>
            <a 
              href="/obiecte/mele" 
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {language === 'ro' ? 'Vezi toate' : 'View all'} →
            </a>
          </div>

          {recentObjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentObjects.map(obj => (
                <div 
                  key={obj.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/obiecte/${obj.id}`)}
                >
                  {obj.images && obj.images[0] && (
                    <img 
                      src={obj.images[0]} 
                      alt={obj.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h4 className="font-semibold text-gray-900 mb-1 truncate">
                    {obj.title}
                  </h4>
                  <p className="text-sm text-gray-600 truncate">
                    {obj.category}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(obj.created_at).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="mb-2">📦</p>
              <p>{language === 'ro' ? 'Nu ai obiecte încă' : 'No objects yet'}</p>
              <button
                onClick={() => router.push('/obiecte/nou')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {language === 'ro' ? 'Adaugă Primul Obiect' : 'Add First Object'}
              </button>
            </div>
          )}
        </div>

        {/* Badges Section */}
        <BadgeShowcase userId={userId} compact={true} />

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mt-8">
          <h3 className="text-xl font-bold mb-4">
            {language === 'ro' ? 'Acțiuni Rapide' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/obiecte/nou')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all"
            >
              <div className="text-2xl mb-2">➕</div>
              <p className="font-medium">
                {language === 'ro' ? 'Adaugă Obiect' : 'Add Object'}
              </p>
            </button>
            <button
              onClick={() => router.push('/cauta')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all"
            >
              <div className="text-2xl mb-2">🔍</div>
              <p className="font-medium">
                {language === 'ro' ? 'Caută Obiecte' : 'Search Objects'}
              </p>
            </button>
            <button
              onClick={() => router.push('/chat')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all"
            >
              <div className="text-2xl mb-2">💬</div>
              <p className="font-medium">
                {language === 'ro' ? 'Mesajele Mele' : 'My Messages'}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
