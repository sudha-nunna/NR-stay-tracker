import { useForm } from "react-hook-form";
import { countries } from "../../utils/countries";
import { FiPlus, FiSave, FiX, FiChevronDown } from "react-icons/fi";
import { useEffect, useState, useRef } from "react";

export default function TravelForm({ onSubmit, initialData, onCancel }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: initialData || {
      fromCountry: "",
      toCountry: "",
      departureDate: "",
      arrivalDate: "",
      purpose: "",
    },
  });

  // Dynamic values register tracking hooks
  const watchedFromCountry = watch("fromCountry");
  const watchedToCountry = watch("toCountry");
  const watchedDepartureDate = watch("departureDate");

  // Search filter options layout state handling mechanisms
  const [searchFrom, setSearchFrom] = useState("");
  const [isOpenFrom, setIsOpenFrom] = useState(false);
  const [searchTo, setSearchTo] = useState("");
  const [isOpenTo, setIsOpenTo] = useState(false);

  // References to detect clicks outside dropdown components
  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Today's date string snapshot format used to cap future selections
  const todayStr = new Date().toISOString().split("T")[0];

  // Dynamic state context tracking validation mechanism
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        fromCountry: "",
        toCountry: "",
        departureDate: "",
        arrivalDate: "",
        purpose: "",
      });
    }
  }, [initialData, reset]);

  // Handle outside clicks to close active search windows
  useEffect(() => {
    function handleClickOutside(event) {
      if (fromRef.current && !fromRef.current.contains(event.target))
        setIsOpenFrom(false);
      if (toRef.current && !toRef.current.contains(event.target))
        setIsOpenTo(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter countries array list structurally based on search query strings
  const filteredFromCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchFrom.toLowerCase()) ||
      c.code.toLowerCase().includes(searchFrom.toLowerCase()),
  );

  const filteredToCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTo.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTo.toLowerCase()),
  );

  // Get active text strings for screen layout display indicators
  const currentFromLabel =
    countries.find((c) => c.code === watchedFromCountry)?.name ||
    "Select Origin Country";
  const currentToLabel =
    countries.find((c) => c.code === watchedToCountry)?.name ||
    "Select Destination Country";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 space-y-4 text-left"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold tracking-tight text-slate-800 uppercase">
          {initialData ? "Modify Travel Entry" : "Log New Movement"}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-red-600 cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Origin Country Dropdown Selection Field */}
        <div className="relative" ref={fromRef}>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Leaving From
          </label>
          <input
            type="hidden"
            {...register("fromCountry", {
              required: "Please select your origin country.",
            })}
          />

          <div
            onClick={() => setIsOpenFrom(!isOpenFrom)}
            className={`w-full flex items-center justify-between px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base transition cursor-pointer outline-none ${errors.fromCountry ? "border-red-400 focus-within:ring-red-200" : "border-slate-200 focus-within:ring-blue-500"}`}
          >
            <span className="truncate">{currentFromLabel}</span>
            <FiChevronDown
              className={`text-slate-400 transition-transform duration-200 ${isOpenFrom ? "rotate-180" : ""}`}
            />
          </div>

          {errors.fromCountry && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.fromCountry.message}
            </p>
          )}

          {isOpenFrom && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-hidden flex flex-col">
              <input
                type="text"
                autoFocus
                placeholder="Search origin country..."
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                className="w-full px-3 py-2 border-b border-slate-100 text-base outline-none bg-slate-50/50 text-slate-800 focus:bg-white"
              />
              <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-slate-50">
                {filteredFromCountries.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 italic text-center">
                    No match found
                  </div>
                ) : (
                  filteredFromCountries.map((c) => (
                    <div
                      key={c.code}
                      onClick={() => {
                        setValue("fromCountry", c.code, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setIsOpenFrom(false);
                        setSearchFrom("");
                      }}
                      className={`px-3 py-2 text-base cursor-pointer transition-colors hover:bg-slate-50 ${watchedFromCountry === c.code ? "bg-blue-50/70 font-bold text-blue-600" : "text-slate-700"}`}
                    >
                      {c.name}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Destination Dropdown Selection Field */}
        <div className="relative" ref={toRef}>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Going To
          </label>
          <input
            type="hidden"
            {...register("toCountry", {
              required: "Please select your destination country.",
            })}
          />

          <div
            onClick={() => setIsOpenTo(!isOpenTo)}
            className={`w-full flex items-center justify-between px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base transition cursor-pointer outline-none ${errors.toCountry ? "border-red-400 focus-within:ring-red-200" : "border-slate-200 focus-within:ring-blue-500"}`}
          >
            <span className="truncate">{currentToLabel}</span>
            <FiChevronDown
              className={`text-slate-400 transition-transform duration-200 ${isOpenTo ? "rotate-180" : ""}`}
            />
          </div>

          {errors.toCountry && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.toCountry.message}
            </p>
          )}

          {isOpenTo && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-hidden flex flex-col">
              <input
                type="text"
                autoFocus
                placeholder="Search destination..."
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                className="w-full px-3 py-2 border-b border-slate-100 text-base outline-none bg-slate-50/50 text-slate-800 focus:bg-white"
              />
              <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-slate-50">
                {filteredToCountries.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 italic text-center">
                    No match found
                  </div>
                ) : (
                  filteredToCountries.map((c) => (
                    <div
                      key={c.code}
                      onClick={() => {
                        setValue("toCountry", c.code, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setIsOpenTo(false);
                        setSearchTo("");
                      }}
                      className={`px-3 py-2 text-base cursor-pointer transition-colors hover:bg-slate-50 ${watchedToCountry === c.code ? "bg-blue-50/70 font-bold text-blue-600" : "text-slate-700"}`}
                    >
                      {c.name}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Travel Start Date Picker Component Block */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Travel Start Date
          </label>
          <input
            type="date"
            max={todayStr}
            onKeyDown={(e) => e.preventDefault()}
            {...register("departureDate", {
              required: "Please select your travel start date.",
              validate: {
                noFutureDays: (value) => 
                  value <= todayStr || "Future travel records cannot be logged ahead of time."
              }
            })}
            className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition ${errors.departureDate ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-slate-200 focus:ring-2 focus:ring-blue-500"}`}
          />
          {errors.departureDate && (
            <p className="text-red-500 text-[11px] mt-1 font-medium">
              {errors.departureDate.message}
            </p>
          )}
        </div>

        {/* Travel End Date Picker Component Block */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Travel End Date
          </label>
          <input
            type="date"
            max={todayStr}
            onKeyDown={(e) => e.preventDefault()}
            {...register("arrivalDate", {
              required: "Please select your travel end date.",
              validate: {
                noFutureDays: (value) => 
                  value <= todayStr || "Future travel records cannot be logged ahead of time.",
                chronologicalOrder: (value) => 
                  !watchedDepartureDate || value >= watchedDepartureDate || "Travel end date must be on or after the start date."
              }
            })}
            className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition ${errors.arrivalDate ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-slate-200 focus:ring-2 focus:ring-blue-500"}`}
          />
          {errors.arrivalDate && (
            <p className="text-red-500 text-[11px] mt-1 font-medium">
              {errors.arrivalDate.message}
            </p>
          )}
        </div>

        {/* Reason for Travel Field Block */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Reason for Travel
          </label>
          <input
            type="text"
            {...register("purpose", {
              required: "Please specify the reason for your travel.",
              minLength: {
                value: 3,
                message: "Please enter a valid descriptive travel reason."
              }
            })}
            placeholder="Business, leisure, family emergency..."
            className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition ${errors.purpose ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-slate-200 focus:ring-2 focus:ring-blue-500"}`}
          />
          {errors.purpose && (
            <p className="text-red-500 text-[11px] mt-1 font-medium">
              {errors.purpose.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {initialData ? <FiSave /> : <FiPlus />}
          <span>{initialData ? "Update Record" : "Save Record"}</span>
        </button>
      </div>
    </form>
  );
}




