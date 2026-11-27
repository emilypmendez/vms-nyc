import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function ResetPasswordPage() {
  const supabaseRef = useRef(null);

  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash.slice(1)
    );

    const isRecoveryLink =
      params.get('type') === 'recovery' &&
      Boolean(params.get('access_token'));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'vms-password-recovery',
        },
      }
    );

    supabaseRef.current = supabase;

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        if (
          event === 'PASSWORD_RECOVERY' &&
          session &&
          isRecoveryLink
        ) {
          setVerified(true);
          setChecking(false);
          setError('');
        } else if (event === 'INITIAL_SESSION') {
          setChecking(false);

          if (!isRecoveryLink) {
            setError(
              'Please open the password reset link from your email.'
            );
          }
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!verified || !supabaseRef.current) {
      setError('A valid recovery link is required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } =
        await supabaseRef.current.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setVerified(false);
      setPassword('');
      setConfirmPassword('');

      await supabaseRef.current.auth.signOut({
        scope: 'local',
      });
    } catch (err) {
      setError(
        err.message || 'Unable to reset password.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Reset Password | VMS-NYC</title>
      </Head>

      <main className="max-w-md mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">
          Reset Password
        </h1>

        {success ? (
          <div role="status" className="space-y-4">
            <p className="text-green-600">
              Your password has been updated successfully!
            </p>

            <Link
              href="/auth/login"
              className="text-blue-600 hover:underline"
            >
              Return to Login
            </Link>
          </div>
        ) : checking ? (
          <p>Checking your recovery link...</p>
        ) : !verified ? (
          <div className="space-y-4">
            <p role="alert" className="text-red-600">
              {error || 'Invalid or expired recovery link.'}
            </p>

            <Link
              href="/auth/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <p className="text-gray-600">
              Enter and confirm your new password.
            </p>

            <label className="block">
              <span className="block mb-1">
                New Password
              </span>

              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full px-3 py-2 border rounded bg-white text-gray-900"
              />
            </label>

            <label className="block">
              <span className="block mb-1">
                Confirm Password
              </span>

              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                className="w-full px-3 py-2 border rounded bg-white text-gray-900"
              />
            </label>

            {error && (
              <p role="alert" className="text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}
      </main>
    </>
  );
}

