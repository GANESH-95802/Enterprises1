import { useState, useEffect } from 'react';
import { analyticsService, assistantService, knowledgeService, recommendationService } from '../services';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, Loading, Badge } from '../components/ui';
import { FiCpu, FiTrendingUp, FiActivity, FiMessageSquare, FiThumbsUp, FiDatabase } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Analytics() {
  const { user } = useAuth();
  const [aiUsage, setAiUsage] = useState(null);
  const [aiPerf, setAiPerf] = useState(null);
  const [insights, setInsights] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [trends, setTrends] = useState(null);
  const [conversations, setConversations] = useState(null);
  const [recAnalytics, setRecAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usageRes, perfRes, insightsRes, predRes, trendsRes, convRes, recRes] = await Promise.allSettled([
        analyticsService.getAIUsage(),
        analyticsService.getAIPerformance(),
        analyticsService.generateInsights(),
        analyticsService.getPredictions(),
        analyticsService.getTrends(),
        analyticsService.getConversationInsights(),
        analyticsService.getRecommendationAnalytics(),
      ]);
      if (usageRes.status === 'fulfilled') setAiUsage(usageRes.value.data?.data || usageRes.value.data);
      if (perfRes.status === 'fulfilled') setAiPerf(perfRes.value.data?.data || perfRes.value.data);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data?.data || insightsRes.value.data);
      if (predRes.status === 'fulfilled') setPredictions(predRes.value.data?.data || predRes.value.data);
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data?.data || trendsRes.value.data);
      if (convRes.status === 'fulfilled') setConversations(convRes.value.data?.data || convRes.value.data);
      if (recRes.status === 'fulfilled') setRecAnalytics(recRes.value.data?.data || recRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Loading analytics..." />;

  // Build chart data from various sources
  const usageData = Array.isArray(aiUsage?.dailyUsage) ? aiUsage.dailyUsage : [];
  const perfData = Array.isArray(aiPerf?.performance) ? aiPerf.performance : [];
  const trendData = Array.isArray(trends?.trends) ? trends.trends : [];
  const convData = Array.isArray(conversations?.conversations) ? conversations.conversations : [];

  const insightList = insights?.insights || insights?.items || [];
  const predictionList = predictions?.predictions || predictions?.items || [];

  return (
    <div>
      <PageHeader
        title="Analytics Dashboard"
        subtitle="ML-powered insights, predictions, and performance metrics"
      />

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#2563eb15', color: '#2563eb' }}><FiCpu /></div>
          <div className="stat-info">
            <h3>{aiUsage?.totalRequests || aiUsage?.total || 0}</h3>
            <p>AI Requests</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}><FiActivity /></div>
          <div className="stat-info">
            <h3>{aiPerf?.avgLatency ? `${aiPerf.avgLatency.toFixed(0)}ms` : '—'}</h3>
            <p>Avg Latency</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><FiMessageSquare /></div>
          <div className="stat-info">
            <h3>{conversations?.totalConversations || 0}</h3>
            <p>Conversations</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf615', color: '#8b5cf6' }}><FiThumbsUp /></div>
          <div className="stat-info">
            <h3>{recAnalytics?.totalRecommendations || 0}</h3>
            <p>Recommendations</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <Card>
          <h3 className="card-title">AI Usage Trend</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="requests" stroke="#2563eb" fill="#2563eb20" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="card-title">AI Performance</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="successRate" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <Card>
          <h3 className="card-title">Trend Detection</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
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
          <h3 className="card-title">Conversation Insights</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={convData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {convData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card>
          <h3 className="card-title">AI Insights</h3>
          <div className="insight-list">
            {insightList.length === 0 && <div className="table-empty">No insights available</div>}
            {insightList.map((insight, i) => (
              <div key={i} className="insight-item">
                <FiTrendingUp />
                <div>
                  <strong>{insight.title || insight.type || 'Insight'}</strong>
                  <p>{insight.description || insight.message || insight.text}</p>
                  {insight.severity && <Badge variant={insight.severity === 'high' ? 'danger' : insight.severity === 'medium' ? 'warning' : 'success'}>{insight.severity}</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="card-title">Predictions</h3>
          <div className="insight-list">
            {predictionList.length === 0 && <div className="table-empty">No predictions available</div>}
            {predictionList.map((pred, i) => (
              <div key={i} className="insight-item">
                <FiActivity />
                <div>
                  <strong>{pred.title || pred.metric || 'Prediction'}</strong>
                  <p>{pred.description || pred.message || pred.text}</p>
                  {pred.confidence && <Badge variant="info">Confidence: {Math.round(pred.confidence * 100)}%</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}