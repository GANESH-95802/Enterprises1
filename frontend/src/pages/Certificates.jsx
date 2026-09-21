import CRUDPage from '../components/CRUDPage';
import GenericForm from '../components/GenericForm';

const columns = [
  { key: 'title', label: 'Certificate' },
  { key: 'issuer', label: 'Issuer' },
  { key: 'category', label: 'Category', render: (v) => <span className="badge badge-neutral">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v === 'active' ? 'success' : v === 'expired' ? 'danger' : 'warning'}`}>{v}</span> },
  { key: 'issueDate', label: 'Issued', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const fields = [
  { key: 'title', label: 'Certificate Title', type: 'text', required: true },
  { key: 'issuer', label: 'Issuing Organization', type: 'text', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['professional', 'academic', 'technical', 'compliance', 'other'] },
  { key: 'issueDate', label: 'Issue Date', type: 'date', required: true },
  { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
  { key: 'credentialId', label: 'Credential ID', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

export default function CertificatesPage() {
  return (
    <CRUDPage title="Certificates" description="Manage professional certifications" resource="certificates" columns={columns}
      FormComponent={(props) => <GenericForm {...props} fields={fields} />} />
  );
}