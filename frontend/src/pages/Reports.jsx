import { useState, useEffect } from 'react';
import { reportService, chatbotService } from '../services';
import { PageHeader, Card, Loading, Badge, Modal, FormField, Table } from '../components/ui';
import { FiFile, FiPlus, FiTrash2, FiDownload, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ title: '', type: '', description: '' });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await reportService.getAll();
      const data = res.data?.data || res.data;
      setReports(Array.isArray(data) ? data : data?.reports || data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title) {
      toast.error('Title is required');
      return;
    }
    setCreating(true);
    try {
      await reportService.create(form);
      toast.success('Report created');
      setCreateOpen(false);
      setForm({ title: '', type: '', description: '' });
      loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create report');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await chatbotService.generateReport({ type: form.type || 'summary' });
      if (res.data?.data?.report?.title) {
        setForm({ ...form, title: res.data.data.report.title });
      }
      toast.success('AI report generated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await reportService.delete(id);
      toast.success('Report deleted');
      loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <Loading text="Loading reports..." />;

  const columns = [
    { key: 'title', label: 'Title', render: (r) => <strong>{r.title}</strong> },
    { key: 'type', label: 'Type', render: (r) => r.type ? <Badge variant="info">{r.type}</Badge> : '—' },
    { key: 'createdAt', label: 'Created', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-sm btn-outline" aria-label="Download"><FiDownload /></button>
        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r._id)} aria-label="Delete"><FiTrash2 /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Create, manage, and analyze business reports"
        actions={
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <FiPlus /> New Report
          </button>
        }
      />

      <Card>
        <h3 className="card-title">All Reports</h3>
        <Table columns={columns} data={reports} emptyMessage="No reports yet" />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Report">
        <form onSubmit={handleCreate}>
          <FormField label="Title" required>
            <input
              type="text"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Report title"
            />
          </FormField>
          <FormField label="Type">
            <select
              className="form-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="">Select type</option>
              <option value="summary">Summary</option>
              <option value="financial">Financial</option>
              <option value="operational">Operational</option>
              <option value="analytics">Analytics</option>
            </select>
          </FormField>
          <FormField label="Description">
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Report description"
            />
          </FormField>
          <div style={{ marginBottom: 16 }}>
            <button type="button" className="btn btn-outline" onClick={handleGenerate} disabled={generating}>
              <FiCpu /> {generating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}