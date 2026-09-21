import { useState, useEffect } from 'react';
import { recommendationService } from '../services';
import { PageHeader, Card, Loading, Badge } from '../components/ui';
import { FiThumbsUp, FiThumbsDown, FiStar, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [personalized, setPersonalized] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personalized');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recRes, perRes, histRes, statsRes, typesRes] = await Promise.allSettled([
        recommendationService.getRecommendations({ limit: 10 }),
        recommendationService.getPersonalized({ limit: 10 }),
        recommendationService.getHistory({ limit: 10 }),
        recommendationService.getStats(),
        recommendationService.getTypes(),
      ]);
      if (recRes.status === 'fulfilled') {
        const data = recRes.value.data?.data || recRes.value.data;
        setRecommendations(data?.recommendations || data?.items || []);
      }
      if (perRes.status === 'fulfilled') {
        const data = perRes.value.data?.data || perRes.value.data;
        setPersonalized(data?.recommendations || data?.items || []);
      }
      if (histRes.status === 'fulfilled') {
        const data = histRes.value.data?.data || histRes.value.data;
        setHistory(data?.history || data?.items || []);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data || statsRes.value.data);
      if (typesRes.status === 'fulfilled') {
        const data = typesRes.value.data?.data || typesRes.value.data;
        setTypes(data?.types || data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (recId, type, rating = null) => {
    try {
      await recommendationService.submitFeedback({
        recommendationId: recId,
        type,
        rating,
      });
      toast.success('Feedback submitted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  if (loading) return <Loading text="Loading recommendations..." />;

  const renderRecommendation = (rec, i) => (
    <Card key={rec._id || i} className="recommendation-card">
      <div className="recommendation-header">
        <div className="recommendation-icon">
          <FiThumbsUp />
        </div>
        <div>
          <h3>{rec.title || rec.name || 'Recommendation'}</h3>
          <div className="recommendation-meta">
            {rec.type && <Badge variant="info">{rec.type}</Badge>}
            {rec.category && <Badge variant="neutral">{rec.category}</Badge>}
            {rec.score && <Badge variant="success">Score: {Math.round(rec.score * 100)}%</Badge>}
          </div>
        </div>
      </div>
      {rec.description && <p className="recommendation-desc">{rec.description}</p>}
      {rec.reason && <p className="recommendation-reason"><FiTrendingUp /> {rec.reason}</p>}
      <div className="recommendation-actions">
        <button className="btn btn-sm btn-outline" onClick={() => handleFeedback(rec._id, 'like')}>
          <FiThumbsUp /> Like
        </button>
        <button className="btn btn-sm btn-outline" onClick={() => handleFeedback(rec._id, 'dislike')}>
          <FiThumbsDown /> Dislike
        </button>
        <button className="btn btn-sm btn-outline" onClick={() => handleFeedback(rec._id, 'rating', 5)}>
          <FiStar /> Rate
        </button>
      </div>
    </Card>
  );

  const tabs = [
    { id: 'personalized', label: 'Personalized' },
    { id: 'all', label: 'All' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div>
      <PageHeader
        title="Recommendation Center"
        subtitle="AI-powered recommendations tailored to you"
      />

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#2563eb15', color: '#2563eb' }}><FiThumbsUp /></div>
          <div className="stat-info">
            <h3>{stats?.totalRecommendations || 0}</h3>
            <p>Total</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}><FiThumbsUp /></div>
          <div className="stat-info">
            <h3>{stats?.totalLikes || 0}</h3>
            <p>Likes</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#ef444415', color: '#ef4444' }}><FiThumbsDown /></div>
          <div className="stat-info">
            <h3>{stats?.totalDislikes || 0}</h3>
            <p>Dislikes</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><FiStar /></div>
          <div className="stat-info">
            <h3>{stats?.avgRating ? stats.avgRating.toFixed(1) : '—'}</h3>
            <p>Avg Rating</p>
          </div>
        </Card>
      </div>

      <div className="tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="recommendations-grid" style={{ marginTop: 24 }}>
        {activeTab === 'personalized' && (
          personalized.length > 0 ? personalized.map(renderRecommendation) : <div className="table-empty">No personalized recommendations yet</div>
        )}
        {activeTab === 'all' && (
          recommendations.length > 0 ? recommendations.map(renderRecommendation) : <div className="table-empty">No recommendations available</div>
        )}
        {activeTab === 'history' && (
          history.length > 0 ? history.map(renderRecommendation) : <div className="table-empty">No recommendation history</div>
        )}
      </div>
    </div>
  );
}