// import { useEffect, useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import {
//   subscribeToTravelRecords,
//   addTravelRecord,
//   updateTravelRecord,
// } from "../firebase/firestoreService";
// import { calculateResidencyStatus } from "../utils/residencyCalculator";
// import { autoTrackLocation } from "../utils/locationTracker";
// import { countries } from "../utils/countries";
// import * as XLSX from "xlsx";
// import toast from "react-hot-toast";
// import {
//   format,
//   parseISO,
//   eachDayOfInterval,
//   subDays,
//   addDays,
// } from "date-fns";
// import StayCalendar from "../components/tracker/StayCalendar";
// import {
//   FiClock,
//   FiMapPin,
//   FiCalendar,
//   FiShield,
//   FiAlertTriangle,
//   FiTrendingDown,
//   FiDownloadCloud,
//   FiInfo,
// } from "react-icons/fi";
// import { BiLoaderAlt } from "react-icons/bi";
// import TravelForm from "../components/tracker/TravelForm";

// export default function Dashboard() {
//   const { user, profile } = useAuth();
//   const [records, setRecords] = useState([]);
//   const [metricsLoading, setMetricsLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [editingRecord, setEditingRecord] = useState(null);

//   const getFullCountryName = (code) => {
//     if (!code) return "Unknown Base";
//     if (code.toUpperCase() === "ABROAD" || code.toUpperCase() === "OTHER")
//       return "Abroad";
//     const match = countries.find(
//       (c) => c.code.toUpperCase() === code.toUpperCase(),
//     );
//     return match ? match.name : code;
//   };

//   const formatToMonthDay = (dateStr) => {
//     if (!dateStr || dateStr.includes("Open") || dateStr === "not-set")
//       return "Not Set";

//     try {
//       if (/^\d{2}-\d{2}$/.test(dateStr)) {
//         const [month, day] = dateStr.split("-");
//         const shortMonths = [
//           "Jan",
//           "Feb",
//           "Mar",
//           "Apr",
//           "May",
//           "Jun",
//           "Jul",
//           "Aug",
//           "Sep",
//           "Oct",
//           "Nov",
//           "Dec",
//         ];
//         const monthIndex = parseInt(month, 10) - 1;

//         if (monthIndex >= 0 && monthIndex < 12) {
//           return `${day} ${shortMonths[monthIndex]}`;
//         }
//       }
//       return format(parseISO(dateStr), "dd MMM");
//     } catch (e) {
//       return dateStr;
//     }
//   };

//   useEffect(() => {
//     window.scrollTo(0, 0);
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

//   useEffect(() => {
//     if (!user || metricsLoading) return;

//     const today = new Date().toISOString().split("T")[0];
//     const localStorageKey = `lastLocationTrackDate_${user.uid}`;
//     const alreadyTrackedToday = localStorage.getItem(localStorageKey);

//     const gpsRecordExistsInDb = records.some((r) => {
//       const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;
//       return arrival === today && r.purpose === "Daily GPS Check-In";
//     });

//     if (alreadyTrackedToday === today && gpsRecordExistsInDb) {
//       return;
//     }

//     const runTracking = async () => {
//       try {
//         const tracked = await autoTrackLocation(user, records);
//         if (tracked) {
//           toast.success("Daily GPS check-in recorded successfully");
//         }
//         localStorage.setItem(localStorageKey, today);
//       } catch (error) {
//         console.error("[Dashboard GPS Auto-Track Error]:", error);
//       }
//     };

//     runTracking();
//   }, [user, metricsLoading, records]);

//   if (metricsLoading) {
//     return (
//       <div className="h-[60vh] w-full flex items-center justify-center">
//         <BiLoaderAlt className="animate-spin text-slate-800 text-3xl" />
//       </div>
//     );
//   }

//   const calculation = calculateResidencyStatus(records, profile);
//   const rawHomeCountry = profile?.homeCountry || profile?.nativeCountry || "US";
//   const homeCountryName = rawHomeCountry
//     ? getFullCountryName(rawHomeCountry)
//     : "Configuring Base...";

//   const targetTimezone = profile?.timezone || "Not Set";
//   const horizonPeriodStart =
//     profile?.residencyPeriodStart || profile?.fyStart || "Start Date Open";
//   const horizonPeriodEnd =
//     profile?.residencyPeriodEnd || profile?.fyEnd || "End Date Open";
//   const definedMilestone = parseInt(profile?.residencyThreshold || "183", 10);

//   const hasValidTravelRecords = records.some(
//     (record) =>
//       record?.arrivalDate &&
//       record?.departureDate &&
//       (record?.toCountry || record?.fromCountry),
//   );

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
//       "Origin Country": getFullCountryName(record.fromCountry) || "N/A",
//       "Destination Country": getFullCountryName(record.toCountry) || "N/A",
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

