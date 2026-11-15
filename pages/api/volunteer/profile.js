import { createClient } from '@supabase/supabase-js';
import {
  AVAILABILITY_VALUES,
  BOROUGH_VALUES,
  SKILL_VALUES,
} from '../../../lib/volunteerOptions';

const NAME_MAX = 50;
const BIO_MAX = 1000;

// A client scoped to the caller's JWT, so Supabase RLS sees auth.uid()
// and only lets the volunteer read/update their own row.
function supabaseForToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

function formatProfile(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    skills: row.skills ?? [],
    borough: row.borough,
    availability: row.availability,
    bio: row.bio,
    updatedAt: row.updated_at,
  };
}

// Returns { errors, values }. errors is null when the input is valid.
function validateProfile(body = {}) {
  const errors = {};
  const { firstName, lastName, skills, borough, availability, bio } = body;

  const cleanName = (value, label) => {
    if (typeof value !== 'string' || !value.trim()) {
      return { error: `${label} is required` };
    }
    if (value.trim().length > NAME_MAX) {
      return { error: `${label} must be ${NAME_MAX} characters or fewer` };
    }
    return { value: value.trim() };
  };

  const first = cleanName(firstName, 'First name');
  const last = cleanName(lastName, 'Last name');
  if (first.error) errors.firstName = first.error;
  if (last.error) errors.lastName = last.error;

  let cleanSkills = [];
  if (skills !== undefined && skills !== null) {
    if (!Array.isArray(skills)) {
      errors.skills = 'Skills must be an array';
    } else {
      const invalid = skills.filter((s) => !SKILL_VALUES.includes(s));
      if (invalid.length) {
        errors.skills = `Unknown skill(s): ${invalid.join(', ')}`;
      } else {
        cleanSkills = [...new Set(skills)];
      }
    }
  }

  if (!BOROUGH_VALUES.includes(borough)) {
    errors.borough = `Borough must be one of: ${BOROUGH_VALUES.join(', ')}`;
  }

  let cleanAvailability = null;
  if (availability !== undefined && availability !== null && availability !== '') {
    if (!AVAILABILITY_VALUES.includes(availability)) {
      errors.availability = `Availability must be one of: ${AVAILABILITY_VALUES.join(', ')}`;
    } else {
      cleanAvailability = availability;
    }
  }

  let cleanBio = null;
  if (bio !== undefined && bio !== null) {
    if (typeof bio !== 'string') {
      errors.bio = 'Bio must be text';
    } else if (bio.length > BIO_MAX) {
      errors.bio = `Bio must be ${BIO_MAX} characters or fewer`;
    } else {
      cleanBio = bio.trim() || null;
    }
  }

  if (Object.keys(errors).length) return { errors, values: null };

  return {
    errors: null,
    values: {
      first_name: first.value,
      last_name: last.value,
      skills: cleanSkills,
      borough,
      availability: cleanAvailability,
      bio: cleanBio,
    },
  };
}

export default async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const supabase = supabaseForToken(token);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('volunteers')
        .select('id, email, first_name, last_name, skills, borough, availability, bio, updated_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      if (!data) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      return res.status(200).json({ success: true, data: formatProfile(data) });
    }

    // PUT
    const { errors, values } = validateProfile(req.body);
    if (errors) {
      return res.status(422).json({
        success: false,
        error: 'Invalid profile data',
        details: errors,
      });
    }

    const { data, error } = await supabase
      .from('volunteers')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('id, email, first_name, last_name, skills, borough, availability, bio, updated_at')
      .maybeSingle();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (!data) {
      // No row matched: either no volunteer profile, or RLS blocked the update.
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    return res.status(200).json({ success: true, data: formatProfile(data) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
