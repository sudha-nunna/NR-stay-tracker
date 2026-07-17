import { useEffect, useRef } from "react"; // Added useEffect import
import { BiLoaderAlt } from "react-icons/bi";
import { FiMapPin, FiClock, FiCalendar, FiSend } from "react-icons/fi";
import { useResidencyDashboard } from "../hooks/useResidencyDashboard";
import React from "react";
import { autoTrackLocation } from "../utils/locationTracker";
export default function Dashboard() {
  const {
    user, // Added cleanly here to resolve the ReferenceError
    profile,
    records,
    metricsLoading,
    calculation,
    homeCountryName,
    definedMilestone,
    hasValidTravelRecords,
    runway,
    displayHomeDays,
    displayOutsideDays,
    remainingTargetDays,
    getFullCountryName,
    handleTogglePresence,
    handleFormSubmitCallback,
  } = useResidencyDashboard();

  // STOPS CO-CURRENT SUBMISSIONS IN INTERMEDIATE COMPONENT LIFECYCLES
  const isCurrentlySubmittingGPS = useRef(false);

  // 2. Updated useEffect block with validation and storage synchronizer:
  useEffect(() => {
    // PREVENT FIRING PREMATURELY BEFORE LIVE FIRESTORE STREAM COMPLETES INITIAL LOADING
    if (metricsLoading || typeof handleFormSubmitCallback !== "function") {
      return;
    }

    const todayStr = new Date().toLocaleDateString("en-CA");
    const storageKey = `gps_checked_in_${todayStr}`;

    // Look up current record logs array to check if a GPS check-in exists for today
    const activeRecordExists = records.some(
      (r) =>
        r.departureDate?.startsWith(todayStr) &&
        r.purpose === "Daily GPS Check-In",
    );

    // INSTANT FORCE SYNC: If record is missing from DB, immediately clear local settings synchronously
    // if (!activeRecordExists) {
    //   localStorage.removeItem(storageKey);
    //   isCurrentlySubmittingGPS.current = false;
    // }
    // INSTANT FORCE SYNC: Completely reset both storage and internal ref variables synchronously
    if (!activeRecordExists) {
      localStorage.removeItem(storageKey);
      isCurrentlySubmittingGPS.current = false; // Directly updates the active operational guard reference
    } else {
      // If it does exist in the database, keep the ref synchronized to block duplicate triggers
      isCurrentlySubmittingGPS.current = true;
    }

    // SAFETY GUARD: Wait until base settings match array stream context builds up securely
    const hasInitialStayRecord = records.some(
      (r) => r.purpose === "Initial Home Stay",
    );
    if (records.length > 0 && !hasInitialStayRecord) {
      return;
    }

    // Read token right here AFTER the active database mismatch verification check runs
    const isCheckedInToday = localStorage.getItem(storageKey);

    // Strict single-execution check
    if (
      !isCheckedInToday &&
      !activeRecordExists &&
      !isCurrentlySubmittingGPS.current
    ) {
      isCurrentlySubmittingGPS.current = true;
      localStorage.setItem(storageKey, "true");

      autoTrackLocation(user, records, profile)
        .then((tracked) => {
          if (!tracked) {
            isCurrentlySubmittingGPS.current = false;
            localStorage.removeItem(storageKey);
          }
        })
        .catch((err) => {
          console.error(err);
          isCurrentlySubmittingGPS.current = false;
          localStorage.removeItem(storageKey);
        });
    } else if (activeRecordExists && !isCheckedInToday) {
      localStorage.setItem(storageKey, "true");
      isCurrentlySubmittingGPS.current = true;
    }
  }, [metricsLoading, handleFormSubmitCallback, records, profile, user]);
  if (metricsLoading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <BiLoaderAlt className="animate-spin text-slate-800 text-3xl" />
      </div>
    );
  }

  const loggedTrips = records.filter((r) => {
  // Exclude initial setup markers that aren't actual trips
  if (r.purpose === "Initial Home Stay") return false;

  // Include if it's a valid travel log targeting a real outside country,
  // but explicitly exclude the text placeholder "ABROAD"
  if (r.toCountry === "ABROAD") return false;

  // Include if it's a valid travel log targeting an outside country
  return r.toCountry && r.toCountry !== profile?.homeCountry;
});
  const recentTrips = [...loggedTrips]
    .sort(
      (a, b) => new Date(b.departureDate || 0) - new Date(a.departureDate || 0),
    )
    .slice(0, 5);

  const formatShortDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const tripDuration = (record) => {
    try {
      const dep = new Date(record.departureDate);
      const arr = new Date(record.arrivalDate);
      const days = Math.max(
        1,
        Math.round((arr - dep) / (1000 * 60 * 60 * 24)) + 1,
      );
      return `${days}d`;
    } catch {
      return "";
    }
  };

  // Ring proportion: Home vs Abroad split of days logged so far (NOT vs milestone).
  // Guards against 0/0 when no days have been logged yet.
  const totalTrackedDays = displayHomeDays + displayOutsideDays;
  const abroadFraction =
    totalTrackedDays > 0
      ? Math.min(displayOutsideDays / totalTrackedDays, 1)
      : 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 max-w-7xl mx-auto text-left">
      {/* ===== GREETING + BADGE: outside the card, on the page background ===== */}
      <div className="flex items-start justify-between ">
        <div>
          <p className="text-slate-500 text-sm sm:text-lg font-semibold">
            Hello, {homeCountryName}
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 leading-tight">
            Your residency
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-full bg-green-700 text-white font-semibold text-xs sm:text-lg shrink-0">
          <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white"></span>
          {calculation.status}
        </div>
      </div>

      {/* ===== CARD: Ring + Home/Abroad ONLY ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col items-center">
          <div className="relative w-52 h-52 sm:w-64 sm:h-64">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#14532d "
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#D4A857"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={2 * Math.PI * 48 * (1 - abroadFraction)}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-slate-500 text-sm uppercase tracking-wider">
                Days Abroad
              </span>
              <h2 className="text-5xl font-black text-slate-900">
                {displayOutsideDays}
              </h2>
              <p className="text-slate-500 text-sm">
                of {definedMilestone} limit
              </p>
              <span className="mt-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                FY {new Date(profile?.fyStart).getFullYear()}-
                {String(new Date(profile?.fyEnd).getFullYear()).slice(-2)}
              </span>
            </div>
          </div>

          {/* Home / Abroad split — dot markers, divider, matches mobile reference */}
          <div className="flex items-center justify-center gap-10 sm:gap-16 mt-5 sm:mt-8 w-full max-w-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-green-700"></span>
                Home
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {displayHomeDays}d
              </span>
            </div>
            <div className="w-px h-10 bg-slate-200"></div>
            <div className="flex flex-col items-center gap-1">
              <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]"></span>
                Abroad
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {displayOutsideDays}d
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SEPARATE CARDS: Days to Target / Days Left / Trips Logged ===== */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-5">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 sm:mb-3">
            <FiClock className="text-sm sm:text-lg" />
          </div>
          <p className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide font-semibold">
            Days to Target
          </p>
          <h3 className="text-xl sm:text-3xl font-bold text-slate-900 mt-1">
            {remainingTargetDays}
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-5">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 sm:mb-3">
            <FiCalendar className="text-sm sm:text-lg" />
          </div>
          <p className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide font-semibold">
            Days Left in FY
          </p>
          <h3 className="text-xl sm:text-3xl font-bold text-slate-900 mt-1">
            {runway.daysLeftInPeriod}
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-5">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-2 sm:mb-3">
            <FiSend className="text-sm sm:text-lg" />
          </div>
          <p className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wide font-semibold">
            Trips Logged
          </p>
          <h3 className="text-xl sm:text-3xl font-bold text-slate-900 mt-1">
            {loggedTrips.length}
          </h3>
        </div>
      </div>

      {/* ===== SEPARATE CARD: Projection ===== */}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 sm:p-5">
        <h4 className="font-bold text-green-800 mb-1.5 text-sm sm:text-base">
          Projection
        </h4>
        <p className="text-green-700 text-xs sm:text-sm">
          You need {remainingTargetDays} more days abroad within{" "}
          {runway.daysLeftInPeriod} remaining days of this tracking period.
        </p>
      </div>

      {/* ===== SEPARATE CARD: Recent Trips ===== */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Recent Trips</h2>
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
            {loggedTrips.length} Logs
          </span>
        </div>

        {recentTrips.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No travel records logged yet.
          </p>
        ) : (
          <div className="space-y-3">
            {recentTrips.map((record) => (
              <div
                key={record.recordId}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FiMapPin className="text-lg" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {getFullCountryName(record.toCountry)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatShortDate(record.departureDate)} →{" "}
                      {formatShortDate(record.arrivalDate)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full">
                  {tripDuration(record)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// import { BiLoaderAlt } from "react-icons/bi";
// import { FiMapPin } from "react-icons/fi";
// import { useResidencyDashboard } from "../hooks/useResidencyDashboard";

// export default function Dashboard() {
//   const {
//     profile,
//     records,
//     metricsLoading,
//     calculation,
//     homeCountryName,
//     definedMilestone,
//     hasValidTravelRecords,
//     runway,
//     displayHomeDays,
//     displayOutsideDays,
//     remainingTargetDays,
//     getFullCountryName,
//   } = useResidencyDashboard();

//   if (metricsLoading) {
//     return (
//       <div className="h-[60vh] w-full flex items-center justify-center">
//         <BiLoaderAlt className="animate-spin text-slate-800 text-3xl" />
//       </div>
//     );
//   }

//   // Trips logged: exclude system-generated / auto entries
//   const AUTO_PURPOSES = [
//     "Initial Home Stay",
//     "Daily GPS Check-In",
//     "Country Changed",
//     "Calendar Check-In",
//     "Calendar Check-Out",
//     "Automated System Entry",
//   ];
//   const loggedTrips = records.filter(
//     (r) => !AUTO_PURPOSES.includes(r.purpose),
//   );
//   const recentTrips = [...loggedTrips]
//     .sort(
//       (a, b) => new Date(b.departureDate || 0) - new Date(a.departureDate || 0),
//     )
//     .slice(0, 5);

//   const formatShortDate = (dateStr) => {
//     if (!dateStr) return "";
//     try {
//       return new Date(dateStr).toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//       });
//     } catch {
//       return dateStr;
//     }
//   };

//   const tripDuration = (record) => {
//     try {
//       const dep = new Date(record.departureDate);
//       const arr = new Date(record.arrivalDate);
//       const days = Math.max(
//         1,
//         Math.round((arr - dep) / (1000 * 60 * 60 * 24)) + 1,
//       );
//       return `${days}d`;
//     } catch {
//       return "";
//     }
//   };

//   return (
//     <div className="space-y-8 pb-4 max-w-7xl mx-auto text-left">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-black tracking-tight">
//             Workspace Terminal
//           </h1>
//           <p className="text-sm text-blue-800 font-medium mt-1">
//             Global Travel & Residency Management
//           </p>
//         </div>
//       </div>

//       <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
//         <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
//           <div>
//             <p className="text-slate-500 text-lg font-semibold">
//               Hello, {homeCountryName}
//             </p>
//             <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
//               Your residency
//             </h2>
//           </div>
//           <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green-700 text-white font-semibold text-lg self-start">
//             <span className="w-3 h-3 rounded-full bg-white"></span>
//             {calculation.status}
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
//           <div className="flex justify-center">
//             <div className="relative w-64 h-64">
//               <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
//                 <circle
//                   cx="60"
//                   cy="60"
//                   r="48"
//                   fill="none"
//                   stroke="#14532d"
//                   strokeWidth="10"
//                 />
//                 <circle
//                   cx="60"
//                   cy="60"
//                   r="48"
//                   fill="none"
//                   stroke="#D4A857"
//                   strokeWidth="10"
//                   strokeLinecap="round"
//                   strokeDasharray={`${2 * Math.PI * 48}`}
//                   strokeDashoffset={
//                     2 *
//                       Math.PI *
//                       48 *
//                       (1 -
//                         Math.min(displayOutsideDays / definedMilestone, 1)) ||
//                     0
//                   }
//                 />
//               </svg>

//               <div className="absolute inset-0 flex flex-col items-center justify-center">
//                 <span className="text-slate-500 text-sm uppercase tracking-wider">
//                   Days Abroad
//                 </span>
//                 <h2 className="text-5xl font-black text-slate-900">
//                   {displayOutsideDays}
//                 </h2>
//                 <p className="text-slate-500 text-sm">
//                   of {definedMilestone} limit
//                 </p>
//                 <span className="mt-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
//                   FY {new Date(profile?.fyStart).getFullYear()}-
//                   {String(new Date(profile?.fyEnd).getFullYear()).slice(-2)}
//                 </span>
//               </div>
//             </div>
//           </div>

//           <div className="space-y-5">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="bg-slate-50 rounded-2xl p-4">
//                 <p className="text-slate-500 text-sm">Home</p>
//                 <h3 className="text-3xl font-bold text-green-700">
//                   {displayHomeDays}days
//                 </h3>
//               </div>
//               <div className="bg-slate-50 rounded-2xl p-4">
//                 <p className="text-slate-500 text-sm">Abroad</p>
//                 <h3 className="text-3xl font-bold text-amber-600">
//                   {displayOutsideDays}days
//                 </h3>
//               </div>
//             </div>

//             <div className="grid grid-cols-3 gap-4">
//               <div className="bg-slate-50 rounded-2xl p-4">
//                 <p className="text-slate-500 text-xs">Days to Target</p>
//                 <h3 className="text-2xl font-bold text-slate-900">
//                   {remainingTargetDays}
//                 </h3>
//               </div>
//               <div className="bg-slate-50 rounded-2xl p-4">
//                 <p className="text-slate-500 text-xs">Days Left</p>
//                 <h3 className="text-2xl font-bold text-slate-900">
//                   {runway.daysLeftInPeriod}
//                 </h3>
//               </div>
//               <div className="bg-slate-50 rounded-2xl p-4">
//                 <p className="text-slate-500 text-xs">Trips Logged</p>
//                 <h3 className="text-2xl font-bold text-slate-900">
//                   {loggedTrips.length}
//                 </h3>
//               </div>
//             </div>

//             <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
//               <h4 className="font-bold text-green-800 mb-2">Projection</h4>
//               <p className="text-green-700 text-sm">
//                 You need {remainingTargetDays} more days abroad within{" "}
//                 {runway.daysLeftInPeriod} remaining days of this tracking
//                 period.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-xl font-semibold text-slate-900">
//             Recent Trips
//           </h2>
//           <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
//             {loggedTrips.length} Logs
//           </span>
//         </div>

//         {recentTrips.length === 0 ? (
//           <p className="text-slate-500 text-sm">
//             No travel records logged yet.
//           </p>
//         ) : (
//           <div className="space-y-3">
//             {recentTrips.map((record) => (
//               <div
//                 key={record.recordId}
//                 className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
//                     <FiMapPin className="text-lg" />
//                   </div>
//                   <div>
//                     <p className="font-semibold text-slate-900">
//                       {getFullCountryName(record.toCountry)}
//                     </p>
//                     <p className="text-xs text-slate-500">
//                       {formatShortDate(record.departureDate)} →{" "}
//                       {formatShortDate(record.arrivalDate)}
//                     </p>
//                   </div>
//                 </div>
//                 <span className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full">
//                   {tripDuration(record)}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // import { useEffect, useState, useRef } from "react";
// // import { useAuth } from "../context/AuthContext";
// // import {
// //   subscribeToTravelRecords,
// //   addTravelRecord,
// //   updateTravelRecord,
// // } from "../firebase/firestoreService";
// // import { calculateResidencyStatus } from "../utils/residencyCalculator";
// // import { autoTrackLocation } from "../utils/locationTracker";
// // import { countries } from "../utils/countries";

// // import toast from "react-hot-toast";
// // import {
// //   format,
// //   parseISO,
// //   eachDayOfInterval,
// //   subDays,
// //   isAfter,
// // } from "date-fns";
// // import StayCalendar from "../components/tracker/StayCalendar";
// // import {
// //   FiClock,
// //   FiMapPin,
// //   FiCalendar,
// //   FiAlertTriangle,
// //   FiDownloadCloud,
// //   FiInfo,
// //   FiPlus,
// //   FiChevronDown,
// // } from "react-icons/fi";
// // import { BiLoaderAlt } from "react-icons/bi";
// // import TravelForm from "../components/tracker/TravelForm";

// // import { usePresenceToggle } from "../hooks/usePresenceToggle";

// // export default function Dashboard() {
// //   const { user, profile } = useAuth();
// //   const [records, setRecords] = useState([]);
// //   const [metricsLoading, setMetricsLoading] = useState(true);
// //   const [showForm, setShowForm] = useState(false);
// //   const [editingRecord, setEditingRecord] = useState(null);

// //   const [isMenuOpen, setIsMenuOpen] = useState(false);
// //   const menuRef = useRef(null);

// //   const isCreatingInitialHomeStay = useRef(false);

// //   // EXECUTE HOOK TO GET UNIFIED SHARING METHOD
// //   const { handleTogglePresence } = usePresenceToggle(user, profile, records);

// //   const getFullCountryName = (code) => {
// //     if (!code) return "Unknown Base";
// //     if (code.toUpperCase() === "ABROAD" || code.toUpperCase() === "OTHER")
// //       return "Abroad";
// //     const match = countries.find(
// //       (c) => c.code.toUpperCase() === code.toUpperCase(),
// //     );
// //     return match ? match.name : code;
// //   };

// //   const formatToMonthDay = (dateStr) => {
// //     if (!dateStr || dateStr.includes("Open") || dateStr === "not-set")
// //       return "Not Set";

// //     try {
// //       if (/^\d{2}-\d{2}$/.test(dateStr)) {
// //         const [month, day] = dateStr.split("-");
// //         const shortMonths = [
// //           "Jan",
// //           "Feb",
// //           "Mar",
// //           "Apr",
// //           "May",
// //           "Jun",
// //           "Jul",
// //           "Aug",
// //           "Sep",
// //           "Oct",
// //           "Nov",
// //           "Dec",
// //         ];
// //         const monthIndex = parseInt(month, 10) - 1;

// //         if (monthIndex >= 0 && monthIndex < 12) {
// //           return `${day} ${shortMonths[monthIndex]}`;
// //         }
// //       }
// //       return format(parseISO(dateStr), "dd MMM");
// //     } catch (e) {
// //       return dateStr;
// //     }
// //   };

// //   useEffect(() => {
// //     window.scrollTo(0, 0);
// //     if (!user) return;

// //     const unsubscribe = subscribeToTravelRecords(
// //       user.uid,
// //       (fetchedRecords) => {
// //         setRecords(fetchedRecords);
// //         setMetricsLoading(false);
// //       },
// //       (error) => {
// //         console.error(error);
// //         setMetricsLoading(false);
// //       },
// //     );

// //     return () => unsubscribe();
// //   }, [user]);

// //   useEffect(() => {
// //     function handleClickOutsideMenu(event) {
// //       if (menuRef.current && !menuRef.current.contains(event.target)) {
// //         setIsMenuOpen(false);
// //       }
// //     }
// //     document.addEventListener("mousedown", handleClickOutsideMenu);
// //     return () =>
// //       document.removeEventListener("mousedown", handleClickOutsideMenu);
// //   }, []);

// //   useEffect(() => {
// //     if (!user || metricsLoading || !profile) return;
// //     const fyStart = profile?.fyStart || profile?.residencyPeriodStart;
// //     if (!fyStart) return;

// //     const rawHomeCountry =
// //       profile?.homeCountry || profile?.nativeCountry || "US";
// //     const initialHomeStayRecord = records.find(
// //       (r) => r.purpose === "Initial Home Stay",
// //     );

// //     if (!initialHomeStayRecord && !isCreatingInitialHomeStay.current) {
// //       isCreatingInitialHomeStay.current = true;
// //       const today = new Date();
// //       const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
// //       const cleanStartDate = fyStart.includes("T")
// //         ? fyStart.split("T")[0]
// //         : fyStart;

// //       addTravelRecord(user.uid, {
// //         departureDate: cleanStartDate,
// //         arrivalDate: yesterdayStr,
// //         fromCountry: rawHomeCountry,
// //         toCountry: rawHomeCountry,
// //         purpose: "Initial Home Stay",
// //       }).catch((err) => {
// //         console.error("[Initial Home Stay Auto-Creation Error]:", err);
// //         isCreatingInitialHomeStay.current = false;
// //       });
// //     } else if (initialHomeStayRecord) {
// //       const oldHomeCountry = initialHomeStayRecord.toCountry;

// //       if (
// //         oldHomeCountry !== rawHomeCountry ||
// //         initialHomeStayRecord.fromCountry !== rawHomeCountry
// //       ) {
// //         const syncOperations = [
// //           updateTravelRecord(initialHomeStayRecord.recordId, {
// //             fromCountry: rawHomeCountry,
// //             toCountry: rawHomeCountry,
// //             departureDate: initialHomeStayRecord.departureDate,
// //             arrivalDate: initialHomeStayRecord.arrivalDate,
// //             purpose: "Initial Home Stay",
// //           }),
// //         ];

// //         records.forEach((record) => {
// //           if (
// //             record.recordId !== initialHomeStayRecord.recordId &&
// //             record.fromCountry === oldHomeCountry &&
// //             (record.purpose === "Daily GPS Check-In" ||
// //               record.purpose === "Country Changed")
// //           ) {
// //             syncOperations.push(
// //               updateTravelRecord(record.recordId, {
// //                 ...record,
// //                 fromCountry: rawHomeCountry,
// //               }),
// //             );
// //           }
// //         });

// //         Promise.all(syncOperations).catch((err) =>
// //           console.error("[Profile Country Sync cascading update failed]:", err),
// //         );
// //       }
// //     }
// //   }, [user, profile, metricsLoading, records]);

// //   useEffect(() => {
// //     if (!user || metricsLoading || !profile) return;

// //     const fyStart = profile?.fyStart || profile?.residencyPeriodStart;
// //     const hasInitialHomeStay = records.some(
// //       (r) => r.purpose === "Initial Home Stay",
// //     );

// //     if (fyStart && !hasInitialHomeStay) {
// //       return;
// //     }

// //     const today = new Date().toISOString().split("T")[0];
// //     const localStorageKey = `lastLocationTrackDate_${user.uid}`;
// //     const alreadyTrackedToday = localStorage.getItem(localStorageKey);

// //     const gpsRecordExistsInDb = records.some((r) => {
// //       const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;
// //       return (
// //         arrival === today &&
// //         (r.purpose === "Daily GPS Check-In" || r.purpose === "Country Changed")
// //       );
// //     });

// //     if (!gpsRecordExistsInDb && alreadyTrackedToday === today) {
// //       localStorage.removeItem(localStorageKey);
// //     }

// //     if (gpsRecordExistsInDb || window.isLocationTrackingActive === today) {
// //       return;
// //     }

// //     const runTracking = async () => {
// //       try {
// //         const tracked = await autoTrackLocation(user, records, profile);
// //         if (tracked) {
// //           toast.success("Daily GPS check-in recorded successfully");
// //           localStorage.setItem(localStorageKey, today);
// //         }
// //       } catch (error) {
// //         console.error("[Dashboard GPS Auto-Track Error]:", error);
// //       }
// //     };

// //     runTracking();
// //   }, [user, metricsLoading, records, profile]);

// //   if (metricsLoading) {
// //     return (
// //       <div className="h-[60vh] w-full flex items-center justify-center">
// //         <BiLoaderAlt className="animate-spin text-slate-800 text-3xl" />
// //       </div>
// //     );
// //   }

// //   const calculation = calculateResidencyStatus(records, profile);
// //   const rawHomeCountry = profile?.homeCountry || profile?.nativeCountry || "US";
// //   const homeCountryName = rawHomeCountry
// //     ? getFullCountryName(rawHomeCountry)
// //     : "Configuring Base...";

// //   const targetTimezone = profile?.timezone || "Not Set";
// //   const horizonPeriodStart =
// //     profile?.residencyPeriodStart || profile?.fyStart || "Start Date Open";
// //   const horizonPeriodEnd =
// //     profile?.residencyPeriodEnd || profile?.fyEnd || "End Date Open";
// //   const definedMilestone = parseInt(profile?.residencyThreshold || "183", 10);

// //   const hasValidTravelRecords = records.some(
// //     (record) =>
// //       record?.arrivalDate &&
// //       record?.departureDate &&
// //       (record?.toCountry || record?.fromCountry),
// //   );

// //   const getRunwayMetrics = () => {
// //     const targetEnd = profile?.residencyPeriodEnd || profile?.fyEnd;
// //     const targetStart = profile?.residencyPeriodStart || profile?.fyStart;

// //     if (!targetEnd || !hasValidTravelRecords) {
// //       return { daysLeftInPeriod: 0, isPossible: true };
// //     }

// //     const endDate = new Date(targetEnd);
// //     const startDate = new Date(targetStart || targetEnd);
// //     const today = new Date();

// //     const dayInMilliseconds = 24 * 60 * 60 * 1000;
// //     const periodDays = Math.max(
// //       1,
// //       Math.round((endDate - startDate) / dayInMilliseconds) + 1,
// //     );
// //     const daysElapsed = Math.max(
// //       0,
// //       Math.round((today - startDate) / dayInMilliseconds),
// //     );
// //     const daysLeftInPeriod = Math.max(0, periodDays - daysElapsed);
// //     const isStillPossible = daysLeftInPeriod >= calculation.daysRemaining;

// //     return {
// //       daysLeftInPeriod,
// //       isPossible: isStillPossible,
// //     };
// //   };
// //   const runway = getRunwayMetrics();

// //   const displayHomeDays = hasValidTravelRecords
// //     ? (calculation?.homeDays ?? 0)
// //     : 0;
// //   const displayOutsideDays = hasValidTravelRecords
// //     ? (calculation?.outsideDays ?? 0)
// //     : 0;
// //   const remainingTargetDays = Math.max(
// //     0,
// //     definedMilestone - displayOutsideDays,
// //   );

// //   const cards = [
// //     {
// //       title: "Home Tracking Country",
// //       value: homeCountryName,
// //       icon: FiMapPin,
// //       iconBg: "bg-blue-50 text-blue-600",
// //     },
// //     {
// //       title: "Standard Timezone",
// //       value: targetTimezone,
// //       icon: FiClock,
// //       iconBg: "bg-purple-50 text-purple-600",
// //     },
// //     {
// //       title: "Tracking Horizon Period",
// //       value: `${formatToMonthDay(horizonPeriodStart)} → ${formatToMonthDay(horizonPeriodEnd)}`,
// //       icon: FiCalendar,
// //       iconBg: "bg-pink-50 text-pink-600",
// //     },
// //   ];

// //   const getCurrentFootprint = () => {
// //     if (records.length === 0) return homeCountryName;
// //     const gpsRecords = records.filter(
// //       (r) =>
// //         r.purpose === "Daily GPS Check-In" || r.purpose === "Country Changed",
// //     );
// //     const targetRecords = gpsRecords.length > 0 ? gpsRecords : records;

// //     const latestRecord = [...targetRecords].sort((a, b) => {
// //       const dateA = new Date(a.arrivalDate || a.departureDate || 0);
// //       const dateB = new Date(b.arrivalDate || b.departureDate || 0);
// //       return dateB - dateA;
// //     })[0];

// //     if (
// //       latestRecord?.toCountry?.toUpperCase() === "ABROAD" ||
// //       latestRecord?.toCountry?.toUpperCase() === "OTHER"
// //     ) {
// //       return "Abroad";
// //     }
// //     return latestRecord?.toCountry
// //       ? getFullCountryName(latestRecord.toCountry)
// //       : "Locating...";
// //   };

// //   const currentFootprintDisplay = getCurrentFootprint();
// //   const homeBase = (
// //     profile?.homeCountry ||
// //     profile?.nativeCountry ||
// //     "US"
// //   ).toUpperCase();
// //   const computedDayMap = {};

// //   if (hasValidTravelRecords) {
// //     records.forEach((record) => {
// //       if (!record?.arrivalDate || !record?.departureDate) return;
// //       if (isAfter(parseISO(record.departureDate), parseISO(record.arrivalDate)))
// //         return;
// //       if (
// //         record.arrivalDate === record.departureDate &&
// //         (record.purpose === "Calendar Check-In" ||
// //           record.purpose === "Calendar Check-Out" ||
// //           record.purpose === "Daily GPS Check-In")
// //       ) {
// //         return;
// //       }

// //       const isRecordHome =
// //         record.toCountry && record.toCountry.toUpperCase() === homeBase;
// //       const days = eachDayOfInterval({
// //         start: new Date(record.departureDate + "T00:00:00"),
// //         end: new Date(record.arrivalDate + "T00:00:00"),
// //       });

// //       days.forEach((day) => {
// //         const key = format(day, "yyyy-MM-dd");
// //         computedDayMap[key] = {
// //           status: isRecordHome ? "Home Stay" : "Abroad Stay",
// //           country: getFullCountryName(record.toCountry),
// //         };
// //       });
// //     });

// //     records.forEach((record) => {
// //       if (!record?.arrivalDate || !record?.departureDate) return;
// //       if (record.arrivalDate !== record.departureDate) return;
// //       if (
// //         record.purpose !== "Calendar Check-In" &&
// //         record.purpose !== "Calendar Check-Out" &&
// //         record.purpose !== "Daily GPS Check-In"
// //       )
// //         return;

// //       const key = record.arrivalDate;
// //       const isRecordHome =
// //         record.toCountry && record.toCountry.toUpperCase() === homeBase;

// //       computedDayMap[key] = {
// //         status: isRecordHome ? "Home Stay" : "Abroad Stay",
// //         country: getFullCountryName(record.toCountry),
// //       };
// //     });
// //   }

// //   const calendarHomeDays = displayHomeDays;
// //   const calendarAbroadDays = displayOutsideDays;
// //   // const loggedTotalDays = calendarHomeDays + calendarAbroadDays;
// //   const loggedTotalDays =
// //     Number(calendarHomeDays || 0) + Number(calendarAbroadDays || 0);
// //   const handleFormSubmitCallback = async (data) => {
// //     try {
// //       const normalizeDate = (date) => {
// //         if (!date) return "";
// //         return date.includes("T") ? date.split("T")[0] : date;
// //       };

// //       const isDuplicate = records.some((record) => {
// //         if (editingRecord && record.recordId === editingRecord.recordId) {
// //           return false;
// //         }

// //         return (
// //           normalizeDate(record.departureDate) ===
// //             normalizeDate(data.departureDate) &&
// //           normalizeDate(record.arrivalDate) ===
// //             normalizeDate(data.arrivalDate) &&
// //           (record.fromCountry || "").toUpperCase() ===
// //             (data.fromCountry || "").toUpperCase() &&
// //           (record.toCountry || "").toUpperCase() ===
// //             (data.toCountry || "").toUpperCase()
// //         );
// //       });

// //       if (isDuplicate) {
// //         toast.error(
// //           "A travel record with the same dates and countries already exists.",
// //         );
// //         return;
// //       }

// //       if (editingRecord) {
// //         await updateTravelRecord(editingRecord.recordId, data);
// //         toast.success("Record updated successfully");
// //       } else {
// //         await addTravelRecord(user.uid, data);
// //         toast.success("Travel record added successfully");
// //       }

// //       setShowForm(false);
// //       setEditingRecord(null);
// //     } catch (error) {
// //       console.error(error);
// //       toast.error(error?.message || "Unable to save travel record");
// //     }
// //   };

// //   return (
// //     <div className="space-y-8 pb-4 max-w-7xl mx-auto text-left">
// //       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
// //         <div>
// //           <h1 className="text-3xl font-bold text-black tracking-tight">
// //             Workspace Terminal
// //           </h1>
// //           <p className="text-sm text-blue-800 font-medium mt-1">
// //             Global Travel & Residency Management
// //           </p>
// //         </div>
// //       </div>

// //       <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
// //         <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
// //           <div>
// //             <p className="text-slate-500 text-lg font-semibold">
// //               Hello, {homeCountryName}
// //             </p>
// //             <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
// //               Your residency
// //             </h2>
// //           </div>
// //           <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green-700 text-white font-semibold text-lg self-start">
// //             <span className="w-3 h-3 rounded-full bg-white"></span>
// //             {calculation.status}
// //           </div>
// //         </div>

// //         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
// //           <div className="flex justify-center">
// //             <div className="relative w-64 h-64">
// //               <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
// //                 <circle
// //                   cx="60"
// //                   cy="60"
// //                   r="48"
// //                   fill="none"
// //                   stroke="#14532d"
// //                   strokeWidth="10"
// //                 />
// //                 <circle
// //                   cx="60"
// //                   cy="60"
// //                   r="48"
// //                   fill="none"
// //                   stroke="#D4A857"
// //                   strokeWidth="10"
// //                   strokeLinecap="round"
// //                   strokeDasharray={`${2 * Math.PI * 48}`}
// //                   strokeDashoffset={
// //                     2 *
// //                       Math.PI *
// //                       48 *
// //                       (1 -
// //                         Math.min(displayOutsideDays / definedMilestone, 1)) || 0
// //                   }
// //                 />
// //               </svg>

// //               <div className="absolute inset-0 flex flex-col items-center justify-center">
// //                 <span className="text-slate-500 text-sm uppercase tracking-wider">
// //                   Days Abroad
// //                 </span>
// //                 <h2 className="text-5xl font-black text-slate-900">
// //                   {displayOutsideDays}
// //                 </h2>
// //                 <p className="text-slate-500 text-sm">
// //                   of {definedMilestone} limit
// //                 </p>
// //                 <span className="mt-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
// //                   FY {new Date(profile?.fyStart).getFullYear()}-
// //                   {String(new Date(profile?.fyEnd).getFullYear()).slice(-2)}
// //                 </span>
// //               </div>
// //             </div>
// //           </div>

// //           <div className="space-y-5">
// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="bg-slate-50 rounded-2xl p-4">
// //                 <p className="text-slate-500 text-sm">Home</p>
// //                 <h3 className="text-3xl font-bold text-green-700">
// //                   {displayHomeDays}days
// //                 </h3>
// //               </div>
// //               <div className="bg-slate-50 rounded-2xl p-4">
// //                 <p className="text-slate-500 text-sm">Abroad</p>
// //                 <h3 className="text-3xl font-bold text-amber-600">
// //                   {displayOutsideDays}days
// //                 </h3>
// //               </div>
// //             </div>

// //             <div className="grid grid-cols-3 gap-4">
// //               <div className="bg-slate-50 rounded-2xl p-4">
// //                 <p className="text-slate-500 text-xs">Days to Target</p>
// //                 <h3 className="text-2xl font-bold text-slate-900">
// //                   {remainingTargetDays}
// //                 </h3>
// //               </div>
// //               <div className="bg-slate-50 rounded-2xl p-4">
// //                 <p className="text-slate-500 text-xs">Days Left</p>
// //                 <h3 className="text-2xl font-bold text-slate-900">
// //                   {runway.daysLeftInPeriod}
// //                 </h3>
// //               </div>
// //             </div>

// //             <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
// //               <h4 className="font-bold text-green-800 mb-2">Projection</h4>
// //               <p className="text-green-700 text-sm">
// //                 You need {remainingTargetDays} more days abroad within{" "}
// //                 {runway.daysLeftInPeriod} remaining days of this tracking
// //                 period.
// //               </p>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
// //         <div className="flex items-center justify-between mb-6">
// //           <h2 className="text-xl font-semibold text-slate-900">
// //             Travel Summary
// //           </h2>
// //           <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
// //             {records.length} Logs
// //           </span>
// //         </div>

// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
// //           <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-100 flex flex-col justify-between">
// //             <p className="text-xs sm:text-sm text-amber-700 font-bold uppercase tracking-wider">
// //               Abroad Stay Target
// //             </p>
// //             <div className="flex flex-wrap items-baseline gap-1 mt-2">
// //               <h3 className="text-2xl sm:text-3xl font-black text-amber-900">
// //                 {displayOutsideDays}
// //               </h3>
// //               <span className="text-base sm:text-lg font-semibold text-amber-700">
// //                 /
// //               </span>
// //               <h3 className="text-2xl sm:text-3xl font-black text-amber-900">
// //                 {definedMilestone}
// //               </h3>
// //               <span className="text-xs sm:text-sm text-amber-600 font-semibold ml-0.5">
// //                 days
// //               </span>
// //             </div>
// //             <p className="text-xs sm:text-sm text-red-600 mt-2 sm:mt-3 font-semibold">
// //               Remaining: {remainingTargetDays} Days
// //             </p>
// //           </div>

// //           <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
// //             <p className="text-sm text-green-700 font-medium">
// //               Own Country Stay
// //             </p>
// //             <div className="flex items-center gap-2 mt-1">
// //               <h3 className="text-3xl font-bold text-green-900 mt-2">
// //                 {displayHomeDays}
// //               </h3>
// //               <p className="text-sm text-green-600 font-medium mt-3">days</p>
// //             </div>
// //           </div>

// //           <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
// //             <p className="text-sm text-blue-700 font-medium">
// //               Abroad Country Stay
// //             </p>
// //             <div className="flex items-center gap-2 mt-1">
// //               <h3 className="text-3xl font-bold text-blue-900 mt-2">
// //                 {displayOutsideDays}
// //               </h3>
// //               <p className="text-sm text-blue-600 font-medium mt-3">days</p>
// //             </div>
// //           </div>

// //           <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
// //             <p className="text-sm text-purple-700 font-medium">Total Stay</p>
// //             <div className="flex items-center gap-2 mt-1">
// //               <h3 className="text-3xl font-bold text-purple-900 mt-2">
// //                 {loggedTotalDays}
// //               </h3>
// //               <p className="text-sm text-purple-600 font-medium mt-3">days</p>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
// //         <div className="flex items-center justify-between mb-2">
// //           <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
// //             Abroad Status Progress
// //           </span>
// //           <span className="text-sm font-bold text-slate-900">
// //             {displayOutsideDays > 0 ? calculation.progressPercentage : 0}%
// //           </span>
// //         </div>
// //         <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
// //           <div
// //             className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
// //             style={{
// //               width: `${displayOutsideDays > 0 ? calculation.progressPercentage : 0}%`,
// //             }}
// //           ></div>
// //         </div>
// //         <div className="flex justify-between items-center mt-3 text-xs text-slate-500 font-semibold">
// //           <span>Current Presence Stays: {displayOutsideDays} days</span>
// //           <span>Configured Milestone: {definedMilestone} days</span>
// //         </div>
// //       </div>

// //       <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
// //         <div className="border-b border-slate-100 pb-4 mb-6">
// //           <h2 className="text-xl font-semibold text-slate-900">
// //             Profile Summary
// //           </h2>
// //           <p className="text-xs text-slate-500 mt-0.5">
// //             Overview of your current core settings, tracking horizons, and
// //             active global footprint.
// //           </p>
// //         </div>

// //         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
// //           {cards.map((card, index) => {
// //             const Icon = card.icon;
// //             return (
// //               <div
// //                 key={index}
// //                 className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:shadow-sm transition-all"
// //               >
// //                 <div className="flex items-start justify-between">
// //                   <div className="space-y-1">
// //                     <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
// //                       {card.title}
// //                     </p>
// //                     <p className="text-lg font-semibold text-slate-900 break-words mt-2">
// //                       {card.value}
// //                     </p>
// //                   </div>
// //                   <div
// //                     className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
// //                   >
// //                     <Icon className="text-lg" />
// //                   </div>
// //                 </div>
// //               </div>
// //             );
// //           })}

// //           <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 hover:shadow-sm transition-all">
// //             <div className="flex items-start justify-between">
// //               <div className="space-y-1">
// //                 <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
// //                   Current Footprint
// //                 </p>
// //                 <p className="text-lg font-semibold text-slate-900 truncate max-w-[180px]">
// //                   {currentFootprintDisplay}
// //                 </p>
// //               </div>
// //               <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
// //                 <FiMapPin className="text-lg" />
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {calculation.warning && (
// //         <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
// //           <FiAlertTriangle className="text-orange-600 text-xl mt-0.5" />
// //           <div>
// //             <h3 className="font-semibold text-orange-800">
// //               {hasValidTravelRecords
// //                 ? "Residency Warning"
// //                 : "Add Travel History"}
// //             </h3>
// //             <p className="text-orange-700 text-sm mt-1">
// //               {calculation.warning}
// //             </p>
// //           </div>
// //         </div>
// //       )}

// //       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
// //         <div className="flex items-start gap-3.5">
// //           <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
// //             <FiInfo className="text-xl" />
// //           </div>
// //           <div className="space-y-1">
// //             <h3 className="font-bold text-blue-900 text-base tracking-tight">
// //               Add Your Travel History
// //             </h3>
// //             <p className="text-base text-blue-700 leading-relaxed max-w-3xl">
// //               For accurate residency calculations, add your previous travel
// //               history using the Add Travel Record button or update your stay
// //               records directly from the calendar below.
// //             </p>
// //           </div>
// //         </div>

// //         <div className="relative shrink-0 w-full md:w-auto" ref={menuRef}>
// //           <button
// //             type="button"
// //             onClick={() => setIsMenuOpen(!isMenuOpen)}
// //             className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-sm text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
// //           >
// //             <FiPlus />
// //             <span>Add Travel Record</span>
// //             <FiChevronDown
// //               className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
// //             />
// //           </button>

// //           {isMenuOpen && (
// //             <div className="absolute right-0 mt-2 w-full md:w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
// //               <button
// //                 type="button"
// //                 onClick={() => {
// //                   setIsMenuOpen(false);
// //                   const element = document.getElementById(
// //                     "stay-calendar-section",
// //                   );
// //                   if (element) {
// //                     element.scrollIntoView({
// //                       behavior: "smooth",
// //                       block: "center",
// //                     });
// //                   }
// //                 }}
// //                 className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
// //               >
// //                 <FiCalendar className="text-blue-500 text-base" />
// //                 <span>Update via Calendar View</span>
// //               </button>
// //               <button
// //                 type="button"
// //                 onClick={() => {
// //                   setIsMenuOpen(false);
// //                   setEditingRecord(null);
// //                   setShowForm(true);
// //                 }}
// //                 className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer border-t border-slate-100"
// //               >
// //                 <FiPlus className="text-purple-500 text-base" />
// //                 <span>Log via Manual Form</span>
// //               </button>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       <div
// //         id="stay-calendar-section"
// //         className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl space-y-4 w-full mx-auto border border-slate-200 shadow-lg p-4"
// //       >
// //         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
// //           <h2 className="text-xl font-bold text-slate-900">Stay Calendar</h2>
// //           <div className="flex flex-wrap gap-2 sm:gap-3">
// //             <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
// //               <span className="text-green-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
// //                 🏠 Home: {calendarHomeDays} Days
// //               </span>
// //             </div>
// //             <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
// //               <span className="text-blue-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
// //                 🌍 Abroad: {calendarAbroadDays} Days
// //               </span>
// //             </div>
// //             <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
// //               <span className="text-purple-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
// //                 Total: &nbsp;{calendarHomeDays + calendarAbroadDays} Days
// //               </span>
// //             </div>
// //           </div>
// //         </div>

// //         <StayCalendar
// //           dayMap={computedDayMap}
// //           travelRecords={records}
// //           fyStart={profile?.fyStart || profile?.residencyPeriodStart}
// //           fyEnd={profile?.fyEnd || profile?.residencyPeriodEnd}
// //           onToggleDayPresence={handleTogglePresence}
// //         />
// //       </div>

// //       {showForm && (
// //         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
// //           <div className="w-full max-w-2xl">
// //             <TravelForm
// //               initialData={editingRecord}
// //               onSubmit={handleFormSubmitCallback}
// //               travelRecords={records}
// //               fyStart={profile?.fyStart || profile?.residencyPeriodStart}
// //               fyEnd={profile?.fyEnd || profile?.residencyPeriodEnd}
// //               onCancel={() => {
// //                 setShowForm(false);
// //                 setEditingRecord(null);
// //               }}
// //             />
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }
