import Link from 'next/link';
import { BOROUGHS, COMMITMENTS, labelFor } from '../../lib/opportunity';

export default function OpportunityCard({ opportunity }) {
  const description = opportunity.description || '';
  const preview = description.length > 120 ? `${description.slice(0, 120)}...` : description;

  return (
    <div className="border rounded p-4 hover:shadow-lg transition flex flex-col">
      <h3 className="font-bold text-lg">{opportunity.title}</h3>
      {opportunity.organizationName && (
        <p className="text-sm text-gray-600">{opportunity.organizationName}</p>
      )}
      <p className="text-sm mt-2 flex-1">{preview}</p>

      <div className="flex flex-wrap gap-2 mt-4">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {labelFor(COMMITMENTS, opportunity.commitment)}
        </span>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          {opportunity.slotsAvailable} slot{opportunity.slotsAvailable === 1 ? '' : 's'}
        </span>
        {opportunity.borough && (
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
            {labelFor(BOROUGHS, opportunity.borough)}
          </span>
        )}
        {(opportunity.requiredSkills || []).map((skill) => (
          <span key={skill} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
            {skill}
          </span>
        ))}
      </div>

      <Link
        href={`/volunteer/opportunity/${opportunity.id}`}
        className="text-blue-600 text-sm mt-4 block hover:underline"
      >
        View Details
      </Link>
    </div>
  );
}
