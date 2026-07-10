import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export default function DaysPieChart({ homeDays, internationalDays }) {
  const total = homeDays + internationalDays;

  if (total === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl h-[300px] flex items-center justify-center">
        <p className="text-slate-500">No travel data available</p>
      </div>
    );
  }
  const data = [
    { name: "Home Stay", value: homeDays },
    { name: "Abroad Stay", value: internationalDays },
  ];

  const COLORS = ["#10B981", "#3B82F6"];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl h-[300px] flex flex-col">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">
        Stay Distribution across Home Vs Abroad Destinations
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0F172A",
                color: "#FFF",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

