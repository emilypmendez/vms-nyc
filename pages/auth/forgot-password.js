import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Request failed');
      }

      setMessage(result.message);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Forgot Password | VMS-NYC</title>
      </Head>

      <main className="max-w-md mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">
          Forgot Password
        </h1>

        <p className="text-gray-600">
          Enter your email address and we will send you
          a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1">
              Email Address
            </span>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
            />
          </label>

          {error && (
            <p role="alert" className="text-red-600 text-sm">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="text-green-600 text-sm">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-sm text-center">
          <Link
            href="/auth/login"
            className="text-blue-600 hover:underline"
          >
            Back to Login
          </Link>
        </p>
      </main>
    </>
  );
}
