import CRUDPage from '../components/CRUDPage';
import GenericForm from '../components/GenericForm';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type', render: (v) => <span className="badge badge-neutral">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v === 'compliant' ? 'success' : v === 'non-compliant' ? 'danger' : 'warning'}`}>{v}</span> },
  { key: 'riskLevel', label: 'Risk', render: (v) => <span className={`badge badge-${v === 'high' || v === 'critical' ? 'danger' : v === 'medium' ? 'warning' : 'info'}`}>{v}</span> },
];

const fields = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'type', label: 'Type', type: 'select', options: ['regulation', 'license', 'certification', 'audit', 'policy', 'other'], required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['compliant', 'non-compliant', 'pending', 'expired', 'in-progress'] },
  { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'authority', label: 'Authority', type: 'text' },
];

export default function CompliancePage() {
  return (
    <CRUDPage title="Compliance Records" description="Track regulatory compliance and certifications" resource="compliance" columns={columns}
      FormComponent={(props) => <GenericForm {...props} fields={fields} />} />
  );
}