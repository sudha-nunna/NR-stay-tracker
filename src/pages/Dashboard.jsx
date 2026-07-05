import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribeToTravelRecords } from "../firebase/firestoreService";
import { calculateResidencyStatus } from "../utils/residencyCalculator";
import * as XLSX from "xlsx";

import {
  FiClock,
  FiMapPin,
  FiCalendar,
  FiShield,
  FiAlertTriangle,
  FiTrendingUp,
  FiGlobe,
  FiTrendingDown,
  FiDownloadCloud,
} from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToTravelRecords(
      user.uid,
      (fetchedRecords) => {
        setRecords(fetchedRecords);
        setMetricsLoading(false);
      },
      (error) => {
        console.error(error);
        setMetricsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  if (metricsLoading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <BiLoaderAlt className="animate-spin text-white text-3xl" />
      </div>
    );
  }

  const calculation = calculateResidencyStatus(records, profile);

  const homeCountryName =
    profile?.homeCountry || profile?.nativeCountry || "Configuring Base...";
  const targetTimezone = profile?.timezone || "Not Set";
  const horizonPeriodStart =
    profile?.residencyPeriodStart || profile?.fyStart || "Start Date Open";
  const horizonPeriodEnd =
    profile?.residencyPeriodEnd || profile?.fyEnd || "End Date Open";
  const definedMilestone = parseInt(profile?.residencyThreshold || "183", 10);
  const hasValidTravelRecords = records.some(
    (record) =>
      record?.arrivalDate && record?.departureDate && record?.toCountry,
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "Resident":
        return "bg-green-100 text-green-700 border-green-200";
      case "Temporary Resident":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-orange-100 text-orange-700 border-orange-200";
    }
  };

  const getRunwayMetrics = () => {
    const targetEnd = profile?.residencyPeriodEnd || profile?.fyEnd;
    const targetStart = profile?.residencyPeriodStart || profile?.fyStart;

    if (!targetEnd || !hasValidTravelRecords) {
      return { daysLeftInPeriod: 0, isPossible: true };
    }

    const endDate = new Date(targetEnd);
    const startDate = new Date(targetStart || targetEnd);
    const today = new Date();

    const dayInMilliseconds = 24 * 60 * 60 * 1000;
    const periodDays = Math.max(
      1,
      Math.round((endDate - startDate) / dayInMilliseconds) + 1,
    );
    const daysElapsed = Math.max(
      0,
      Math.round((today - startDate) / dayInMilliseconds),
    );
    const daysLeftInPeriod = Math.max(0, periodDays - daysElapsed);
    const isStillPossible = daysLeftInPeriod >= calculation.daysRemaining;

    return {
      daysLeftInPeriod,
      isPossible: isStillPossible,
    };
  };
  const runway = getRunwayMetrics();

  const handleExportData = () => {
    if (records.length === 0) return;

    const structuredRows = records.map((record, index) => ({
      "Log Index": records.length - index,
      "Origin Country": record.fromCountry || "N/A",
      "Destination Country": record.toCountry || "N/A",
      "Departure Date": record.departureDate || "N/A",
      "Arrival Date": record.arrivalDate || "N/A",
      "Purpose of Travel": record.purpose || "Automated System Entry",
      "GPS Latitude": record.latitude || "N/A",
      "GPS Longitude": record.longitude || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(structuredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Travel History Logs");

    const maxColumnWidths = Object.keys(structuredRows[0] || {}).map((key) => {
      const headerLength = key.length;
      const longestCellLength = structuredRows.reduce(
        (max, row) => Math.max(max, String(row[key] || "").length),
        0,
      );
      return { wch: Math.max(headerLength, longestCellLength) + 3 };
    });
    worksheet["!cols"] = maxColumnWidths;

    XLSX.writeFile(workbook, `Residency_Audit_Report_${homeCountryName}.xlsx`);
  };

  const cards = [
    {
      title: "Home Tracking Country",
      value: homeCountryName,
      icon: FiMapPin,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Standard Timezone",
      value: targetTimezone,
      icon: FiClock,
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      title: "Tracking Horizon Period",
      value: `${horizonPeriodStart} → ${horizonPeriodEnd}`,
      icon: FiCalendar,
      iconBg: "bg-pink-50 text-pink-600",
    },
  ];

  const totalPeriodDays =
    profile?.residencyPeriodStart && profile?.residencyPeriodEnd
      ? Math.ceil(
          (new Date(profile.residencyPeriodEnd) -
            new Date(profile.residencyPeriodStart)) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : profile?.fyStart && profile?.fyEnd
        ? Math.ceil(
            (new Date(profile.fyEnd) - new Date(profile.fyStart)) /
              (1000 * 60 * 60 * 24),
          ) + 1
        : 365;

  const displayHomeDays = hasValidTravelRecords
    ? (calculation?.homeDays ?? 0)
    : 0;
  const displayOutsideDays = hasValidTravelRecords
    ? (calculation?.outsideDays ?? 0)
    : 0;
  const loggedTotalDays = displayHomeDays + displayOutsideDays;

  return (
    <div className="space-y-10 z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">
            Workspace Terminal
          </h1>
          <p className="text-sm text-blue-800 font-medium mt-1">
            Global Travel & Residency Management
          </p>
        </div>

        {records.length > 0 && (
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
          >
            <FiDownloadCloud className="text-base text-indigo-600" />
            Export Excel Report
          </button>
        )}
      </div>

      {/* Warning Banner */}
      {calculation.warning && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
          <FiAlertTriangle className="text-orange-600 text-xl mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-800">
              {hasValidTravelRecords
                ? "Residency Warning"
                : "Add Travel History"}
            </h3>
            <p className="text-orange-700 text-sm mt-1">
              {calculation.warning}
            </p>
          </div>
        </div>
      )}

      {/* RISK RUNWAY BANNER */}
      {hasValidTravelRecords &&
        !runway.isPossible &&
        calculation.daysRemaining > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <FiAlertTriangle className="text-red-600 text-xl mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Runway Risk</h3>
              <p className="text-red-700 text-sm mt-1">
                Your current travel history suggests the remaining days in this
                tracking period may not be enough to reach the{" "}
                {definedMilestone}-day threshold. Add earlier travel records if
                available to improve the calculation.
              </p>
            </div>
          </div>
        )}

      {/* Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                    {card.title}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-900 break-words">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}
                >
                  <Icon className="text-xl" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Status Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                Current Status
              </p>
              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusStyle(calculation.status)}`}
                >
                  {calculation.status}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiShield className="text-xl" />
            </div>
          </div>
        </div>
      </div>
      {/* Travel Summary Logs Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Travel Summary
          </h2>
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
            {records.length} Logs
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
            <p className="text-sm text-green-700 font-medium">
              Own Country Stay
            </p>
            <h3 className="text-3xl font-bold text-green-900 mt-2">
              {displayHomeDays}
            </h3>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <p className="text-sm text-blue-700 font-medium">
              Other Countries Stay
            </p>
            <h3 className="text-3xl font-bold text-blue-900 mt-2">
              {displayOutsideDays}
            </h3>
          </div>

          <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
            <p className="text-sm text-purple-700 font-medium">Total Stay</p>
            <h3 className="text-3xl font-bold text-purple-900 mt-2">
              {loggedTotalDays}
              <span className="text-lg text-purple-600">
                {" / "}
                {totalPeriodDays}
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* Progress Metric Execution Frame */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Residency Threshold Milestone Progress
          </span>
          <span className="text-sm font-bold text-slate-900">
            {records.length > 0 ? calculation.progressPercentage : 0}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
            style={{
              width: `${records.length > 0 ? calculation.progressPercentage : 0}%`,
            }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-3 text-xs text-slate-500 font-semibold">
          <span>Current Presence Stays: {displayHomeDays} days</span>
          <span>Configured Milestone: {definedMilestone} days</span>
        </div>
      </div>

      {/* DYNAMIC RUNWAY SUMMARY BOX */}
      {hasValidTravelRecords &&
        calculation.daysRemaining > 0 &&
        runway.isPossible &&
        profile?.fyEnd && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FiTrendingDown className="text-lg" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Horizon Timeline Risk Runway
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  You have{" "}
                  <span className="text-slate-950 font-bold">
                    {runway.daysLeftInPeriod} days
                  </span>{" "}
                  total left in this tracked period to fulfill your target
                  balance.
                </p>
              </div>
            </div>
            <div
              className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap ${runway.daysLeftInPeriod - calculation.daysRemaining < 15 ? "bg-red-50 text-red-700 border border-red-100 animate-pulse" : "bg-slate-100 text-slate-700"}`}
            >
              Safety Buffer:{" "}
              {Math.max(0, runway.daysLeftInPeriod - calculation.daysRemaining)}{" "}
              Days
            </div>
          </div>
        )}

      {/* MULTI-BASE JURISDICTIONAL RUNWAY MATRIX */}
      <div className="bg-gradient-to-br from-green-100 to-indigo-100 border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FiGlobe className="text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Multi-Office Split Journey Planner
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live presence allocation tracking across all global operational
              office bases.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {(() => {
            const countryDaysMap = {};
            countryDaysMap[profile?.homeCountry || "US"] = 0;

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

            return Object.entries(countryDaysMap).map(
              ([countryCode, daysSpent]) => {
                const isPrimaryBase =
                  countryCode === (profile?.homeCountry || "US");
                const localThreshold = isPrimaryBase ? definedMilestone : 90;
                const allocatedPercentage = Math.min(
                  Math.round((daysSpent / localThreshold) * 100),
                  100,
                );

                return (
                  <div
                    key={countryCode}
                    className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-800 text-white font-bold text-xs uppercase tracking-wider">
                          {countryCode}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {isPrimaryBase
                            ? "Primary Tax & Residency Base"
                            : "Satellite Regional Office Base"}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-500">
                        <span className="text-slate-900 font-bold">
                          {daysSpent}
                        </span>{" "}
                        / {localThreshold} Days Logged
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${isPrimaryBase ? "bg-gradient-to-r from-blue-500 to-indigo-600" : daysSpent > 75 ? "bg-red-500" : "bg-purple-500"}`}
                        style={{ width: `${allocatedPercentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 font-medium flex justify-between">
                      <span>
                        {isPrimaryBase
                          ? daysSpent >= localThreshold
                            ? "✓ Status locked. Safe to depart to global satellite offices."
                            : `Requires ${localThreshold - daysSpent} more days here to secure primary residency.`
                          : daysSpent > 75
                            ? "⚠️ Proximity Alert: Approaching local physical stay cap rules. Plan exit soon."
                            : `Safe Zone: You can comfortably spend up to ${localThreshold - daysSpent} more days at this office.`}
                      </span>
                      <span className="italic text-slate-400">
                        {allocatedPercentage}% Capacity Utilized
                      </span>
                    </div>
                  </div>
                );
              },
            );
          })()}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <FiGlobe className="text-2xl" />
            </div>
            <span className="text-xs font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full uppercase">
              In Stays
            </span>
          </div>
          <h2 className="text-5xl font-bold text-slate-900 mt-6">
            {displayHomeDays}
          </h2>
          <p className="mt-2 text-slate-500 text-sm">
            Total days spent within the home country borders during the chosen
            tracking timeframe.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiTrendingUp className="text-2xl" />
            </div>
            <span className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full uppercase">
              Outside Stays
            </span>
          </div>
          <h2 className="text-5xl font-bold text-slate-900 mt-6">
            {displayOutsideDays}
          </h2>
          <p className="mt-2 text-slate-500 text-sm">
            Total tracking timeline intervals logged outside home operational
            limits.
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-400 to-purple-500 rounded-3xl p-8 text-white shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <FiShield className="text-2xl" />
          </div>
          <h3 className="mt-6 text-lg font-semibold">Residency Standing</h3>
          <p className="mt-2 text-blue-100 text-sm">
            Based on dynamic cross-referencing of travel entries against your
            configuration rule criteria.
          </p>
          <div className="mt-5 text-3xl font-bold">{calculation.status}</div>
        </div>
      </div>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import { subscribeToTravelRecords } from "../firebase/firestoreService";
// import { calculateResidencyStatus } from "../utils/residencyCalculator";
// import * as XLSX from "xlsx";

// import {
//   FiClock,
//   FiMapPin,
//   FiCalendar,
//   FiShield,
//   FiAlertTriangle,
//   FiTrendingUp,
//   FiGlobe,
//   FiTrendingDown,
//   FiDownloadCloud,
// } from "react-icons/fi";
// import { BiLoaderAlt } from "react-icons/bi";

// export default function Dashboard() {
//   const { user, profile } = useAuth();
//   const [records, setRecords] = useState([]);
//   const [metricsLoading, setMetricsLoading] = useState(true);

//   useEffect(() => {
//     if (!user) return;

//     const unsubscribe = subscribeToTravelRecords(
//       user.uid,
//       (fetchedRecords) => {
//         setRecords(fetchedRecords);
//         setMetricsLoading(false);
//       },
//       (error) => {
//         console.error(error);
//         setMetricsLoading(false);
//       },
//     );

//     return () => unsubscribe();
//   }, [user]);

//   if (metricsLoading) {
//     return (
//       <div className="h-[60vh] w-full flex items-center justify-center">
//         <BiLoaderAlt className="animate-spin text-white text-3xl" />
//       </div>
//     );
//   }

//   const calculation = calculateResidencyStatus(records, profile);

//   const homeCountryName =
//     profile?.homeCountry || profile?.nativeCountry || "Configuring Base...";
//   const targetTimezone = profile?.timezone || "Not Set";
//   const horizonPeriodStart =
//     profile?.residencyPeriodStart || profile?.fyStart || "Start Date Open";
//   const horizonPeriodEnd =
//     profile?.residencyPeriodEnd || profile?.fyEnd || "End Date Open";
//   const definedMilestone = parseInt(profile?.residencyThreshold || "183", 10);

//   const getStatusStyle = (status) => {
//     switch (status) {
//       case "Resident":
//         return "bg-green-100 text-green-700 border-green-200";
//       case "Temporary Resident":
//         return "bg-blue-100 text-blue-700 border-blue-200";
//       default:
//         return "bg-orange-100 text-orange-700 border-orange-200";
//     }
//   };

//   const getRunwayMetrics = () => {
//     const targetEnd = profile?.residencyPeriodEnd || profile?.fyEnd;
//     const targetStart = profile?.residencyPeriodStart || profile?.fyStart;

//     if (!targetEnd || !hasValidTravelRecords) {
//       return { daysLeftInPeriod: 0, isPossible: true };
//     }

//     const endDate = new Date(targetEnd);
//     const startDate = new Date(targetStart || targetEnd);
//     const today = new Date();

//     const dayInMilliseconds = 24 * 60 * 60 * 1000;
//     const periodDays = Math.max(
//       1,
//       Math.round((endDate - startDate) / dayInMilliseconds) + 1,
//     );
//     const daysElapsed = Math.max(
//       0,
//       Math.round((today - startDate) / dayInMilliseconds),
//     );
//     const daysLeftInPeriod = Math.max(0, periodDays - daysElapsed);
//     const isStillPossible = daysLeftInPeriod >= calculation.daysRemaining;

//     return {
//       daysLeftInPeriod,
//       isPossible: isStillPossible,
//     };
//   };
//   const runway = getRunwayMetrics();

//   const handleExportData = () => {
//     if (records.length === 0) return;

//     const structuredRows = records.map((record, index) => ({
//       "Log Index": records.length - index,
//       "Origin Country": record.fromCountry || "N/A",
//       "Destination Country": record.toCountry || "N/A",
//       "Departure Date": record.departureDate || "N/A",
//       "Arrival Date": record.arrivalDate || "N/A",
//       "Purpose of Travel": record.purpose || "Automated System Entry",
//       "GPS Latitude": record.latitude || "N/A",
//       "GPS Longitude": record.longitude || "N/A",
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(structuredRows);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Travel History Logs");

//     const maxColumnWidths = Object.keys(structuredRows[0] || {}).map((key) => {
//       const headerLength = key.length;
//       const longestCellLength = structuredRows.reduce(
//         (max, row) => Math.max(max, String(row[key] || "").length),
//         0,
//       );
//       return { wch: Math.max(headerLength, longestCellLength) + 3 };
//     });
//     worksheet["!cols"] = maxColumnWidths;

//     XLSX.writeFile(workbook, `Residency_Audit_Report_${homeCountryName}.xlsx`);
//   };

//   const cards = [
//     {
//       title: "Home Tracking Country",
//       value: homeCountryName,
//       icon: FiMapPin,
//       iconBg: "bg-blue-50 text-blue-600",
//     },
//     {
//       title: "Standard Timezone",
//       value: targetTimezone,
//       icon: FiClock,
//       iconBg: "bg-purple-50 text-purple-600",
//     },
//     {
//       title: "Tracking Horizon Period",
//       value: `${horizonPeriodStart} → ${horizonPeriodEnd}`,
//       icon: FiCalendar,
//       iconBg: "bg-pink-50 text-pink-600",
//     },
//   ];

//   const totalPeriodDays =
//     profile?.residencyPeriodStart && profile?.residencyPeriodEnd
//       ? Math.ceil(
//           (new Date(profile.residencyPeriodEnd) -
//             new Date(profile.residencyPeriodStart)) /
//             (1000 * 60 * 60 * 24),
//         ) + 1
//       : profile?.fyStart && profile?.fyEnd
//         ? Math.ceil(
//             (new Date(profile.fyEnd) - new Date(profile.fyStart)) /
//               (1000 * 60 * 60 * 24),
//           ) + 1
//         : 365;

//   const hasValidTravelRecords = records.some(
//     (record) =>
//       record?.arrivalDate && record?.departureDate && record?.toCountry,
//   );
//   const displayHomeDays = hasValidTravelRecords
//     ? (calculation?.homeDays ?? 0)
//     : 0;
//   const displayOutsideDays = hasValidTravelRecords
//     ? (calculation?.outsideDays ?? 0)
//     : 0;
//   const loggedTotalDays = displayHomeDays + displayOutsideDays;

//   return (
//     <div className="space-y-10 z-10">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-black tracking-tight">
//             Workspace Terminal
//           </h1>
//           <p className="text-sm text-blue-800 font-medium mt-1">
//             Global Travel & Residency Management
//           </p>
//         </div>

//         {records.length > 0 && (
//           <button
//             onClick={handleExportData}
//             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
//           >
//             <FiDownloadCloud className="text-base text-indigo-600" />
//             Export Excel Report
//           </button>
//         )}
//       </div>

//       {/* Warning Banner */}
//       {calculation.warning && (
//         <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
//           <FiAlertTriangle className="text-orange-600 text-xl mt-0.5" />
//           <div>
//             <h3 className="font-semibold text-orange-800">
//               {hasValidTravelRecords ? "Residency Warning" : "Add Travel History"}
//             </h3>
//             <p className="text-orange-700 text-sm mt-1">
//               {calculation.warning}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* RISK RUNWAY BANNER */}
//       {hasValidTravelRecords && !runway.isPossible && calculation.daysRemaining > 0 && (
//         <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
//           <FiAlertTriangle className="text-red-600 text-xl mt-0.5" />
//           <div>
//             <h3 className="font-semibold text-red-800">Runway Risk</h3>
//             <p className="text-red-700 text-sm mt-1">
//               Your current travel history suggests the remaining days in this tracking period may not be enough to reach the {definedMilestone}-day threshold. Add earlier travel records if available to improve the calculation.
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Profile Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
//         {cards.map((card, index) => {
//           const Icon = card.icon;
//           return (
//             <div
//               key={index}
//               className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
//             >
//               <div className="flex items-start justify-between">
//                 <div>
//                   <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
//                     {card.title}
//                   </p>
//                   <p className="mt-3 text-lg font-semibold text-slate-900 break-words">
//                     {card.value}
//                   </p>
//                 </div>
//                 <div
//                   className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}
//                 >
//                   <Icon className="text-xl" />
//                 </div>
//               </div>
//             </div>
//           );
//         })}

//         {/* Status Card */}
//         <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
//           <div className="flex items-start justify-between">
//             <div>
//               <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
//                 Current Status
//               </p>
//               <div className="mt-4">
//                 <span
//                   className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusStyle(calculation.status)}`}
//                 >
//                   {calculation.status}
//                 </span>
//               </div>
//             </div>
//             <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
//               <FiShield className="text-xl" />
//             </div>
//           </div>
//         </div>
//       </div>
//       {/* Travel Summary Logs Matrix */}
//       <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-xl font-semibold text-slate-900">
//             Travel Summary
//           </h2>
//           <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
//             {records.length} Logs
//           </span>
//         </div>

//         <div className="grid md:grid-cols-3 gap-4">
//           <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
//             <p className="text-sm text-green-700 font-medium">
//               Own Country Stay
//             </p>
//             <h3 className="text-3xl font-bold text-green-900 mt-2">
//               {displayHomeDays}
//             </h3>
//           </div>

//           <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
//             <p className="text-sm text-blue-700 font-medium">
//               Other Countries Stay
//             </p>
//             <h3 className="text-3xl font-bold text-blue-900 mt-2">
//               {displayOutsideDays}
//             </h3>
//           </div>

//           <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
//             <p className="text-sm text-purple-700 font-medium">Total Stay</p>
//             <h3 className="text-3xl font-bold text-purple-900 mt-2">
//               {loggedTotalDays}
//               <span className="text-lg text-purple-600">
//                 {" / "}
//                 {totalPeriodDays}
//               </span>
//             </h3>
//           </div>
//         </div>
//       </div>

//       {/* Progress Metric Execution Frame */}
//       <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
//         <div className="flex items-center justify-between mb-2">
//           <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
//             Residency Threshold Milestone Progress
//           </span>
//           <span className="text-sm font-bold text-slate-900">
//             {records.length > 0 ? calculation.progressPercentage : 0}%
//           </span>
//         </div>
//         <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
//           <div
//             className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
//             style={{
//               width: `${records.length > 0 ? calculation.progressPercentage : 0}%`,
//             }}
//           ></div>
//         </div>
//         <div className="flex justify-between items-center mt-3 text-xs text-slate-500 font-semibold">
//           <span>Current Presence Stays: {displayHomeDays} days</span>
//           <span>Configured Milestone: {definedMilestone} days</span>
//         </div>
//       </div>

//       {/* DYNAMIC RUNWAY SUMMARY BOX */}
//       {hasValidTravelRecords && calculation.daysRemaining > 0 && runway.isPossible && profile?.fyEnd && (
//         <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
//               <FiTrendingDown className="text-lg" />
//             </div>
//             <div>
//               <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
//                 Horizon Timeline Risk Runway
//               </h4>
//               <p className="text-xs text-slate-500 mt-0.5">
//                 You have{" "}
//                 <span className="text-slate-950 font-bold">
//                   {runway.daysLeftInPeriod} days
//                 </span>{" "}
//                 total left in this tracked period to fulfill your target
//                 balance.
//               </p>
//             </div>
//           </div>
//           <div
//             className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap ${runway.daysLeftInPeriod - calculation.daysRemaining < 15 ? "bg-red-50 text-red-700 border border-red-100 animate-pulse" : "bg-slate-100 text-slate-700"}`}
//           >
//             Safety Buffer:{" "}
//             {Math.max(0, runway.daysLeftInPeriod - calculation.daysRemaining)}{" "}
//             Days
//           </div>
//         </div>
//       )}

//       {/* MULTI-BASE JURISDICTIONAL RUNWAY MATRIX */}
//       <div className="bg-gradient-to-br from-green-100 to-indigo-100 border border-slate-200 rounded-3xl p-6 shadow-sm">
//         <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
//           <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
//             <FiGlobe className="text-lg" />
//           </div>
//           <div>
//             <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
//               Multi-Office Split Journey Planner
//             </h3>
//             <p className="text-xs text-slate-500 mt-0.5">
//               Live presence allocation tracking across all global operational
//               office bases.
//             </p>
//           </div>
//         </div>

//         <div className="space-y-6">
//           {(() => {
//             const countryDaysMap = {};
//             countryDaysMap[profile?.homeCountry || "US"] = 0;

//             if (hasValidTravelRecords) {
//               records.forEach((r) => {
//                 if (!r.departureDate || !r.arrivalDate || !r.toCountry) return;
//                 const d1 = new Date(r.departureDate);
//                 const d2 = new Date(r.arrivalDate);
//                 const diffDays = Math.max(
//                   1,
//                   Math.round(Math.abs((d2 - d1) / (24 * 60 * 60 * 1000))) + 1,
//                 );
//                 countryDaysMap[r.toCountry] =
//                   (countryDaysMap[r.toCountry] || 0) + diffDays;
//               });
//             }

//             return Object.entries(countryDaysMap).map(
//               ([countryCode, daysSpent]) => {
//                 const isPrimaryBase =
//                   countryCode === (profile?.homeCountry || "US");
//                 const localThreshold = isPrimaryBase ? definedMilestone : 90;
//                 const allocatedPercentage = Math.min(
//                   Math.round((daysSpent / localThreshold) * 100),
//                   100,
//                 );

//                 return (
//                   <div
//                     key={countryCode}
//                     className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50"
//                   >
//                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
//                       <div className="flex items-center gap-2">
//                         <span className="px-2.5 py-0.5 rounded-md bg-blue-800 text-white font-bold text-xs uppercase tracking-wider">
//                           {countryCode}
//                         </span>
//                         <span className="text-xs font-bold text-slate-700">
//                           {isPrimaryBase
//                             ? "Primary Tax & Residency Base"
//                             : "Satellite Regional Office Base"}
//                         </span>
//                       </div>
//                       <div className="text-xs font-semibold text-slate-500">
//                         <span className="text-slate-900 font-bold">
//                           {daysSpent}
//                         </span>{" "}
//                         / {localThreshold} Days Logged
//                       </div>
//                     </div>
//                     <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
//                       <div
//                         className={`h-full transition-all duration-500 ${isPrimaryBase ? "bg-gradient-to-r from-blue-500 to-indigo-600" : daysSpent > 75 ? "bg-red-500" : "bg-purple-500"}`}
//                         style={{ width: `${allocatedPercentage}%` }}
//                       ></div>
//                     </div>
//                     <div className="mt-2 text-[11px] text-slate-500 font-medium flex justify-between">
//                       <span>
//                         {isPrimaryBase
//                           ? daysSpent >= localThreshold
//                             ? "✓ Status locked. Safe to depart to global satellite offices."
//                             : `Requires ${localThreshold - daysSpent} more days here to secure primary residency.`
//                           : daysSpent > 75
//                             ? "⚠️ Proximity Alert: Approaching local physical stay cap rules. Plan exit soon."
//                             : `Safe Zone: You can comfortably spend up to ${localThreshold - daysSpent} more days at this office.`}
//                       </span>
//                       <span className="italic text-slate-400">
//                         {allocatedPercentage}% Capacity Utilized
//                       </span>
//                     </div>
//                   </div>
//                 );
//               },
//             );
//           })()}
//         </div>
//       </div>

//       {/* KPI Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
//               <FiGlobe className="text-2xl" />
//             </div>
//             <span className="text-xs font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full uppercase">
//               In Stays
//             </span>
//           </div>
//           <h2 className="text-5xl font-bold text-slate-900 mt-6">
//             {displayHomeDays}
//           </h2>
//           <p className="mt-2 text-slate-500 text-sm">
//             Total days spent within the home country borders during the chosen
//             tracking timeframe.
//           </p>
//         </div>

//         <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
//               <FiTrendingUp className="text-2xl" />
//             </div>
//             <span className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full uppercase">
//               Outside Stays
//             </span>
//           </div>
//           <h2 className="text-5xl font-bold text-slate-900 mt-6">
//             {displayOutsideDays}
//           </h2>
//           <p className="mt-2 text-slate-500 text-sm">
//             Total tracking timeline intervals logged outside home operational
//             limits.
//           </p>
//         </div>

//         <div className="bg-gradient-to-r from-green-400 to-purple-500 rounded-3xl p-8 text-white shadow-lg">
//           <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
//             <FiShield className="text-2xl" />
//           </div>
//           <h3 className="mt-6 text-lg font-semibold">Residency Standing</h3>
//           <p className="mt-2 text-blue-100 text-sm">
//             Based on dynamic cross-referencing of travel entries against your
//             configuration rule criteria.
//           </p>
//           <div className="mt-5 text-3xl font-bold">{calculation.status}</div>
//         </div>
//       </div>
//     </div>

//   );
// }
