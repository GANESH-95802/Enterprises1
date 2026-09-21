import CRUDPage from '../components/CRUDPage';
import GenericForm from '../components/GenericForm';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v === 'active' ? 'success' : v === 'lead' ? 'warning' : 'danger'}`}>{v}</span> },
];

const fields = [
  { key: 'name', label: 'Customer Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'company', label: 'Company', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'lead'] },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function Customers() {
  return (
    <CRUDPage title="Customers" description="Manage your customer relationships" resource="customers" columns={columns}
      FormComponent={(props) => <GenericForm {...props} fields={fields} />} />
  );
}