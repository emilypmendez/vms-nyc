import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { dashboardFor, safeNextPath, saveSession } from '../../lib/auth';

const inputClass =
  'w-full px-3 py-2 border rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function LoginForm({ initialEmail = '' }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json().catch(() => null);

      if (!result?.success) {
        setError(result?.error || 'Login failed');
        return;
      }

      const { session, role } = result.data;
      saveSession({ token: session.access_token, role });

      router.push(safeNextPath(router.query.next) || dashboardFor(role));
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium mb-1">Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClass}
        />
      </label>

      {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Logging in...' : 'Log in'}
      </button>

      <p className="text-sm text-gray-500">
        No account yet?{' '}
        <Link href="/auth/signup" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
