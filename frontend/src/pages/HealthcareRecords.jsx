import CRUDPage from '../components/CRUDPage';
import GenericForm from '../components/GenericForm';

const columns = [
  { key: 'patientName', label: 'Patient Name' },
  { key: 'patientId', label: 'Patient ID' },
  { key: 'bloodType', label: 'Blood Type', render: (v) => <span className="badge badge-info">{v}</span> },
  { key: 'gender', label: 'Gender', render: (v) => v?.charAt(0).toUpperCase() + v?.slice(1) },
  { key: 'createdAt', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
];

const fields = [
  { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
  { key: 'patientId', label: 'Patient ID', type: 'text', required: true },
  { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
  { key: 'bloodType', label: 'Blood Type', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  { key: 'contactInfo.phone', label: 'Phone', type: 'text' },
  { key: 'contactInfo.email', label: 'Email', type: 'email' },
];

export default function HealthcarePage() {
  return (
    <CRUDPage title="Healthcare Records" description="Manage patient healthcare records" resource="healthcare-records" columns={columns}
      FormComponent={(props) => <GenericForm {...props} fields={fields} />} />
  );
}