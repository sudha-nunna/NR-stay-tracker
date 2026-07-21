import React, { useState ,useRef,useEffect} from "react";
import {
  parseISO,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isToday,
  isAfter,
  isWithinInterval,
  setMonth,
  setYear,
} from "date-fns";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiGlobe,
  FiHome,
  FiCalendar,
} from "react-icons/fi";
import { calculateResidencyStatus } from "../../utils/residencyCalculator";

export default function StayCalendar({
  dayMap = {},
  onToggleDayPresence,
  fyStart,
  fyEnd,
  travelRecords = [],
}) {
  console.log("CALENDAR RECORDS", travelRecords.map(r => ({
    id: r.recordId,
    dep: r.departureDate,
    arr: r.arrivalDate,
    purpose: r.purpose
  })));
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  
  // Custom Dropdown Open States & Component Refs
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const MONTHS_LIST = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYearNum = new Date().getFullYear();
  const YEARS_LIST = Array.from(
    { length: 7 },
    (_, i) => currentYearNum - 3 + i,
  );

  const handlePrevMonth = () =>
    setCurrentViewDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () =>
    setCurrentViewDate((prev) => addMonths(prev, 1));

  const handleMonthChange = (e) => {
    setCurrentViewDate((prev) => setMonth(prev, parseInt(e.target.value, 10)));
  };

  const handleResetToToday = () => {
    setCurrentViewDate(new Date());
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (monthRef.current && !monthRef.current.contains(event.target)) {
        setMonthDropdownOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setYearDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthStart = startOfMonth(currentViewDate);
  const monthEnd = endOfMonth(currentViewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOffset = getDay(monthStart);

  const startPeriod = fyStart ? new Date(fyStart.split("T")[0] + "T00:00:00") : null;
  const endPeriod = fyEnd ? new Date(fyEnd.split("T")[0] + "T23:59:59") : null;

  const handleDayActionToggle = (dayDate, dateStr, currentStatus) => {
    const todayDate = new Date();

    const isOutsideFY = startPeriod && endPeriod 
      ? (dayDate < startPeriod || dayDate > endPeriod)
      : false;

    const isFutureDay = isAfter(dayDate, todayDate) && !isToday(dayDate);

    if (isOutsideFY || isFutureDay) return;

    if (typeof onToggleDayPresence === "function") {
      const nextStatus =
        currentStatus === "Abroad Stay" ? "Home Stay" : "Abroad Stay";
      onToggleDayPresence(dateStr, nextStatus);
    }
  };

  return (
    <div
      className="bg-white rounded-3xl space-y-4 w-full mx-auto border border-slate-200/80 p-2 sm:p-6 shadow-sm"
      id="stay-calendar-section"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-4 border-b border-slate-100 ml-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-950 tracking-tight">
              Travel Calendar
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-lg whitespace-nowrap">🏠 Home: {Object.values(dayMap).filter(d => d.status === "Home Stay").length} d</span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg whitespace-nowrap">🌍 Abroad: {Object.values(dayMap).filter(d => d.status === "Abroad Stay").length}d</span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-lg whitespace-nowrap">📋 Total: {Object.values(dayMap).length} d</span>
            </div>
          </div>
          <p className="text-slate-500 text-[16px] mt-0.5">
            Track your Home and Abroad stays across the selected period.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* Custom Month Dropdown Selector Component */}
          <div className="relative" ref={monthRef}>
            <div
              onClick={() => { setMonthDropdownOpen(!monthDropdownOpen); setYearDropdownOpen(false); }}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-xl hover:border-slate-300 transition cursor-pointer h-8 flex items-center justify-between gap-1 shadow-sm select-none"
            >
              <span>{MONTHS_LIST[currentViewDate.getMonth()].substring(0, 3)}</span>
              <FiChevronDown className="text-slate-400 shrink-0" size={14} />
            </div>
            {monthDropdownOpen && (
              <div className="absolute z-50 left-0 mt-1 min-w-[110px] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {MONTHS_LIST.map((m, index) => (
                  <div
                    key={m}
                    onClick={() => {
                      setCurrentViewDate((prev) => setMonth(prev, index));
                      setMonthDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-slate-50 ${
                      currentViewDate.getMonth() === index ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-700"
                    }`}
                  >
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Year Dropdown Selector Component */}
          <div className="relative" ref={yearRef}>
            <div
              onClick={() => { setYearDropdownOpen(!yearDropdownOpen); setMonthDropdownOpen(false); }}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-xl hover:border-slate-300 transition cursor-pointer h-8 flex items-center justify-between gap-1 shadow-sm select-none"
            >
              <span>{currentViewDate.getFullYear()}</span>
              <FiChevronDown className="text-slate-400 shrink-0" size={14} />
            </div>
            {yearDropdownOpen && (
              <div className="absolute z-50 left-0 mt-1 min-w-[90px] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {YEARS_LIST.map((y) => (
                  <div
                    key={y}
                    onClick={() => {
                      setCurrentViewDate((prev) => setYear(prev, y));
                      setYearDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-slate-50 ${
                      currentViewDate.getFullYear() === y ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-700"
                    }`}
                  >
                    {y}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden h-8 shadow-sm">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="px-2.5 h-full hover:bg-slate-50 text-slate-600 transition cursor-pointer border-r border-slate-100 flex items-center justify-center"
            >
              <FiChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="px-2.5 h-full hover:bg-slate-50 text-slate-600 transition cursor-pointer flex items-center justify-center"
            >
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Layout Grid Panel */}
      <div className="w-full">
        <div className="space-y-1">
          {/* Weekdays Row Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-[16px] sm:text-[16px] font-bold text-blue-700 uppercase tracking-wider py-0.5"
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Days Grid Rendering Engine */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: startDayOffset }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="bg-slate-100/20 border border-slate-200 rounded-xl h-12 sm:h-20 opacity-30"
              />
            ))}

            {daysInMonth.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const todayDate = new Date();

              const isOutsideFY =
                startPeriod && endPeriod
                  ? day < startPeriod || day > endPeriod
                  : false;

              const isFutureDay = isAfter(day, todayDate) && !isToday(day);
              const isLockedDay = isOutsideFY || isFutureDay;

              const explicitMapEntry = dayMap[dateStr];

              let backgroundRangeMatch = null;
              if (!explicitMapEntry && Array.isArray(travelRecords)) {
                // FIXED: Enforce accurate descending priority sequencing to prevent calendar multi-overlap bugs
                const sortedRecords = [...travelRecords].sort((a, b) => {
                  const purposePriority = (p) => {
                    if (p === "Country Changed") return 0;
                    if (p === "Daily GPS Check-In") return 1;
                    if (p === "Calendar Check-In" || p === "Calendar Check-Out") return 2;
                    return 3;
                  };
                  const pDiff = purposePriority(a.purpose) - purposePriority(b.purpose);
                  if (pDiff !== 0) return pDiff;
                  
                  const aLen = new Date(a.arrivalDate.split("T")[0]) - new Date(a.departureDate.split("T")[0]);
                  const bLen = new Date(b.arrivalDate.split("T")[0]) - new Date(b.departureDate.split("T")[0]);
                  if (aLen !== bLen) return aLen - bLen;
                  
                  return new Date(b.arrivalDate.split("T")[0]) - new Date(a.arrivalDate.split("T")[0]);
                });

                backgroundRangeMatch = sortedRecords.find((record) => {
                  if (!record.departureDate || !record.arrivalDate) return false;
                  try {
                    const start = new Date(record.departureDate.split("T")[0] + "T00:00:00");
                    const end = new Date(record.arrivalDate.split("T")[0] + "T23:59:59");
                    return isWithinInterval(day, { start, end });
                  } catch (e) {
                    return false;
                  }
                });
              }

              const recordExists = !!(explicitMapEntry || backgroundRangeMatch);
              let currentStatus = "not set";
              let currentCountry = "not set";

              if (explicitMapEntry) {
                currentStatus = explicitMapEntry.status;
                currentCountry = explicitMapEntry.country;
              } else if (backgroundRangeMatch) {
                const homeBase =
                  backgroundRangeMatch.homeCountry ||
                  backgroundRangeMatch.nativeCountry ||
                  "US";
                const isHome = backgroundRangeMatch.toCountry?.toUpperCase() === homeBase.toUpperCase();
                currentStatus = isHome ? "Home Stay" : "Abroad Stay";
                currentCountry = backgroundRangeMatch.toCountry || "Abroad";
              }

              const isHomeStay = recordExists && currentStatus === "Home Stay";
              const isAbroadStay = recordExists && (currentStatus === "Abroad Stay" || currentStatus === "Other Countries Stay");
              const checkCurrentDay = isToday(day);

              let dayStyles = "bg-white border-slate-200 text-slate-800 hover:bg-slate-50/60 hover:border-slate-300";
              if (isHomeStay) {
                dayStyles = "bg-emerald-50/60 border-emerald-300 hover:bg-emerald-50/90 text-emerald-950";
              } else if (isAbroadStay) {
                dayStyles = "bg-blue-50/60 border-blue-300 hover:bg-blue-50/90 text-blue-950";
              }

              if (isLockedDay) {
                dayStyles = "bg-slate-50/40 border-slate-100 text-slate-300/70 cursor-not-allowed select-none pointer-events-none";
              }

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayActionToggle(day, dateStr, currentStatus)}
                  className={`group relative border rounded-xl p-1.5 sm:p-2.5 h-12 sm:h-20 flex flex-col justify-between transition-all duration-150 ${dayStyles} ${
                    checkCurrentDay && !isLockedDay ? "ring-2 ring-slate-950 ring-offset-1 z-10" : ""
                  }`}
                  title={isLockedDay ? "Locked" : `Click to change status for ${dateStr}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[16px] sm:text-base font-bold tracking-tight ${
                        checkCurrentDay && !isLockedDay
                          ? "text-slate-950 font-black underline decoration-2 decoration-blue-600 underline-offset-1"
                          : isHomeStay
                            ? "text-emerald-900"
                            : isAbroadStay
                              ? "text-blue-900"
                              : isLockedDay
                                ? "text-slate-300"
                                : "text-slate-700"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {recordExists && !isLockedDay && (
                      <div className={`p-0.5 rounded-md hidden sm:block ${isHomeStay ? "text-emerald-600" : "text-blue-600"}`}>
                        {isHomeStay ? <FiHome size={12} /> : <FiGlobe size={12} />}
                      </div>
                    )}
                  </div>

                  <div className="text-left mt-auto">
                    <p
                      className={`text-[9px] sm:text-[10px] font-bold tracking-tight truncate max-w-full ${
                        isHomeStay
                          ? "text-emerald-700"
                          : isAbroadStay
                            ? "text-blue-700"
                            : isLockedDay
                              ? "text-slate-400 font-medium"
                              : "text-slate-700 font-medium"
                      }`}
                    >
                      {isLockedDay ? "Locked" : recordExists ? (isHomeStay ? "Home" : "Abroad") : "No Record"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Legend Matrix Footer Info Panel */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-[16px] font-medium text-slate-500 py-1 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-50 rounded-sm border border-blue-300 flex items-center justify-center text-blue-600">
            <FiGlobe size={8} />
          </div>
          <span className="text-slate-500 font-semibold">Abroad(click to set Abroad)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-50 rounded-sm border border-emerald-300 flex items-center justify-center text-emerald-600">
            <FiHome size={8} />
          </div>
          <span className="text-slate-500 font-semibold">Home(double click to set home)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-slate-50 border border-slate-200 text-slate-300 flex items-center justify-center">
            <FiCalendar size={8} />
          </div>
          <span className="text-slate-500 font-semibold">Locked(future days)</span>
        </div>
      </div>
    </div>
  );
}





// import React, { useState ,useRef,useEffect} from "react";
// import {
//   parseISO,
//   format,
//   startOfMonth,
//   endOfMonth,
//   eachDayOfInterval,
//   addMonths,
//   subMonths,
//   getDay,
//   isToday,
//   isAfter,
//   isWithinInterval,
//   setMonth,
//   setYear,
// } from "date-fns";
// import {
//   FiChevronLeft,
//   FiChevronRight,
//   FiChevronDown,
//   FiGlobe,
//   FiHome,
//   FiCalendar,
// } from "react-icons/fi";
// import { calculateResidencyStatus } from "../../utils/residencyCalculator";
// export default function StayCalendar({
//   dayMap = {},
//   onToggleDayPresence,
//   fyStart,
//   fyEnd,
//   travelRecords = [],
// }) {
//   console.log("CALENDAR RECORDS", travelRecords.map(r => ({
//     id: r.recordId,
//     dep: r.departureDate,
//     arr: r.arrivalDate,
//     purpose: r.purpose
//   })));
//   const [currentViewDate, setCurrentViewDate] = useState(new Date());
  
//   // Custom Dropdown Open States & Component Refs
//   const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
//   const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
//   const monthRef = useRef(null);
//   const yearRef = useRef(null);

//   const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//   const MONTHS_LIST = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];

//   // Restored browsing window so users can change and view other years normally
//   const currentYearNum = new Date().getFullYear();
//   const YEARS_LIST = Array.from(
//     { length: 7 },
//     (_, i) => currentYearNum - 3 + i,
//   );

//   const handlePrevMonth = () =>
//     setCurrentViewDate((prev) => subMonths(prev, 1));
//   const handleNextMonth = () =>
//     setCurrentViewDate((prev) => addMonths(prev, 1));

//   const handleMonthChange = (e) => {
//     setCurrentViewDate((prev) => setMonth(prev, parseInt(e.target.value, 10)));
//   };

//   const handleResetToToday = () => {
//     setCurrentViewDate(new Date());
//   };

//   // Close calendar custom header dropdowns on outside context interaction taps
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (monthRef.current && !monthRef.current.contains(event.target)) {
//         setMonthDropdownOpen(false);
//       }
//       if (yearRef.current && !yearRef.current.contains(event.target)) {
//         setYearDropdownOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const monthStart = startOfMonth(currentViewDate);
//   const monthEnd = endOfMonth(currentViewDate);
//   const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
//   const startDayOffset = getDay(monthStart);

//   // FIXED: Normalized string extraction to avoid browser engine date parsing offsets across Safari/Chrome
//   const startPeriod = fyStart ? new Date(fyStart.split("T")[0] + "T00:00:00") : null;
//   const endPeriod = fyEnd ? new Date(fyEnd.split("T")[0] + "T23:59:59") : null;

//   const handleDayActionToggle = (dayDate, dateStr, currentStatus) => {
//     const todayDate = new Date();

//     // FIXED: Derived boundaries using local midnight strings to accurately calculate target dates like April 1st
//     const isOutsideFY = startPeriod && endPeriod 
//       ? (dayDate < startPeriod || dayDate > endPeriod)
//       : false;

//     const isFutureDay = isAfter(dayDate, todayDate) && !isToday(dayDate);

//     // Completely block state execution updates if out of threshold boundaries
//     if (isOutsideFY || isFutureDay) return;

//     if (typeof onToggleDayPresence === "function") {
//       const nextStatus =
//         currentStatus === "Abroad Stay" ? "Home Stay" : "Abroad Stay";
//       onToggleDayPresence(dateStr, nextStatus);
//     }
//   };

//   return (
//     <div
//       className="bg-white rounded-3xl space-y-4 w-full mx-auto border border-slate-200/80 p-2 sm:p-6 shadow-sm"
//       id="stay-calendar-section"
//     >
//       {/* Structural Header Navigation Frame */}
//       {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 ml-2">
//         <div>
//           <div className="flex flex-wrap items-center gap-2">
//             <h2 className="text-lg font-bold text-slate-950 tracking-tight">
//               Travel Calendar
//             </h2>
//           </div>
//           <p className="text-slate-500 text-[16px] mt-0.5">
//             Track your Home and Abroad stays across the selected period.
//           </p>
//         </div> */}
//         {/* Structural Header Navigation Frame */}
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-4 border-b border-slate-100 ml-2">
//         <div>
//           <div className="flex flex-wrap items-center gap-2">
//             <h2 className="text-lg font-bold text-slate-950 tracking-tight">
//               Travel Calendar
//             </h2>
//             {/* Integrated Internal Status Badge Strip Elements directly in one place */}
//             <div className="flex flex-wrap gap-2">
//               <span className="px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-lg whitespace-nowrap">🏠 Home: {Object.values(dayMap).filter(d => d.status === "Home Stay").length} Days</span>
//               <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg whitespace-nowrap">🌍 Abroad: {Object.values(dayMap).filter(d => d.status === "Abroad Stay").length} Days</span>
//               <span className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-lg whitespace-nowrap">📋 Total: {Object.values(dayMap).length} Days</span>
//             </div>
//           </div>
//           <p className="text-slate-500 text-[16px] mt-0.5">
//             Track your Home and Abroad stays across the selected period.
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
//           {/* <button
//             type="button"
//             onClick={handleResetToToday}
//             className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-[16px] font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 h-8 shadow-sm"
//           >
//             <FiCalendar className="text-slate-400" size={13} />
//             <span className="hidden xs:inline">Today</span>
//           </button> */}

//           {/* Custom Month Dropdown Selector Node Component */}
//           <div className="relative" ref={monthRef}>
//             <div
//               onClick={() => { setMonthDropdownOpen(!monthDropdownOpen); setYearDropdownOpen(false); }}
//               className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-xl hover:border-slate-300 transition cursor-pointer h-8 flex items-center justify-between gap-1 shadow-sm select-none"
//             >
//               <span>{MONTHS_LIST[currentViewDate.getMonth()].substring(0, 3)}</span>
//               <FiChevronDown className="text-slate-400 shrink-0" size={14} />
//             </div>
//             {monthDropdownOpen && (
//               <div className="absolute z-50 left-0 mt-1 min-w-[110px] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
//                 {MONTHS_LIST.map((m, index) => (
//                   <div
//                     key={m}
//                     onClick={() => {
//                       setCurrentViewDate((prev) => setMonth(prev, index));
//                       setMonthDropdownOpen(false);
//                     }}
//                     className={`px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-slate-50 ${
//                       currentViewDate.getMonth() === index ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-700"
//                     }`}
//                   >
//                     {m}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Custom Year Dropdown Selector Node Component */}
//           <div className="relative" ref={yearRef}>
//             <div
//               onClick={() => { setYearDropdownOpen(!yearDropdownOpen); setMonthDropdownOpen(false); }}
//               className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-xl hover:border-slate-300 transition cursor-pointer h-8 flex items-center justify-between gap-1 shadow-sm select-none"
//             >
//               <span>{currentViewDate.getFullYear()}</span>
//               <FiChevronDown className="text-slate-400 shrink-0" size={14} />
//             </div>
//             {yearDropdownOpen && (
//               <div className="absolute z-50 left-0 mt-1 min-w-[90px] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
//                 {YEARS_LIST.map((y) => (
//                   <div
//                     key={y}
//                     onClick={() => {
//                       setCurrentViewDate((prev) => setYear(prev, y));
//                       setYearDropdownOpen(false);
//                     }}
//                     className={`px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-slate-50 ${
//                       currentViewDate.getFullYear() === y ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-700"
//                     }`}
//                   >
//                     {y}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden h-8 shadow-sm">
//             <button
//               type="button"
//               onClick={handlePrevMonth}
//               className="px-2.5 h-full hover:bg-slate-50 text-slate-600 transition cursor-pointer border-r border-slate-100 flex items-center justify-center"
//             >
//               <FiChevronLeft size={14} />
//             </button>
//             <button
//               type="button"
//               onClick={handleNextMonth}
//               className="px-2.5 h-full hover:bg-slate-50 text-slate-600 transition cursor-pointer flex items-center justify-center"
//             >
//               <FiChevronRight size={14} />
//             </button>
//           </div>
//         </div>
//       </div>
//       {/* Calendar Layout Container */}
//       <div className="w-full">
//         <div className="space-y-1">
//           {/* Weekdays Row */}
//           <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-1">
//             {WEEKDAYS.map((day) => (
//               <div
//                 key={day}
//                 className="text-[16px] sm:text-[16px] font-bold text-blue-700 uppercase tracking-wider py-0.5"
//               >
//                 {day.substring(0, 3)}
//               </div>
//             ))}
//           </div>

//           {/* Days Grid */}
//           <div className="grid grid-cols-7 gap-1 sm:gap-2">
//             {Array.from({ length: startDayOffset }).map((_, index) => (
//               <div
//                 key={`empty-${index}`}
//                 className="bg-slate-100/20 border border-slate-200 rounded-xl h-12 sm:h-20 opacity-30"
//               />
//             ))}

//             {daysInMonth.map((day) => {
//               const dateStr = format(day, "yyyy-MM-dd");
//               const todayDate = new Date();

//               // FIXED: Reused normalized fiscal boundary limits to guarantee cross-browser layout compliance
//               const isOutsideFY =
//                 startPeriod && endPeriod
//                   ? day < startPeriod || day > endPeriod
//                   : false;

//               const isFutureDay = isAfter(day, todayDate) && !isToday(day);

//               // Lock past periods and future dates seamlessly
//               const isLockedDay = isOutsideFY || isFutureDay;

//               const explicitMapEntry = dayMap[dateStr];

//               let backgroundRangeMatch = null;
//               if (!explicitMapEntry && Array.isArray(travelRecords)) {
//                 const sortedRecords = [...travelRecords].sort((a, b) => {
//                   const purposePriority = (p) => {
//                     if (p === "Country Changed") return 0;
//                     if (p === "Daily GPS Check-In") return 1;
//                     if (p === "Calendar Check-In" || p === "Calendar Check-Out") return 2;
//                     return 3;
//                   };
//                   const pDiff = purposePriority(a.purpose) - purposePriority(b.purpose);
//                   if (pDiff !== 0) return pDiff;
//                   const aLen =
//                     new Date(a.arrivalDate.split("T")[0]) -
//                     new Date(a.departureDate.split("T")[0]);
//                   const bLen =
//                     new Date(b.arrivalDate.split("T")[0]) -
//                     new Date(b.departureDate.split("T")[0]);
//                   if (aLen !== bLen) return aLen - bLen;
//                   return (
//                     new Date(b.arrivalDate.split("T")[0]) -
//                     new Date(a.arrivalDate.split("T")[0])
//                   );
//                 });
//                 backgroundRangeMatch = sortedRecords.find((record) => {
//                   if (!record.departureDate || !record.arrivalDate)
//                     return false;
//                   try {
//                     const start = new Date(
//                       record.departureDate.split("T")[0] + "T00:00:00",
//                     );
//                     const end = new Date(
//                       record.arrivalDate.split("T")[0] + "T23:59:59",
//                     );
//                     const matches = isWithinInterval(day, { start, end });
//                     if (matches) {
//                       console.log("CALENDAR MATCHED RECORD", dateStr, {
//                         id: record.recordId,
//                         dep: record.departureDate,
//                         arr: record.arrivalDate,
//                         purpose: record.purpose,
//                       });
//                     }
//                     return matches;
//                   } catch (e) {
//                     return false;
//                   }
//                 });
//               }

//               const recordExists = !!(explicitMapEntry || backgroundRangeMatch);
//               let currentStatus = "not set";
//               let currentCountry = "not set";

//               if (explicitMapEntry) {
//                 currentStatus = explicitMapEntry.status;
//                 currentCountry = explicitMapEntry.country;
//               } else if (backgroundRangeMatch) {
//                 const homeBase =
//                   backgroundRangeMatch.homeCountry ||
//                   backgroundRangeMatch.nativeCountry ||
//                   "US";
//                 const isHome =
//                   backgroundRangeMatch.toCountry?.toUpperCase() ===
//                   homeBase.toUpperCase();
//                 currentStatus = isHome ? "Home Stay" : "Abroad Stay";
//                 currentCountry = backgroundRangeMatch.toCountry || "Abroad";
//               }

//               const isHomeStay = recordExists && currentStatus === "Home Stay";
//               const isAbroadStay =
//                 recordExists &&
//                 (currentStatus === "Abroad Stay" ||
//                   currentStatus === "Other Countries Stay");
//               const checkCurrentDay = isToday(day);

//               let dayStyles =
//                 "bg-white border-slate-200 text-slate-800 hover:bg-slate-50/60 hover:border-slate-300";
//               if (isHomeStay) {
//                 dayStyles =
//                   "bg-emerald-50/60 border-emerald-300 hover:bg-emerald-50/90 text-emerald-950";
//               } else if (isAbroadStay) {
//                 dayStyles =
//                   "bg-blue-50/60 border-blue-300 hover:bg-blue-50/90 text-blue-950";
//               }

//               // Apply locked styles if it is out of period or in the future
//               if (isLockedDay) {
//                 dayStyles =
//                   "bg-slate-50/40 border-slate-100 text-slate-300/70 cursor-not-allowed select-none pointer-events-none";
//               }

//               return (
//                 <div
//                   key={dateStr}
//                   onClick={() =>
//                     handleDayActionToggle(day, dateStr, currentStatus)
//                   }
//                   className={`group relative border rounded-xl p-1.5 sm:p-2.5 h-12 sm:h-20 flex flex-col justify-between transition-all duration-150 ${dayStyles} ${
//                     checkCurrentDay && !isLockedDay
//                       ? "ring-2 ring-slate-950 ring-offset-1 z-10"
//                       : ""
//                   }`}
//                   title={
//                     isLockedDay
//                       ? "Locked"
//                       : `Click to change status for ${dateStr}`
//                   }
//                 >
//                   <div className="flex items-center justify-between w-full">
//                     <span
//                       className={`text-[16px] sm:text-base font-bold tracking-tight ${
//                         checkCurrentDay && !isLockedDay
//                           ? "text-slate-950 font-black underline decoration-2 decoration-blue-600 underline-offset-1"
//                           : isHomeStay
//                             ? "text-emerald-900"
//                             : isAbroadStay
//                               ? "text-blue-900"
//                               : isLockedDay
//                                 ? "text-slate-300"
//                                 : "text-slate-700"
//                       }`}
//                     >
//                       {format(day, "d")}
//                     </span>

//                     {recordExists && !isLockedDay && (
//                       <div
//                         className={`p-0.5 rounded-md hidden sm:block ${
//                           isHomeStay ? "text-emerald-600" : "text-blue-600"
//                         }`}
//                       >
//                         {isHomeStay ? (
//                           <FiHome size={12} />
//                         ) : (
//                           <FiGlobe size={12} />
//                         )}
//                       </div>
//                     )}
//                   </div>

//                   <div className="text-left mt-auto">
//                     <p
//                       className={`text-[9px] sm:text-[10px] font-bold tracking-tight truncate max-w-full ${
//                         isHomeStay
//                           ? "text-emerald-700"
//                           : isAbroadStay
//                             ? "text-blue-700"
//                             : isLockedDay
//                               ? "text-slate-400 font-medium"
//                               : "text-slate-700 font-medium"
//                       }`}
//                     >
//                       {isLockedDay
//                         ? "Locked"
//                         : recordExists
//                           ? isHomeStay
//                             ? "Home"
//                             : "Abroad"
//                           : "No Record"}
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//             {/* System Legend Matrix Panel */}
//       <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-[16px] font-medium text-slate-500 py-1 border-b border-slate-100 pb-3">
//         <div className="flex items-center gap-1.5">
//           <div className="w-3 h-3 bg-blue-50 rounded-sm border border-blue-300 flex items-center justify-center text-blue-600">
//             <FiGlobe size={8} />
//           </div>
//           <span className="text-slate-500 font-semibold">
//             Abroad(click to set Abroad)
//           </span>
//         </div>
//         <div className="flex items-center gap-1.5">
//           <div className="w-3 h-3 bg-emerald-50 rounded-sm border border-emerald-300 flex items-center justify-center text-emerald-600">
//             <FiHome size={8} />
//           </div>
//           <span className="text-slate-500 font-semibold">
//             Home(double click to set home)
//           </span>
//         </div>

//         <div className="flex items-center gap-1.5">
//           <div className="w-3 h-3 bg-slate-50 border border-slate-200 text-slate-300 flex items-center justify-center">
//             <FiCalendar size={8} />
//           </div>
//           <span className="text-slate-500 font-semibold">
//             Locked(future days)
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }




// // import React, { useState } from "react";
// // import {
// //   parseISO,
// //   format,
// //   startOfMonth,
// //   endOfMonth,
// //   eachDayOfInterval,
// //   addMonths,
// //   subMonths,
// //   getDay,
// //   isToday,
// //   isAfter,
// //   isWithinInterval,
// //   setMonth,
// //   setYear,
// // } from "date-fns";
// // import {
// //   FiChevronLeft,
// //   FiChevronRight,
// //   FiGlobe,
// //   FiHome,
// //   FiCalendar,
// // } from "react-icons/fi";

// // export default function StayCalendar({
// //   dayMap = {},
// //   onToggleDayPresence,
// //   fyStart,
// //   fyEnd,
// //   travelRecords = [],
// // }) {
// //   const [currentViewDate, setCurrentViewDate] = useState(new Date());
// //   const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// //   const MONTHS_LIST = [
// //     "January",
// //     "February",
// //     "March",
// //     "April",
// //     "May",
// //     "June",
// //     "July",
// //     "August",
// //     "September",
// //     "October",
// //     "November",
// //     "December",
// //   ];

// //   // Restored browsing window so users can change and view other years normally
// //   const currentYearNum = new Date().getFullYear();
// //   const YEARS_LIST = Array.from(
// //     { length: 7 },
// //     (_, i) => currentYearNum - 3 + i,
// //   );

// //   const handlePrevMonth = () =>
// //     setCurrentViewDate((prev) => subMonths(prev, 1));
// //   const handleNextMonth = () =>
// //     setCurrentViewDate((prev) => addMonths(prev, 1));

// //   const handleMonthChange = (e) => {
// //     setCurrentViewDate((prev) => setMonth(prev, parseInt(e.target.value, 10)));
// //   };

// //   const handleYearChange = (e) => {
// //     setCurrentViewDate((prev) => setYear(prev, parseInt(e.target.value, 10)));
// //   };

// //   const handleResetToToday = () => {
// //     setCurrentViewDate(new Date());
// //   };

// //   const monthStart = startOfMonth(currentViewDate);
// //   const monthEnd = endOfMonth(currentViewDate);
// //   const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
// //   const startDayOffset = getDay(monthStart);

// //   const handleDayActionToggle = (dayDate, dateStr, currentStatus) => {
// //     const todayDate = new Date();

// //     // Parse the profile threshold inputs directly or fallback safely to system defaults
// //     // const startPeriod = fyStart ? new Date(fyStart) : null;
// //     // const endPeriod = fyEnd ? new Date(fyEnd) : null;
// //     // Parse the profile threshold inputs strictly as local year dates to eliminate midnight timezone offsets
// //     // Parse the profile threshold inputs directly using local time rules
// //     const startPeriod = fyStart
// //       ? new Date(fyStart.split("T")[0] + "T00:00:00")
// //       : null;
// //     const endPeriod = fyEnd
// //       ? new Date(fyEnd.split("T")[0] + "T23:59:59")
// //       : null;

// //     const isFutureDay = isAfter(dayDate, todayDate) && !isToday(dayDate);

// //     // Completely block state execution updates if out of threshold boundaries
// //     if (isOutsideFY || isFutureDay) return;

// //     if (typeof onToggleDayPresence === "function") {
// //       const nextStatus =
// //         currentStatus === "Abroad Stay" ? "Home Stay" : "Abroad Stay";
// //       onToggleDayPresence(dateStr, nextStatus);
// //     }
// //   };

// //   return (
// //     <div
// //       className="bg-white rounded-3xl space-y-4 w-full mx-auto border border-slate-200/80 p-2 sm:p-6 shadow-sm"
// //       id="stay-calendar-section"
// //     >
// //       {/* Structural Header Navigation Frame */}
// //       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 ml-2">
// //         <div>
// //           <div className="flex flex-wrap items-center gap-2">
// //             <h2 className="text-lg font-bold text-slate-950 tracking-tight">
// //               Travel Calendar
// //             </h2>
// //           </div>
// //           <p className="text-slate-500 text-[16px] mt-0.5">
// //             Track your Home and Abroad stays across the selected period.
// //           </p>
// //         </div>

// //         <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
// //           <button
// //             type="button"
// //             onClick={handleResetToToday}
// //             className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-[16px] font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 h-8 shadow-sm"
// //           >
// //             <FiCalendar className="text-slate-400" size={13} />
// //             <span className="hidden xs:inline">Today</span>
// //           </button>

// //           <select
// //             value={currentViewDate.getMonth()}
// //             onChange={handleMonthChange}
// //             className="px-2 py-1.5 bg-white border border-slate-200 text-slate-800 text-[16px] font-bold rounded-xl hover:border-slate-300 transition outline-none cursor-pointer h-8 shadow-sm"
// //           >
// //             {MONTHS_LIST.map((m, index) => (
// //               <option key={m} value={index}>
// //                 {m.substring(0, 3)}
// //               </option>
// //             ))}
// //           </select>

// //           <select
// //             value={currentViewDate.getFullYear()}
// //             onChange={handleYearChange}
// //             className="px-2 py-1.5 bg-white border border-slate-200 text-slate-800 text-[16px] font-bold rounded-xl hover:border-slate-300 transition outline-none cursor-pointer h-8 shadow-sm"
// //           >
// //             {YEARS_LIST.map((y) => (
// //               <option key={y} value={y}>
// //                 {y}
// //               </option>
// //             ))}
// //           </select>

// //           <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden h-8 shadow-sm">
// //             <button
// //               type="button"
// //               onClick={handlePrevMonth}
// //               className="px-2.5 h-full hover:bg-slate-50 text-slate-600 transition cursor-pointer border-r border-slate-100 flex items-center justify-center"
// //             >
// //               <FiChevronLeft size={14} />
// //             </button>
// //             <button
// //               type="button"
// //               onClick={handleNextMonth}
// //               className="px-2.5 h-full hover:bg-slate-50 text-slate-600 transition cursor-pointer flex items-center justify-center"
// //             >
// //               <FiChevronRight size={14} />
// //             </button>
// //           </div>
// //         </div>
// //       </div>

// //       {/* System Legend Matrix Panel */}
// //       <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-[16px] font-medium text-slate-500 py-1 border-b border-slate-100 pb-3">
// //         <div className="flex items-center gap-1.5">
// //           <div className="w-3 h-3 bg-blue-50 rounded-sm border border-blue-300 flex items-center justify-center text-blue-600">
// //             <FiGlobe size={8} />
// //           </div>
// //           <span className="text-slate-500 font-semibold">
// //             Abroad(click to set Abroad)
// //           </span>
// //         </div>
// //         <div className="flex items-center gap-1.5">
// //           <div className="w-3 h-3 bg-emerald-50 rounded-sm border border-emerald-300 flex items-center justify-center text-emerald-600">
// //             <FiHome size={8} />
// //           </div>
// //           <span className="text-slate-500 font-semibold">
// //             Home(double click to set home)
// //           </span>
// //         </div>

// //         <div className="flex items-center gap-1.5">
// //           <div className="w-3 h-3 bg-slate-50 border border-slate-200 text-slate-300 flex items-center justify-center">
// //             <FiCalendar size={8} />
// //           </div>
// //           <span className="text-slate-500 font-semibold">
// //             Locked(future days)
// //           </span>
// //         </div>
// //       </div>

// //       {/* Calendar Layout Container */}
// //       <div className="w-full">
// //         <div className="space-y-1">
// //           {/* Weekdays Row */}
// //           <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-1">
// //             {WEEKDAYS.map((day) => (
// //               <div
// //                 key={day}
// //                 className="text-[16px] sm:text-[16px] font-bold text-blue-700 uppercase tracking-wider py-0.5"
// //               >
// //                 {day.substring(0, 3)}
// //               </div>
// //             ))}
// //           </div>

// //           {/* Days Grid */}
// //           <div className="grid grid-cols-7 gap-1 sm:gap-2">
// //             {Array.from({ length: startDayOffset }).map((_, index) => (
// //               <div
// //                 key={`empty-${index}`}
// //                 className="bg-slate-100/20 border border-slate-200 rounded-xl h-12 sm:h-20 opacity-30"
// //               />
// //             ))}

// //             {daysInMonth.map((day) => {
// //               const dateStr = format(day, "yyyy-MM-dd");
// //               const todayDate = new Date();

// //               // Parse threshold window directly from profile context variables
// //               const startPeriod = fyStart ? new Date(fyStart) : null;
// //               const endPeriod = fyEnd ? new Date(fyEnd) : null;

// //               const isOutsideFY =
// //                 startPeriod && endPeriod
// //                   ? day < startPeriod || day > endPeriod
// //                   : false;

// //               const isFutureDay = isAfter(day, todayDate) && !isToday(day);

// //               // Lock past periods and future dates seamlessly
// //               const isLockedDay = isOutsideFY || isFutureDay;

// //               const explicitMapEntry = dayMap[dateStr];

// //               let backgroundRangeMatch = null;
// //               if (!explicitMapEntry && Array.isArray(travelRecords)) {
// //                 backgroundRangeMatch = travelRecords.find((record) => {
// //                   if (!record.departureDate || !record.arrivalDate)
// //                     return false;
// //                   try {
// //                     const start = parseISO(record.departureDate.split("T")[0]);
// //                     const end = parseISO(record.arrivalDate.split("T")[0]);
// //                     return isWithinInterval(day, { start, end });
// //                   } catch (e) {
// //                     return false;
// //                   }
// //                 });
// //               }

// //               const recordExists = !!(explicitMapEntry || backgroundRangeMatch);
// //               let currentStatus = "not set";
// //               let currentCountry = "not set";

// //               if (explicitMapEntry) {
// //                 currentStatus = explicitMapEntry.status;
// //                 currentCountry = explicitMapEntry.country;
// //               } else if (backgroundRangeMatch) {
// //                 const homeBase =
// //                   backgroundRangeMatch.homeCountry ||
// //                   backgroundRangeMatch.nativeCountry ||
// //                   "US";
// //                 const isHome =
// //                   backgroundRangeMatch.toCountry?.toUpperCase() ===
// //                   homeBase.toUpperCase();
// //                 currentStatus = isHome ? "Home Stay" : "Abroad Stay";
// //                 currentCountry = backgroundRangeMatch.toCountry || "Abroad";
// //               }

// //               const isHomeStay = recordExists && currentStatus === "Home Stay";
// //               const isAbroadStay =
// //                 recordExists &&
// //                 (currentStatus === "Abroad Stay" ||
// //                   currentStatus === "Other Countries Stay");
// //               const checkCurrentDay = isToday(day);

// //               let dayStyles =
// //                 "bg-white border-slate-200 text-slate-800 hover:bg-slate-50/60 hover:border-slate-300";
// //               if (isHomeStay) {
// //                 dayStyles =
// //                   "bg-emerald-50/60 border-emerald-300 hover:bg-emerald-50/90 text-emerald-950";
// //               } else if (isAbroadStay) {
// //                 dayStyles =
// //                   "bg-blue-50/60 border-blue-300 hover:bg-blue-50/90 text-blue-950";
// //               }

// //               // Apply locked styles if it is out of period or in the future
// //               if (isLockedDay) {
// //                 dayStyles =
// //                   "bg-slate-50/40 border-slate-100 text-slate-300/70 cursor-not-allowed select-none pointer-events-none";
// //               }

// //               return (
// //                 <div
// //                   key={dateStr}
// //                   onClick={() =>
// //                     handleDayActionToggle(day, dateStr, currentStatus)
// //                   }
// //                   className={`group relative border rounded-xl p-1.5 sm:p-2.5 h-12 sm:h-20 flex flex-col justify-between transition-all duration-150 ${dayStyles} ${
// //                     checkCurrentDay && !isLockedDay
// //                       ? "ring-2 ring-slate-950 ring-offset-1 z-10"
// //                       : ""
// //                   }`}
// //                   title={
// //                     isLockedDay
// //                       ? "Locked"
// //                       : `Click to change status for ${dateStr}`
// //                   }
// //                 >
// //                   <div className="flex items-center justify-between w-full">
// //                     <span
// //                       className={`text-[16px] sm:text-base font-bold tracking-tight ${
// //                         checkCurrentDay && !isLockedDay
// //                           ? "text-slate-950 font-black underline decoration-2 decoration-blue-600 underline-offset-1"
// //                           : isHomeStay
// //                             ? "text-emerald-900"
// //                             : isAbroadStay
// //                               ? "text-blue-900"
// //                               : isLockedDay
// //                                 ? "text-slate-300"
// //                                 : "text-slate-700"
// //                       }`}
// //                     >
// //                       {format(day, "d")}
// //                     </span>

// //                     {recordExists && !isLockedDay && (
// //                       <div
// //                         className={`p-0.5 rounded-md hidden sm:block ${
// //                           isHomeStay ? "text-emerald-600" : "text-blue-600"
// //                         }`}
// //                       >
// //                         {isHomeStay ? (
// //                           <FiHome size={12} />
// //                         ) : (
// //                           <FiGlobe size={12} />
// //                         )}
// //                       </div>
// //                     )}
// //                   </div>

// //                   <div className="text-left mt-auto">
// //                     <p
// //                       className={`text-[9px] sm:text-[10px] font-bold tracking-tight truncate max-w-full ${
// //                         isHomeStay
// //                           ? "text-emerald-700"
// //                           : isAbroadStay
// //                             ? "text-blue-700"
// //                             : isLockedDay
// //                               ? "text-slate-400 font-medium"
// //                               : "text-slate-700 font-medium"
// //                       }`}
// //                     >
// //                       {isLockedDay
// //                         ? "Locked"
// //                         : recordExists
// //                           ? isHomeStay
// //                             ? "Home"
// //                             : "Abroad"
// //                           : "No Record"}
// //                     </p>
// //                   </div>
// //                 </div>
// //               );
// //             })}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
