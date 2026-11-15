import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// "Apply" button for the volunteer opportunity detail page.
// Props:
//   opportunityId  - required
//   disabled       - e.g. when the opportunity isn't open
//   redirectTo     - where to send the volunteer after applying (null to stay)
//   onApplied(app) - optional callback with { applicationId, status, appliedAt }
export default function OpportunityApplyButton({
  opportunityId,
  disabled = false,
  redirectTo = '/volunteer/dashboard',
  onApplied,
}) {
  const router = useRouter();
  const [state, setState] = useState('idle'); // idle | submitting | applied | already
  const [error, setError] = useState('');

  const apply = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setState('submitting');
    setError('');
    try {
      const res = await fetch('/api/opportunity/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ opportunityId }),
      });
      const result = await res.json();

      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (res.status === 409 && /already applied/i.test(result.error ?? '')) {
        setState('already');
        return;
      }
      if (!result.success) {
        setError(result.error || 'Could not submit your application');
        setState('idle');
        return;
      }

      setState('applied');
      onApplied?.(result.data);
      if (redirectTo) setTimeout(() => router.push(redirectTo), 1500);
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  };

  if (state === 'applied' || state === 'already') {
    return (
      <div role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">
        {state === 'applied'
          ? 'Application submitted! The organization will review it soon.'
          : "You've already applied to this opportunity."}{' '}
        <Link href="/volunteer/dashboard" className="font-medium underline">
          View my applications
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={apply}
        disabled={disabled || state === 'submitting'}
        className="rounded bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {state === 'submitting' ? 'Applying…' : 'Apply to Opportunity'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
