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

  const countryDaysMap = {
    [primaryCountryCode]: calculation.homeDays || 0,
  };

  if (hasValidTravelRecords) {
    records.forEach((r) => {
      if (!r.departureDate || !r.arrivalDate || !r.toCountry) return;

      const targetCountry = r.toCountry.toUpperCase();

      if (targetCountry === primaryCountryCode.toUpperCase()) {
        return; // already covered by calculation.homeDays
      }

      const d1 = new Date(r.departureDate);
      const d2 = new Date(r.arrivalDate);

      const diffDays = Math.floor((d2 - d1) / (24 * 60 * 60 * 1000)) + 1;

      countryDaysMap[targetCountry] =
        (countryDaysMap[targetCountry] || 0) + Math.max(diffDays, 1);
    });
  }

  const targetDropdownSelectionCode = selectedCountryCode || primaryCountryCode;
  const activeDaysLogged = countryDaysMap[targetDropdownSelectionCode] || 0;
  const totalStayDays = homeDays + internationalDays;
  const isActivePrimaryBase =
    targetDropdownSelectionCode === primaryCountryCode;
  
  const activeLocalThreshold = isActivePrimaryBase
  ? definedMilestone
  : Math.max(...Object.values(countryDaysMap), 1);

const activeAllocatedPercentage = Math.min(
  Math.round((activeDaysLogged / activeLocalThreshold) * 100),
  100,
);
  
  return (
    <div className="space-y-6 relative z-10 text-left">
      {/* Updated items alignment and gap to prevent overlapping or crushing on small screens */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-blue-800">
            Comprehensive travel and residency insights.
          </p>
        </div>

        {/* Added shrink-0 and text-center to keep the badge perfectly shaped and aligned on mobile */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-lg shrink-0 text-center w-max ml-auto">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide opacity-80 whitespace-nowrap">
            Total Stay Days
          </p>
          <h2 className="text-xl sm:text-2xl font-bold mt-0.5">{homeDays + internationalDays}</h2>
        </div>
      </div>
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-base text-slate-500">Home Country Days</p>
          <h2 className="text-4xl font-bold text-green-600 mt-3">{homeDays}</h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-base text-slate-500">Abroad Days</p>
          <h2 className="text-4xl font-bold text-blue-600 mt-3">
            {internationalDays}
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

      {/* MULTI-OFFICE SPLIT JOURNEY PLANNER */}
      {/* MULTI-OFFICE SPLIT JOURNEY PLANNER */}
      <div className="bg-gradient-to-br from-green-100 to-indigo-100 border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 pb-4 mb-6 w-full">
          <div className="flex items-start gap-3 min-w-0 w-full">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <FiGlobe className="text-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900 break-words">
                Multi-Office Split Journey Planner
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Live presence allocation tracking across all global operational
                office bases.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto shrink-0">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block sm:inline">
              Select Country:
            </label>
            
            <select
              value={targetDropdownSelectionCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm hover:border-slate-300 transition outline-none cursor-pointer max-w-xs"
            >
              {Object.keys(countryDaysMap).map((code) => (
                <option key={code} value={code}>
                  {code === "ABROAD"
                    ? "MANUAL ENTRY"
                    : `${code} - ${getFullCountryName(code)}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 w-full flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-800 text-white font-bold text-xs uppercase tracking-wider shrink-0">
                {targetDropdownSelectionCode === "ABROAD"
                  ? "MANUAL ENTRY"
                  : targetDropdownSelectionCode}
              </span>
              <span className="text-xs font-bold text-slate-700 truncate block sm:inline">
                {isActivePrimaryBase
                  ? `${getFullCountryName(targetDropdownSelectionCode)} (Primary Tax & Residency Base)`
                  : `${getFullCountryName(targetDropdownSelectionCode)} (Satellite Regional Office Base)`}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500 shrink-0 whitespace-nowrap">
              <span className="text-slate-900 font-bold">
                {activeDaysLogged}
              </span>{" "}
              Days Stayed
            </div>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden block relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${isActivePrimaryBase ? "bg-gradient-to-r from-blue-500 to-indigo-600" : activeDaysLogged > 75 ? "bg-red-500" : "bg-purple-500"}`}
              style={{ width: `${activeAllocatedPercentage}%` }}
            ></div>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 font-medium flex flex-col sm:flex-row justify-between gap-1 w-full">
            <span className="break-words">
              Total days recorded in{" "}
              <strong>{getFullCountryName(targetDropdownSelectionCode)}</strong>{" "}
              : <strong>{activeDaysLogged}</strong> Days
            </span>

            {/* <span className="italic text-slate-400 shrink-0 whitespace-nowrap">
              {activeAllocatedPercentage}% of highest stay
            </span> */}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-slate-600">
              All Countries Total Stay Days
            </span>

            <span className="font-bold text-slate-900">
              {totalStayDays} Days
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