//   // FIXED: Closed missing structural scopes and un-isolated block mutations safely
//   const handleTogglePresence = async (dateStr, nextStatus) => {
//     try {
//       const homeBase = (
//         profile?.homeCountry ||
//         profile?.nativeCountry ||
//         "US"
//       ).toUpperCase();
//       const cleanDateStr = dateStr.includes("T")
//         ? dateStr.split("T")[0]
//         : dateStr;

//       // Helper to normalize dates consistently for comparison
//       const normalizeDate = (d) => {
//         if (!d) return d;
//         return d.includes("T") ? d.split("T")[0] : d;
//       };

//       // 1. Identify explicit single-day record match parameters
//       const explicitSingleRecord = records.find((r) => {
//         const rDept = normalizeDate(r.departureDate);
//         const rArr = normalizeDate(r.arrivalDate);
//         return (
//           rDept === cleanDateStr &&
//           rArr === cleanDateStr &&
//           (r.purpose === "Calendar Check-In" ||
//             r.purpose === "Calendar Check-Out")
//         );
//       });

//       // 2. Identify target parent interval map row container block
//       const parentRangeRecord = records
//         .filter((r) => {
//           if (!r.departureDate || !r.arrivalDate) {
//             return false;
//           }

//           const rDept = normalizeDate(r.departureDate);
//           const rArr = normalizeDate(r.arrivalDate);

//           // Skip single-day calendar overrides to avoid matching with themselves
//           if (
//             rDept === rArr &&
//             (r.purpose === "Calendar Check-In" ||
//               r.purpose === "Calendar Check-Out")
//           ) {
//             return false;
//           }

//           return cleanDateStr >= rDept && cleanDateStr <= rArr;
//         })
//         .sort((a, b) => {
//           const aLength =
//             new Date(normalizeDate(a.arrivalDate)) -
//             new Date(normalizeDate(a.departureDate));
//           const bLength =
//             new Date(normalizeDate(b.arrivalDate)) -
//             new Date(normalizeDate(b.departureDate));
//           return aLength - bLength;
//         })[0];

//       const targetToCountry =
//         nextStatus === "Abroad Stay" ? "ABROAD" : homeBase;
//       const targetFromCountry =
//         nextStatus === "Abroad Stay" ? homeBase : "ABROAD";
//       const targetPurpose =
//         nextStatus === "Abroad Stay"
//           ? "Calendar Check-In"
//           : "Calendar Check-Out";

//       // Case 1: Override match exists -> overwrite inline parameters
//       if (explicitSingleRecord) {
//         await updateTravelRecord(explicitSingleRecord.recordId, {
//           departureDate: cleanDateStr,
//           arrivalDate: cleanDateStr,
//           fromCountry: targetFromCountry,
//           toCountry: targetToCountry,
//           purpose: targetPurpose,
//         });
//       }
//       // Case 2: Embedded parent record range match element -> execute isolated structural partition segments
//       else if (parentRangeRecord) {
//         const pStartStr = normalizeDate(parentRangeRecord.departureDate);
//         const pEndStr = normalizeDate(parentRangeRecord.arrivalDate);

//         const baseProps = {
//           fromCountry: parentRangeRecord.fromCountry || homeBase,
//           toCountry: parentRangeRecord.toCountry || "ABROAD",
//           purpose: parentRangeRecord.purpose || "Automated System Entry",
//         };

//         // Use date-fns for timezone-safe date arithmetic (avoids timezone conversion issues)
//         const currentDate = parseISO(cleanDateStr);
//         const prevDayStr = format(subDays(currentDate, 1), "yyyy-MM-dd");
//         const nextDayStr = format(addDays(currentDate, 1), "yyyy-MM-dd");

//         // Sub-case A: Exact left-edge hit boundary check (e.g. 13 of 13-25)
//         if (pStartStr === cleanDateStr) {
//           // Execute both operations in parallel to ensure complete Firestore sync
//           await Promise.all([
//             updateTravelRecord(parentRangeRecord.recordId, {
//               ...baseProps,
//               departureDate: nextDayStr,
//               arrivalDate: pEndStr,
//             }),
//             addTravelRecord(user.uid, {
//               departureDate: cleanDateStr,
//               arrivalDate: cleanDateStr,
//               fromCountry: targetFromCountry,
//               toCountry: targetToCountry,
//               purpose: targetPurpose,
//             }),
//           ]);
//         }
//         // Sub-case B: Exact right-edge hit boundary check (e.g. 25 of 13-25)
//         else if (pEndStr === cleanDateStr) {
//           // Execute both operations in parallel to ensure complete Firestore sync
//           await Promise.all([
//             updateTravelRecord(parentRangeRecord.recordId, {
//               ...baseProps,
//               departureDate: pStartStr,
//               arrivalDate: prevDayStr,
//             }),
//             addTravelRecord(user.uid, {
//               departureDate: cleanDateStr,
//               arrivalDate: cleanDateStr,
//               fromCountry: targetFromCountry,
//               toCountry: targetToCountry,
//               purpose: targetPurpose,
//             }),
//           ]);
//         }
//         // Sub-case C: Exact middle hit boundary partition layout execution split (e.g. 28 of 25-31)
//         else {
//           // Execute all three operations in parallel to ensure Firestore syncs with complete data
//           // This prevents intermediate states where days appear/disappear during split
//           await Promise.all([
//             updateTravelRecord(parentRangeRecord.recordId, {
//               ...baseProps,
//               departureDate: pStartStr,
//               arrivalDate: prevDayStr,
//             }),
//             addTravelRecord(user.uid, {
//               ...baseProps,
//               departureDate: nextDayStr,
//               arrivalDate: pEndStr,
//             }),
//             addTravelRecord(user.uid, {
//               departureDate: cleanDateStr,
//               arrivalDate: cleanDateStr,
//               fromCountry: targetFromCountry,
//               toCountry: targetToCountry,
//               purpose: targetPurpose,
//             }),
//           ]);
//         }
//       }
//       // Case 3: Completely empty matrix grid row -> fresh insertion rule logic
//       else {
//         await addTravelRecord(user.uid, {
//           departureDate: cleanDateStr,
//           arrivalDate: cleanDateStr,
//           fromCountry: targetFromCountry,
//           toCountry: targetToCountry,
//           purpose: targetPurpose,
//         });
//       }

