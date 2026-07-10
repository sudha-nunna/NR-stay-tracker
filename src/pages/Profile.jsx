import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { updateUserProfileInDb } from "../firebase/firestoreService";
import { countries } from "../utils/countries";
import { timezones, getTimezoneByCountry } from "../utils/timezoneList";
import {
  GLOBAL_MONTHS,
  getDaysInMonth,
  splitMonthDay,
} from "../utils/dateHelpers"; // Shared hooks
import toast from "react-hot-toast";
import { FiSave, FiSearch, FiChevronDown } from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";
import { useState, useRef, useEffect } from "react";

export default function Profile() {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);

  // Searchable Dropdown States
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);
  const [timezoneSearchQuery, setTimezoneSearchQuery] = useState("");

  const countryRef = useRef(null);
  const timezoneRef = useRef(null);

  // Extract initial values using shared date utility logic
  const initialStartParts = splitMonthDay(
    profile?.fyStart || profile?.residencyPeriodStart,
  );
  const initialEndParts = splitMonthDay(
    profile?.fyEnd || profile?.residencyPeriodEnd,
  );

  // Dynamic dropdown selector states
  const [startMonth, setStartMonth] = useState(initialStartParts.month);
  const [startDay, setStartDay] = useState(initialStartParts.day);
  const [endMonth, setEndMonth] = useState(initialEndParts.month);
  const [endDay, setEndDay] = useState(initialEndParts.day);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      timezone: profile?.timezone || "",
      nativeCountry: profile?.nativeCountry || profile?.homeCountry || "",
      fyStart: profile?.fyStart || profile?.residencyPeriodStart || "",
      fyEnd: profile?.fyEnd || profile?.residencyPeriodEnd || "",
      residencyThreshold: profile?.residencyThreshold || "",
    },
  });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // Sync state changes gracefully whenever context signals updates
  useEffect(() => {
    if (profile) {
      setValue(
        "nativeCountry",
        profile.nativeCountry || profile.homeCountry || "",
      );
      setValue("timezone", profile.timezone || "");
      setValue("residencyThreshold", profile.residencyThreshold || "");

      const sParts = splitMonthDay(
        profile.fyStart || profile.residencyPeriodStart,
      );
      const eParts = splitMonthDay(profile.fyEnd || profile.residencyPeriodEnd);

      setStartMonth(sParts.month);
      setStartDay(sParts.day);
      setEndMonth(eParts.month);
      setEndDay(eParts.day);
    }
  }, [profile, setValue]);

  // Handle field serialization targets dynamically for React Hook Form tracking
  useEffect(() => {
    if (startMonth && startDay) {
      setValue("fyStart", `${startMonth}-${startDay}`, { shouldDirty: true });
    } else {
      setValue("fyStart", "");
    }
  }, [startMonth, startDay, setValue]);

  useEffect(() => {
    if (endMonth && endDay) {
      setValue("fyEnd", `${endMonth}-${endDay}`, { shouldDirty: true });
    } else {
      setValue("fyEnd", "");
    }
  }, [endMonth, endDay, setValue]);

  const selectedCountryCode = watch("nativeCountry");
  const selectedTimezoneValue = watch("timezone");

  useEffect(() => {
    function handleClickOutside(event) {
      if (countryRef.current && !countryRef.current.contains(event.target))
        setCountryDropdownOpen(false);
      if (timezoneRef.current && !timezoneRef.current.contains(event.target))
        setTimezoneDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearchQuery.toLowerCase().trim()) ||
      c.code.toLowerCase().includes(countrySearchQuery.toLowerCase().trim()),
  );

  const filteredTimezones = timezones.filter(
    (t) =>
      t.label
        .toLowerCase()
        .includes(timezoneSearchQuery.toLowerCase().trim()) ||
      t.value.toLowerCase().includes(timezoneSearchQuery.toLowerCase().trim()),
  );

  const currentCountryName =
    countries.find((c) => c.code === selectedCountryCode)?.name ||
    (profile?.nativeCountry || profile?.homeCountry
      ? selectedCountryCode
      : "Not Set");
  const currentTimezoneLabel =
    timezones.find((t) => t.value === selectedTimezoneValue)?.label ||
    (profile?.timezone ? selectedTimezoneValue : "Not Set");

  const onUpdate = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        nativeCountry: formData.nativeCountry || "not-set",
        homeCountry: formData.nativeCountry || "not-set",
        timezone: formData.timezone || "not-set",
        residencyThreshold: formData.residencyThreshold
          ? Number(formData.residencyThreshold)
          : "not-set",
        fyStart: formData.fyStart || "not-set",
        residencyPeriodStart: formData.fyStart || "not-set",
        fyEnd: formData.fyEnd || "not-set",
        residencyPeriodEnd: formData.fyEnd || "not-set",
      };

      await updateUserProfileInDb(user.uid, payload);
      toast.success("Profile saved successfully.");
    } catch (e) {
      toast.error("Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative z-10 px-6 py-4 text-left">
      <div className="bg-gradient-to-r from-green-400 via-purple-400 to-pink-400 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white">Profile Configuration</h1>
        <p className="text-indigo-100 mt-2 text-base max-w-2xl">
          Set your personal thresholds and custom date parameters without
          entering year fields manually.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8">
        <form onSubmit={handleSubmit(onUpdate)} className="space-y-5">
          {/* Country Selection Dropdown Panel */}
          <div className="relative" ref={countryRef}>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Native Country
            </label>
            <div
              onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">{currentCountryName}</span>
              <FiChevronDown />
            </div>
            {countryDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b bg-slate-50">
                  <FiSearch className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Country..."
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    className="w-full outline-none text-base bg-transparent text-slate-900"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredCountries.map((country) => (
                    <div
                      key={country.code}
                      onClick={() => {
                        setValue("nativeCountry", country.code, {
                          shouldDirty: true,
                        });

                        const detectedTimezone = getTimezoneByCountry(
                          country.code,
                        );

                        if (detectedTimezone) {
                          setValue("timezone", detectedTimezone, {
                            shouldDirty: true,
                          });
                        }

                        setCountryDropdownOpen(false);
                        setCountrySearchQuery("");

                        setTimezoneDropdownOpen(false);
                        setTimezoneSearchQuery("");
                      }}
                      className="px-4 py-2.5 hover:bg-slate-50 text-base cursor-pointer"
                    >
                      {country.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input type="hidden" {...register("nativeCountry")} />
          </div>

          {/* Timezone Selection Dropdown Panel */}
          <div className="relative" ref={timezoneRef}>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Target Timezone Context
            </label>
            <div
              onClick={() => setTimezoneDropdownOpen(!timezoneDropdownOpen)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">{currentTimezoneLabel}</span>
              <FiChevronDown />
            </div>
            {timezoneDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b bg-slate-50">
                  <FiSearch className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Timezone..."
                    value={timezoneSearchQuery}
                    onChange={(e) => setTimezoneSearchQuery(e.target.value)}
                    className="w-full outline-none text-base bg-transparent text-slate-900"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredTimezones.map((tz) => (
                    <div
                      key={tz.value}
                      onClick={() => {
                        setValue("timezone", tz.value, { shouldDirty: true });
                        setTimezoneDropdownOpen(false);
                      }}
                      className="px-4 py-2.5 hover:bg-slate-50 text-base cursor-pointer"
                    >
                      {tz.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input type="hidden" {...register("timezone")} />
          </div>

          {/* Threshold Days Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Residency Threshold (Days)
            </label>
            <input
              type="number"
              placeholder="Not Set"
              {...register("residencyThreshold", { min: 1, max: 365 })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base"
            />
          </div>

          {/* Financial Cycle Dropdowns Mapping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Window Selection Dropdown Panel */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Financial Year Start
              </label>
              <div className="flex gap-2">
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Month (Not Set)</option>
                  {GLOBAL_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={startDay}
                  onChange={(e) => setStartDay(e.target.value)}
                  className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Day (Not Set)</option>
                  {getDaysInMonth(startMonth).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <input type="hidden" {...register("fyStart")} />
            </div>

            {/* End Window Selection Dropdown Panel */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Financial Year End
              </label>
              <div className="flex gap-2">
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Month (Not Set)</option>
                  {GLOBAL_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={endDay}
                  onChange={(e) => setEndDay(e.target.value)}
                  className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Day (Not Set)</option>
                  {getDaysInMonth(endMonth).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <input type="hidden" {...register("fyEnd")} />
            </div>
          </div>

          {/* Action Submit Core Button Trigger */}
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition flex items-center justify-center cursor-pointer shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <BiLoaderAlt className="animate-spin mr-2 text-xl" />
            ) : (
              <FiSave className="mr-1.5 text-base" />
            )}
            <span>Save Changes</span>
          </button>
        </form>
      </div>
    </div>
  );
}
