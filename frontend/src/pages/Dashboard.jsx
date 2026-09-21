import { useState, useEffect } from 'react';
import { dashboardService, assistantService, knowledgeService, recommendationService, monitoringService } from '../services';
import { useAuth } from '../context/AuthContext';
import { PageHeader, StatCard, Card, Loading, Badge } from '../components/ui';
import { FiUsers, FiBriefcase, FiPackage, FiFileText, FiCpu, FiDatabase, FiThumbsUp, FiActivity } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [kbStats, setKbStats] = useState(null);
  const [recStats, setRecStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, chartsRes, aiRes, kbRes, recRes, healthRes] = await Promise.allSettled([
          dashboardService.getStats(),
          dashboardService.getCharts(),
          assistantService.getStats(),
          knowledgeService.getStats(),
          recommendationService.getStats(),
          monitoringService.getHealth(),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data || statsRes.value.data);
        if (chartsRes.status === 'fulfilled') setCharts(chartsRes.value.data?.data || chartsRes.value.data);
        if (aiRes.status === 'fulfilled') setAiStats(aiRes.value.data?.data?.stats || aiRes.value.data?.data);
        if (kbRes.status === 'fulfilled') setKbStats(kbRes.value.data?.data || kbRes.value.data);
        if (recRes.status === 'fulfilled') setRecStats(recRes.value.data?.data || recRes.value.data);
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data?.data || healthRes.value.data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <Loading text="Loading dashboard..." />;

  const counts = stats?.counts || {};
  const salesData = (charts?.sales || []).map((s) => ({
    name: `${s._id?.month}/${s._id?.year}`,
    revenue: s.totalRevenue || 0,
    quantity: s.totalQuantity || 0,
  }));

  const complianceData = (charts?.complianceStatus || []).map((c) => ({ name: c._id, value: c.count }));
  const projectData = (charts?.projectStatus || []).map((p) => ({ name: p._id, value: p.count }));

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name || 'User'}`}
        subtitle="Here's what's happening across your AI Enterprise Hub"
      />

      <div className="grid grid-4">
        <StatCard icon={FiUsers} label="Total Users" value={counts.users || 0} color="#2563eb" />
        <StatCard icon={FiBriefcase} label="Businesses" value={counts.businesses || 0} color="#10b981" />
        <StatCard icon={FiPackage} label="Products" value={counts.products || 0} color="#f59e0b" />
        <StatCard icon={FiFileText} label="Reports" value={counts.reports || 0} color="#8b5cf6" />
      </div>

      <div className="grid grid-4" style={{ marginTop: 24 }}>
        <StatCard icon={FiCpu} label="AI Conversations" value={aiStats?.totalConversations || aiStats?.conversations || 0} color="#06b6d4" />
        <StatCard icon={FiDatabase} label="Knowledge Docs" value={kbStats?.totalDocuments || kbStats?.documents || 0} color="#ec4899" />
        <StatCard icon={FiThumbsUp} label="Recommendations" value={recStats?.totalRecommendations || recStats?.recommendations || 0} color="#f97316" />
        <StatCard icon={FiActivity} label="System Status" value={health?.status === 'healthy' ? 'Healthy' : 'Checking'} color={health?.status === 'healthy' ? '#10b981' : '#f59e0b'} />
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <Card>
          <h3 className="card-title">Revenue Trend</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="quantity" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="card-title">Compliance Status</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={complianceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {complianceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <Card>
          <h3 className="card-title">Project Status</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="card-title">Recent Activity</h3>
          <div className="recent-list">
            {(stats?.recent?.users || []).slice(0, 5).map((u) => (
              <div key={u._id} className="recent-item">
                <div className="recent-avatar">{u.name?.charAt(0)?.toUpperCase()}</div>
                <div>
                  <div className="recent-title">{u.name}</div>
                  <div className="recent-sub">{u.email} · <Badge variant="info">{u.role}</Badge></div>
                </div>
              </div>
            ))}
            {(!stats?.recent?.users || stats.recent.users.length === 0) && (
              <div className="table-empty">No recent activity</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}