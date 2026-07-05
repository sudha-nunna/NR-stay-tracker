import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { calculateDaysBetween } from "../../utils/dateHelpers";
export default function MonthlyBarChart({ records, homeCountryCode = "US" }) {
  const currentYear = new Date().getFullYear();

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    name: new Date(currentYear, i, 1).toLocaleString("default", {
      month: "short",
    }),
    Days: 0,
  }));

  records.forEach((r) => {
    if (!r.departureDate) return;
    const month = new Date(r.departureDate).getMonth();
    if (month >= 0 && month < 12 && r.toCountry === homeCountryCode) {
      const stayDays = calculateDaysBetween(r.departureDate, r.arrivalDate);

      monthlyData[month].Days += stayDays;
    }
  });

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl h-[300px] flex flex-col">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">
        Monthly Inflow Stay Metrics
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#F1F5F9"
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#94A3B8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94A3B8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0F172A",
                color: "#FFF",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
            <Bar dataKey="Days" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


