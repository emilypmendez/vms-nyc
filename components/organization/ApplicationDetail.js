import { useEffect, useState } from 'react';
import { availabilityLabel, boroughLabel, skillLabel } from '../../lib/volunteerOptions';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  accepted: 'bg-green-100 text-green-800 ring-green-600/20',
  rejected: 'bg-red-100 text-red-800 ring-red-600/20',
  withdrawn: 'bg-gray-100 text-gray-700 ring-gray-500/20',
};

export function ReviewStatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.withdrawn;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function SkillMatch({ volunteerSkills = [], requiredSkills = [] }) {
  if (requiredSkills.length === 0) {
    return (
      <div>
        <p className="text-sm text-gray-600">This opportunity has no required skills.</p>
        <SkillChips skills={volunteerSkills} matched={[]} />
      </div>
    );
  }

  const have = new Set(volunteerSkills);
  const matched = requiredSkills.filter((s) => have.has(s));
  const missing = requiredSkills.filter((s) => !have.has(s));

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">
        Matches <strong>{matched.length}</strong> of {requiredSkills.length} required skill
        {requiredSkills.length === 1 ? '' : 's'}
      </p>
      <SkillChips skills={volunteerSkills} matched={matched} />
      {missing.length > 0 && (
        <p className="text-xs text-gray-500">
          Missing: {missing.map(skillLabel).join(', ')}
        </p>
      )}
    </div>
  );
}

function SkillChips({ skills, matched }) {
  if (!skills.length) return <p className="text-sm text-gray-500">No skills listed.</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <li
          key={skill}
          className={`rounded px-2 py-0.5 text-xs ${
            matched.includes(skill) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {skillLabel(skill)}
        </li>
      ))}
    </ul>
  );
}

// Modal for reviewing one application: volunteer details, skill match,
// and Accept / Reject with optional notes.
export default function ApplicationDetail({ application, opportunity, onClose, onReviewed }) {
  const [notes, setNotes] = useState(application.notes ?? '');
  const [saving, setSaving] = useState(null); // 'accepted' | 'rejected' | null
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const slotsLeft =
    opportunity?.slotsAvailable != null
      ? Math.max(opportunity.slotsAvailable - (opportunity.acceptedCount ?? 0), 0)
      : null;
  const canAccept =
    application.status !== 'withdrawn' &&
    (application.status === 'accepted' || slotsLeft === null || slotsLeft > 0);

  const review = async (status) => {
    setSaving(status);
    setError('');
    try {
      const res = await fetch(`/api/organization/application/${application.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status, notes }),
      });
      const result = await res.json();
      if (!result.success) {
        const detail = result.details ? Object.values(result.details).join(' ') : '';
        setError(detail || result.error || 'Could not update the application');
        return;
      }
      onReviewed(application.id, result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-detail-title"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="application-detail-title" className="text-lg font-semibold text-gray-900">
              {application.volunteerName}
            </h2>
            <p className="text-sm text-gray-600">Applied {formatDate(application.appliedAt)}</p>
          </div>
          <ReviewStatusBadge status={application.status} />
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-500">Email</dt>
            <dd className="break-all text-gray-900">
              {application.volunteerEmail ? (
                <a href={`mailto:${application.volunteerEmail}`} className="text-blue-600 hover:underline">
                  {application.volunteerEmail}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Phone</dt>
            <dd className="text-gray-900">{application.volunteerPhone || '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Borough</dt>
            <dd className="text-gray-900">{application.volunteerBorough ? boroughLabel(application.volunteerBorough) : '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Availability</dt>
            <dd className="text-gray-900">{application.volunteerAvailability ? availabilityLabel(application.volunteerAvailability) : '—'}</dd>
          </div>
        </dl>

        {application.volunteerBio && (
          <p className="mt-4 whitespace-pre-line text-sm text-gray-700">{application.volunteerBio}</p>
        )}

        <section className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Skills</h3>
          <SkillMatch
            volunteerSkills={application.volunteerSkills}
            requiredSkills={opportunity?.requiredSkills ?? []}
          />
        </section>

        <section className="mt-4">
          <label htmlFor="review-notes" className="mb-1 block text-sm font-semibold text-gray-900">
            Internal notes <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            id="review-notes"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={application.status === 'withdrawn'}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. Great fit for our team!"
          />
          <p className="mt-1 text-xs text-gray-500">Only your organization sees these notes.</p>
        </section>

        {slotsLeft !== null && (
          <p className="mt-2 text-xs text-gray-500">
            {slotsLeft} of {opportunity.slotsAvailable} slot{opportunity.slotsAvailable === 1 ? '' : 's'} left
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => review('rejected')}
            disabled={saving !== null || application.status === 'withdrawn'}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
          >
            {saving === 'rejected' ? 'Rejecting…' : 'Reject'}
          </button>
          <button
            type="button"
            onClick={() => review('accepted')}
            disabled={saving !== null || !canAccept}
            title={canAccept ? undefined : 'No slots left'}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
          >
            {saving === 'accepted' ? 'Accepting…' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
