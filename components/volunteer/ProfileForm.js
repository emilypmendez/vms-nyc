import { useEffect, useState } from 'react';
import { AVAILABILITY, BOROUGHS, SKILLS } from '../../lib/volunteerOptions';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  skills: [],
  borough: '',
  availability: '',
  bio: '',
};

const BIO_MAX = 1000;

const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

export default function ProfileForm({ onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/volunteer/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (cancelled) return;
        if (!result.success) {
          setError(result.error || 'Could not load your profile');
          return;
        }
        const p = result.data;
        setForm({
          firstName: p.firstName ?? '',
          lastName: p.lastName ?? '',
          skills: p.skills ?? [],
          borough: p.borough ?? '',
          availability: p.availability ?? '',
          bio: p.bio ?? '',
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setSuccess('');
  };

  const toggleSkill = (skill) => {
    updateField(
      'skills',
      form.skills.includes(skill)
        ? form.skills.filter((s) => s !== skill)
        : [...form.skills, skill]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    setFieldErrors({});

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/volunteer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error || 'Could not save your profile');
        if (result.details) setFieldErrors(result.details);
        return;
      }

      setSuccess('Profile saved.');
      onSaved?.(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading your profile…</p>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            required
            maxLength={50}
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            aria-invalid={Boolean(fieldErrors.firstName)}
            aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
            className={inputClass}
          />
          <FieldError id="firstName-error" message={fieldErrors.firstName} />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            required
            maxLength={50}
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            aria-invalid={Boolean(fieldErrors.lastName)}
            aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
            className={inputClass}
          />
          <FieldError id="lastName-error" message={fieldErrors.lastName} />
        </div>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">Skills</legend>
        <p className="text-xs text-gray-500">Select all that apply.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SKILLS.map((skill) => {
            const selected = form.skills.includes(skill.value);
            return (
              <label
                key={skill.value}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 ${
                  selected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected}
                  onChange={() => toggleSkill(skill.value)}
                />
                {skill.label}
              </label>
            );
          })}
        </div>
        <FieldError id="skills-error" message={fieldErrors.skills} />
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="borough" className="block text-sm font-medium text-gray-700">
            Borough
          </label>
          <select
            id="borough"
            required
            value={form.borough}
            onChange={(e) => updateField('borough', e.target.value)}
            aria-invalid={Boolean(fieldErrors.borough)}
            aria-describedby={fieldErrors.borough ? 'borough-error' : undefined}
            className={inputClass}
          >
            <option value="">Select a borough</option>
            {BOROUGHS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <FieldError id="borough-error" message={fieldErrors.borough} />
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
            Availability
          </label>
          <select
            id="availability"
            value={form.availability}
            onChange={(e) => updateField('availability', e.target.value)}
            aria-invalid={Boolean(fieldErrors.availability)}
            aria-describedby={fieldErrors.availability ? 'availability-error' : undefined}
            className={inputClass}
          >
            <option value="">No preference</option>
            {AVAILABILITY.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <FieldError id="availability-error" message={fieldErrors.availability} />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          rows={4}
          maxLength={BIO_MAX}
          value={form.bio}
          onChange={(e) => updateField('bio', e.target.value)}
          aria-invalid={Boolean(fieldErrors.bio)}
          aria-describedby="bio-hint"
          className={inputClass}
          placeholder="Tell organizations a little about yourself"
        />
        <p id="bio-hint" className="mt-1 text-xs text-gray-500">
          {form.bio.length}/{BIO_MAX}
        </p>
        <FieldError id="bio-error" message={fieldErrors.bio} />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
