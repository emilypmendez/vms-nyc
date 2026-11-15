import { useState } from 'react';
import { BOROUGHS, COMMITMENTS, STATUSES, validateOpportunity } from '../../lib/opportunity';

const EMPTY = {
  title: '',
  description: '',
  requiredSkills: '',
  commitment: 'one-time',
  startDate: '',
  endDate: '',
  slotsAvailable: 1,
  location: '',
  borough: '',
  status: 'open',
};

/** Turn an API opportunity object into form state (skills array -> comma string, nulls -> ''). */
function toFormValues(opportunity) {
  if (!opportunity) return EMPTY;
  return {
    ...EMPTY,
    ...Object.fromEntries(
      Object.keys(EMPTY).map((key) => [key, opportunity[key] ?? EMPTY[key]])
    ),
    requiredSkills: (opportunity.requiredSkills || []).join(', '),
  };
}

const inputClass =
  'w-full px-3 py-2 border rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500';

function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
      {error && <span className="block text-sm text-red-600 mt-1">{error}</span>}
    </label>
  );
}

/**
 * Create/edit form for an opportunity.
 *
 * Props:
 * - initialValues: opportunity object from the API (edit mode), or omit for a blank form
 * - onSubmit(payload): async; throw an Error with `.details` for field errors
 * - submitLabel: button text
 * - showStatus: show the status select (edit mode only)
 * - resetOnSuccess: clear the form after a successful submit
 */
export default function OpportunityForm({
  initialValues,
  onSubmit,
  submitLabel = 'Create Opportunity',
  showStatus = false,
  resetOnSuccess = false,
}) {
  const [values, setValues] = useState(() => toFormValues(initialValues));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      ...values,
      slotsAvailable: Number(values.slotsAvailable),
      requiredSkills: values.requiredSkills, // server parses the comma list
    };
    if (!showStatus) delete payload.status;

    // Same validation as the API, so users get instant feedback.
    const { errors: clientErrors } = validateOpportunity(payload, { partial: showStatus });
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      await onSubmit(payload);
      if (resetOnSuccess) setValues(EMPTY);
    } catch (err) {
      if (err.details) setErrors(err.details);
      setFormError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl" noValidate>
      <Field label="Title *" error={errors.title}>
        <input className={inputClass} value={values.title} onChange={set('title')} maxLength={200} />
      </Field>

      <Field label="Description *" error={errors.description}>
        <textarea
          className={inputClass}
          rows={4}
          value={values.description}
          onChange={set('description')}
        />
      </Field>

      <Field
        label="Required skills"
        error={errors.requiredSkills}
        hint="Comma-separated, e.g. teaching, english"
      >
        <input className={inputClass} value={values.requiredSkills} onChange={set('requiredSkills')} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Commitment" error={errors.commitment}>
          <select className={inputClass} value={values.commitment} onChange={set('commitment')}>
            {COMMITMENTS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Volunteers needed *" error={errors.slotsAvailable}>
          <input
            type="number"
            min={1}
            step={1}
            className={inputClass}
            value={values.slotsAvailable}
            onChange={set('slotsAvailable')}
          />
        </Field>

        <Field label="Start date" error={errors.startDate}>
          <input type="date" className={inputClass} value={values.startDate} onChange={set('startDate')} />
        </Field>

        <Field label="End date" error={errors.endDate}>
          <input
            type="date"
            className={inputClass}
            value={values.endDate}
            min={values.startDate || undefined}
            onChange={set('endDate')}
          />
        </Field>

        <Field label="Borough" error={errors.borough}>
          <select className={inputClass} value={values.borough} onChange={set('borough')}>
            <option value="">Select a borough</option>
            {BOROUGHS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Location" error={errors.location}>
          <input
            className={inputClass}
            value={values.location}
            onChange={set('location')}
            placeholder="123 Main St, Brooklyn"
          />
        </Field>

        {showStatus && (
          <Field label="Status" error={errors.status}>
            <select className={inputClass} value={values.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {formError && <div className="text-red-600 text-sm">{formError}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
