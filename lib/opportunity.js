// Shared opportunity constants, validation, and formatting.
// Safe to import from both API routes and React components (no server-only code).

export const BOROUGHS = [
  { value: 'manhattan', label: 'Manhattan' },
  { value: 'brooklyn', label: 'Brooklyn' },
  { value: 'queens', label: 'Queens' },
  { value: 'bronx', label: 'Bronx' },
  { value: 'staten_island', label: 'Staten Island' },
];

export const COMMITMENTS = [
  { value: 'one-time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'filled', label: 'Filled' },
  { value: 'closed', label: 'Closed' },
];

const values = (list) => list.map((item) => item.value);

export function labelFor(list, value) {
  return list.find((item) => item.value === value)?.label || value || '';
}

/** Accept an array or a comma-separated string; return a clean, de-duplicated array. */
export function parseSkills(input) {
  const raw = Array.isArray(input) ? input : String(input ?? '').split(',');
  const cleaned = raw
    .map((skill) => String(skill).trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(cleaned)];
}

const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const blankToNull = (value) => (value === '' || value === undefined ? null : value);

/**
 * Validate an opportunity payload (camelCase, as sent by the frontend).
 *
 * `partial: true` validates only the fields that are present (for PUT).
 * Returns `{ errors, row }`: `errors` is a field -> message map (empty when
 * valid); `row` holds only the provided fields, as snake_case DB columns.
 */
export function validateOpportunity(body = {}, { partial = false } = {}) {
  const errors = {};
  const row = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has('title')) {
    const title = String(body.title ?? '').trim();
    if (!title) errors.title = 'Title is required';
    else if (title.length > 200) errors.title = 'Title must be 200 characters or fewer';
    else row.title = title;
  }

  if (!partial || has('description')) {
    const description = String(body.description ?? '').trim();
    if (!description) errors.description = 'Description is required';
    else row.description = description;
  }

  if (!partial || has('commitment')) {
    const commitment = body.commitment || 'one-time';
    if (!values(COMMITMENTS).includes(commitment)) {
      errors.commitment = `Commitment must be one of: ${values(COMMITMENTS).join(', ')}`;
    } else row.commitment = commitment;
  }

  if (!partial || has('slotsAvailable')) {
    const raw = body.slotsAvailable ?? 1;
    const slots = Number(raw);
    if (!Number.isInteger(slots) || slots < 1) {
      errors.slotsAvailable = 'Slots must be a whole number of at least 1';
    } else row.slots_available = slots;
  }

  if (has('requiredSkills')) row.required_skills = parseSkills(body.requiredSkills);
  else if (!partial) row.required_skills = [];

  if (!partial || has('borough')) {
    const borough = blankToNull(body.borough);
    if (borough !== null && !values(BOROUGHS).includes(borough)) {
      errors.borough = `Borough must be one of: ${values(BOROUGHS).join(', ')}`;
    } else row.borough = borough;
  }

  if (!partial || has('location')) {
    row.location = blankToNull(String(body.location ?? '').trim());
  }

  for (const [key, column] of [['startDate', 'start_date'], ['endDate', 'end_date']]) {
    if (!partial || has(key)) {
      const date = blankToNull(body[key]);
      if (date !== null && !isDate(date)) errors[key] = 'Use the format YYYY-MM-DD';
      else row[column] = date;
    }
  }

  if (row.start_date && row.end_date && row.end_date < row.start_date) {
    errors.endDate = 'End date cannot be before start date';
  }

  // Status is only set on update; new opportunities always start as 'open'.
  if (partial && has('status')) {
    if (!values(STATUSES).includes(body.status)) {
      errors.status = `Status must be one of: ${values(STATUSES).join(', ')}`;
    } else row.status = body.status;
  }

  return { errors, row };
}

/** Convert a DB row (snake_case, optionally with joins) to the API's camelCase shape. */
export function formatOpportunity(opp) {
  const org = opp.organizations;
  const countRow = Array.isArray(opp.applications) ? opp.applications[0] : null;

  const formatted = {
    id: opp.id,
    title: opp.title,
    description: opp.description,
    organizationId: opp.organization_id ?? org?.id ?? null,
    requiredSkills: opp.required_skills ?? [],
    commitment: opp.commitment,
    startDate: opp.start_date,
    endDate: opp.end_date,
    slotsAvailable: opp.slots_available,
    location: opp.location,
    borough: opp.borough,
    status: opp.status,
    createdAt: opp.created_at,
    updatedAt: opp.updated_at,
  };

  if (org) {
    formatted.organizationName = org.name ?? null;
    if (org.email !== undefined) formatted.organizationEmail = org.email;
  }
  if (countRow && typeof countRow.count === 'number') {
    formatted.totalApplications = countRow.count;
  }

  // Drop keys that weren't selected so responses stay tidy.
  return Object.fromEntries(Object.entries(formatted).filter(([, v]) => v !== undefined));
}
