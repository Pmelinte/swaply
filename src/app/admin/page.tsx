'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { getBrowserSupabase } from '@/lib/supabase/client';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Users,
  Package,
  RefreshCw,
  Star,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
} from 'lucide-react';

// Types
interface StatsOverview {
  total_users: number;
  new_users_this_week: number;
  new_users_this_month: number;
  active_users_this_week: number;
  available_objects: number;
  new_objects_this_week: number;
  total_objects: number;
  pending_swap_requests: number;
  accepted_swap_requests: number;
  completed_swaps_total: number;
  completed_swaps_this_week: number;
  completed_swaps_this_month: number;
  rejected_swap_requests: number;
  average_rating: number;
  total_reviews: number;
  reviews_this_week: number;
  unread_notifications: number;
  notifications_today: number;
}

interface SwapTrend {
  date: string;
  pending_count: number;
  accepted_count: number;
  completed_count: number;
  rejected_count: number;
  total_count: number;
}

interface CategoryDistribution {
  category: string;
  object_count: number;
  available_count: number;
  swapped_count: number;
  percentage: number;
}

interface TopUser {
  user_id: string;
  email: string;
  full_name: string;
  metric_value: number;
  metric_name: string;
}

interface GrowthMetric {
  metric_name: string;
  current_value: number;
  previous_value: number;
  growth_rate: number;
  growth_count: number;
}

interface RecentActivity {
  event_type: string;
  entity_id: string;
  description: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [swapTrends, setSwapTrends] = useState<SwapTrend[]>([]);
  const [categoryDist, setCategoryDist] = useState<CategoryDistribution[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetric[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getBrowserSupabase();

      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirect=/admin');
        return;
      }

      // Note: In production, add admin role check here
      // For now, any authenticated user can access (add admin flag to users table later)

      // Load all dashboard data in parallel
      const [
        statsResult,
        trendsResult,
        categoryResult,
        topUsersResult,
        growthResult,
        activityResult,
      ] = await Promise.all([
        // Stats overview
        supabase.from('admin_stats_overview').select('*').single(),

        // Swap trends (last 30 days)
        supabase.from('admin_swap_trends').select('*').order('date', { ascending: false }).limit(30),

        // Category distribution
        supabase.from('admin_category_distribution').select('*'),

        // Top rated users
        supabase.rpc('get_top_users', { metric_type: 'rating', limit_count: 10 }),

        // Growth metrics (last 30 days)
        supabase.rpc('get_growth_metrics', { period_days: 30 }),

        // Recent activity
        supabase.from('admin_recent_activity').select('*').limit(50),
      ]);

      // Handle errors
      if (statsResult.error) throw statsResult.error;
      if (trendsResult.error) throw trendsResult.error;
      if (categoryResult.error) throw categoryResult.error;
      if (topUsersResult.error) throw topUsersResult.error;
      if (growthResult.error) throw growthResult.error;
      if (activityResult.error) throw activityResult.error;

      // Set state
      setStats(statsResult.data);
      setSwapTrends(trendsResult.data || []);
      setCategoryDist(categoryResult.data || []);
      setTopUsers(topUsersResult.data || []);
      setGrowthMetrics(growthResult.data || []);
      setRecentActivity(activityResult.data || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform statistics and monitoring</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats.new_users_this_week} this week
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          {/* Available Objects */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available Objects</p>
                <p className="text-3xl font-bold text-gray-900">{stats.available_objects}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total_objects} total
                </p>
              </div>
              <Package className="w-12 h-12 text-green-500" />
            </div>
          </div>

          {/* Completed Swaps */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Swaps</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completed_swaps_total}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats.completed_swaps_this_week} this week
                </p>
              </div>
              <RefreshCw className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{stats.average_rating || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total_reviews} reviews
                </p>
              </div>
              <Star className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pending_swap_requests}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {stats.accepted_swap_requests} accepted
                </p>
              </div>
              <Clock className="w-12 h-12 text-purple-500" />
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active This Week</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active_users_this_week}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((stats.active_users_this_week / stats.total_users) * 100)}% of total
                </p>
              </div>
              <Activity className="w-12 h-12 text-teal-500" />
            </div>
          </div>

          {/* Growth Rate */}
          {growthMetrics.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Growth Metrics (30 days)</h3>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {growthMetrics.map((metric) => (
                  <div key={metric.metric_name} className="border-l-4 border-blue-500 pl-3">
                    <p className="text-sm text-gray-600">{metric.metric_name}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.current_value}</p>
                    <p
                      className={`text-xs mt-1 ${
                        metric.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {metric.growth_rate >= 0 ? '+' : ''}
                      {metric.growth_rate}% ({metric.growth_count >= 0 ? '+' : ''}
                      {metric.growth_count})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Swap Trends Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Swap Trends (30 days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={swapTrends.reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed_count" stroke="#10b981" name="Completed" />
                <Line type="monotone" dataKey="pending_count" stroke="#3b82f6" name="Pending" />
                <Line type="monotone" dataKey="accepted_count" stroke="#f59e0b" name="Accepted" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDist}
                  dataKey="object_count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.category} (${entry.percentage}%)`}
                >
                  {categoryDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Rated Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-semibold text-gray-900">
                          {user.metric_value.toFixed(2)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity.slice(0, 20).map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          activity.event_type === 'swap_completed'
                            ? 'bg-green-100 text-green-800'
                            : activity.event_type === 'user_signup'
                            ? 'bg-blue-100 text-blue-800'
                            : activity.event_type === 'object_created'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {activity.event_type.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">
                    {new Date(activity.timestamp).toLocaleDateString('ro-RO', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
