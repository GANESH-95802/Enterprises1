import { useState, useEffect } from 'react';
import { saasService } from '../services';
import { PageHeader, Card, Loading, Badge, Modal } from '../components/ui';
import { FiCreditCard, FiCheck, FiDownload, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const planFeatures = {
  free: ['100 AI requests/month', 'Basic agents', '1GB storage', '5 team members', '50 documents'],
  professional: ['5,000 AI requests/month', 'All AI agents', '10GB storage', '25 team members', '500 documents', 'Custom agents', 'Advanced analytics', 'API access'],
  enterprise: ['50,000 AI requests/month', 'All AI agents', '100GB storage', '1,000 team members', '10,000 documents', 'Custom agents', 'Advanced analytics', 'API access', 'SSO enabled', 'Priority support'],
};

export default function Billing() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orgRes, plansRes] = await Promise.allSettled([
        saasService.getMyOrganizations(),
        saasService.getPlans(),
      ]);
      if (orgRes.status === 'fulfilled') {
        const data = orgRes.value.data?.data || orgRes.value.data;
        const orgs = data?.organizations || [];
        setOrganizations(orgs);
        if (orgs.length > 0) {
          setSelectedOrg(orgs[0]);
          loadOrgBilling(orgs[0].id);
        }
      }
      if (plansRes.status === 'fulfilled') {
        const data = plansRes.value.data?.data || plansRes.value.data;
        setPlans(data?.plans || {});
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOrgBilling = async (orgId) => {
    try {
      const [subRes, invRes] = await Promise.allSettled([
        saasService.getSubscription(orgId),
        saasService.listInvoices(orgId, { limit: 20 }),
      ]);
      if (subRes.status === 'fulfilled') {
        const data = subRes.value.data?.data || subRes.value.data;
        setSubscription(data?.subscription || null);
      }
      if (invRes.status === 'fulfilled') {
        const data = invRes.value.data?.data || invRes.value.data;
        setInvoices(data?.invoices || []);
      }
    } catch {
      // Silent
    }
  };

  const handleChangePlan = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setChanging(true);
    try {
      await saasService.changePlan(selectedOrg.id, {
        plan: selectedPlan,
        billingCycle,
      });
      toast.success('Subscription updated');
      setChangeOpen(false);
      loadOrgBilling(selectedOrg.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change plan');
    } finally {
      setChanging(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrg) return;
    if (!window.confirm('Cancel subscription? You will lose access to paid features.')) return;
    try {
      await saasService.cancelSubscription(selectedOrg.id);
      toast.success('Subscription canceled');
      loadOrgBilling(selectedOrg.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cancel failed');
    }
  };

  if (loading) return <Loading text="Loading billing..." />;

  return (
    <div>
      <PageHeader
        title="Billing & Subscription"
        subtitle="Manage your plan, invoices, and billing"
        actions={
          selectedOrg && (
            <button className="btn btn-primary" onClick={() => setChangeOpen(true)}>
              <FiRefreshCw /> Change Plan
            </button>
          )
        }
      />

      {!selectedOrg ? (
        <Card>
          <div className="table-empty">
            <FiCreditCard size={48} />
            <h3>No organization registered</h3>
            <p>Register your company to manage billing</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-3" style={{ marginBottom: 24 }}>
            {Object.entries(plans).map(([key, plan]) => (
              <Card key={key} className={`pricing-card ${subscription?.plan === key ? 'active' : ''}`}>
                <h3>{plan.name}</h3>
                <div className="pricing-price">
                  <span className="price">${plan.price}</span>
                  <span className="period">/month</span>
                </div>
                <ul className="pricing-features">
                  {(planFeatures[key] || []).map((feature) => (
                    <li key={feature}><FiCheck /> {feature}</li>
                  ))}
                </ul>
                {subscription?.plan === key && (
                  <Badge variant="success">Current Plan</Badge>
                )}
              </Card>
            ))}
          </div>

          <div className="grid grid-2" style={{ marginBottom: 24 }}>
            <Card>
              <h3 className="card-title">Current Subscription</h3>
              {subscription ? (
                <div>
                  <div className="subscription-info">
                    <Badge variant={subscription.status === 'active' ? 'success' : 'warning'}>
                      {subscription.status}
                    </Badge>
                    <h4>{subscription.plan} Plan</h4>
                    <p>${subscription.price}/month ({subscription.billingCycle})</p>
                    <p>Payment: {subscription.paymentStatus}</p>
                    <p>Expires: {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'Never'}</p>
                  </div>
                  {subscription.plan !== 'free' && (
                    <button className="btn btn-danger btn-sm" onClick={handleCancel}>
                      Cancel Subscription
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-empty">No subscription found</div>
              )}
            </Card>

            <Card>
              <h3 className="card-title">Invoices</h3>
              <div className="invoice-list">
                {invoices.length === 0 && <div className="table-empty">No invoices yet</div>}
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="invoice-item">
                    <div className="invoice-info">
                      <strong>{invoice.invoiceNumber}</strong>
                      <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="invoice-amount">
                      <strong>${invoice.totalAmount}</strong>
                      <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'neutral'}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      <Modal open={changeOpen} onClose={() => setChangeOpen(false)} title="Change Subscription Plan">
        <form onSubmit={handleChangePlan}>
          <div className="form-group">
            <label className="form-label">Select Plan</label>
            <select
              className="form-select"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              <option value="free">Free - $0/month</option>
              <option value="professional">Professional - $49/month</option>
              <option value="enterprise">Enterprise - $199/month</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Billing Cycle</label>
            <select
              className="form-select"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly (2 months free)</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setChangeOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={changing}>
              {changing ? 'Updating...' : 'Update Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}