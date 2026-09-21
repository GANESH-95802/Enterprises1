import CRUDPage from '../components/CRUDPage';
import GenericForm from '../components/GenericForm';

const columns = [
  { key: 'name', label: 'Skill' },
  { key: 'category', label: 'Category', render: (v) => <span className="badge badge-neutral">{v}</span> },
  { key: 'proficiencyLevel', label: 'Level', render: (v) => <span className={`badge badge-${v === 'expert' ? 'success' : v === 'advanced' ? 'info' : 'warning'}`}>{v}</span> },
  { key: 'yearsOfExperience', label: 'Years Exp' },
];

const fields = [
  { key: 'name', label: 'Skill Name', type: 'text', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['technical', 'soft', 'management', 'creative', 'language', 'other'] },
  { key: 'proficiencyLevel', label: 'Proficiency', type: 'select', options: ['beginner', 'intermediate', 'advanced', 'expert'] },
  { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

export default function SkillsPage() {
  return (
    <CRUDPage title="Skills" description="Manage employee skills and competencies" resource="skills" columns={columns}
      FormComponent={(props) => <GenericForm {...props} fields={fields} />} />
  );
}