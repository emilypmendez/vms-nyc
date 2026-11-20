import { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/fetchApi';

function BarChart({ title, items, color }) {
  const max = Math.max(
    1,
    ...items.map((item) => Number(item.count) || 0)
  );

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">{title}</h2>

      <div className="space-y-5">
        {items.map((item) => {
          const count = Number(item.count) || 0;

          return (
            <div key={item.label}>
              <div className="flex justify-between mb-2 text-sm">
                <span className="font-medium">{item.label}</span>
                <span>{count}</span>
              </div>

              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{
                    width: `${(count / max) * 100}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardCharts() {
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    fetchApi('/api/admin/charts')
      .then((result) => {
        if (active) setCharts(result.data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold mb-4">
        Platform Reports
      </h2>

      {loading && <p>Loading charts...</p>}

      {error && (
        <p className="text-red-600">Error: {error}</p>
      )}

      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart
            title="Opportunities by Borough"
            items={charts.opportunitiesByBorough || []}
            color="bg-blue-600"
          />

          <BarChart
            title="Applications by Status"
            items={charts.applicationsByStatus || []}
            color="bg-green-600"
          />
        </div>
      )}
    </section>
  );
}
