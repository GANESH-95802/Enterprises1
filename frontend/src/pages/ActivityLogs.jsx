import { useState, useEffect } from 'react';
import { enterpriseService } from '../services';
import { PageHeader, Card, Loading, Badge, Table } from '../components/ui';
import { FiActivity } from 'react-icons/fi';

export default function ActivityLogs() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadActivities();
  }, [page]);

  const loadActivities = async () => {
    try {
      const res = await enterpriseService.getActivities({ page, limit });
      const data = res.data;
      const items = data?.activities || data?.data || [];
      setActivities(Array.isArray(items) ? items : []);
      setTotal(data?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Loading activity logs..." />;

  const columns = [
    { key: 'action', label: 'Action', render: (r) => <Badge variant="info">{r.action}</Badge> },
    { key: 'resource', label: 'Resource', render: (r) => r.resource || '—' },
    { key: 'details', label: 'Details', render: (r) => r.details || '—' },
    { key: 'createdAt', label: 'Timestamp', render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div>
      <PageHeader title="Activity Logs" subtitle="Audit trail of all user activities" />

      <Card>
        <Table columns={columns} data={activities} emptyMessage="No activities recorded" />
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button className="btn btn-sm btn-outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}