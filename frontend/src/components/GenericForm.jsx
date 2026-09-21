import { useState } from 'react';

export default function GenericForm({ fields, initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(initialData || {});

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          {field.type === 'select' ? (
            <select className="form-select" value={formData[field.key] || ''} onChange={(e) => handleChange(field.key, e.target.value)} required={field.required}>
              <option value="">Select {field.label}</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea className="form-textarea" value={formData[field.key] || ''} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} required={field.required} />
          ) : (
            <input className="form-input" type={field.type || 'text'} value={formData[field.key] || ''} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} required={field.required} />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">{initialData ? 'Update' : 'Create'}</button>
      </div>
    </form>
  );
}