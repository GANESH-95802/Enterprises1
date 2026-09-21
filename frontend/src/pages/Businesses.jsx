import CRUDPage from '../components/CRUDPage';
import GenericForm from '../components/GenericForm';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category', render: (v) => <span className="badge badge-neutral">{v}</span> },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v === 'active' ? 'success' : v === 'pending' ? 'warning' : 'danger'}`}>{v}</span> },
];

const fields = [
  { key: 'name', label: 'Business Name', type: 'text', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['retail', 'technology', 'healthcare', 'construction', 'finance', 'education', 'other'], required: true },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'pending'] },
];

export default function Businesses() {
  return (
    <CRUDPage
      title="Businesses"
      description="Manage all registered businesses"
      resource="businesses"
      columns={columns}
      FormComponent={(props) => <GenericForm {...props} fields={fields} />}
    />
  );
}