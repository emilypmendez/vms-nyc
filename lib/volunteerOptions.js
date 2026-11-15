// Allowed values for volunteer profile fields.
// Shared by the API (validation) and the UI (form options) so they never drift.
// Values are stored lowercase in Supabase; labels are for display only.

export const BOROUGHS = [
  { value: 'manhattan', label: 'Manhattan' },
  { value: 'brooklyn', label: 'Brooklyn' },
  { value: 'queens', label: 'Queens' },
  { value: 'bronx', label: 'The Bronx' },
  { value: 'staten_island', label: 'Staten Island' },
];

export const SKILLS = [
  { value: 'teaching', label: 'Teaching' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'mentoring', label: 'Mentoring' },
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'translation', label: 'Translation' },
  { value: 'event_setup', label: 'Event Setup' },
  { value: 'food_service', label: 'Food Service' },
  { value: 'cleanup', label: 'Cleanup' },
  { value: 'tech_support', label: 'Tech Support' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'first_aid', label: 'First Aid' },
];

export const AVAILABILITY = [
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'evenings', label: 'Evenings' },
  { value: 'flexible', label: 'Flexible' },
];

export const BOROUGH_VALUES = BOROUGHS.map((b) => b.value);
export const SKILL_VALUES = SKILLS.map((s) => s.value);
export const AVAILABILITY_VALUES = AVAILABILITY.map((a) => a.value);

const labelFor = (options) => (value) =>
  options.find((o) => o.value === value)?.label ?? value;

export const boroughLabel = labelFor(BOROUGHS);
export const skillLabel = labelFor(SKILLS);
export const availabilityLabel = labelFor(AVAILABILITY);