//       toast.success(`Presence status updated for ${cleanDateStr}`);
//     } catch (error) {
//       console.error("[Dashboard Override Error]:", error);
//       toast.error("Could not update presence tracking status.");
//     }
//   };

//   const displayHomeDays = hasValidTravelRecords
//     ? (calculation?.homeDays ?? 0)
//     : 0;
//   const displayOutsideDays = hasValidTravelRecords
//     ? (calculation?.outsideDays ?? 0)
//     : 0;
//   const loggedTotalDays = calculation?.totalDays || 0;
//   const remainingTargetDays = Math.max(0, definedMilestone - displayHomeDays);

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
//       value: `${formatToMonthDay(horizonPeriodStart)} → ${formatToMonthDay(horizonPeriodEnd)}`,
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

//   const getCurrentFootprint = () => {
//     if (records.length === 0) return homeCountryName;
//     const gpsRecords = records.filter(
//       (r) => r.purpose === "Daily GPS Check-In",
//     );
//     const targetRecords = gpsRecords.length > 0 ? gpsRecords : records;

//     const latestRecord = [...targetRecords].sort((a, b) => {
//       const dateA = new Date(a.arrivalDate || a.departureDate || 0);
//       const dateB = new Date(b.arrivalDate || b.departureDate || 0);
//       return dateB - dateA;
//     })[0];

//     if (
//       latestRecord?.toCountry?.toUpperCase() === "ABROAD" ||
//       latestRecord?.toCountry?.toUpperCase() === "OTHER"
//     ) {
//       return "Abroad";
//     }

//     return latestRecord?.toCountry
//       ? getFullCountryName(latestRecord.toCountry)
//       : "Locating...";
//   };

//   const currentFootprintDisplay = getCurrentFootprint();
//   const computedDayMap = {};

//   if (hasValidTravelRecords) {
//     const homeBase = (
//       profile?.homeCountry ||
//       profile?.nativeCountry ||
//       "US"
//     ).toUpperCase();

//     // Pass 1: Map long background parent segments
//     records.forEach((record) => {
//       if (!record?.arrivalDate || !record?.departureDate) return;
//       if (
//         record.arrivalDate === record.departureDate &&
//         (record.purpose === "Calendar Check-In" ||
//           record.purpose === "Calendar Check-Out")
//       ) {
//         return;
//       }

//       const isRecordHome =
//         record.toCountry && record.toCountry.toUpperCase() === homeBase;
//       const days = eachDayOfInterval({
//         start: new Date(record.departureDate + "T00:00:00"),
//         end: new Date(record.arrivalDate + "T00:00:00"),
//       });

//       days.forEach((day) => {
//         const key = format(day, "yyyy-MM-dd");
//         computedDayMap[key] = {
//           status: isRecordHome ? "Home Stay" : "Abroad Stay",
//           country: getFullCountryName(record.toCountry),
//         };
//       });
//     });

//     // Pass 2: Overwrite precise single day overrides
//     records.forEach((record) => {
//       if (!record?.arrivalDate || !record?.departureDate) return;
//       if (record.arrivalDate !== record.departureDate) return;
//       if (
//         record.purpose !== "Calendar Check-In" &&
//         record.purpose !== "Calendar Check-Out"
//       )
//         return;

//       const key = record.arrivalDate;
//       const isRecordHome =
//         record.toCountry && record.toCountry.toUpperCase() === homeBase;

//       computedDayMap[key] = {
//         status: isRecordHome ? "Home Stay" : "Abroad Stay",
//         country: getFullCountryName(record.toCountry),
//       };
//     });
//   }

//   const handleSaveRecord = async (data) => {
//     try {
//       if (editingRecord) {
//         await updateTravelRecord(editingRecord.recordId, data);
//         toast.success("Record updated");
//       } else {
//         await addTravelRecord(user.uid, data);
//         toast.success("Record added");
//       }
//       setShowForm(false);
//       setEditingRecord(null);
//     } catch (error) {
//       console.error(error);
//       toast.error("Operation failed");
//     }
//   };

