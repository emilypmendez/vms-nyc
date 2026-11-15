import Link from 'next/link';

export default function OpportunityCard({ opportunity }) {
  return (
    <div className="border rounded p-4 hover:shadow-lg transition">
      <h3 className="font-bold text-lg">{opportunity.title}</h3>
      <p className="text-sm text-gray-600">{opportunity.organizationName}</p>
      <p className="text-sm mt-2">{opportunity.description.substring(0, 100)}...</p>
      <div className="flex gap-2 mt-4">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {opportunity.commitment}
        </span>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          {opportunity.slotsAvailable} slots
        </span>
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
