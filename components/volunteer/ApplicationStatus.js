const STYLES = {
  pending: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  accepted: 'bg-green-100 text-green-800 ring-green-600/20',
  rejected: 'bg-red-100 text-red-800 ring-red-600/20',
};

const LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export default function ApplicationStatus({ status }) {
  const style = STYLES[status] ?? 'bg-gray-100 text-gray-700 ring-gray-500/20';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