//   return (
//     <div className="space-y-8 p-4 max-w-7xl mx-auto text-left">
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

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-100 flex flex-col justify-between">
//             <p className="text-xs sm:text-sm text-amber-700 font-bold uppercase tracking-wider">
//               Target Tracker
//             </p>
//             <div className="flex flex-wrap items-baseline gap-1 mt-2">
//               <h3 className="text-2xl sm:text-3xl font-black text-amber-900">
//                 {displayHomeDays}
//               </h3>
//               <span className="text-base sm:text-lg font-semibold text-amber-700">
//                 /
//               </span>
//               <h3 className="text-2xl sm:text-3xl font-black text-amber-900">
//                 {definedMilestone}
//               </h3>
//               <span className="text-xs sm:text-sm text-amber-600 font-semibold ml-0.5">
//                 days
//               </span>
//             </div>
//             <p className="text-xs sm:text-sm text-red-600 mt-2 sm:mt-3 font-semibold">
//               Remaining: {remainingTargetDays} Days
//             </p>
//           </div>

//           <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
//             <p className="text-sm text-green-700 font-medium">
//               Own Country Stay
//             </p>
//             <div className="flex items-center gap-2 mt-1">
//               <h3 className="text-3xl font-bold text-green-900 mt-2">
//                 {displayHomeDays}
//               </h3>
//               <p className="text-sm text-green-600 font-medium mt-3">days</p>
//             </div>
//           </div>

//           <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
//             <p className="text-sm text-blue-700 font-medium">
//               Abroad Country Stay
//             </p>
//             <div className="flex items-center gap-2 mt-1">
//               <h3 className="text-3xl font-bold text-blue-900 mt-2">
//                 {displayOutsideDays}
//               </h3>
//               <p className="text-sm text-blue-600 font-medium mt-3">days</p>
//             </div>
//           </div>

//           <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
//             <p className="text-sm text-purple-700 font-medium">Total Stay</p>
//             <div className="flex items-center gap-2 mt-1">
//               <h3 className="text-3xl font-bold text-purple-900 mt-2">
//                 {loggedTotalDays}
//               </h3>
//               <p className="text-sm text-purple-600 font-medium mt-3">days</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Progress Metric Frame */}
//       <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
//         <div className="flex items-center justify-between mb-2">
//           <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
//             Residency Status Progress
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

//       {/* Profile Summary Logs Matrix */}
//       <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
//         <div className="border-b border-slate-100 pb-4 mb-6">
//           <h2 className="text-xl font-semibold text-slate-900">
//             Profile Summary
//           </h2>
//           <p className="text-xs text-slate-500 mt-0.5">
//             Overview of your current core settings, tracking horizons, and
//             active global workspace footprint.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
//           {cards.map((card, index) => {
//             const Icon = card.icon;
//             return (
//               <div
//                 key={index}
//                 className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:shadow-sm transition-all"
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="space-y-1">
//                     <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
//                       {card.title}
//                     </p>
//                     <p className="text-lg font-semibold text-slate-900 break-words mt-2">
//                       {card.value}
//                     </p>
//                   </div>
//                   <div
//                     className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
//                   >
//                     <Icon className="text-lg" />
//                   </div>
//                 </div>
//               </div>
//             );
//           })}

//           {/* Current Footprint Card */}
//           <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 hover:shadow-sm transition-all">
//             <div className="flex items-start justify-between">
//               <div className="space-y-1">
//                 <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
//                   Current Footprint
//                 </p>
//                 <p className="text-lg font-semibold text-slate-900 truncate max-w-[180px]">
//                   {currentFootprintDisplay}
//                 </p>
//               </div>
//               <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
//                 <FiMapPin className="text-lg" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Warning Banners */}
//       {calculation.warning && (
//         <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
//           <FiAlertTriangle className="text-orange-600 text-xl mt-0.5" />
//           <div>
//             <h3 className="font-semibold text-orange-800">
//               {hasValidTravelRecords
//                 ? "Residency Warning"
//                 : "Add Travel History"}
//             </h3>
//             <p className="text-orange-700 text-sm mt-1">
//               {calculation.warning}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Permanent Information Banner */}
//       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div className="flex items-start gap-3.5">
//           <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
//             <FiInfo className="text-xl" />
//           </div>

//           <div className="space-y-1">
//             <h3 className="font-bold text-blue-900 text-base tracking-tight">
//               Add Your Travel History
//             </h3>

//             <p className="text-base text-blue-700 leading-relaxed max-w-3xl">
//               For accurate residency calculations, add your previous travel
//               history using the Add Travel Record button or update your stay
//               records directly from the calendar below. More travel records help
//               provide better tracking and residency status calculations.
//             </p>
//           </div>
//         </div>

