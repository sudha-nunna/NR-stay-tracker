import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateDaysBetween } from '../../utils/dateHelpers';
export default function CountryWiseChart({ records }) {
  const counts = {};
  records.forEach(r => {
   if (r.toCountry) {
  const days = calculateDaysBetween(
    r.departureDate,
    r.arrivalDate
  );

  counts[r.toCountry] =
    (counts[r.toCountry] || 0) + days;
}
  });

  const data = Object.keys(counts).map(country => ({
    Country: country,
    Visits: counts[country]
  })).sort((a,b) => b.Visits - a.Visits).slice(0, 5);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl h-[300px] flex flex-col">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Destination Footprint Map</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
            <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="Country" type="category" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '11px' }} />
            <Bar dataKey="Visits" fill="#EC4899" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

