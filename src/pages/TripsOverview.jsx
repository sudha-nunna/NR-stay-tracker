import {
  FiClock,
  FiMapPin,
  FiCalendar,
  FiAlertTriangle,
  FiInfo,
  FiPlus,
  FiChevronDown,
} from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";
import StayCalendar from "../components/tracker/StayCalendar";
import TravelForm from "../components/tracker/TravelForm";
import { useResidencyDashboard } from "../hooks/useResidencyDashboard";

export default function TripsOverview() {
  const {
    profile,
    records,
    metricsLoading,
    showForm,
    setShowForm,
    editingRecord,
    setEditingRecord,
    isMenuOpen,
    setIsMenuOpen,
    menuRef,
    handleTogglePresence,
    formatToMonthDay,
    calculation,
    homeCountryName,
    targetTimezone,
    horizonPeriodStart,
    horizonPeriodEnd,
    definedMilestone,
    hasValidTravelRecords,
    displayHomeDays,
    displayOutsideDays,
    remainingTargetDays,
    currentFootprintDisplay,
    computedDayMap,
    calendarHomeDays,
    calendarAbroadDays,
    handleFormSubmitCallback,
  } = useResidencyDashboard();

  if (metricsLoading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <BiLoaderAlt className="animate-spin text-slate-800 text-3xl" />
      </div>
    );
  }

  const loggedTotalDays =
    Number(calendarHomeDays || 0) + Number(calendarAbroadDays || 0);

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

  return (
    <div className="space-y-8 pb-2 max-w-7xl mx-auto text-left">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">
          Trips Overview
        </h1>
        <p className="text-sm text-blue-800 font-medium mt-1">
          Travel history, records, and stay calendar
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Travel Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-100 flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-amber-700 font-bold uppercase tracking-wider">
              Abroad Stay Target
            </p>
            <div className="flex flex-wrap items-baseline gap-1 mt-2">
              <h3 className="text-2xl sm:text-3xl font-black text-amber-900">
                {displayOutsideDays}
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

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Abroad Status Progress
          </span>
          <span className="text-sm font-bold text-slate-900">
            {displayOutsideDays > 0 ? calculation.progressPercentage : 0}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
            style={{
              width: `${displayOutsideDays > 0 ? calculation.progressPercentage : 0}%`,
            }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-3 text-xs text-slate-500 font-semibold">
          <span>Current Stays: {displayOutsideDays} days</span>
          <span>Target Milestone: {definedMilestone} days</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Profile Summary
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your current core settings, tracking horizons, and
            active global footprint.
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

      <div
        id="stay-calendar-section"
        className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl space-y-4 w-full mx-auto border border-slate-200 shadow-lg p-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Stay Calendar</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
              <span className="text-green-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
                🏠 Home: {calendarHomeDays} Days
              </span>
            </div>
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-blue-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
                🌍 Abroad: {calendarAbroadDays} Days
              </span>
            </div>
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-purple-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
                Total: &nbsp;{loggedTotalDays} Days
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <TravelForm
              initialData={editingRecord}
              onSubmit={handleFormSubmitCallback}
              travelRecords={records}
              fyStart={profile?.fyStart || profile?.residencyPeriodStart}
              fyEnd={profile?.fyEnd || profile?.residencyPeriodEnd}
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