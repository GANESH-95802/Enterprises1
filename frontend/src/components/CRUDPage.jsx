import { useState, useEffect } from 'react';
import { crudAPI } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CRUDPage({ title, description, resource, columns, formFields, FormComponent }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const api = crudAPI(resource);
  const limit = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.getAll({ page, limit, search });
      setData(res.data);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(id);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {}
  };

  const handleSave = async (formData) => {
    try {
      if (editing) {
        await api.update(editing._id, formData);
        toast.success('Updated successfully');
      } else {
        await api.create(formData);
        toast.success('Created successfully');
      }
      setShowModal(false);
      setEditing(null);
      fetchData();
    } catch (err) {}
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <FiPlus /> Add New
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiSearch size={20} color="var(--gray-400)" />
          <input
            className="form-input"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 400 }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {columns.map((col) => <th key={col.key}>{col.label}</th>)}
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No data found</td></tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item._id}>
                        {columns.map((col) => (
                          <td key={col.key}>
                            {col.render ? col.render(item[col.key], item) : item[col.key] || '-'}
                          </td>
                        ))}
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => { setEditing(item); setShowModal(true); }}>
                              <FiEdit2 />
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}>
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {total > limit && (
              <div style={{ padding: 16, display: 'flex', justifyContent: 'center', gap: 8, borderTop: '1px solid var(--gray-200)' }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: 'var(--gray-500)' }}>Page {page} of {Math.ceil(total / limit)}</span>
                <button className="btn btn-outline btn-sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditing(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editing ? `Edit ${title.slice(0, -1)}` : `Add New ${title.slice(0, -1)}`}</h2>
            {FormComponent ? (
              <FormComponent initialData={editing} onSubmit={handleSave} onCancel={() => { setShowModal(false); setEditing(null); }} />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}