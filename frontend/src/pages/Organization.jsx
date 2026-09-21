import { useState, useEffect } from 'react';
import { saasService } from '../services';
import { PageHeader, Card, Loading, Badge, FormField, Modal } from '../components/ui';
import { FiHome, FiUsers, FiDollarSign, FiActivity, FiPlus, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Organization() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [team, setTeam] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ companyName: '', industry: '', description: '', size: 'small' });
  const [editForm, setEditForm] = useState({ companyName: '', industry: '', description: '', size: 'small' });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });

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
        loadOrgDetails(orgs[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOrgDetails = async (orgId) => {
    try {
      const [subRes, teamRes, usageRes] = await Promise.allSettled([
        saasService.getSubscription(orgId),
        saasService.getTeam(orgId),
        saasService.getUsage(orgId),
      ]);
      if (subRes.status === 'fulfilled') {
        const data = subRes.value.data?.data || subRes.value.data;
        setSubscription(data?.subscription || null);
      }
      if (teamRes.status === 'fulfilled') {
        const data = teamRes.value.data?.data || teamRes.value.data;
        setTeam(data?.members || []);
      }
      if (usageRes.status === 'fulfilled') {
        const data = usageRes.value.data?.data || usageRes.value.data;
        setUsage(data);
      }
    } catch {
      // Silent
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }
    setRegistering(true);
    try {
      await saasService.registerOrganization(form);
      toast.success('Organization registered successfully');
      setRegisterOpen(false);
      setForm({ companyName: '', industry: '', description: '', size: 'small' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      await saasService.updateOrganization(selectedOrg.id, editForm);
      toast.success('Organization updated');
      setEditOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!selectedOrg || !inviteForm.email.trim()) return;
    try {
      await saasService.inviteMember(selectedOrg.id, inviteForm);
      toast.success('Invitation sent');
      setInviteOpen(false);
      setInviteForm({ email: '', role: 'member' });
      loadOrgDetails(selectedOrg.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invite failed');
    }
  };

  const openEdit = () => {
    if (!selectedOrg) return;
    setEditForm({
      companyName: selectedOrg.companyName || '',
      industry: selectedOrg.industry || '',
      description: selectedOrg.description || '',
      size: selectedOrg.size || 'small',
    });
    setEditOpen(true);
  };

  if (loading) return <Loading text="Loading organization..." />;

  return (
    <div>
      <PageHeader
        title="Organization"
        subtitle="Manage your company, team, subscription, and usage"
        actions={
          organizations.length === 0 ? (
            <button className="btn btn-primary" onClick={() => setRegisterOpen(true)}>
              <FiPlus /> Register Company
            </button>
          ) : (
            <button className="btn btn-outline" onClick={openEdit}>
              <FiEdit2 /> Edit Profile
            </button>
          )
        }
      />

      {organizations.length === 0 ? (
        <Card>
          <div className="table-empty">
            <FiHome size={48} />
            <h3>No organization registered</h3>
            <p>Register your company to start using the SaaS platform</p>
            <button className="btn btn-primary" onClick={() => setRegisterOpen(true)}>
              <FiPlus /> Register Company
            </button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: '#2563eb15', color: '#2563eb' }}><FiHome /></div>
              <div className="stat-info">
                <h3>{selectedOrg?.companyName || '—'}</h3>
                <p>{selectedOrg?.industry || 'No industry'}</p>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}><FiUsers /></div>
              <div className="stat-info">
                <h3>{team.length}</h3>
                <p>Team Members</p>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><FiDollarSign /></div>
              <div className="stat-info">
                <h3>{subscription?.plan || 'free'}</h3>
                <p>Subscription Plan</p>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: '#8b5cf615', color: '#8b5cf6' }}><FiActivity /></div>
              <div className="stat-info">
                <h3>{usage?.usage?.aiRequests || 0}</h3>
                <p>AI Requests</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-2" style={{ marginBottom: 24 }}>
            <Card>
              <h3 className="card-title">Subscription</h3>
              {subscription ? (
                <div>
                  <div className="subscription-info">
                    <Badge variant={subscription.status === 'active' ? 'success' : 'warning'}>
                      {subscription.status}
                    </Badge>
                    <h4>{subscription.plan} Plan</h4>
                    <p>${subscription.price}/month</p>
                    <p>Expires: {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'Never'}</p>
                  </div>
                  <div className="usage-limits">
                    <div className="usage-limit-item">
                      <span>AI Requests: {usage?.usage?.aiRequests || 0}/{usage?.limits?.aiRequestsPerMonth || 0}</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${usage?.usagePercentages?.aiRequests || 0}%` }} />
                      </div>
                    </div>
                    <div className="usage-limit-item">
                      <span>Tokens: {usage?.usage?.tokensUsed || 0}/{usage?.limits?.tokensPerMonth || 0}</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${usage?.usagePercentages?.tokens || 0}%` }} />
                      </div>
                    </div>
                    <div className="usage-limit-item">
                      <span>Storage: {Math.round((usage?.usage?.storageBytes || 0) / (1024 * 1024))}MB/{usage?.limits?.storageMb || 0}MB</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${usage?.usagePercentages?.storage || 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="table-empty">No subscription found</div>
              )}
            </Card>

            <Card>
              <h3 className="card-title">Team Members</h3>
              <div className="team-list">
                {team.length === 0 && <div className="table-empty">No team members</div>}
                {team.map((member) => (
                  <div key={member.id} className="team-member-item">
                    <div className="team-member-avatar">
                      {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="team-member-info">
                      <strong>{member.user?.name || 'Unknown'}</strong>
                      <span>{member.user?.email || ''}</span>
                    </div>
                    <Badge variant={member.role === 'owner' ? 'success' : member.role === 'admin' ? 'info' : 'neutral'}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setInviteOpen(true)}>
                <FiPlus /> Invite Member
              </button>
            </Card>
          </div>
        </>
      )}

      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="Register Company">
        <form onSubmit={handleRegister}>
          <FormField label="Company Name" required>
            <input
              type="text"
              className="form-input"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Acme Corporation"
            />
          </FormField>
          <FormField label="Industry">
            <input
              type="text"
              className="form-input"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              placeholder="e.g. Technology, Finance, Healthcare"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className="form-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Company description"
              rows={3}
            />
          </FormField>
          <FormField label="Company Size">
            <select
              className="form-select"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            >
              <option value="small">Small (1-10)</option>
              <option value="medium">Medium (11-50)</option>
              <option value="large">Large (51-200)</option>
              <option value="enterprise">Enterprise (200+)</option>
            </select>
          </FormField>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setRegisterOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={registering}>
              {registering ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Organization">
        <form onSubmit={handleUpdate}>
          <FormField label="Company Name" required>
            <input
              type="text"
              className="form-input"
              value={editForm.companyName}
              onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
            />
          </FormField>
          <FormField label="Industry">
            <input
              type="text"
              className="form-input"
              value={editForm.industry}
              onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className="form-input"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
            />
          </FormField>
          <FormField label="Company Size">
            <select
              className="form-select"
              value={editForm.size}
              onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
            >
              <option value="small">Small (1-10)</option>
              <option value="medium">Medium (11-50)</option>
              <option value="large">Large (51-200)</option>
              <option value="enterprise">Enterprise (200+)</option>
            </select>
          </FormField>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setEditOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member">
        <form onSubmit={handleInvite}>
          <FormField label="Email" required>
            <input
              type="email"
              className="form-input"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="colleague@company.com"
            />
          </FormField>
          <FormField label="Role">
            <select
              className="form-select"
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </FormField>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setInviteOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Send Invitation</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}