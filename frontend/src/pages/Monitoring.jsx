import { useState, useEffect } from 'react';
import { monitoringService } from '../services';
import { PageHeader, Card, Loading, Badge } from '../components/ui';
import { FiActivity, FiCpu, FiDatabase, FiShield, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Monitoring() {
  const [health, setHealth] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [securityAudit, setSecurityAudit] = useState(null);
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [healthRes, perfRes, auditRes, errorsRes] = await Promise.allSettled([
        monitoringService.getHealth(),
        monitoringService.getPerformance(),
        monitoringService.getSecurityAudit(),
        monitoringService.getErrorStats(),
      ]);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data?.data || healthRes.value.data);
      if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data?.data || perfRes.value.data);
      if (auditRes.status === 'fulfilled') setSecurityAudit(auditRes.value.data?.data || auditRes.value.data);
      if (errorsRes.status === 'fulfilled') setErrors(errorsRes.value.data?.data || errorsRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    setRunningAudit(true);
    try {
      const res = await monitoringService.runSecurityAudit();
      setSecurityAudit(res.data?.data || res.data);
      toast.success('Security audit completed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Audit failed');
    } finally {
      setRunningAudit(false);
    }
  };

  if (loading) return <Loading text="Loading monitoring data..." />;

  const isHealthy = health?.status === 'healthy' || health?.status === 'ok';
  const mem = performance?.memory || {};
  const proc = performance?.process || {};
  const db = performance?.database || {};

  return (
    <div>
      <PageHeader
        title="Monitoring Dashboard"
        subtitle="System health, performance, and security monitoring"
        actions={
          <button className="btn btn-outline" onClick={runAudit} disabled={runningAudit}>
            <FiRefreshCw /> {runningAudit ? 'Running Audit...' : 'Run Security Audit'}
          </button>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: isHealthy ? '#10b98115' : '#ef444415', color: isHealthy ? '#10b981' : '#ef4444' }}><FiActivity /></div>
          <div className="stat-info">
            <h3>{isHealthy ? 'Healthy' : 'Unhealthy'}</h3>
            <p>System Status</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#2563eb15', color: '#2563eb' }}><FiCpu /></div>
          <div className="stat-info">
            <h3>{proc.uptime ? `${Math.floor(proc.uptime / 60)}m` : '—'}</h3>
            <p>Uptime</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><FiDatabase /></div>
          <div className="stat-info">
            <h3>{db.state || '—'}</h3>
            <p>Database</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#ef444415', color: '#ef4444' }}><FiAlertTriangle /></div>
          <div className="stat-info">
            <h3>{errors?.totalErrors || 0}</h3>
            <p>Errors (24h)</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <Card>
          <h3 className="card-title">Memory Usage</h3>
          <div className="metric-list">
            <div className="metric-item">
              <span>Heap Used</span>
              <strong>{mem.heapUsedMB || 0} MB</strong>
            </div>
            <div className="metric-item">
              <span>Heap Total</span>
              <strong>{mem.heapTotalMB || 0} MB</strong>
            </div>
            <div className="metric-item">
              <span>RSS</span>
              <strong>{mem.rssMB || 0} MB</strong>
            </div>
            <div className="metric-item">
              <span>External</span>
              <strong>{mem.externalMB || 0} MB</strong>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="card-title">Process Info</h3>
          <div className="metric-list">
            <div className="metric-item">
              <span>PID</span>
              <strong>{proc.pid || '—'}</strong>
            </div>
            <div className="metric-item">
              <span>Node Version</span>
              <strong>{proc.nodeVersion || '—'}</strong>
            </div>
            <div className="metric-item">
              <span>Platform</span>
              <strong>{proc.platform || '—'}</strong>
            </div>
            <div className="metric-item">
              <span>Architecture</span>
              <strong>{proc.arch || '—'}</strong>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card>
          <h3 className="card-title">Security Audit</h3>
          {securityAudit ? (
            <div className="audit-result">
              <div className="audit-score">
                <strong>{securityAudit.score || securityAudit.overallScore || '—'}</strong>
                <span>/ 100</span>
              </div>
              <div className="audit-checks">
                {(securityAudit.checks || securityAudit.results || []).map((check, i) => (
                  <div key={i} className="audit-check">
                    <Badge variant={check.passed ? 'success' : 'danger'}>
                      {check.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                    <span>{check.name || check.check || 'Check'}</span>
                  </div>
                ))}
                {(!securityAudit.checks || securityAudit.checks.length === 0) && (
                  <div className="table-empty">No audit results available</div>
                )}
              </div>
            </div>
          ) : (
            <div className="table-empty">No security audit has been run yet</div>
          )}
        </Card>

        <Card>
          <h3 className="card-title">Recent Errors</h3>
          <div className="error-list">
            {(errors?.recentErrors || []).map((err) => (
              <div key={err.id} className="error-item">
                <Badge variant="danger">{err.action || 'error'}</Badge>
                <div>
                  <strong>{err.resource || 'Unknown'}</strong>
                  <p>{err.error || 'No error message'}</p>
                  <small>{new Date(err.timestamp).toLocaleString()}</small>
                </div>
              </div>
            ))}
            {(!errors?.recentErrors || errors.recentErrors.length === 0) && (
              <div className="table-empty">No errors in the last 24 hours</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}