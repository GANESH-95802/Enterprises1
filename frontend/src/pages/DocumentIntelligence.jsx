import { useState, useEffect, useRef } from 'react';
import { documentIntelligenceService } from '../services';
import { PageHeader, Card, Loading, Badge, Modal, FormField, Table } from '../components/ui';
import { FiUpload, FiFileText, FiTrash2, FiCpu, FiSearch, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function DocumentIntelligence() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', tags: '' });
  const fileRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsRes, statsRes, capsRes] = await Promise.allSettled([
        documentIntelligenceService.listDocuments({ limit: 50 }),
        documentIntelligenceService.getStats(),
        documentIntelligenceService.getCapabilities(),
      ]);
      if (docsRes.status === 'fulfilled') {
        const data = docsRes.value.data?.data || docsRes.value.data;
        setDocuments(data?.documents || data?.items || []);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data || statsRes.value.data);
      if (capsRes.status === 'fulfilled') setCapabilities(capsRes.value.data?.data || capsRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (form.title) formData.append('title', form.title);
      if (form.category) formData.append('category', form.category);
      if (form.tags) formData.append('tags', form.tags);
      const res = await documentIntelligenceService.uploadAndAnalyze(formData);
      toast.success('Document uploaded and analyzed');
      setUploadOpen(false);
      setForm({ title: '', category: '', tags: '' });
      fileRef.current.value = '';
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (doc) => {
    setSelectedDoc(doc);
    setAnalyzing(true);
    try {
      const res = await documentIntelligenceService.getDocument(doc._id);
      setAnalysis(res.data?.data || res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this analysis?')) return;
    try {
      await documentIntelligenceService.deleteDocument(id);
      toast.success('Analysis deleted');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <Loading text="Loading document intelligence..." />;

  const columns = [
    { key: 'title', label: 'Title', render: (r) => <strong>{r.title || r.filename || 'Untitled'}</strong> },
    { key: 'category', label: 'Category', render: (r) => r.category ? <Badge variant="info">{r.category}</Badge> : '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'completed' ? 'success' : r.status === 'processing' ? 'warning' : 'neutral'}>{r.status || 'pending'}</Badge> },
    { key: 'classification', label: 'Type', render: (r) => r.classification?.type || r.documentType || '—' },
    { key: 'createdAt', label: 'Uploaded', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-sm btn-outline" onClick={() => handleAnalyze(r)}>View</button>
        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r._id)} aria-label="Delete"><FiTrash2 /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Document Intelligence"
        subtitle="AI-powered document analysis, extraction, and summarization"
        actions={
          <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
            <FiUpload /> Upload & Analyze
          </button>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#2563eb15', color: '#2563eb' }}><FiFileText /></div>
          <div className="stat-info">
            <h3>{stats?.totalDocuments || documents.length || 0}</h3>
            <p>Documents</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}><FiCpu /></div>
          <div className="stat-info">
            <h3>{stats?.totalAnalyses || 0}</h3>
            <p>Analyses</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><FiLayers /></div>
          <div className="stat-info">
            <h3>{stats?.totalExtractions || 0}</h3>
            <p>Extractions</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf615', color: '#8b5cf6' }}><FiSearch /></div>
          <div className="stat-info">
            <h3>{stats?.totalSummaries || 0}</h3>
            <p>Summaries</p>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="card-title">Analyzed Documents</h3>
        <Table columns={columns} data={documents} emptyMessage="No documents analyzed yet" />
      </Card>

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload & Analyze Document">
        <form onSubmit={handleUpload}>
          <FormField label="File" required>
            <input type="file" ref={fileRef} className="form-input" accept=".pdf,.doc,.docx,.txt,.md,.csv,.png,.jpg,.jpeg" />
          </FormField>
          <FormField label="Title">
            <input type="text" className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Document title" />
          </FormField>
          <FormField label="Category">
            <input type="text" className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. finance, legal" />
          </FormField>
          <FormField label="Tags (comma separated)">
            <input type="text" className="form-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Q1, report" />
          </FormField>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setUploadOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload & Analyze'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!selectedDoc} onClose={() => { setSelectedDoc(null); setAnalysis(null); }} title={selectedDoc?.title || 'Analysis Result'}>
        {analyzing ? <Loading text="Loading analysis..." /> : analysis && (
          <div className="analysis-result">
            {analysis.summary && (
              <div className="analysis-section">
                <h4>Summary</h4>
                <p>{analysis.summary}</p>
              </div>
            )}
            {analysis.classification && (
              <div className="analysis-section">
                <h4>Classification</h4>
                <p>Type: <Badge variant="info">{analysis.classification.type}</Badge></p>
                {analysis.classification.confidence && <p>Confidence: {Math.round(analysis.classification.confidence * 100)}%</p>}
              </div>
            )}
            {analysis.metadata && Object.keys(analysis.metadata).length > 0 && (
              <div className="analysis-section">
                <h4>Extracted Metadata</h4>
                <div className="metadata-grid">
                  {Object.entries(analysis.metadata).map(([key, value]) => (
                    <div key={key} className="metadata-item">
                      <strong>{key}</strong>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.entities && analysis.entities.length > 0 && (
              <div className="analysis-section">
                <h4>Entities</h4>
                <div className="entity-list">
                  {analysis.entities.map((e, i) => (
                    <Badge key={i} variant="neutral">{e.name || e.text} ({e.type})</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}