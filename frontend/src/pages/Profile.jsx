import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, FormField, Loading } from '../components/ui';
import { FiUser, FiMail, FiBriefcase, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    avatar: user?.avatar || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="User Profile" subtitle="Manage your personal information" />

      <div className="grid grid-2">
        <Card>
          <div className="profile-header">
            <div className="profile-avatar-large">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
              <span className="badge badge-info">{user?.role}</span>
            </div>
          </div>
          <div className="profile-details">
            <div className="profile-detail-item">
              <FiUser />
              <span>Name</span>
              <strong>{user?.name}</strong>
            </div>
            <div className="profile-detail-item">
              <FiMail />
              <span>Email</span>
              <strong>{user?.email}</strong>
            </div>
            <div className="profile-detail-item">
              <FiBriefcase />
              <span>Department</span>
              <strong>{user?.department || 'Not set'}</strong>
            </div>
            <div className="profile-detail-item">
              <FiBriefcase />
              <span>Role</span>
              <strong className="text-capitalize">{user?.role}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="card-title">Edit Profile</h3>
          <form onSubmit={handleSubmit}>
            <FormField label="Full Name" required error={errors.name}>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>
            <FormField label="Email" required error={errors.email}>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FormField>
            <FormField label="Phone">
              <input
                type="tel"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </FormField>
            <FormField label="Department">
              <input
                type="text"
                className="form-input"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Engineering"
              />
            </FormField>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}