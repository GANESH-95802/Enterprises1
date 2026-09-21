import { useState, useEffect } from 'react';
import { crudService } from '../services';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, Loading, Badge, Table } from '../components/ui';
import { FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user, can } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await crudService('users').getAll();
      const data = res.data?.data || res.data;
      setUsers(Array.isArray(data) ? data : data?.items || data?.users || []);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await crudService('users').update(id, { isActive: !isActive });
      toast.success('User status updated');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  if (loading) return <Loading text="Loading users..." />;

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <strong>{r.name}</strong> },
    { key: 'email', label: 'Email', render: (r) => r.email },
    { key: 'role', label: 'Role', render: (r) => <Badge variant="info">{r.role}</Badge> },
    { key: 'isActive', label: 'Status', render: (r) => <Badge variant={r.isActive !== false ? 'success' : 'danger'}>{r.isActive !== false ? 'Active' : 'Inactive'}</Badge> },
    { key: 'createdAt', label: 'Joined', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  if (can('admin')) {
    columns.push({
      key: 'actions', label: '', render: (r) => (
        <button className="btn btn-sm btn-outline" onClick={() => handleToggleActive(r._id, r.isActive !== false)}>
          {r.isActive !== false ? 'Deactivate' : 'Activate'}
        </button>
      ),
    });
  }

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage enterprise users" />

      <Card>
        <Table columns={columns} data={users} emptyMessage="No users found" />
      </Card>
    </div>
  );
}