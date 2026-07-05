import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { updateUserProfileInDb } from "../firebase/firestoreService";
import { countries } from "../utils/countries";
import { timezones } from "../utils/timezoneList";
import toast from "react-hot-toast";
import { FiSave, FiSearch, FiChevronDown } from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";
import { useState, useRef, useEffect } from "react";

export default function Profile() {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      timezone: profile?.timezone || "Asia/Kolkata",
      nativeCountry: profile?.nativeCountry || "IN",
      fyStart: profile?.fyStart || "2026-04-01",
      fyEnd: profile?.fyEnd || "2027-03-31",
    },
  });

  // Keep internal input fields correctly aligned whenever profile context changes
  useEffect(() => {
    if (profile) {
      setValue("nativeCountry", profile.nativeCountry || "IN");
      setValue("timezone", profile.timezone || "Asia/Kolkata");
      setValue("fyStart", profile.fyStart || "2026-04-01");
      setValue("fyEnd", profile.fyEnd || "2027-03-31");
    }
  }, [profile, setValue]);

  const selectedCountryCode = watch("nativeCountry");
  const selectedTimezoneValue = watch("timezone");
  const fyStartValue = watch("fyStart");

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);
  const [timezoneSearchQuery, setTimezoneSearchQuery] = useState("");

  const countryRef = useRef(null);
  const timezoneRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setCountryDropdownOpen(false);
      }
      if (timezoneRef.current && !timezoneRef.current.contains(event.target)) {
        setTimezoneDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter systems dynamically based on input match conditions (optimized to includes)
  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearchQuery.toLowerCase().trim()) ||
      c.code.toLowerCase().includes(countrySearchQuery.toLowerCase().trim()),
  );

  const filteredTimezones = timezones.filter(
    (t) =>
      t.label.toLowerCase().includes(timezoneSearchQuery.toLowerCase().trim()) ||
      t.value.toLowerCase().includes(timezoneSearchQuery.toLowerCase().trim()),
  );

  const currentCountryName = countries.find((c) => c.code === selectedCountryCode)?.name || "Select Country";
  const currentTimezoneLabel = timezones.find((t) => t.value === selectedTimezoneValue)?.label || "Select Timezone";

  const onUpdate = async (formData) => {
    setSaving(true);
    try {
      // Include current threshold from existing profile data to prevent overwriting with defaults
      const payload = {
        ...formData,
        residencyThreshold: profile?.residencyThreshold || "183"
      };
      await updateUserProfileInDb(user.uid, payload);
      toast.success("Profile settings updated successfully.");
    } catch (e) {
      toast.error("Unable to save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative z-10 px-6 py-4">
      <div className="bg-gradient-to-r from-green-400 via-purple-400 to-pink-400 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Global Residency Configuration
        </h1>
        <p className="text-indigo-100 mt-3 text-sm md:text-base max-w-3xl">
          Configure your primary residency jurisdiction, financial year boundaries, and parameters across the platform.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8">
        <form onSubmit={handleSubmit(onUpdate)} className="space-y-5">
          <div className="relative" ref={countryRef}>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Native Country
            </label>
            <div
              onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white text-slate-900 text-sm font-medium"
            >
              <span className="truncate">{currentCountryName}</span>
              <FiChevronDown className={`text-slate-500 transition duration-200 ${countryDropdownOpen ? "rotate-180" : ""}`} />
            </div>

            {countryDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b bg-slate-50">
                  <FiSearch className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search Country..."
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    className="w-full outline-none text-sm bg-transparent text-slate-900"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto no-scrollbar">
                  {filteredCountries.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                      No countries found
                    </div>
                  ) : (
                    filteredCountries.map((country) => (
                      <div
                        key={country.code}
                        onClick={() => {
                          setValue("nativeCountry", country.code, { shouldValidate: true, shouldDirty: true });
                          setCountryDropdownOpen(false);
                          setCountrySearchQuery("");
                        }}
                        className={`px-4 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center text-sm text-slate-700 transition ${selectedCountryCode === country.code ? "bg-slate-50 font-bold text-slate-900" : ""}`}
                      >
                        <span>{country.name}</span>
                        <span className="text-slate-400 font-mono text-xs uppercase">{country.code}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <input type="hidden" {...register("nativeCountry")} />
          </div>

          <div className="relative" ref={timezoneRef}>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Target Timezone Context
            </label>
            <div
              onClick={() => setTimezoneDropdownOpen(!timezoneDropdownOpen)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white text-slate-900 text-sm font-medium"
            >
              <span className="truncate">{currentTimezoneLabel}</span>
              <FiChevronDown className={`text-slate-500 transition duration-200 ${timezoneDropdownOpen ? "rotate-180" : ""}`} />
            </div>

            {timezoneDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b bg-slate-50">
                  <FiSearch className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search Timezone..."
                    value={timezoneSearchQuery}
                    onChange={(e) => setTimezoneSearchQuery(e.target.value)}
                    className="w-full outline-none text-sm bg-transparent text-slate-900"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto no-scrollbar">
                  {filteredTimezones.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                      No timezones found
                    </div>
                  ) : (
                    filteredTimezones.map((timezone) => (
                      <div
                        key={timezone.value}
                        onClick={() => {
                          setValue("timezone", timezone.value, { shouldValidate: true, shouldDirty: true });
                          setTimezoneDropdownOpen(false);
                          setTimezoneSearchQuery("");
                        }}
                        className={`px-4 py-3 hover:bg-indigo-50 cursor-pointer text-sm text-slate-700 transition ${selectedTimezoneValue === timezone.value ? "bg-slate-50 font-bold text-slate-900" : ""}`}
                      >
                        {timezone.label}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <input type="hidden" {...register("timezone")} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Financial Year Start
              </label>
              <input
                type="date"
                {...register("fyStart", { required: true })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Financial Year End
              </label>
              <input
                type="date"
                {...register("fyEnd", {
                  required: true,
                  validate: (v) => new Date(v) > new Date(fyStartValue) || "Must conclude sequentially following target start checkpoint",
                })}
                className={`w-full px-4 py-2.5 bg-slate-50 border text-slate-900 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition ${errors.fyEnd ? "border-red-500" : "border-slate-200"}`}
              />
              {errors.fyEnd && (
                <p className="text-red-500 text-[10px] mt-1 font-bold tracking-wide">
                  {errors.fyEnd.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 transition-all duration-300 shadow-xl disabled:opacity-50 flex items-center justify-center cursor-pointer"
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
