import CRUDPage from '../components/CRUDPage';
import GenericForm from '../components/GenericForm';

const columns = [
  { key: 'name', label: 'Project Name' },
  { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v === 'completed' ? 'success' : v === 'in-progress' ? 'info' : v === 'on-hold' ? 'warning' : 'neutral'}`}>{v}</span> },
  { key: 'budget', label: 'Budget', render: (v) => `$${v?.estimated?.toLocaleString() || 0}` },
  { key: 'startDate', label: 'Start Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
];

const fields = [
  { key: 'name', label: 'Project Name', type: 'text', required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'] },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'location.city', label: 'City', type: 'text' },
  { key: 'location.state', label: 'State', type: 'text' },
];

export default function ConstructionProjectsPage() {
  return (
    <CRUDPage title="Construction Projects" description="Manage construction projects and milestones" resource="construction-projects" columns={columns}
      FormComponent={(props) => <GenericForm {...props} fields={fields} />} />
  );
}