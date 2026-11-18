import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { dashboardFor, saveSession } from '../../lib/auth';

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

const ROLES = [
  { value: 'volunteer', label: 'Volunteer', hint: 'Find and apply to opportunities' },
  { value: 'organization', label: 'Organization', hint: 'Post opportunities and review applicants' },
];

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
      {error && <span className="block text-sm text-red-600 mt-1">{error}</span>}
    </label>
  );
}

export default function SignupForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    role: 'volunteer',
    firstName: '',
    lastName: '',
    organizationName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setNotice('');
    setLoading(true);

    const payload = { ...values };
    if (payload.role !== 'organization') delete payload.organizationName;

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => null);

      if (!result?.success) {
        // The API sends undefined for valid fields; drop those.
        const details = Object.fromEntries(
          Object.entries(result?.details || {}).filter(([, v]) => v)
        );
        setErrors(details);
        setFormError(result?.error || 'Signup failed');
        return;
      }

      // Try to log straight in. If Supabase requires email confirmation first,
      // this fails and we show the "check your email" message instead.
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      const login = await loginRes.json().catch(() => null);

      if (login?.success) {
        saveSession({ token: login.data.session.access_token, role: login.data.role });
        router.push(dashboardFor(login.data.role));
        return;
      }

      setNotice(result.data?.message || 'Signup successful. Check your email to confirm.');
    } catch (err) {
      setFormError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (notice) {
    return (
      <div className="space-y-4">
        <p className="text-green-700">{notice}</p>
        <Link
          href={{ pathname: '/auth/login', query: { email: values.email } }}
          className="text-blue-600 hover:underline"
        >
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <fieldset>
        <legend className="block text-sm font-medium mb-2">I am signing up as</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`cursor-pointer rounded border bg-white text-gray-900 p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 ${
                values.role === r.value ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={values.role === r.value}
                onChange={set('role')}
                className="sr-only"
              />
              <span className="block font-medium">{r.label}</span>
              <span className="block text-xs text-gray-500">{r.hint}</span>
            </label>
          ))}
        </div>
        {errors.role && <span className="block text-sm text-red-600 mt-1">{errors.role}</span>}
      </fieldset>

      {values.role === 'organization' && (
        <Field label="Organization name" error={errors.organizationName}>
          <input
            className={inputClass}
            value={values.organizationName}
            onChange={set('organizationName')}
            autoComplete="organization"
          />
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={values.role === 'organization' ? 'Contact first name' : 'First name'}
          error={errors.firstName}
        >
          <input
            className={inputClass}
            value={values.firstName}
            onChange={set('firstName')}
            autoComplete="given-name"
          />
        </Field>
        <Field
          label={values.role === 'organization' ? 'Contact last name' : 'Last name'}
          error={errors.lastName}
        >
          <input
            className={inputClass}
            value={values.lastName}
            onChange={set('lastName')}
            autoComplete="family-name"
          />
        </Field>
      </div>

      <Field label="Email" error={errors.email}>
        <input
          type="email"
          className={inputClass}
          value={values.email}
          onChange={set('email')}
          autoComplete="email"
        />
      </Field>

      <Field label="Password" error={errors.password}>
        <input
          type="password"
          className={inputClass}
          value={values.password}
          onChange={set('password')}
          autoComplete="new-password"
        />
      </Field>

      {formError && <div className="text-red-600 text-sm" role="alert">{formError}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
