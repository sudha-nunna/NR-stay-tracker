import React, { useState } from "react";
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
  FiGlobe,
  FiHome,
  FiCalendar,
} from "react-icons/fi";

export default function StayCalendar({
  dayMap = {},
  onToggleDayPresence,
  fyStart,
  fyEnd,
  travelRecords = [],
}) {
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
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

  // Restored browsing window so users can change and view other years normally
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

  const handleYearChange = (e) => {
    setCurrentViewDate((prev) => setYear(prev, parseInt(e.target.value, 10)));
  };

  const handleResetToToday = () => {
    setCurrentViewDate(new Date());
  };

  const monthStart = startOfMonth(currentViewDate);
  const monthEnd = endOfMonth(currentViewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOffset = getDay(monthStart);

  const handleDayActionToggle = (dayDate, dateStr, currentStatus) => {
    const todayDate = new Date();
    
    // Parse the profile threshold inputs directly or fallback safely to system defaults
    const startPeriod = fyStart ? new Date(fyStart) : null;
    const endPeriod = fyEnd ? new Date(fyEnd) : null;

    const isOutsideFY = startPeriod && endPeriod 
      ? (dayDate < startPeriod || dayDate > endPeriod)
      : false;
      
    const isFutureDay = isAfter(dayDate, todayDate) && !isToday(dayDate);

    // Completely block state execution updates if out of threshold boundaries
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
      {/* Structural Header Navigation Frame */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 ml-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-950 tracking-tight">
              Travel Calendar
            </h2>
          </div>
          <p className="text-slate-500 text-[16px] mt-0.5">
            Track your Home and Abroad stays across the selected period.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleResetToToday}
            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-[16px] font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 h-8 shadow-sm"
          >
            <FiCalendar className="text-slate-400" size={13} />
            <span className="hidden xs:inline">Today</span>
          </button>

          <select
            value={currentViewDate.getMonth()}
            onChange={handleMonthChange}
            className="px-2 py-1.5 bg-white border border-slate-200 text-slate-800 text-[16px] font-bold rounded-xl hover:border-slate-300 transition outline-none cursor-pointer h-8 shadow-sm"
          >
            {MONTHS_LIST.map((m, index) => (
              <option key={m} value={index}>
                {m.substring(0, 3)}
              </option>
            ))}
          </select>

          <select
            value={currentViewDate.getFullYear()}
            onChange={handleYearChange}
            className="px-2 py-1.5 bg-white border border-slate-200 text-slate-800 text-[16px] font-bold rounded-xl hover:border-slate-300 transition outline-none cursor-pointer h-8 shadow-sm"
          >
            {YEARS_LIST.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

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

      {/* System Legend Matrix Panel */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-[16px] font-medium text-slate-500 py-1 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-50 rounded-sm border border-blue-300 flex items-center justify-center text-blue-600">
            <FiGlobe size={8} />
          </div>
          <span className="text-slate-500 font-semibold">
            Abroad(click to set Abroad)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-50 rounded-sm border border-emerald-300 flex items-center justify-center text-emerald-600">
            <FiHome size={8} />
          </div>
          <span className="text-slate-500 font-semibold">
            Home(double click to set home)
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-slate-50 border border-slate-200 text-slate-300 flex items-center justify-center">
            <FiCalendar size={8} />
          </div>
          <span className="text-slate-500 font-semibold">Locked(future days)</span>
        </div>
      </div>

      {/* Calendar Layout Container */}
      <div className="w-full">
        <div className="space-y-1">
          {/* Weekdays Row */}
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

          {/* Days Grid */}
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
              
              // Parse threshold window directly from profile context variables
              const startPeriod = fyStart ? new Date(fyStart) : null;
              const endPeriod = fyEnd ? new Date(fyEnd) : null;

              const isOutsideFY = startPeriod && endPeriod 
                ? (day < startPeriod || day > endPeriod)
                : false;

              const isFutureDay = isAfter(day, todayDate) && !isToday(day);
              
              // Lock past periods and future dates seamlessly
              const isLockedDay = isOutsideFY || isFutureDay;

              const explicitMapEntry = dayMap[dateStr];

              let backgroundRangeMatch = null;
              if (!explicitMapEntry && Array.isArray(travelRecords)) {
                backgroundRangeMatch = travelRecords.find((record) => {
                  if (!record.departureDate || !record.arrivalDate)
                    return false;
                  try {
                    const start = parseISO(record.departureDate.split("T")[0]);
                    const end = parseISO(record.arrivalDate.split("T")[0]);
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
                const isHome =
                  backgroundRangeMatch.toCountry?.toUpperCase() ===
                  homeBase.toUpperCase();
                currentStatus = isHome ? "Home Stay" : "Abroad Stay";
                currentCountry = backgroundRangeMatch.toCountry || "Abroad";
              }

              const isHomeStay = recordExists && currentStatus === "Home Stay";
              const isAbroadStay =
                recordExists &&
                (currentStatus === "Abroad Stay" ||
                  currentStatus === "Other Countries Stay");
              const checkCurrentDay = isToday(day);

              let dayStyles =
                "bg-white border-slate-200 text-slate-800 hover:bg-slate-50/60 hover:border-slate-300";
              if (isHomeStay) {
                dayStyles =
                  "bg-emerald-50/60 border-emerald-300 hover:bg-emerald-50/90 text-emerald-950";
              } else if (isAbroadStay) {
                dayStyles =
                  "bg-blue-50/60 border-blue-300 hover:bg-blue-50/90 text-blue-950";
              }

              // Apply locked styles if it is out of period or in the future
              if (isLockedDay) {
                dayStyles =
                  "bg-slate-50/40 border-slate-100 text-slate-300/70 cursor-not-allowed select-none pointer-events-none";
              }

              return (
                <div
                  key={dateStr}
                  onClick={() =>
                    handleDayActionToggle(day, dateStr, currentStatus)
                  }
                  className={`group relative border rounded-xl p-1.5 sm:p-2.5 h-12 sm:h-20 flex flex-col justify-between transition-all duration-150 ${dayStyles} ${
                    checkCurrentDay && !isLockedDay
                      ? "ring-2 ring-slate-950 ring-offset-1 z-10"
                      : ""
                  }`}
                  title={
                    isLockedDay
                      ? "Locked"
                      : `Click to change status for ${dateStr}`
                  }
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
                      <div
                        className={`p-0.5 rounded-md hidden sm:block ${
                          isHomeStay ? "text-emerald-600" : "text-blue-600"
                        }`}
                      >
                        {isHomeStay ? (
                          <FiHome size={12} />
                        ) : (
                          <FiGlobe size={12} />
                        )}
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
                      {isLockedDay
                        ? "Locked"
                        : recordExists
                          ? isHomeStay
                            ? "Home"
                            : "Abroad"
                          : "No Record"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}




// import React, { useState } from "react";
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
//   FiGlobe,
//   FiHome,
//   FiCalendar,
// } from "react-icons/fi";

// export default function StayCalendar({
//   dayMap = {},
//   onToggleDayPresence,
//   fyStart,
//   fyEnd,
//   travelRecords = [],
// }) {
//   const [currentViewDate, setCurrentViewDate] = useState(new Date());
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

//   // Automatically determine the relevant financial year group dynamically
//   const todayDateObj = new Date();
//   const baseFYYear = todayDateObj.getMonth() >= 3 
//     ? todayDateObj.getFullYear() 
//     : todayDateObj.getFullYear() - 1;

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

//   const handleYearChange = (e) => {
//     setCurrentViewDate((prev) => setYear(prev, parseInt(e.target.value, 10)));
//   };

//   const handleResetToToday = () => {
//     setCurrentViewDate(new Date());
//   };

//   const monthStart = startOfMonth(currentViewDate);
//   const monthEnd = endOfMonth(currentViewDate);
//   const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
//   const startDayOffset = getDay(monthStart);

//   const handleDayActionToggle = (dayDate, dateStr, currentStatus) => {
//     const todayDate = new Date();
    
//     // Parse the profile threshold inputs directly or fallback safely to system defaults
//     const startPeriod = fyStart ? new Date(fyStart) : null;
//     const endPeriod = fyEnd ? new Date(fyEnd) : null;

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
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 ml-2">
//         <div>
//           <div className="flex flex-wrap items-center gap-2">
//             <h2 className="text-lg font-bold text-slate-950 tracking-tight">
//               Travel Calendar
//             </h2>
//           </div>
//           <p className="text-slate-500 text-[16px] mt-0.5">
//             Track your Home and Abroad stays across the selected period.
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
//           <button
//             type="button"
//             onClick={handleResetToToday}
//             className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-[16px] font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 h-8 shadow-sm"
//           >
//             <FiCalendar className="text-slate-400" size={13} />
//             <span className="hidden xs:inline">Today</span>
//           </button>

//           <select
//             value={currentViewDate.getMonth()}
//             onChange={handleMonthChange}
//             className="px-2 py-1.5 bg-white border border-slate-200 text-slate-800 text-[16px] font-bold rounded-xl hover:border-slate-300 transition outline-none cursor-pointer h-8 shadow-sm"
//           >
//             {MONTHS_LIST.map((m, index) => (
//               <option key={m} value={index}>
//                 {m.substring(0, 3)}
//               </option>
//             ))}
//           </select>

//           <select
//             value={currentViewDate.getFullYear()}
//             onChange={handleYearChange}
//             className="px-2 py-1.5 bg-white border border-slate-200 text-slate-800 text-[16px] font-bold rounded-xl hover:border-slate-300 transition outline-none cursor-pointer h-8 shadow-sm"
//           >
//             {YEARS_LIST.map((y) => (
//               <option key={y} value={y}>
//                 {y}
//               </option>
//             ))}
//           </select>

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

//       {/* System Legend Matrix Panel */}
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
//           <span className="text-slate-500 font-semibold">Locked(future days)</span>
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
//             {/* Offset Padding Days */}
//             {Array.from({ length: startDayOffset }).map((_, index) => (
//               <div
//                 key={`empty-${index}`}
//                 className="bg-slate-100/20 border border-slate-200 rounded-xl h-12 sm:h-20 opacity-30"
//               />
//             ))}

//             {daysInMonth.map((day) => {
//               const dateStr = format(day, "yyyy-MM-dd");
//               const todayDate = new Date();
              
//               // Calculate explicit threshold limits for UI element styling mapping
//               const baseFYYearCalc = todayDate.getMonth() >= 3 ? todayDate.getFullYear() : todayDate.getFullYear() - 1;
//               const startPeriod = new Date(baseFYYearCalc, 3, 1, 0, 0, 0, 0);
//               const endPeriod = new Date(baseFYYearCalc + 1, 2, 31, 23, 59, 59, 999);

//               const isOutsideFY = day < startPeriod || day > endPeriod;
//               const isFutureDay = isAfter(day, todayDate) && !isToday(day);
              
//               // Lock past years, past periods, and future dates seamlessly
//               const isLockedDay = isOutsideFY || isFutureDay;

//               const explicitMapEntry = dayMap[dateStr];

//               let backgroundRangeMatch = null;
//               if (!explicitMapEntry && Array.isArray(travelRecords)) {
//                 backgroundRangeMatch = travelRecords.find((record) => {
//                   if (!record.departureDate || !record.arrivalDate)
//                     return false;
//                   try {
//                     const start = parseISO(record.departureDate.split("T")[0]);
//                     const end = parseISO(record.arrivalDate.split("T")[0]);
//                     return isWithinInterval(day, { start, end });
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

// //  // Automatically determine the relevant financial year group dynamically
// //   const todayDateObj = new Date();
// //   const baseFYYear = todayDateObj.getMonth() >= 3 
// //     ? todayDateObj.getFullYear() 
// //     : todayDateObj.getFullYear() - 1;

// //   // This automatically provides [2026, 2027] now, and switches to [2027, 2028] after March 31, 2027
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
// //    const handleDayActionToggle = (dayDate, dateStr, currentStatus) => {
// //     const todayDate = new Date();
    
// //     // Dynamically calculate the active threshold tracking period limits
// //     const baseFYYear = todayDate.getMonth() >= 3 ? todayDate.getFullYear() : todayDate.getFullYear() - 1;
    
// //     // Setup pure date timestamps without time shifts for precise comparison
// //     const startPeriod = new Date(baseFYYear, 3, 1, 0, 0, 0, 0); 
// //     const endPeriod = new Date(baseFYYear + 1, 2, 31, 23, 59, 59, 999); 

// //     const isOutsideFY = dayDate < startPeriod || dayDate > endPeriod;
// //     const isFutureDay = isAfter(dayDate, todayDate) && !isToday(dayDate);

// //     // Completely block state execution updates if out of threshold boundaries
// //     if (isOutsideFY || isFutureDay) return;

// //     if (typeof onToggleDayPresence === "function") {
// //       const nextStatus =
// //         currentStatus === "Abroad Stay" ? "Home Stay" : "Abroad Stay";
// //       onToggleDayPresence(dateStr, nextStatus);
// //     }
// //   };
  
// //   // const handleDayActionToggle = (dateStr, currentStatus, isFutureDay) => {
// //   //   if (isFutureDay) return;

// //   //   if (typeof onToggleDayPresence === "function") {
// //   //     const nextStatus =
// //   //       currentStatus === "Abroad Stay" ? "Home Stay" : "Abroad Stay";
// //   //     onToggleDayPresence(dateStr, nextStatus);
// //   //   }
// //   // };

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
// //             {/* <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100 shrink-0">
// //               {travelRecords.length} Records Added
// //             </span> */}
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
// //           <span className="text-slate-500 font-semibold">Locked(future days)</span>
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
// //             {/* Offset Padding Days */}
// //             {Array.from({ length: startDayOffset }).map((_, index) => (
// //               <div
// //                 key={`empty-${index}`}
// //                 className="bg-slate-100/20 border border-slate-200 rounded-xl h-12 sm:h-20 opacity-30"
// //               />
// //             ))}

// //             {/* Active Calendar Month Day Rows */}
// //             {daysInMonth.map((day) => {
// //               const dateStr = format(day, "yyyy-MM-dd");
// //               const todayDate = new Date();
// //               const isFutureDay = isAfter(day, todayDate) && !isToday(day);

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

// //               if (isFutureDay) {
// //                 dayStyles =
// //                   "bg-slate-50/40 border-slate-100 text-slate-300 cursor-not-allowed";
// //               }

// //               return (
// //                 <div
// //                   key={dateStr}
// //                   onClick={() =>
// //                     handleDayActionToggle(dateStr, currentStatus, isFutureDay)
// //                   }
// //                   className={`group relative border rounded-xl p-1.5 sm:p-2.5 h-12 sm:h-20 flex flex-col justify-between transition-all duration-150 cursor-pointer ${dayStyles} ${
// //                     checkCurrentDay
// //                       ? "ring-2 ring-slate-950 ring-offset-1 z-10"
// //                       : ""
// //                   }`}
// //                   title={
// //                     isFutureDay
// //                       ? "Locked"
// //                       : `Click to change status for ${dateStr}`
// //                   }
// //                 >
// //                   <div className="flex items-center justify-between w-full">
// //                     <span
// //                       className={`text-[16px] sm:text-base font-bold tracking-tight ${
// //                         checkCurrentDay
// //                           ? "text-slate-950 font-black underline decoration-2 decoration-blue-600 underline-offset-1"
// //                           : isHomeStay
// //                             ? "text-emerald-900"
// //                             : isAbroadStay
// //                               ? "text-blue-900"
// //                               : isFutureDay
// //                                 ? "text-slate-500"
// //                                 : "text-slate-700"
// //                       }`}
// //                     >
// //                       {format(day, "d")}
// //                     </span>

// //                     {recordExists && (
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
// //                             : isFutureDay
// //                               ? "text-slate-500 font-medium"
// //                               : "text-slate-700 font-medium"
// //                       }`}
// //                     >
// //                       {isFutureDay
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





// // // import React, { useState } from "react";
// // // import {
// // //   parseISO,
// // //   format,
// // //   startOfMonth,
// // //   endOfMonth,
// // //   eachDayOfInterval,
// // //   addMonths,
// // //   subMonths,
// // //   getDay,
// // //   isToday,
// // //   isAfter,
// // //   isWithinInterval,
// // //   setMonth,
// // //   setYear,
// // // } from "date-fns";
// // // import {
// // //   FiChevronLeft,
// // //   FiChevronRight,
// // //   FiGlobe,
// // //   FiHome,
// // //   FiCalendar,
// // // } from "react-icons/fi";

// // // export default function StayCalendar({
// // //   dayMap = {},
// // //   onToggleDayPresence,
// // //   fyStart,
// // //   fyEnd,
// // //   travelRecords = [],
// // // }) {
// // //   const [currentViewDate, setCurrentViewDate] = useState(new Date());
// // //   const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// // //   const MONTHS_LIST = [
// // //     "January",
// // //     "February",
// // //     "March",
// // //     "April",
// // //     "May",
// // //     "June",
// // //     "July",
// // //     "August",
// // //     "September",
// // //     "October",
// // //     "November",
// // //     "December",
// // //   ];

// // //   const currentYearNum = new Date().getFullYear();
// // //   const YEARS_LIST = Array.from(
// // //     { length: 7 },
// // //     (_, i) => currentYearNum - 3 + i,
// // //   );

// // //   const handlePrevMonth = () =>
// // //     setCurrentViewDate((prev) => subMonths(prev, 1));
// // //   const handleNextMonth = () =>
// // //     setCurrentViewDate((prev) => addMonths(prev, 1));

// // //   const handleMonthChange = (e) => {
// // //     setCurrentViewDate((prev) => setMonth(prev, parseInt(e.target.value, 10)));
// // //   };

// // //   const handleYearChange = (e) => {
// // //     setCurrentViewDate((prev) => setYear(prev, parseInt(e.target.value, 10)));
// // //   };

// // //   const handleResetToToday = () => {
// // //     setCurrentViewDate(new Date());
// // //   };

// // //   const monthStart = startOfMonth(currentViewDate);
// // //   const monthEnd = endOfMonth(currentViewDate);
// // //   const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
// // //   const startDayOffset = getDay(monthStart);

// // //   const handleDayActionToggle = (dateStr, currentStatus, isFutureDay) => {
// // //     if (isFutureDay) return;

// // //     if (typeof onToggleDayPresence === "function") {
// // //       const nextStatus =
// // //         currentStatus === "Abroad Stay" ? "Home Stay" : "Abroad Stay";
// // //       onToggleDayPresence(dateStr, nextStatus);
// // //     }
// // //   };

// // //   return (
// // //     <div
// // //       className="bg-white rounded-3xl space-y-4 w-full mx-auto border border-slate-200/80 p-2 sm:p-6 shadow-sm"
// // //       id="stay-calendar-section"
// // //     >
// // //       {/* Structural Header Navigation Frame */}
// // //       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 ml-2">
// // //         <div>
// // //           <div className="flex flex-wrap items-center gap-2">
// // //             <h2 className="text-lg font-bold text-slate-950 tracking-tight">
// // //               Travel Calendar
// // //             </h2>
// // //             {/* <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100 shrink-0">
// // //               {travelRecords.length} Records Added
// // //             </span> */}
// // //           </div>
// // //           <p className="text-slate-500 text-[16px] mt-0.5">
// // //             Track your Home and Abroad stays across the selected period.
// // //           </p>
// // //         </div>

// // //         <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
// // //           <button
// // //             type="button"
// // //             onClick={handleResetToToday}
// // //             className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-[16px] font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 h-8 shadow-sm"
// // //           >
// // //             <FiCalendar className="text-slate-400" size={13} />
// // //             <span className="hidden xs:inline">Today</span>
// // //           </button>

// // //           <select
// // //             value={currentViewDate.getMonth()}
// // //             onChange={handleMonthChange}
// // //             className="px-2 py-1.5 bg-white border border-slate-200 text-slate-800 text-[16px] font-bold rounded-xl hover:border-slate-300 transition outline-none cursor-pointer h-8 shadow-sm"
// // //           >
// // //             {MONTHS_LIST.map((m, index) => (
// // //               <option key={m} value={index}>
// // //                 {m.substring(0, 3)}
// // //               </option>
// // //             ))}
// // //           </select>

// // //           <select
// // //             value={currentViewDate.getFullYear()}
// // //             onChange={handleYearChange}
// // //             className="px-2 py-1.5 bg-white border border-slate-200 text-slate-800 text-[16px] font-bold rounded-xl hover:border-slate-300 transition outline-none cursor-pointer h-8 shadow-sm"
// // //           >
// // //             {YEARS_LIST.map((y) => (
// // //               <option key={y} value={y}>
// // //                 {y}
// // //               </option>
// // //             ))}
// // //           </select>

// // //           <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden h-8 shadow-sm">
// // //             <button
// // //               type="button"
// // //               onClick={handlePrevMonth}
// // //               className="px-2.5 h-full hover:bg-slate-50 text-slate-600 transition cursor-pointer border-r border-slate-100 flex items-center justify-center"
// // //             >
// // //               <FiChevronLeft size={14} />
// // //             </button>
// // //             <button
// // //               type="button"
// // //               onClick={handleNextMonth}
// // //               className="px-2.5 h-full hover:bg-slate-50 text-slate-600 transition cursor-pointer flex items-center justify-center"
// // //             >
// // //               <FiChevronRight size={14} />
// // //             </button>
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* System Legend Matrix Panel */}
// // //       <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-[16px] font-medium text-slate-500 py-1 border-b border-slate-100 pb-3">
// // //         <div className="flex items-center gap-1.5">
// // //           <div className="w-3 h-3 bg-blue-50 rounded-sm border border-blue-300 flex items-center justify-center text-blue-600">
// // //             <FiGlobe size={8} />
// // //           </div>
// // //           <span className="text-slate-500 font-semibold">
// // //             Abroad(click to set Abroad)
// // //           </span>
// // //         </div>
// // //         <div className="flex items-center gap-1.5">
// // //           <div className="w-3 h-3 bg-emerald-50 rounded-sm border border-emerald-300 flex items-center justify-center text-emerald-600">
// // //             <FiHome size={8} />
// // //           </div>
// // //           <span className="text-slate-500 font-semibold">
// // //             Home(double click to set home)
// // //           </span>
// // //         </div>
        
// // //         <div className="flex items-center gap-1.5">
// // //           <div className="w-3 h-3 bg-slate-50 border border-slate-200 text-slate-300 flex items-center justify-center">
// // //             <FiCalendar size={8} />
// // //           </div>
// // //           <span className="text-slate-500 font-semibold">Locked(future days)</span>
// // //         </div>
// // //       </div>

// // //       {/* Calendar Layout Container */}
// // //       <div className="w-full">
// // //         <div className="space-y-1">
// // //           {/* Weekdays Row */}
// // //           <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-1">
// // //             {WEEKDAYS.map((day) => (
// // //               <div
// // //                 key={day}
// // //                 className="text-[16px] sm:text-[16px] font-bold text-blue-700 uppercase tracking-wider py-0.5"
// // //               >
// // //                 {day.substring(0, 3)}
// // //               </div>
// // //             ))}
// // //           </div>

// // //           {/* Days Grid */}
// // //           <div className="grid grid-cols-7 gap-1 sm:gap-2">
// // //             {/* Offset Padding Days */}
// // //             {Array.from({ length: startDayOffset }).map((_, index) => (
// // //               <div
// // //                 key={`empty-${index}`}
// // //                 className="bg-slate-100/20 border border-slate-200 rounded-xl h-12 sm:h-20 opacity-30"
// // //               />
// // //             ))}

// // //             {/* Active Calendar Month Day Rows */}
// // //             {daysInMonth.map((day) => {
// // //               const dateStr = format(day, "yyyy-MM-dd");
// // //               const todayDate = new Date();
// // //               const isFutureDay = isAfter(day, todayDate) && !isToday(day);

// // //               const explicitMapEntry = dayMap[dateStr];

// // //               let backgroundRangeMatch = null;
// // //               if (!explicitMapEntry && Array.isArray(travelRecords)) {
// // //                 backgroundRangeMatch = travelRecords.find((record) => {
// // //                   if (!record.departureDate || !record.arrivalDate)
// // //                     return false;
// // //                   try {
// // //                     const start = parseISO(record.departureDate.split("T")[0]);
// // //                     const end = parseISO(record.arrivalDate.split("T")[0]);
// // //                     return isWithinInterval(day, { start, end });
// // //                   } catch (e) {
// // //                     return false;
// // //                   }
// // //                 });
// // //               }

// // //               const recordExists = !!(explicitMapEntry || backgroundRangeMatch);
// // //               let currentStatus = "not set";
// // //               let currentCountry = "not set";

// // //               if (explicitMapEntry) {
// // //                 currentStatus = explicitMapEntry.status;
// // //                 currentCountry = explicitMapEntry.country;
// // //               } else if (backgroundRangeMatch) {
// // //                 const homeBase =
// // //                   backgroundRangeMatch.homeCountry ||
// // //                   backgroundRangeMatch.nativeCountry ||
// // //                   "US";
// // //                 const isHome =
// // //                   backgroundRangeMatch.toCountry?.toUpperCase() ===
// // //                   homeBase.toUpperCase();
// // //                 currentStatus = isHome ? "Home Stay" : "Abroad Stay";
// // //                 currentCountry = backgroundRangeMatch.toCountry || "Abroad";
// // //               }

// // //               const isHomeStay = recordExists && currentStatus === "Home Stay";
// // //               const isAbroadStay =
// // //                 recordExists &&
// // //                 (currentStatus === "Abroad Stay" ||
// // //                   currentStatus === "Other Countries Stay");
// // //               const checkCurrentDay = isToday(day);

// // //               let dayStyles =
// // //                 "bg-white border-slate-200 text-slate-800 hover:bg-slate-50/60 hover:border-slate-300";
// // //               if (isHomeStay) {
// // //                 dayStyles =
// // //                   "bg-emerald-50/60 border-emerald-300 hover:bg-emerald-50/90 text-emerald-950";
// // //               } else if (isAbroadStay) {
// // //                 dayStyles =
// // //                   "bg-blue-50/60 border-blue-300 hover:bg-blue-50/90 text-blue-950";
// // //               }

// // //               if (isFutureDay) {
// // //                 dayStyles =
// // //                   "bg-slate-50/40 border-slate-100 text-slate-300 cursor-not-allowed";
// // //               }

// // //               return (
// // //                 <div
// // //                   key={dateStr}
// // //                   onClick={() =>
// // //                     handleDayActionToggle(dateStr, currentStatus, isFutureDay)
// // //                   }
// // //                   className={`group relative border rounded-xl p-1.5 sm:p-2.5 h-12 sm:h-20 flex flex-col justify-between transition-all duration-150 cursor-pointer ${dayStyles} ${
// // //                     checkCurrentDay
// // //                       ? "ring-2 ring-slate-950 ring-offset-1 z-10"
// // //                       : ""
// // //                   }`}
// // //                   title={
// // //                     isFutureDay
// // //                       ? "Locked"
// // //                       : `Click to change status for ${dateStr}`
// // //                   }
// // //                 >
// // //                   <div className="flex items-center justify-between w-full">
// // //                     <span
// // //                       className={`text-[16px] sm:text-base font-bold tracking-tight ${
// // //                         checkCurrentDay
// // //                           ? "text-slate-950 font-black underline decoration-2 decoration-blue-600 underline-offset-1"
// // //                           : isHomeStay
// // //                             ? "text-emerald-900"
// // //                             : isAbroadStay
// // //                               ? "text-blue-900"
// // //                               : isFutureDay
// // //                                 ? "text-slate-500"
// // //                                 : "text-slate-700"
// // //                       }`}
// // //                     >
// // //                       {format(day, "d")}
// // //                     </span>

// // //                     {recordExists && (
// // //                       <div
// // //                         className={`p-0.5 rounded-md hidden sm:block ${
// // //                           isHomeStay ? "text-emerald-600" : "text-blue-600"
// // //                         }`}
// // //                       >
// // //                         {isHomeStay ? (
// // //                           <FiHome size={12} />
// // //                         ) : (
// // //                           <FiGlobe size={12} />
// // //                         )}
// // //                       </div>
// // //                     )}
// // //                   </div>

// // //                   <div className="text-left mt-auto">
// // //                     <p
// // //                       className={`text-[9px] sm:text-[10px] font-bold tracking-tight truncate max-w-full ${
// // //                         isHomeStay
// // //                           ? "text-emerald-700"
// // //                           : isAbroadStay
// // //                             ? "text-blue-700"
// // //                             : isFutureDay
// // //                               ? "text-slate-500 font-medium"
// // //                               : "text-slate-700 font-medium"
// // //                       }`}
// // //                     >
// // //                       {isFutureDay
// // //                         ? "Locked"
// // //                         : recordExists
// // //                           ? isHomeStay
// // //                             ? "Home"
// // //                             : "Abroad"
// // //                           : "No Record"}
// // //                     </p>
// // //                   </div>
// // //                 </div>
// // //               );
// // //             })}
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }
