import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/shared/ProtectedRoute';
import { fetchApi } from '../../lib/fetchApi';

function UsersContent() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const limit = 20;

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(page * limit),
        });

        if (role) params.set('role', role);

        const result = await fetchApi(
          `/api/admin/users?${params.toString()}`
        );

        if (active) {
          setUsers(result.data || []);
          setTotal(result.total || 0);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setUsers([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [role, page]);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-2">
        User Management
      </h1>

      <p className="text-gray-600 mb-6">
        View registered users and filter by role.
      </p>

      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Filter by role
        </label>

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(0);
          }}
          className="border rounded-lg p-3 bg-white"
        >
          <option value="">All Users</option>
          <option value="admin">Administrators</option>
          <option value="volunteer">Volunteers</option>
          <option value="organization">Organizations</option>
        </select>
      </div>

      {error && (
        <p className="text-red-600 mb-4">
          Error: {error}
        </p>
      )}

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
                <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Join Date</th>
                </tr>
                </thead>

            
            <tbody>
            {users.map((user) => (
                <tr key={user.id} className="border-t">
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4 capitalize">{user.role}</td>
                <td className="p-4">
                    {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'N/A'}
                </td>
                </tr>
            ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <p className="p-6 text-gray-500">
              No users found.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={loading || page === 0}
          className="border rounded px-4 py-2 disabled:opacity-40"
        >
          Previous
        </button>

        <span>
          Page {page + 1} of {Math.max(1, Math.ceil(total / limit))}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={loading || (page + 1) * limit >= total}
          className="border rounded px-4 py-2 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </main>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <UsersContent />
    </ProtectedRoute>
  );
}