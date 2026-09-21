import CRUDPage from '../components/CRUDPage';
import GenericForm from '../components/GenericForm';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category', render: (v) => <span className="badge badge-neutral">{v}</span> },
  { key: 'price', label: 'Price', render: (v) => `$${v?.toFixed(2) || '0.00'}` },
  { key: 'stock', label: 'Stock' },
  { key: 'isActive', label: 'Status', render: (v) => <span className={`badge ${v ? 'badge-success' : 'badge-danger'}`}>{v ? 'Active' : 'Inactive'}</span> },
];

const fields = [
  { key: 'name', label: 'Product Name', type: 'text', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['electronics', 'clothing', 'food', 'software', 'hardware', 'service', 'other'] },
  { key: 'price', label: 'Price', type: 'number', required: true },
  { key: 'costPrice', label: 'Cost Price', type: 'number' },
  { key: 'stock', label: 'Stock', type: 'number' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'sku', label: 'SKU', type: 'text' },
];

export default function Products() {
  return (
    <CRUDPage
      title="Products"
      description="Manage your product inventory"
      resource="products"
      columns={columns}
      FormComponent={(props) => <GenericForm {...props} fields={fields} />}
    />
  );
}