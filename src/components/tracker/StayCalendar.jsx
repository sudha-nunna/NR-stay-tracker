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

  const handleDayActionToggle = (dateStr, currentStatus, isFutureDay) => {
    if (isFutureDay) return;

    if (typeof onToggleDayPresence === "function") {
      const nextStatus =
        currentStatus === "Abroad Stay" ? "Home Stay" : "Abroad Stay";
      onToggleDayPresence(dateStr, nextStatus);
    }
  };

  return (
    <div className="bg-white rounded-2xl space-y-6 w-full mx-auto border border-gray-200 p-4">
      {/* Structural Header Navigation Frame */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Travel Calendar
          </h2>
          <p className="text-blue-600 text-xs mt-0.5">
            Track your Home and Abroad stays across the selected period.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={handleResetToToday}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
          >
            <FiCalendar className="text-slate-400" />
            <span>Today</span>
          </button>

          <select
            value={currentViewDate.getMonth()}
            onChange={handleMonthChange}
            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-slate-300 transition outline-none cursor-pointer"
          >
            {MONTHS_LIST.map((m, index) => (
              <option key={m} value={index}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={currentViewDate.getFullYear()}
            onChange={handleYearChange}
            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-slate-300 transition outline-none cursor-pointer"
          >
            {YEARS_LIST.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden ml-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-50 text-slate-600 transition cursor-pointer border-r border-slate-100"
            >
              <FiChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            >
              <FiChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* System Legend Matrix Panel */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 items-center text-xs font-medium text-slate-500 py-1">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-emerald-50 rounded border border-emerald-300 flex items-center justify-center text-emerald-600">
            <FiHome size={9} />
          </div>
          <span>Home Stay (Green Border)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-blue-50 rounded border border-blue-300 flex items-center justify-center text-blue-600">
            <FiGlobe size={9} />
          </div>
          <span>Abroad Stay (Blue Border)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-slate-50 border border-slate-200 opacity-60 text-slate-300 flex items-center justify-center">
            <FiCalendar size={9} />
          </div>
          <span>Future Days (Locked Actions)</span>
        </div>
      </div>

      {/* Primary Grid Grid Elements */}
      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 active:scrollbar-thumb-slate-300 touch-pan-x pb-2">
        <div className="space-y-1.5 min-w-[750px]">
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-lg font-semibold text-blue-600 uppercase tracking-wider py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: startDayOffset }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-slate-50/40 border border-slate-100/40 rounded-2xl min-h-[110px] opacity-20"
            />
          ))}

          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const todayDate = new Date();
            const isFutureDay = isAfter(day, todayDate) && !isToday(day);

            // PRIORITY HIERARCHY RESOLUTION ENGINE
            const explicitMapEntry = dayMap[dateStr];

            let backgroundRangeMatch = null;
            if (!explicitMapEntry && Array.isArray(travelRecords)) {
              backgroundRangeMatch = travelRecords.find((record) => {
                if (!record.departureDate || !record.arrivalDate) return false;
                try {
                  const start = parseISO(record.departureDate.split("T")[0]);
                  const end = parseISO(record.arrivalDate.split("T")[0]);
                  return isWithinInterval(day, { start, end });
                } catch (e) {
                  return false;
                }
              });
            }

            const recordExists =
              explicitMapEntry || backgroundRangeMatch ? true : false;
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
              "bg-white border-slate-300 text-slate-800 hover:border-slate-200";
            if (isHomeStay) {
              dayStyles =
                "bg-emerald-50/40 border-emerald-300 text-emerald-900";
            } else if (isAbroadStay) {
              dayStyles = "bg-blue-50/50 border-blue-300 text-blue-900";
            }

            if (isFutureDay) {
              dayStyles += " bg-slate-50/30 border-slate-100/80 text-slate-400";
            }

            return (
              <div
                key={dateStr}
                onClick={() =>
                  handleDayActionToggle(dateStr, currentStatus, isFutureDay)
                }
                className={`group relative border rounded-2xl p-3 min-h-[110px] flex flex-col justify-between transition-all duration-150 cursor-pointer ${dayStyles} ${
                  checkCurrentDay ? "ring-2 ring-slate-900 ring-offset-2" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-lg font-bold ${checkCurrentDay ? "text-slate-950 font-black underline decoration-2 decoration-indigo-500 underline-offset-2" : isHomeStay ? "text-emerald-900" : isAbroadStay ? "text-blue-900" : "text-slate-700"}`}
                  >
                    {format(day, "d")}
                  </span>

                  {recordExists && (
                    <div
                      className={`p-1 rounded-md ${isHomeStay ? "bg-emerald-200/80 text-emerald-700" : "bg-blue-200 text-blue-600"}`}
                    >
                      {isHomeStay ? (
                        <FiHome size={15} />
                      ) : (
                        <FiGlobe size={15} />
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-1 text-left hidden sm:block">
                  <p
                    className={`text-[10px] font-bold tracking-tight truncate max-w-full ${isHomeStay ? "text-emerald-700" : isAbroadStay ? "text-blue-700" : "text-slate-400 font-normal"}`}
                  >
                    {recordExists
                      ? isHomeStay
                        ? "Home Base"
                        : currentCountry || "Abroad"
                      : "not set"}
                  </p>
                </div>
                <div className="mt-2">
                  {isFutureDay ? (
                    <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-500">
                      Locked
                    </span>
                  ) : isHomeStay ? (
                    <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-green-100 text-green-700">
                      Home
                    </span>
                  ) : isAbroadStay ? (
                    <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700">
                      Abroad
                    </span>
                  ) : null}
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
