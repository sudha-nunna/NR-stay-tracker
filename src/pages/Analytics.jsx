import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribeToTravelRecords } from "../firebase/firestoreService";
import { calculateResidencyStatus } from "../utils/residencyCalculator";
import DaysPieChart from "../components/analytics/DaysPieChart";
import MonthlyBarChart from "../components/analytics/MonthlyBarChart";
import CountryWiseChart from "../components/analytics/CountryWiseChart";
import { BiLoaderAlt } from "react-icons/bi";

export default function Analytics() {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTravelRecords(user.uid, (data) => {
      setRecords(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <BiLoaderAlt className="animate-spin text-blue-600 text-3xl" />
      </div>
    );
  }

  const calculation = calculateResidencyStatus(records, profile);

  // Dynamic status evaluation framework matching strict data check boundaries
  const homeDays = records.length > 0 ? (calculation.homeDays || 0) : 0;
  const internationalDays = records.length > 0 ? (calculation.outsideDays || 0) : 0;

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-slate-500">
            Comprehensive travel and residency insights.
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-2xl shadow-lg">
          <p className="text-xs uppercase tracking-wide opacity-80">
            Total Records
          </p>
          <h2 className="text-2xl font-bold">{records.length}</h2>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Home Country Days</p>
          <h2 className="text-4xl font-bold text-green-600 mt-3">{homeDays}</h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">International Days</p>
          <h2 className="text-4xl font-bold text-blue-600 mt-3">
            {internationalDays}
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Countries Visited</p>
          <h2 className="text-4xl font-bold text-purple-600 mt-3">
            {new Set(records.map((r) => r.toCountry).filter(Boolean)).size}
          </h2>
        </div>
        
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Residency Status</p>
          <h2 className="text-2xl font-bold text-indigo-600 mt-3">
            {calculation.status}
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Days Remaining</p>
          <h2 className="text-4xl font-bold text-orange-600 mt-3">
            {calculation.daysRemaining}
          </h2>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4">
          <DaysPieChart
            homeDays={homeDays}
            internationalDays={internationalDays}
          />
        </div>

        <div className="xl:col-span-4">
          <MonthlyBarChart
            records={records}
            homeCountryCode={profile?.homeCountry}
          />
        </div>

        <div className="xl:col-span-4">
          <CountryWiseChart records={records} />
        </div>
      </div>
    </div>
  );
}