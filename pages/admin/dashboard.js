import DashboardCharts from '../../components/admin/DashboardCharts';
import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/shared/ProtectedRoute';
import { fetchApi } from '../../lib/fetchApi';
import Link from 'next/link';

function AdminDashboardContent() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    fetchApi('/api/admin/dashboard')
      .then((result) => {
        if (active) setStats(result.data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const cards = stats
    ? [
      ['Total Users', stats.totalUsers],
      ['Organizations', stats.totalOrganizations],
      ['Opportunities', stats.totalOpportunities],
      ['Pending Applications', stats.pendingApplications],
    ]
    : [];

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        VMS Admin Dashboard
      </h1>

      <p className="text-gray-600 mb-8">
        Volunteer Management System Overview
      </p>

      {error && (
        <p className="text-red-600">
          Error: {error}
        </p>
      )}

      {!stats && !error && <p>Loading statistics...</p>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(([title, value]) => (
            <div
              key={title}
              className="bg-white border rounded-lg shadow-sm p-6"
            >
              <h2 className="text-gray-600 text-sm">
                {title}
              </h2>
              <p className="text-3xl font-bold text-blue-600 mt-3">
                {value ?? 0}
              </p>
            </div>
          ))}
        </div>
      )}

      <DashboardCharts />

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          Admin Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Manage Users', href: '/admin/users' },
            { title: 'Manage Organizations', href: '/admin/organizations' },
            { title: 'Monitor Opportunities', href: '/admin/opportunities' },
            { title: 'Track Applications', href: '/admin/applications' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border rounded-lg p-6
                   hover:bg-blue-50 hover:border-blue-500
                   font-semibold text-blue-600"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
