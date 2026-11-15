import { useEffect, useState } from 'react';

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem('token');

      try {
        const res = await fetch('/api/volunteer/applications', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await res.json();
        if (result.success) {
          setApplications(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">My Applications</h2>
      {applications.length === 0 ? (
        <p className="text-gray-600">No applications yet</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Opportunity</th>
              <th className="text-left py-2">Organization</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Applied</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b">
                <td className="py-2">{app.opportunityTitle}</td>
                <td className="py-2">{app.organizationName}</td>
                <td className="py-2">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      app.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : app.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {app.status}
                  </span>
                </td>
                <td className="py-2 text-sm text-gray-600">
                  {new Date(app.appliedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
