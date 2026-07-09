import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribeToTravelRecords } from "../firebase/firestoreService";
import { calculateResidencyStatus } from "../utils/residencyCalculator";
import { countries } from "../utils/countries";
import DaysPieChart from "../components/analytics/DaysPieChart";
import MonthlyBarChart from "../components/analytics/MonthlyBarChart";
import CountryWiseChart from "../components/analytics/CountryWiseChart";
import { BiLoaderAlt } from "react-icons/bi";
import { FiGlobe } from "react-icons/fi";

export default function Analytics() {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // State hook to filter and lock down singular view configurations for the workspace widget
  const [selectedCountryCode, setSelectedCountryCode] = useState("");

  // Helper function to resolve country codes into full names
  const getFullCountryName = (code) => {
    if (!code) return "Unknown Base";
    const match = countries.find(
      (c) => c.code.toUpperCase() === code.toUpperCase(),
    );
    return match ? match.name : code;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) return;
    const unsubscribe = subscribeToTravelRecords(user.uid, (data) => {
      setRecords(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Handle dropdown setting stabilization upon data load state completion
  useEffect(() => {
    if (loading) return;
    const defaultBase = profile?.homeCountry || profile?.nativeCountry || "IN";
    setSelectedCountryCode(defaultBase);
  }, [loading, profile]);

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <BiLoaderAlt className="animate-spin text-blue-600 text-3xl" />
      </div>
    );
  }

  const calculation = calculateResidencyStatus(records, profile);

  const homeDays = records.length > 0 ? calculation.homeDays || 0 : 0;
  const internationalDays =
    records.length > 0 ? calculation.outsideDays || 0 : 0;
  const definedMilestone = parseInt(profile?.residencyThreshold || "183", 10);
  const hasValidTravelRecords = records.some(
    (record) =>
      record?.arrivalDate && record?.departureDate && record?.toCountry,
  );

  // Pre-calculate multi-country maps inside the analytics data framework
  const primaryCountryCode =
    profile?.homeCountry || profile?.nativeCountry || "IN";
  const countryDaysMap = { [primaryCountryCode]: 0 };

  if (hasValidTravelRecords) {
    records.forEach((r) => {
      if (!r.departureDate || !r.arrivalDate || !r.toCountry) return;
      const d1 = new Date(r.departureDate);
      const d2 = new Date(r.arrivalDate);
      const diffDays = Math.max(
        1,
        Math.round(Math.abs((d2 - d1) / (24 * 60 * 60 * 1000))) + 1,
      );
      countryDaysMap[r.toCountry] =
        (countryDaysMap[r.toCountry] || 0) + diffDays;
    });
  }

  const targetDropdownSelectionCode = selectedCountryCode || primaryCountryCode;
  const activeDaysLogged = countryDaysMap[targetDropdownSelectionCode] || 0;
  const isActivePrimaryBase =
    targetDropdownSelectionCode === primaryCountryCode;
  const activeLocalThreshold = isActivePrimaryBase ? definedMilestone : 90;
  const activeAllocatedPercentage = Math.min(
    Math.round((activeDaysLogged / activeLocalThreshold) * 100),
    100,
  );

  return (
    <div className="space-y-6 relative z-10 text-left">
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
            Total Stay Days
          </p>
          <h2 className="text-2xl font-bold">{homeDays + internationalDays}</h2>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-base text-slate-500">Home Country Days</p>
          <h2 className="text-4xl font-bold text-green-600 mt-3">{homeDays}</h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-base text-slate-500">International Days</p>
          <h2 className="text-4xl font-bold text-blue-600 mt-3">
            {internationalDays}
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-base text-slate-500">Countries Visited</p>
          <h2 className="text-4xl font-bold text-purple-600 mt-3">
            {new Set(records.map((r) => r.toCountry).filter(Boolean)).size}
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-base text-slate-500">Residency Progress</p>
          <h2 className="text-2xl font-bold text-indigo-600 mt-3">
            {calculation.status}
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-base text-slate-500">Days Remaining</p>
          <h2 className="text-4xl font-bold text-orange-600 mt-3">
            {calculation.daysRemaining}
          </h2>
        </div>
      </div>
      {/* MULTI-OFFICE SPLIT JOURNEY PLANNER (SUCCESSFULLY MOVED TO THE BOTTOM OF ANALYTICS) */}
      <div className="bg-gradient-to-br from-green-100 to-indigo-100 border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FiGlobe className="text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-900">
                Multi-Office Split Journey Planner
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live presence allocation tracking across all global operational
                office bases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
              Select Jurisdiction:
            </label>
            <select
              value={targetDropdownSelectionCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm hover:border-slate-300 transition outline-none cursor-pointer"
            >
              {Object.keys(countryDaysMap).map((code) => (
                <option key={code} value={code}>
                  {code} - {getFullCountryName(code)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-800 text-white font-bold text-xs uppercase tracking-wider">
                {targetDropdownSelectionCode}
              </span>
              <span className="text-xs font-bold text-slate-700">
                {isActivePrimaryBase
                  ? `${getFullCountryName(targetDropdownSelectionCode)} (Primary Tax & Residency Base)`
                  : `${getFullCountryName(targetDropdownSelectionCode)} (Satellite Regional Office Base)`}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              <span className="text-slate-900 font-bold">
                {activeDaysLogged}
              </span>{" "}
              / {activeLocalThreshold} Days Logged
            </div>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isActivePrimaryBase ? "bg-gradient-to-r from-blue-500 to-indigo-600" : activeDaysLogged > 75 ? "bg-red-500" : "bg-purple-500"}`}
              style={{ width: `${activeAllocatedPercentage}%` }}
            ></div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium flex justify-between">
            <span>
              {isActivePrimaryBase
                ? activeDaysLogged >= activeLocalThreshold
                  ? "✓ Status locked. Safe to depart to global satellite offices."
                  : `Requires ${activeLocalThreshold - activeDaysLogged} more days here to secure primary residency.`
                : activeDaysLogged > 75
                  ? "⚠️ Proximity Alert: Approaching local physical stay cap rules. Plan exit soon."
                  : `Safe Zone: You can comfortably spend up to ${activeLocalThreshold - activeDaysLogged} more days at this office.`}
            </span>
            <span className="italic text-slate-400">
              {activeAllocatedPercentage}% Capacity Utilized
            </span>
          </div>
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