//         <button
//           onClick={() => {
//             setEditingRecord(null);
//             setShowForm(true);
//           }}
//           className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-sm text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
//         >
//           Add Travel Record
//         </button>
//       </div>

//       {/* Stay Calendar Grid Section */}
//       <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl space-y-6 w-full mx-auto border border-slate-200 shadow-lg p-6">
//         <StayCalendar
//           dayMap={computedDayMap}
//           travelRecords={records}
//           fyStart={profile?.fyStart || profile?.residencyPeriodStart}
//           fyEnd={profile?.fyEnd || profile?.residencyPeriodEnd}
//           onToggleDayPresence={handleTogglePresence}
//         />
//       </div>

//       {showForm && (
//         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//           <div className="w-full max-w-2xl">
//             <TravelForm
//               initialData={editingRecord}
//               onSubmit={handleSaveRecord}
//               onCancel={() => {
//                 setShowForm(false);
//                 setEditingRecord(null);
//               }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToTravelRecords,
  addTravelRecord,
  updateTravelRecord,
} from "../firebase/firestoreService";
import { calculateResidencyStatus } from "../utils/residencyCalculator";
import { autoTrackLocation } from "../utils/locationTracker";
import { countries } from "../utils/countries";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import {
  format,
  parseISO,
  eachDayOfInterval,
  subDays,
  addDays,
} from "date-fns";
import StayCalendar from "../components/tracker/StayCalendar";
import {
  FiClock,
  FiMapPin,
  FiCalendar,
  FiShield,
  FiAlertTriangle,
  FiTrendingDown,
  FiDownloadCloud,
  FiInfo,
  FiPlus,
  FiChevronDown,
} from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";
import TravelForm from "../components/tracker/TravelForm";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Dashboard Interactive Menu dropdown selectors handling variables
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const getFullCountryName = (code) => {
    if (!code) return "Unknown Base";
    if (code.toUpperCase() === "ABROAD" || code.toUpperCase() === "OTHER")
      return "Abroad";
    const match = countries.find(
      (c) => c.code.toUpperCase() === code.toUpperCase(),
    );
    return match ? match.name : code;
  };

  const formatToMonthDay = (dateStr) => {
    if (!dateStr || dateStr.includes("Open") || dateStr === "not-set")
      return "Not Set";

    try {
      if (/^\d{2}-\d{2}$/.test(dateStr)) {
        const [month, day] = dateStr.split("-");
        const shortMonths = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const monthIndex = parseInt(month, 10) - 1;

        if (monthIndex >= 0 && monthIndex < 12) {
          return `${day} ${shortMonths[monthIndex]}`;
        }
      }
      return format(parseISO(dateStr), "dd MMM");
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
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

  // Handle outside layout boundaries triggers click to shut down dropdown container
  useEffect(() => {
    function handleClickOutsideMenu(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideMenu);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideMenu);
  }, []);

  useEffect(() => {
    if (!user || metricsLoading) return;

    const today = new Date().toISOString().split("T")[0];
    const localStorageKey = `lastLocationTrackDate_${user.uid}`;
    const alreadyTrackedToday = localStorage.getItem(localStorageKey);

    const gpsRecordExistsInDb = records.some((r) => {
      const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;
      return arrival === today && r.purpose === "Daily GPS Check-In";
    });

    if (alreadyTrackedToday === today && gpsRecordExistsInDb) {
      return;
    }

    const runTracking = async () => {
      try {
        const tracked = await autoTrackLocation(user, records);
        if (tracked) {
          toast.success("Daily GPS check-in recorded successfully");
        }
        localStorage.setItem(localStorageKey, today);
      } catch (error) {
        console.error("[Dashboard GPS Auto-Track Error]:", error);
      }
    };

    runTracking();
  }, [user, metricsLoading, records]);

  if (metricsLoading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <BiLoaderAlt className="animate-spin text-slate-800 text-3xl" />
      </div>
    );
  }

  const calculation = calculateResidencyStatus(records, profile);
  const rawHomeCountry = profile?.homeCountry || profile?.nativeCountry || "US";
  const homeCountryName = rawHomeCountry
    ? getFullCountryName(rawHomeCountry)
    : "Configuring Base...";

  const targetTimezone = profile?.timezone || "Not Set";
  const horizonPeriodStart =
    profile?.residencyPeriodStart || profile?.fyStart || "Start Date Open";
  const horizonPeriodEnd =
    profile?.residencyPeriodEnd || profile?.fyEnd || "End Date Open";
  const definedMilestone = parseInt(profile?.residencyThreshold || "183", 10);

  const hasValidTravelRecords = records.some(
    (record) =>
      record?.arrivalDate &&
      record?.departureDate &&
      (record?.toCountry || record?.fromCountry),
  );

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
      "Origin Country": getFullCountryName(record.fromCountry) || "N/A",
      "Destination Country": getFullCountryName(record.toCountry) || "N/A",
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

  const handleTogglePresence = async (dateStr, nextStatus) => {
    try {
      const homeBase = (
        profile?.homeCountry ||
        profile?.nativeCountry ||
        "US"
      ).toUpperCase();
      const cleanDateStr = dateStr.includes("T")
        ? dateStr.split("T")[0]
        : dateStr;

      const normalizeDate = (d) => {
        if (!d) return d;
        return d.includes("T") ? d.split("T")[0] : d;
      };

      const explicitSingleRecord = records.find((r) => {
        const rDept = normalizeDate(r.departureDate);
        const rArr = normalizeDate(r.arrivalDate);
        return (
          rDept === cleanDateStr &&
          rArr === cleanDateStr &&
          (r.purpose === "Calendar Check-In" ||
            r.purpose === "Calendar Check-Out")
        );
      });

      const parentRangeRecord = records
        .filter((r) => {
          if (!r.departureDate || !r.arrivalDate) return false;
          const rDept = normalizeDate(r.departureDate);
          const rArr = normalizeDate(r.arrivalDate);
          if (
            rDept === rArr &&
            (r.purpose === "Calendar Check-In" ||
              r.purpose === "Calendar Check-Out")
          ) {
            return false;
          }
          return cleanDateStr >= rDept && cleanDateStr <= rArr;
        })
        .sort((a, b) => {
          const aLength =
            new Date(normalizeDate(a.arrivalDate)) -
            new Date(normalizeDate(a.departureDate));
          const bLength =
            new Date(normalizeDate(b.arrivalDate)) -
            new Date(normalizeDate(b.departureDate));
          return aLength - bLength;
        })[0];

      const targetToCountry =
        nextStatus === "Abroad Stay" ? "ABROAD" : homeBase;
      const targetFromCountry =
        nextStatus === "Abroad Stay" ? homeBase : "ABROAD";
      const targetPurpose =
        nextStatus === "Abroad Stay"
          ? "Calendar Check-In"
          : "Calendar Check-Out";

      if (explicitSingleRecord) {
        await updateTravelRecord(explicitSingleRecord.recordId, {
          departureDate: cleanDateStr,
          arrivalDate: cleanDateStr,
          fromCountry: targetFromCountry,
          toCountry: targetToCountry,
          purpose: targetPurpose,
        });
      } else if (parentRangeRecord) {
        const pStartStr = normalizeDate(parentRangeRecord.departureDate);
        const pEndStr = normalizeDate(parentRangeRecord.arrivalDate);

        const baseProps = {
          fromCountry: parentRangeRecord.fromCountry || homeBase,
          toCountry: parentRangeRecord.toCountry || "ABROAD",
          purpose: parentRangeRecord.purpose || "Automated System Entry",
        };

        const currentDate = parseISO(cleanDateStr);
        const prevDayStr = format(subDays(currentDate, 1), "yyyy-MM-dd");
        const nextDayStr = format(addDays(currentDate, 1), "yyyy-MM-dd");

        if (pStartStr === cleanDateStr) {
          await Promise.all([
            updateTravelRecord(parentRangeRecord.recordId, {
              ...baseProps,
              departureDate: nextDayStr,
              arrivalDate: pEndStr,
            }),
            addTravelRecord(user.uid, {
              departureDate: cleanDateStr,
              arrivalDate: cleanDateStr,
              fromCountry: targetFromCountry,
              toCountry: targetToCountry,
              purpose: targetPurpose,
            }),
          ]);
        } else if (pEndStr === cleanDateStr) {
          await Promise.all([
            updateTravelRecord(parentRangeRecord.recordId, {
              ...baseProps,
              departureDate: pStartStr,
              arrivalDate: prevDayStr,
            }),
            addTravelRecord(user.uid, {
              departureDate: cleanDateStr,
              arrivalDate: cleanDateStr,
              fromCountry: targetFromCountry,
              toCountry: targetToCountry,
              purpose: targetPurpose,
            }),
          ]);
        } else {
          await Promise.all([
            updateTravelRecord(parentRangeRecord.recordId, {
              ...baseProps,
              departureDate: pStartStr,
              arrivalDate: prevDayStr,
            }),
            addTravelRecord(user.uid, {
              ...baseProps,
              departureDate: nextDayStr,
              arrivalDate: pEndStr,
            }),
            addTravelRecord(user.uid, {
              departureDate: cleanDateStr,
              arrivalDate: cleanDateStr,
              fromCountry: targetFromCountry,
              toCountry: targetToCountry,
              purpose: targetPurpose,
            }),
          ]);
        }
      } else {
        await addTravelRecord(user.uid, {
          departureDate: cleanDateStr,
          arrivalDate: cleanDateStr,
          fromCountry: targetFromCountry,
          toCountry: targetToCountry,
          purpose: targetPurpose,
        });
      }

      toast.success(`Presence status updated for ${cleanDateStr}`);
    } catch (error) {
      console.error("[Dashboard Override Error]:", error);
      toast.error("Could not update presence tracking status.");
    }
  };

  const displayHomeDays = hasValidTravelRecords
    ? (calculation?.homeDays ?? 0)
    : 0;
  const displayOutsideDays = hasValidTravelRecords
    ? (calculation?.outsideDays ?? 0)
    : 0;
  const loggedTotalDays = calculation?.totalDays || 0;
  const remainingTargetDays = Math.max(0, definedMilestone - displayHomeDays);

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
      value: `${formatToMonthDay(horizonPeriodStart)} → ${formatToMonthDay(horizonPeriodEnd)}`,
      icon: FiCalendar,
      iconBg: "bg-pink-50 text-pink-600",
    },
  ];

  const getCurrentFootprint = () => {
    if (records.length === 0) return homeCountryName;
    const gpsRecords = records.filter(
      (r) => r.purpose === "Daily GPS Check-In",
    );
    const targetRecords = gpsRecords.length > 0 ? gpsRecords : records;

    const latestRecord = [...targetRecords].sort((a, b) => {
      const dateA = new Date(a.arrivalDate || a.departureDate || 0);
      const dateB = new Date(b.arrivalDate || b.departureDate || 0);
      return dateB - dateA;
    })[0];

    if (
      latestRecord?.toCountry?.toUpperCase() === "ABROAD" ||
      latestRecord?.toCountry?.toUpperCase() === "OTHER"
    ) {
      return "Abroad";
    }
    return latestRecord?.toCountry
      ? getFullCountryName(latestRecord.toCountry)
      : "Locating...";
  };

  const currentFootprintDisplay = getCurrentFootprint();
  const homeBase = (
    profile?.homeCountry ||
    profile?.nativeCountry ||
    "US"
  ).toUpperCase();
  const computedDayMap = {};

  if (hasValidTravelRecords) {
    const homeBase = (
      profile?.homeCountry ||
      profile?.nativeCountry ||
      "US"
    ).toUpperCase();

    records.forEach((record) => {
      if (!record?.arrivalDate || !record?.departureDate) return;
      if (
        record.arrivalDate === record.departureDate &&
        (record.purpose === "Calendar Check-In" ||
          record.purpose === "Calendar Check-Out")
      ) {
        return;
      }

      const isRecordHome =
        record.toCountry && record.toCountry.toUpperCase() === homeBase;
      const days = eachDayOfInterval({
        start: new Date(record.departureDate + "T00:00:00"),
        end: new Date(record.arrivalDate + "T00:00:00"),
      });

      days.forEach((day) => {
        const key = format(day, "yyyy-MM-dd");
        computedDayMap[key] = {
          status: isRecordHome ? "Home Stay" : "Abroad Stay",
          country: getFullCountryName(record.toCountry),
        };
      });
    });

    records.forEach((record) => {
      if (!record?.arrivalDate || !record?.departureDate) return;
      if (record.arrivalDate !== record.departureDate) return;
      if (
        record.purpose !== "Calendar Check-In" &&
        record.purpose !== "Calendar Check-Out"
      )
        return;

      const key = record.arrivalDate;
      const isRecordHome =
        record.toCountry && record.toCountry.toUpperCase() === homeBase;

      computedDayMap[key] = {
        status: isRecordHome ? "Home Stay" : "Abroad Stay",
        country: getFullCountryName(record.toCountry),
      };
    });
  }
  records.forEach((record) => {
    if (!record?.arrivalDate || !record?.departureDate) return;
    if (record.arrivalDate !== record.departureDate) return;
    if (
      record.purpose !== "Calendar Check-In" &&
      record.purpose !== "Calendar Check-Out"
    )
      return;

    const key = record.arrivalDate;
    const isRecordHome =
      record.toCountry && record.toCountry.toUpperCase() === homeBase;

    computedDayMap[key] = {
      status: isRecordHome ? "Home Stay" : "Abroad Stay",
      country: getFullCountryName(record.toCountry),
    };
  });
  const calendarHomeDays = Object.values(computedDayMap).filter(
    (day) => day.status === "Home Stay",
  ).length;

  const calendarAbroadDays = Object.values(computedDayMap).filter(
    (day) => day.status === "Abroad Stay",
  ).length;
  // const handleFormSubmitCallback = async (data) => {
  //   try {
  //     if (editingRecord) {
  //       await updateTravelRecord(editingRecord.recordId, data);
  //       toast.success("Record updated");
  //     } else {
  //       await addTravelRecord(user.uid, data);
  //       toast.success("Record added");
  //     }
  //     setShowForm(false);
  //     setEditingRecord(null);
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Operation failed");
  //   }
  // };
  const handleFormSubmitCallback = async (data) => {
    try {
      const normalizeDate = (date) => {
        if (!date) return "";
        return date.includes("T") ? date.split("T")[0] : date;
      };

      const isDuplicate = records.some((record) => {
        if (editingRecord && record.recordId === editingRecord.recordId) {
          return false;
        }

        return (
          normalizeDate(record.departureDate) ===
            normalizeDate(data.departureDate) &&
          normalizeDate(record.arrivalDate) ===
            normalizeDate(data.arrivalDate) &&
          (record.fromCountry || "").toUpperCase() ===
            (data.fromCountry || "").toUpperCase() &&
          (record.toCountry || "").toUpperCase() ===
            (data.toCountry || "").toUpperCase()
        );
      });

      if (isDuplicate) {
        toast.error(
          "A travel record with the same dates and countries already exists.",
        );
        return;
      }

      if (editingRecord) {
        await updateTravelRecord(editingRecord.recordId, data);
        toast.success("Record updated successfully");
      } else {
        await addTravelRecord(user.uid, data);
        toast.success("Travel record added successfully");
      }

      setShowForm(false);
      setEditingRecord(null);
    } catch (error) {
      console.error(error);

      toast.error(error?.message || "Unable to save travel record");
    }
  };
  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto text-left">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-100 flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-amber-700 font-bold uppercase tracking-wider">
              Target Tracker
            </p>
            <div className="flex flex-wrap items-baseline gap-1 mt-2">
              <h3 className="text-2xl sm:text-3xl font-black text-amber-900">
                {displayHomeDays}
              </h3>
              <span className="text-base sm:text-lg font-semibold text-amber-700">
                /
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-900">
                {definedMilestone}
              </h3>
              <span className="text-xs sm:text-sm text-amber-600 font-semibold ml-0.5">
                days
              </span>
            </div>
            <p className="text-xs sm:text-sm text-red-600 mt-2 sm:mt-3 font-semibold">
              Remaining: {remainingTargetDays} Days
            </p>
          </div>

          <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
            <p className="text-sm text-green-700 font-medium">
              Own Country Stay
            </p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-3xl font-bold text-green-900 mt-2">
                {displayHomeDays}
              </h3>
              <p className="text-sm text-green-600 font-medium mt-3">days</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <p className="text-sm text-blue-700 font-medium">
              Abroad Country Stay
            </p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-3xl font-bold text-blue-900 mt-2">
                {displayOutsideDays}
              </h3>
              <p className="text-sm text-blue-600 font-medium mt-3">days</p>
            </div>
          </div>

          <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
            <p className="text-sm text-purple-700 font-medium">Total Stay</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-3xl font-bold text-purple-900 mt-2">
                {loggedTotalDays}
              </h3>
              <p className="text-sm text-purple-600 font-medium mt-3">days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Progress Metric Frame */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Residency Status Progress
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

      {/* Profile Summary Logs Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Profile Summary
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your current core settings, tracking horizons, and
            active global workspace footprint.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                      {card.title}
                    </p>
                    <p className="text-lg font-semibold text-slate-900 break-words mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
                  >
                    <Icon className="text-lg" />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  Current Footprint
                </p>
                <p className="text-lg font-semibold text-slate-900 truncate max-w-[180px]">
                  {currentFootprintDisplay}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <FiMapPin className="text-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banners */}
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

      {/* Permanent Information Banner Container Area */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <FiInfo className="text-xl" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-blue-900 text-base tracking-tight">
              Add Your Travel History
            </h3>
            <p className="text-base text-blue-700 leading-relaxed max-w-3xl">
              For accurate residency calculations, add your previous travel
              history using the Add Travel Record button or update your stay
              records directly from the calendar below.
            </p>
          </div>
        </div>

        {/* Dashboard Split Action-Dropdown Button View */}
        <div className="relative shrink-0 w-full md:w-auto" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-sm text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
          >
            <FiPlus />
            <span>Add Travel Record</span>
            <FiChevronDown
              className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-full md:w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  const element = document.getElementById(
                    "stay-calendar-section",
                  );
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
              >
                <FiCalendar className="text-blue-500 text-base" />
                <span>Update via Calendar View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setEditingRecord(null);
                  setShowForm(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer border-t border-slate-100"
              >
                <FiPlus className="text-purple-500 text-base" />
                <span>Log via Manual Form</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Target Stay Calendar anchor zone block */}
      <div
        id="stay-calendar-section"
        className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl space-y-6 w-full mx-auto border border-slate-200 shadow-lg p-6"
      >
        <div
          id="stay-calendar-section"
          className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl space-y-6 w-full mx-auto border border-slate-200 shadow-lg p-6"
        >
          {/* NEW HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-slate-900">Stay Calendar</h2>

            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                <span className="text-green-700 font-semibold text-sm">
                  🏠 Home: {calendarHomeDays} Days
                </span>
              </div>

              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-blue-700 font-semibold text-sm">
                  🌍 Abroad: {calendarAbroadDays} Days
                </span>
              </div>
            </div>
          </div>

          <StayCalendar
            dayMap={computedDayMap}
            travelRecords={records}
            fyStart={profile?.fyStart || profile?.residencyPeriodStart}
            fyEnd={profile?.fyEnd || profile?.residencyPeriodEnd}
            onToggleDayPresence={handleTogglePresence}
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <TravelForm
              initialData={editingRecord}
              onSubmit={handleFormSubmitCallback}
              travelRecords={records}
              onCancel={() => {
                setShowForm(false);
                setEditingRecord(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
