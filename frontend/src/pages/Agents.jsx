import { useState, useEffect } from 'react';
import { agentService } from '../services';
import { PageHeader, Card, Loading, Badge, Modal, FormField } from '../components/ui';
import { FiCpu, FiBriefcase, FiShield, FiUsers, FiHeadphones, FiPlus, FiPlay, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const agentIcons = {
  business: FiBriefcase,
  compliance: FiShield,
  hr: FiUsers,
  'customer-support': FiHeadphones,
  custom: FiCpu,
};

const agentColors = {
  business: '#2563eb',
  compliance: '#10b981',
  hr: '#f59e0b',
  'customer-support': '#8b5cf6',
  custom: '#6b7280',
};

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'custom', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [agentsRes, typesRes] = await Promise.allSettled([
        agentService.listAgents({ limit: 50 }),
        agentService.getAgentTypes(),
      ]);
      if (agentsRes.status === 'fulfilled') {
        const data = agentsRes.value.data?.data || agentsRes.value.data;
        setAgents(data?.agents || data?.items || []);
      }
      if (typesRes.status === 'fulfilled') {
        const data = typesRes.value.data?.data || typesRes.value.data;
        setTypes(data?.types || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.type) {
      toast.error('Name and type are required');
      return;
    }
    setCreating(true);
    try {
      await agentService.createAgent({
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim(),
      });
      toast.success('Agent created successfully');
      setCreateOpen(false);
      setForm({ name: '', type: 'custom', description: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  const handleRun = (agent) => {
    navigate(`/agents/${agent.id}/chat`);
  };

  const handleDelete = async (agent) => {
    if (!window.confirm(`Delete agent "${agent.name}"?`)) return;
    try {
      await agentService.deleteAgent(agent.id);
      toast.success('Agent deleted');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <Loading text="Loading AI agents..." />;

  return (
    <div>
      <PageHeader
        title="AI Agents"
        subtitle="Enterprise AI Agent Operating System"
        actions={
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <FiPlus /> Create Agent
          </button>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#2563eb15', color: '#2563eb' }}><FiCpu /></div>
          <div className="stat-info">
            <h3>{agents.length}</h3>
            <p>Total Agents</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}><FiPlay /></div>
          <div className="stat-info">
            <h3>{agents.filter((a) => a.status === 'active').length}</h3>
            <p>Active Agents</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><FiMessageSquare /></div>
          <div className="stat-info">
            <h3>{agents.reduce((sum, a) => sum + (a.stats?.totalRuns || 0), 0)}</h3>
            <p>Total Runs</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf615', color: '#8b5cf6' }}><FiShield /></div>
          <div className="stat-info">
            <h3>{types.length}</h3>
            <p>Agent Types</p>
          </div>
        </Card>
      </div>

      <div className="agent-grid">
        {agents.length === 0 && (
          <Card>
            <div className="table-empty">
              No agents found. Click "Create Agent" to get started.
            </div>
          </Card>
        )}
        {agents.map((agent) => {
          const Icon = agentIcons[agent.type] || FiCpu;
          const color = agentColors[agent.type] || '#6b7280';
          return (
            <Card key={agent.id} className="agent-card">
              <div className="agent-card-header">
                <div className="agent-icon" style={{ background: `${color}15`, color }}>
                  <Icon />
                </div>
                <div className="agent-card-info">
                  <h3>{agent.name}</h3>
                  <Badge variant={agent.status === 'active' ? 'success' : agent.status === 'paused' ? 'warning' : 'neutral'}>
                    {agent.status}
                  </Badge>
                </div>
              </div>
              <p className="agent-description">{agent.description || 'No description'}</p>
              <div className="agent-capabilities">
                {(agent.configuration?.capabilities || []).slice(0, 3).map((cap) => (
                  <Badge key={cap} variant="info">{cap}</Badge>
                ))}
              </div>
              <div className="agent-stats">
                <span>{agent.stats?.totalRuns || 0} runs</span>
                <span>{agent.stats?.totalTokens || 0} tokens</span>
                <span>{agent.stats?.avgLatencyMs || 0}ms avg</span>
              </div>
              <div className="agent-actions">
                <button className="btn btn-primary btn-sm" onClick={() => handleRun(agent)}>
                  <FiPlay /> Start Chat
                </button>
                {!agent.isSystem && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(agent)}>
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create AI Agent">
        <form onSubmit={handleCreate}>
          <FormField label="Agent Name" required>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sales Analysis Agent"
            />
          </FormField>
          <FormField label="Agent Type" required>
            <select
              className="form-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {types.map((t) => (
                <option key={t.type} value={t.type}>{t.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Description">
            <textarea
              className="form-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what this agent does"
              rows={3}
            />
          </FormField>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}