import { useState, useEffect } from 'react';
import { enterpriseService, dashboardService, monitoringService, analyticsService } from '../services';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, Loading, Badge, Table } from '../components/ui';
import { FiUsers, FiBriefcase, FiPackage, FiActivity, FiShield, FiCpu } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function Admin() {
  const { user, can } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, statsRes, healthRes] = await Promise.allSettled([
        enterpriseService.getAnalytics(),
        dashboardService.getStats(),
        monitoringService.getHealth(),
      ]);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data?.data || analyticsRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data || statsRes.value.data);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data?.data || healthRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Loading admin dashboard..." />;

  const totals = analytics?.totals || {};
  const activityTrend = (analytics?.activityTrend || []).map((a) => ({
    date: a._id,
    count: a.count,
  }));

  const recentActivities = analytics?.recentActivities || [];

  const activityColumns = [
    { key: 'user', label: 'User', render: (r) => r.user?.name || 'System' },
    { key: 'action', label: 'Action', render: (r) => <Badge variant="info">{r.action}</Badge> },
    { key: 'resource', label: 'Resource', render: (r) => r.resource || '—' },
    { key: 'createdAt', label: 'Time', render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Enterprise-wide system overview and management"
      />

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#2563eb15', color: '#2563eb' }}><FiUsers /></div>
          <div className="stat-info">
            <h3>{totals.users || 0}</h3>
            <p>Total Users</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}><FiBriefcase /></div>
          <div className="stat-info">
            <h3>{totals.businesses || 0}</h3>
            <p>Businesses</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><FiPackage /></div>
          <div className="stat-info">
            <h3>{totals.products || 0}</h3>
            <p>Products</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf615', color: '#8b5cf6' }}><FiActivity /></div>
          <div className="stat-info">
            <h3>{totals.activeUsers || 0}</h3>
            <p>Active Users</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <Card>
          <h3 className="card-title">Activity Trend</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="card-title">System Health</h3>
          <div className="metric-list">
            <div className="metric-item">
              <span>Status</span>
              <strong>{health?.status || 'Unknown'}</strong>
            </div>
            <div className="metric-item">
              <span>Uptime</span>
              <strong>{health?.uptime ? `${Math.floor(health.uptime / 3600)}h` : '—'}</strong>
            </div>
            <div className="metric-item">
              <span>Database</span>
              <strong>{health?.database?.state || health?.db || '—'}</strong>
            </div>
            <div className="metric-item">
              <span>Memory</span>
              <strong>{health?.memory?.heapUsedMB ? `${health.memory.heapUsedMB} MB` : '—'}</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="card-title">Recent Activities</h3>
        <Table columns={activityColumns} data={recentActivities} emptyMessage="No recent activities" />
      </Card>
    </div>
  );
}