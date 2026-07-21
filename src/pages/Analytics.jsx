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

  // if (hasValidTravelRecords) {
  //   records.forEach((r) => {
  //     if (!r.departureDate || !r.arrivalDate || !r.toCountry) return;

  //     const targetCountry = r.toCountry.toUpperCase();

  //     if (targetCountry === primaryCountryCode.toUpperCase()) {
  //       return; // already covered by calculation.homeDays
  //     }

  //     const d1 = new Date(r.departureDate);
  //     const d2 = new Date(r.arrivalDate);

  //     const diffDays = Math.floor((d2 - d1) / (24 * 60 * 60 * 1000)) + 1;

  //     countryDaysMap[targetCountry] =
  //       (countryDaysMap[targetCountry] || 0) + Math.max(diffDays, 1);
  //   });
  // }

  if (hasValidTravelRecords) {
    records.forEach((r) => {
      if (!r.departureDate || !r.arrivalDate) return;

      const d1 = new Date(r.departureDate);
      const d2 = new Date(r.arrivalDate);
      const diffDays = Math.floor((d2 - d1) / (24 * 60 * 60 * 1000)) + 1;
      const stayDuration = Math.max(diffDays, 1);

      // Check if entry type is explicitly daily check-in or country change
      const isExplicitCountryTracking =
        r.type === "checkin" ||
        r.type === "countryChange" ||
        r.entryMethod === "dailyCheckIn" ||
        r.entryMethod === "countryChange";

      let targetCountry = (r.toCountry || "").toUpperCase();

      // Home country is handled separately
      if (targetCountry === primaryCountryCode.toUpperCase()) {
        return;
      }

      // If it is NOT explicit check-in or country change OR country code is missing/generic, route to MANUAL ENTRY (ABROAD)
      if (!isExplicitCountryTracking || !targetCountry || targetCountry === "MANUAL" || targetCountry === "OTHER") {
        targetCountry = "ABROAD";
      }

      countryDaysMap[targetCountry] =
        (countryDaysMap[targetCountry] || 0) + stayDuration;
    });
  }

  // const targetDropdownSelectionCode = selectedCountryCode || primaryCountryCode;
  // const activeDaysLogged = countryDaysMap[targetDropdownSelectionCode] || 0;
  // const totalStayDays = homeDays + internationalDays;
  // const isActivePrimaryBase =
  //   targetDropdownSelectionCode === primaryCountryCode;

  // const activeLocalThreshold = isActivePrimaryBase
  //   ? definedMilestone
  //   : Math.max(...Object.values(countryDaysMap), 1);

  // const activeAllocatedPercentage = Math.min(
  //   Math.round((activeDaysLogged / activeLocalThreshold) * 100),
  //   100,
  // );
  // Calculate dynamic options list for single dropdown tracker
  const isOverallAbroadSelected = selectedCountryCode === "TOTAL_ABROAD";
  const targetDropdownSelectionCode = selectedCountryCode || primaryCountryCode;

  // Compute display variables dynamically based on single dropdown choice
  let activeDaysLogged = 0;
  let activeAllocatedPercentage = 0;
  let activeTargetMilestone = definedMilestone;
  let activeCardLabel = "";

  if (isOverallAbroadSelected) {
    activeDaysLogged = internationalDays;
    activeAllocatedPercentage = Math.min(
      Math.round((internationalDays / definedMilestone) * 100),
      100
    );
    activeTargetMilestone = definedMilestone;
    activeCardLabel = "Total Abroad Stay Progress (Outside Home Country)";
  } else {
    activeDaysLogged = countryDaysMap[targetDropdownSelectionCode] || 0;
    const isActivePrimaryBase = targetDropdownSelectionCode === primaryCountryCode;
    activeTargetMilestone = isActivePrimaryBase
      ? definedMilestone
      : Math.max(...Object.values(countryDaysMap), 1);

    activeAllocatedPercentage = Math.min(
      Math.round((activeDaysLogged / activeTargetMilestone) * 100),
      100
    );

    activeCardLabel =
      targetDropdownSelectionCode === "ABROAD"
        ? "Manual Travel Entries (Non-Daily Checkin)"
        : isActivePrimaryBase
        ? `${getFullCountryName(targetDropdownSelectionCode)} (Primary Home Base)`
        : `${getFullCountryName(targetDropdownSelectionCode)} (Specific Country Tracking)`;
  }

  const totalStayDays = homeDays + internationalDays;

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
          <h2 className="text-xl sm:text-2xl font-bold mt-0.5">
            {homeDays + internationalDays}
          </h2>
        </div>
      </div>

      {/* MULTI-OFFICE SPLIT JOURNEY PLANNER & SINGLE Dynamic TRACKER */}
      <div className="bg-gradient-to-br from-green-100 to-indigo-100 border border-slate-200 rounded-2xl p-4 shadow-sm w-full space-y-3">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200/60 pb-3 w-full">
          <div className="flex items-start gap-3 min-w-0 w-full">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <FiGlobe className="text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-900">
                Multi-Office Split & Global Journey Planner
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Tracks Daily Check-ins, Country Changes, and Manual Entries seamlessly.
              </p>
            </div>
          </div>

          <div className="flex flex-row items-center gap-1.5 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
             Select Country:
            </label>

            <select
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg shadow-sm outline-none cursor-pointer min-w-[160px] focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TOTAL_ABROAD">✈️ ALL ABROAD STAYS</option>
              {Object.keys(countryDaysMap).map((code) => (
                <option key={code} value={code}>
                  {code === "ABROAD"
                    ? "MANUAL ENTRY (ABROAD)"
                    : `${code} - ${getFullCountryName(code)}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SINGLE UNIFIED DYNAMIC TRACKER CARD */}
        <div className="border border-slate-200/80 rounded-xl p-3.5 bg-white w-full space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-800 text-white font-bold text-xs tracking-wider shrink-0">
                {isOverallAbroadSelected
                  ? "ABROAD"
                  : targetDropdownSelectionCode === "ABROAD"
                  ? "MANUAL ENTRY"
                  : targetDropdownSelectionCode}
              </span>
              <span className="text-xs font-bold text-slate-800 truncate">
                {activeCardLabel}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-600 shrink-0">
              <span className="text-slate-900 font-bold text-sm">
                {activeDaysLogged}
              </span>{" "}
              Days Stayed ({activeAllocatedPercentage}%)
            </div>
          </div>

          {/* DYNAMIC PROGRESS BAR */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isOverallAbroadSelected
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                  : targetDropdownSelectionCode === primaryCountryCode
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                  : targetDropdownSelectionCode === "ABROAD"
                  ? "bg-amber-500"
                  : "bg-purple-600"
              }`}
              style={{ width: `${activeAllocatedPercentage}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium pt-0.5">
            <span>
              Days Recorded: <strong className="text-slate-800">{activeDaysLogged} Days</strong>
            </span>
            <span>
              Target Days: <strong className="text-slate-800">{activeTargetMilestone} Days</strong>
            </span>
          </div>
        </div>

        {/* FOOTER STATS */}
        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">
            Total Days Tracked:
          </span>
          <span className="font-bold text-slate-900 text-sm">
            {totalStayDays} Days
          </span>
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
