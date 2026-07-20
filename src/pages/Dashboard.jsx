import { useEffect, useRef } from "react"; // Added useEffect import
import { BiLoaderAlt } from "react-icons/bi";
import { FiMapPin, FiClock, FiCalendar, FiSend } from "react-icons/fi";
import { useResidencyDashboard } from "../hooks/useResidencyDashboard";
import React from "react";
import { useNavigate } from "react-router-dom";
import { autoTrackLocation } from "../utils/locationTracker";
export default function Dashboard() {
  const navigate = useNavigate();
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

  // Explicitly allow Daily Check-ins to pass through the filter
  if (r.purpose === "Daily GPS Check-In" || r.purpose === "Country Changed") return true;

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
          <div className="flex items-baseline gap-1">
            <span className="text-blue-800 font-bold text-sm sm:text-lg">Hello,</span>
            <span className="text-slate-500 text-sm sm:text-lg font-semibold">
              {user?.email || "User"} from {homeCountryName}
            </span>
          </div>
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
{/* ===== Recent Trips Heading (Placed Outside on Page Background Context) ===== */}
      <div className="flex items-center justify-between mt-2 mb-2">
        <h2 className="text-lg font-bold text-slate-900">Recent trips</h2>
        <button 
          type="button" 
          onClick={() => navigate("/travel-history")} 
          className="text-sm font-semibold text-emerald-800 hover:underline cursor-pointer"
        >
          See all tracking
        </button>
      </div>

      {/* ===== Recent Trips Wrapper Card ===== */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        {recentTrips.length === 0 ? (
          <p className="text-slate-500 text-sm p-2">
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
                      {homeCountryName} → {getFullCountryName(record.toCountry)}
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
