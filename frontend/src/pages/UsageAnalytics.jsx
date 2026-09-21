import { useState, useEffect } from 'react';
import { saasService } from '../services';
import { PageHeader, Card, Loading, Badge } from '../components/ui';
import { FiActivity, FiCpu, FiDollarSign, FiFileText, FiUsers, FiDatabase } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function UsageAnalytics() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await saasService.getMyOrganizations();
      const data = res.data?.data || res.data;
      const orgs = data?.organizations || [];
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setSelectedOrg(orgs[0]);
        loadUsage(orgs[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsage = async (orgId) => {
    try {
      const [usageRes, historyRes] = await Promise.allSettled([
        saasService.getUsage(orgId),
        saasService.getUsageHistory(orgId, { months: 6 }),
      ]);
      if (usageRes.status === 'fulfilled') {
        const data = usageRes.value.data?.data || usageRes.value.data;
        setUsage(data);
      }
      if (historyRes.status === 'fulfilled') {
        const data = historyRes.value.data?.data || historyRes.value.data;
        setHistory(data?.history || []);
      }
    } catch {
      toast.error('Failed to load usage data');
    }
  };

  if (loading) return <Loading text="Loading usage analytics..." />;

  const usageData = usage?.usage || {};
  const limits = usage?.limits || {};
  const percentages = usage?.usagePercentages || {};

  return (
    <div>
      <PageHeader
        title="Usage Analytics"
        subtitle="Track AI usage, costs, and performance"
      />

      {!selectedOrg ? (
        <Card>
          <div className="table-empty">
            <FiActivity size={48} />
            <h3>No organization registered</h3>
            <p>Register your company to view usage analytics</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: '#2563eb15', color: '#2563eb' }}><FiCpu /></div>
              <div className="stat-info">
                <h3>{usageData.aiRequests || 0}</h3>
                <p>AI Requests</p>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}><FiDollarSign /></div>
              <div className="stat-info">
                <h3>${(usageData.costEstimate || 0).toFixed(2)}</h3>
                <p>Estimated Cost</p>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><FiFileText /></div>
              <div className="stat-info">
                <h3>{usageData.documentsUploaded || 0}</h3>
                <p>Documents</p>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: '#8b5cf615', color: '#8b5cf6' }}><FiUsers /></div>
              <div className="stat-info">
                <h3>{usageData.activeUsers || 0}</h3>
                <p>Active Users</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-2" style={{ marginBottom: 24 }}>
            <Card>
              <h3 className="card-title">Usage Limits</h3>
              <div className="usage-limits">
                <div className="usage-limit-item">
                  <span>AI Requests: {usageData.aiRequests || 0}/{limits.aiRequestsPerMonth || 0}</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percentages.aiRequests || 0}%` }} />
                  </div>
                </div>
                <div className="usage-limit-item">
                  <span>Tokens: {usageData.tokensUsed || 0}/{limits.tokensPerMonth || 0}</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percentages.tokens || 0}%` }} />
                  </div>
                </div>
                <div className="usage-limit-item">
                  <span>Storage: {Math.round((usageData.storageBytes || 0) / (1024 * 1024))}MB/{limits.storageMb || 0}MB</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percentages.storage || 0}%` }} />
                  </div>
                </div>
              </div>
              {usage?.isOverLimit && (
                <div className="alert alert-warning" style={{ marginTop: 16 }}>
                  You have reached your usage limit. Upgrade your plan for more capacity.
                </div>
              )}
            </Card>

            <Card>
              <h3 className="card-title">Agent Usage</h3>
              <div className="agent-usage-list">
                {Object.entries(usageData.agentsByType || {}).length === 0 && (
                  <div className="table-empty">No agent usage yet</div>
                )}
                {Object.entries(usageData.agentsByType || {}).map(([type, count]) => (
                  <div key={type} className="agent-usage-item">
                    <Badge variant="info">{type}</Badge>
                    <span>{count} runs</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="card-title">Usage History (6 months)</h3>
            <div className="usage-history">
              {history.length === 0 && <div className="table-empty">No usage history</div>}
              {history.map((item) => (
                <div key={item.period} className="usage-history-item">
                  <div className="usage-history-period">
                    <strong>{item.period}</strong>
                  </div>
                  <div className="usage-history-stats">
                    <span><FiCpu /> {item.aiRequests || 0} requests</span>
                    <span><FiDatabase /> {item.tokensUsed || 0} tokens</span>
                    <span><FiDollarSign /> ${(item.costEstimate || 0).toFixed(2)}</span>
                    <span><FiUsers /> {item.activeUsers || 0} users</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}