import { useState, useEffect, useRef } from 'react';
import { knowledgeService } from '../services';
import { PageHeader, Card, Loading, Badge, Modal, FormField, Table } from '../components/ui';
import { FiUpload, FiSearch, FiFileText, FiTrash2, FiDatabase, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', tags: '' });
  const fileRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsRes, statsRes] = await Promise.allSettled([
        knowledgeService.listDocuments({ limit: 50 }),
        knowledgeService.getStats(),
      ]);
      if (docsRes.status === 'fulfilled') {
        const data = docsRes.value.data?.data || docsRes.value.data;
        setDocuments(data?.documents || data?.items || []);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data || statsRes.value.data);
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
      await knowledgeService.uploadDocument(formData);
      toast.success('Document uploaded successfully');
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await knowledgeService.search({ query: searchQuery.trim(), limit: 10 });
      setSearchResults(res.data?.data || res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await knowledgeService.deleteDocument(id);
      toast.success('Document deleted');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <Loading text="Loading knowledge base..." />;

  const columns = [
    { key: 'title', label: 'Title', render: (r) => <strong>{r.title || r.filename || 'Untitled'}</strong> },
    { key: 'category', label: 'Category', render: (r) => r.category ? <Badge variant="info">{r.category}</Badge> : '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'processed' ? 'success' : r.status === 'processing' ? 'warning' : 'neutral'}>{r.status || 'pending'}</Badge> },
    { key: 'chunkCount', label: 'Chunks', render: (r) => r.chunkCount || r.chunks?.length || 0 },
    { key: 'createdAt', label: 'Uploaded', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: '', render: (r) => (
      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)} aria-label="Delete">
        <FiTrash2 />
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        subtitle="Enterprise RAG - search and manage your knowledge documents"
        actions={
          <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
            <FiUpload /> Upload Document
          </button>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#2563eb15', color: '#2563eb' }}><FiDatabase /></div>
          <div className="stat-info">
            <h3>{stats?.totalDocuments || documents.length || 0}</h3>
            <p>Total Documents</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}><FiCpu /></div>
          <div className="stat-info">
            <h3>{stats?.totalChunks || 0}</h3>
            <p>Total Chunks</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><FiFileText /></div>
          <div className="stat-info">
            <h3>{stats?.totalEmbeddings || 0}</h3>
            <p>Embeddings</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf615', color: '#8b5cf6' }}><FiSearch /></div>
          <div className="stat-info">
            <h3>{stats?.totalSearches || 0}</h3>
            <p>Total Searches</p>
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <form className="search-bar" onSubmit={handleSearch}>
          <FiSearch />
          <input
            type="text"
            className="form-input"
            placeholder="Semantic search your knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search knowledge base"
          />
          <button type="submit" className="btn btn-primary" disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
        {searchResults && (
          <div className="search-results" style={{ marginTop: 16 }}>
            <h4>Search Results</h4>
            {(searchResults.results || searchResults.documents || []).map((r, i) => (
              <div key={i} className="search-result-item">
                <div className="search-result-score">
                  {Math.round((r.score || r.similarity || 0) * 100)}%
                </div>
                <div>
                  <strong>{r.title || r.filename || 'Document'}</strong>
                  <p>{r.snippet || r.content?.slice(0, 200) || 'No preview available'}</p>
                </div>
              </div>
            ))}
            {(!searchResults.results || searchResults.results.length === 0) && (
              <div className="table-empty">No results found</div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="card-title">Documents</h3>
        <Table columns={columns} data={documents} emptyMessage="No documents uploaded yet" />
      </Card>

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document">
        <form onSubmit={handleUpload}>
          <FormField label="File" required>
            <input type="file" ref={fileRef} className="form-input" accept=".pdf,.doc,.docx,.txt,.md,.csv" />
          </FormField>
          <FormField label="Title">
            <input
              type="text"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Document title"
            />
          </FormField>
          <FormField label="Category">
            <input
              type="text"
              className="form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. finance, legal, hr"
            />
          </FormField>
          <FormField label="Tags (comma separated)">
            <input
              type="text"
              className="form-input"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Q1, report, 2026"
            />
          </FormField>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setUploadOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}