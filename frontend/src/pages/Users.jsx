import CRUDPage from '../components/CRUDPage';
import GenericForm from '../components/GenericForm';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', render: (v) => <span className="badge badge-info">{v}</span> },
  { key: 'department', label: 'Department' },
  { key: 'isActive', label: 'Status', render: (v) => <span className={`badge ${v ? 'badge-success' : 'badge-danger'}`}>{v ? 'Active' : 'Inactive'}</span> },
];

const fields = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'password', label: 'Password', type: 'password', required: true },
  { key: 'role', label: 'Role', type: 'select', options: ['admin', 'manager', 'user'] },
  { key: 'department', label: 'Department', type: 'text' },
];

export default function UsersPage() {
  return (
    <CRUDPage title="Users" description="Manage system users" resource="users" columns={columns}
      FormComponent={(props) => <GenericForm {...props} fields={fields} />} />
  );
}