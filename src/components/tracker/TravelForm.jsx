import { useForm } from "react-hook-form";
import { countries } from "../../utils/countries";
import { FiPlus, FiSave, FiX, FiChevronDown } from "react-icons/fi";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

export default function TravelForm({
  onSubmit,
  initialData,
  onCancel,
  travelRecords = [],
  fyStart,
  fyEnd,
}) {
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

  const todayDateObj = new Date();

  // DYNAMIC PROFILE VALUE EXTRACTION
  let periodStartStr = "";
  let periodEndStr = "";

  if (fyStart && fyEnd) {
    periodStartStr = fyStart.split("T")[0];
    periodEndStr = fyEnd.split("T")[0];
  }

  // Today's actual date string snapshot format
  const todayStr = todayDateObj.toISOString().split("T")[0];

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

  const handleFormValidationSubmit = async (data) => {
    // FY configuration must exist
    if (!periodStartStr || !periodEndStr) {
      toast.error(
        "Financial year configuration is not available. Please refresh and try again."
      );
      return;
    }

    // Top-level block defense check during validation submission runtime
    if (
      data.departureDate < periodStartStr ||
      data.departureDate > periodEndStr ||
      data.arrivalDate < periodStartStr ||
      data.arrivalDate > periodEndStr
    ) {
      toast.error(
        "Selected dates are not in range of the selected period configuration."
      );
      return;
    }

    const newStart = new Date(data.departureDate + "T00:00:00");
    const newEnd = new Date(data.arrivalDate + "T00:00:00");

    // Exact duplicate check (same departure and arrival)
    const isExactDuplicate = travelRecords.some((record) => {
      if (initialData && record.recordId === initialData.recordId) return false;
      if (!record.departureDate || !record.arrivalDate) return false;
      return (
        record.departureDate === data.departureDate &&
        record.arrivalDate === data.arrivalDate
      );
    });

    if (isExactDuplicate) {
      toast.error(
        "A travel record already exists for these dates,if you want to change data can edit in histrory table.",
      );
      return;
    }

    // Existing overlapping check
    const isOverlapping = travelRecords.some((record) => {
      if (initialData && record.recordId === initialData.recordId) return false;
      if (!record.departureDate || !record.arrivalDate) return false;

      const existStart = new Date(record.departureDate + "T00:00:00");
      const existEnd = new Date(record.arrivalDate + "T00:00:00");

      return newStart <= existEnd && newEnd >= existStart;
    });

    if (isOverlapping) {
      toast.error(
        "A travel record already exists within the selected date range.",
      );
      return;
    }

    await onSubmit(data);
  };

  const triggerNativePicker = (e) => {
    if (typeof e.target.showPicker === "function") {
      try {
        e.target.showPicker();
      } catch (err) {
        console.error("Picker interaction error", err);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormValidationSubmit)}
      className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 space-y-4 text-left w-full max-w-full box-border"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
        {/* Origin Country Dropdown Selection Field */}
        <div className="relative min-w-0 w-full" ref={fromRef}>
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
            className={`w-full min-w-0 flex items-center justify-between px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base transition cursor-pointer outline-none ${
              errors.fromCountry
                ? "border-red-400 focus-within:ring-red-200"
                : "border-slate-200 focus-within:ring-blue-500"
            }`}
          >
            <span className="truncate pr-2 block flex-1 text-left">
              {currentFromLabel}
            </span>
            <FiChevronDown
              className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                isOpenFrom ? "rotate-180" : ""
              }`}
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
                      className={`px-3 py-2 text-base cursor-pointer transition-colors hover:bg-slate-50 ${
                        watchedFromCountry === c.code
                          ? "bg-blue-50/70 font-bold text-blue-600"
                          : "text-slate-700"
                      }`}
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
        <div className="relative min-w-0 w-full" ref={toRef}>
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
            className={`w-full min-w-0 flex items-center justify-between px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base transition cursor-pointer outline-none ${
              errors.toCountry
                ? "border-red-400 focus-within:ring-red-200"
                : "border-slate-200 focus-within:ring-blue-500"
            }`}
          >
            <span className="truncate pr-2 block flex-1 text-left">
              {currentToLabel}
            </span>
            <FiChevronDown
              className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                isOpenTo ? "rotate-180" : ""
              }`}
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
                      className={`px-3 py-2 text-base cursor-pointer transition-colors hover:bg-slate-50 ${
                        watchedToCountry === c.code
                          ? "bg-blue-50/70 font-bold text-blue-600"
                          : "text-slate-700"
                      }`}
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
        <div className="min-w-0 w-full flex flex-col">
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Travel Start Date
          </label>
          <input
            type="date"
            min={periodStartStr}
            max={periodEndStr}
            onClick={triggerNativePicker}
            onFocus={triggerNativePicker}
            {...register("departureDate", {
              required: "Please select your travel start date.",
              validate: {
                withinPeriod: (value) =>
                  (value >= periodStartStr && value <= periodEndStr) ||
                  "Not in range of selected period configuration.",
                noFutureDays: (value) =>
                  value <= todayStr ||
                  "Future travel records cannot be logged ahead of time.",
              },
            })}
            className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition placeholder-slate-400 min-h-[42px] h-[42px] flex-none ${
              errors.departureDate
                ? "border-red-400 focus:ring-2 focus:ring-red-200"
                : "border-slate-200 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {errors.departureDate && (
            <p className="text-red-500 text-[11px] mt-1 font-medium">
              {errors.departureDate.message}
            </p>
          )}
        </div>

        {/* Travel End Date Picker Component Block */}
        <div className="min-w-0 w-full flex flex-col">
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Travel End Date
          </label>
          <input
            type="date"
            min={periodStartStr}
            max={periodEndStr}
            onClick={triggerNativePicker}
            onFocus={triggerNativePicker}
            {...register("arrivalDate", {
              required: "Please select your travel end date.",
              validate: {
                withinPeriod: (value) =>
                  (value >= periodStartStr && value <= periodEndStr) ||
                  "Not in range of selected period configuration.",
                noFutureDays: (value) =>
                  value <= todayStr ||
                  "Future travel records cannot be logged ahead of time.",
                chronologicalOrder: (value) =>
                  !watchedDepartureDate ||
                  value >= watchedDepartureDate ||
                  "Travel end date must be on or after the start date.",
              },
            })}
            className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition placeholder-slate-400 min-h-[42px] h-[42px] flex-none ${
              errors.arrivalDate
                ? "border-red-400 focus:ring-2 focus:ring-red-200"
                : "border-slate-200 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {errors.arrivalDate && (
            <p className="text-red-500 text-[11px] mt-1 font-medium">
              {errors.arrivalDate.message}
            </p>
          )}
        </div>

        {/* Reason for Travel Field Block */}
        <div className="sm:col-span-2 min-w-0 w-full">
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Reason for Travel
          </label>
          <input
            type="text"
            {...register("purpose", {
              required: "Please specify the reason for your travel.",
              minLength: {
                value: 3,
                message: "Please enter a valid descriptive travel reason.",
              },
            })}
            placeholder="Business, leisure, family emergency..."
            className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition ${
              errors.purpose
                ? "border-red-400 focus:ring-2 focus:ring-red-200"
                : "border-slate-200 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {errors.purpose && (
            <p className="text-red-500 text-[11px] mt-1 font-medium">
              {errors.purpose.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 w-full">
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

// import { useForm } from "react-hook-form";
// import { countries } from "../../utils/countries";
// import { FiPlus, FiSave, FiX, FiChevronDown } from "react-icons/fi";
// import { useEffect, useState, useRef } from "react";
// import toast from "react-hot-toast";

// export default function TravelForm({
//   onSubmit,
//   initialData,
//   onCancel,
//   travelRecords = [],
//   fyStart,
//   fyEnd,
// }) {
//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//   } = useForm({
//     defaultValues: initialData || {
//       fromCountry: "",
//       toCountry: "",
//       departureDate: "",
//       arrivalDate: "",
//       purpose: "",
//     },
//   });

//   // Dynamic values register tracking hooks
//   const watchedFromCountry = watch("fromCountry");
//   const watchedToCountry = watch("toCountry");
//   const watchedDepartureDate = watch("departureDate");

//   // Search filter options layout state handling mechanisms
//   const [searchFrom, setSearchFrom] = useState("");
//   const [isOpenFrom, setIsOpenFrom] = useState(false);
//   const [searchTo, setSearchTo] = useState("");
//   const [isOpenTo, setIsOpenTo] = useState(false);

//   // References to detect clicks outside dropdown components
//   const fromRef = useRef(null);
//   const toRef = useRef(null);

//   const todayDateObj = new Date();
//   const currentYear = todayDateObj.getFullYear();

//   // DYNAMIC PROFILE VALUE EXTRACTION
//   let periodStartStr = "";
//   let periodEndStr = "";

//   if (fyStart && fyEnd && fyStart.trim() !== "" && fyEnd.trim() !== "") {
//     periodStartStr = fyStart.split("T")[0];
//     periodEndStr = fyEnd.split("T")[0];
//   } else {
//     // Structural default if profile variables are empty
//     periodStartStr = `${currentYear}-01-01`;
//     periodEndStr = `${currentYear}-12-31`;
//   }

//   // Today's actual date string snapshot format
//   const todayStr = todayDateObj.toISOString().split("T")[0];

//   // Dynamic state context tracking validation mechanism
//   useEffect(() => {
//     if (initialData) {
//       reset(initialData);
//     } else {
//       reset({
//         fromCountry: "",
//         toCountry: "",
//         departureDate: "",
//         arrivalDate: "",
//         purpose: "",
//       });
//     }
//   }, [initialData, reset]);

//   // Handle outside clicks to close active search windows
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (fromRef.current && !fromRef.current.contains(event.target))
//         setIsOpenFrom(false);
//       if (toRef.current && !toRef.current.contains(event.target))
//         setIsOpenTo(false);
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Filter countries array list structurally based on search query strings
//   const filteredFromCountries = countries.filter(
//     (c) =>
//       c.name.toLowerCase().includes(searchFrom.toLowerCase()) ||
//       c.code.toLowerCase().includes(searchFrom.toLowerCase()),
//   );

//   const filteredToCountries = countries.filter(
//     (c) =>
//       c.name.toLowerCase().includes(searchTo.toLowerCase()) ||
//       c.code.toLowerCase().includes(searchTo.toLowerCase()),
//   );

//   // Get active text strings for screen layout display indicators
//   const currentFromLabel =
//     countries.find((c) => c.code === watchedFromCountry)?.name ||
//     "Select Origin Country";
//   const currentToLabel =
//     countries.find((c) => c.code === watchedToCountry)?.name ||
//     "Select Destination Country";

//   const handleFormValidationSubmit = async (data) => {
//     // Double-check to ensure dates fall completely within the allowed fiscal limits
//     if (
//       data.departureDate < periodStartStr ||
//       data.departureDate > periodEndStr ||
//       data.arrivalDate < periodStartStr ||
//       data.arrivalDate > periodEndStr
//     ) {
//       toast.error(`Selected dates must be strictly within your configured period (${periodStartStr} to ${periodEndStr}).`);
//       return;
//     }

//     const newStart = new Date(data.departureDate + "T00:00:00");
//     const newEnd = new Date(data.arrivalDate + "T00:00:00");

//     // Exact duplicate check (same departure and arrival)
//     const isExactDuplicate = travelRecords.some((record) => {
//       if (initialData && record.recordId === initialData.recordId) return false;
//       if (!record.departureDate || !record.arrivalDate) return false;
//       return (
//         record.departureDate === data.departureDate &&
//         record.arrivalDate === data.arrivalDate
//       );
//     });

//     if (isExactDuplicate) {
//       toast.error(
//         "A travel record already exists for these dates,if you want to change data can edit in histrory table.",
//       );
//       return;
//     }

//     // Existing overlapping check
//     const isOverlapping = travelRecords.some((record) => {
//       if (initialData && record.recordId === initialData.recordId) return false;
//       if (!record.departureDate || !record.arrivalDate) return false;

//       const existStart = new Date(record.departureDate + "T00:00:00");
//       const existEnd = new Date(record.arrivalDate + "T00:00:00");

//       return newStart <= existEnd && newEnd >= existStart;
//     });

//     if (isOverlapping) {
//       toast.error(
//         "A travel record already exists within the selected date range.",
//       );
//       return;
//     }

//     await onSubmit(data);
//   };

//   const triggerNativePicker = (e) => {
//     if (typeof e.target.showPicker === "function") {
//       try {
//         e.target.showPicker();
//       } catch (err) {
//         console.error("Picker interaction error", err);
//       }
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSubmit(handleFormValidationSubmit)}
//       className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 space-y-4 text-left w-full max-w-full box-border"
//     >
//       <div className="flex items-center justify-between border-b border-slate-100 pb-3">
//         <h3 className="text-base font-bold tracking-tight text-slate-800 uppercase">
//           {initialData ? "Modify Travel Entry" : "Log New Movement"}
//         </h3>
//         {onCancel && (
//           <button
//             type="button"
//             onClick={onCancel}
//             className="text-slate-400 hover:text-red-600 cursor-pointer"
//           >
//             <FiX className="text-lg" />
//           </button>
//         )}
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
//         {/* Origin Country Dropdown Selection Field */}
//         <div className="relative min-w-0 w-full" ref={fromRef}>
//           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
//             Leaving From
//           </label>
//           <input
//             type="hidden"
//             {...register("fromCountry", {
//               required: "Please select your origin country.",
//             })}
//           />

//           <div
//             onClick={() => setIsOpenFrom(!isOpenFrom)}
//             className={`w-full min-w-0 flex items-center justify-between px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base transition cursor-pointer outline-none ${
//               errors.fromCountry
//                 ? "border-red-400 focus-within:ring-red-200"
//                 : "border-slate-200 focus-within:ring-blue-500"
//             }`}
//           >
//             <span className="truncate pr-2 block flex-1 text-left">{currentFromLabel}</span>
//             <FiChevronDown
//               className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
//                 isOpenFrom ? "rotate-180" : ""
//               }`}
//             />
//           </div>

//           {errors.fromCountry && (
//             <p className="text-red-500 text-xs mt-1 font-medium">
//               {errors.fromCountry.message}
//             </p>
//           )}

//           {isOpenFrom && (
//             <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-hidden flex flex-col">
//               <input
//                 type="text"
//                 autoFocus
//                 placeholder="Search origin country..."
//                 value={searchFrom}
//                 onChange={(e) => setSearchFrom(e.target.value)}
//                 className="w-full px-3 py-2 border-b border-slate-100 text-base outline-none bg-slate-50/50 text-slate-800 focus:bg-white"
//               />
//               <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-slate-50">
//                 {filteredFromCountries.length === 0 ? (
//                   <div className="p-3 text-xs text-slate-400 italic text-center">
//                     No match found
//                   </div>
//                 ) : (
//                   filteredFromCountries.map((c) => (
//                     <div
//                       key={c.code}
//                       onClick={() => {
//                         setValue("fromCountry", c.code, {
//                           shouldValidate: true,
//                           shouldDirty: true,
//                         });
//                         setIsOpenFrom(false);
//                         setSearchFrom("");
//                       }}
//                       className={`px-3 py-2 text-base cursor-pointer transition-colors hover:bg-slate-50 ${
//                         watchedFromCountry === c.code
//                           ? "bg-blue-50/70 font-bold text-blue-600"
//                           : "text-slate-700"
//                       }`}
//                     >
//                       {c.name}
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Destination Dropdown Selection Field */}
//         <div className="relative min-w-0 w-full" ref={toRef}>
//           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
//             Going To
//           </label>
//           <input
//             type="hidden"
//             {...register("toCountry", {
//               required: "Please select your destination country.",
//             })}
//           />

//           <div
//             onClick={() => setIsOpenTo(!isOpenTo)}
//             className={`w-full min-w-0 flex items-center justify-between px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base transition cursor-pointer outline-none ${
//               errors.toCountry
//                 ? "border-red-400 focus-within:ring-red-200"
//                 : "border-slate-200 focus-within:ring-blue-500"
//             }`}
//           >
//             <span className="truncate pr-2 block flex-1 text-left">{currentToLabel}</span>
//             <FiChevronDown
//               className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
//                 isOpenTo ? "rotate-180" : ""
//               }`}
//             />
//           </div>

//           {errors.toCountry && (
//             <p className="text-red-500 text-xs mt-1 font-medium">
//               {errors.toCountry.message}
//             </p>
//           )}

//           {isOpenTo && (
//             <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-hidden flex flex-col">
//               <input
//                 type="text"
//                 autoFocus
//                 placeholder="Search destination..."
//                 value={searchTo}
//                 onChange={(e) => setSearchTo(e.target.value)}
//                 className="w-full px-3 py-2 border-b border-slate-100 text-base outline-none bg-slate-50/50 text-slate-800 focus:bg-white"
//               />
//               <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-slate-50">
//                 {filteredToCountries.length === 0 ? (
//                   <div className="p-3 text-xs text-slate-400 italic text-center">
//                     No match found
//                   </div>
//                 ) : (
//                   filteredToCountries.map((c) => (
//                     <div
//                       key={c.code}
//                       onClick={() => {
//                         setValue("toCountry", c.code, {
//                           shouldValidate: true,
//                           shouldDirty: true,
//                         });
//                         setIsOpenTo(false);
//                         setSearchTo("");
//                       }}
//                       className={`px-3 py-2 text-base cursor-pointer transition-colors hover:bg-slate-50 ${
//                         watchedToCountry === c.code
//                           ? "bg-blue-50/70 font-bold text-blue-600"
//                           : "text-slate-700"
//                       }`}
//                     >
//                       {c.name}
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Travel Start Date Picker Component Block */}
//         <div className="min-w-0 w-full flex flex-col">
//           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
//             Travel Start Date
//           </label>
//           <input
//             type="date"
//             min={periodStartStr}
//             max={periodEndStr}
//             onClick={triggerNativePicker}
//             onFocus={triggerNativePicker}
//             {...register("departureDate", {
//               required: "Please select your travel start date.",
//               validate: {
//                 withinPeriod: (value) =>
//                   (value >= periodStartStr && value <= periodEndStr) ||
//                   `Date must be within your configured period (${periodStartStr} to ${periodEndStr}).`,
//                 noFutureDays: (value) =>
//                   value <= todayStr ||
//                   "Future travel records cannot be logged ahead of time.",
//               },
//             })}
//             className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition placeholder-slate-400 h-[42px] ${
//               errors.departureDate
//                 ? "border-red-400 focus:ring-2 focus:ring-red-200"
//                 : "border-slate-200 focus:ring-2 focus:ring-blue-500"
//             }`}
//           />
//           {errors.departureDate && (
//             <p className="text-red-500 text-[11px] mt-1 font-medium">
//               {errors.departureDate.message}
//             </p>
//           )}
//         </div>

//         {/* Travel End Date Picker Component Block */}
//         <div className="min-w-0 w-full flex flex-col">
//           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
//             Travel End Date
//           </label>
//           <input
//             type="date"
//             min={periodStartStr}
//             max={periodEndStr}
//             onClick={triggerNativePicker}
//             onFocus={triggerNativePicker}
//             {...register("arrivalDate", {
//               required: "Please select your travel end date.",
//               validate: {
//                 withinPeriod: (value) =>
//                   (value >= periodStartStr && value <= periodEndStr) ||
//                   `Date must be within your configured period (${periodStartStr} to ${periodEndStr}).`,
//                 noFutureDays: (value) =>
//                   value <= todayStr ||
//                   "Future travel records cannot be logged ahead of time.",
//                 chronologicalOrder: (value) =>
//                   !watchedDepartureDate ||
//                   value >= watchedDepartureDate ||
//                   "Travel end date must be on or after the start date.",
//               },
//             })}
//             className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition placeholder-slate-400 h-[42px] ${
//               errors.arrivalDate
//                 ? "border-red-400 focus:ring-2 focus:ring-red-200"
//                 : "border-slate-200 focus:ring-2 focus:ring-blue-500"
//             }`}
//           />
//           {errors.arrivalDate && (
//             <p className="text-red-500 text-[11px] mt-1 font-medium">
//               {errors.arrivalDate.message}
//             </p>
//           )}
//         </div>

//         {/* Reason for Travel Field Block */}
//         <div className="sm:col-span-2 min-w-0 w-full">
//           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
//             Reason for Travel
//           </label>
//           <input
//             type="text"
//             {...register("purpose", {
//               required: "Please specify the reason for your travel.",
//               minLength: {
//                 value: 3,
//                 message: "Please enter a valid descriptive travel reason.",
//               },
//             })}
//             placeholder="Business, leisure, family emergency..."
//             className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition ${
//               errors.purpose
//                 ? "border-red-400 focus:ring-2 focus:ring-red-200"
//                 : "border-slate-200 focus:ring-2 focus:ring-blue-500"
//             }`}
//           />
//           {errors.purpose && (
//             <p className="text-red-500 text-[11px] mt-1 font-medium">
//               {errors.purpose.message}
//             </p>
//           )}
//         </div>
//       </div>

//       <div className="flex items-center justify-end gap-2 pt-2 w-full">
//         {onCancel && (
//           <button
//             type="button"
//             onClick={onCancel}
//             className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer"
//           >
//             Cancel
//           </button>
//         )}
//         <button
//           type="submit"
//           className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer"
//         >
//           {initialData ? <FiSave /> : <FiPlus />}
//           <span>{initialData ? "Update Record" : "Save Record"}</span>
//         </button>
//       </div>
//     </form>
//   );
// }
// // import { useForm } from "react-hook-form";
// // import { countries } from "../../utils/countries";
// // import { FiPlus, FiSave, FiX, FiChevronDown } from "react-icons/fi";
// // import { useEffect, useState, useRef } from "react";
// // import toast from "react-hot-toast";

// // export default function TravelForm({
// //   onSubmit,
// //   initialData,
// //   onCancel,
// //   travelRecords = [],
// //   fyStart,
// //   fyEnd,
// // }) {
// //   const {
// //     register,
// //     handleSubmit,
// //     reset,
// //     setValue,
// //     watch,
// //     formState: { errors },
// //   } = useForm({
// //     defaultValues: initialData || {
// //       fromCountry: "",
// //       toCountry: "",
// //       departureDate: "",
// //       arrivalDate: "",
// //       purpose: "",
// //     },
// //   });

// //   // Dynamic values register tracking hooks
// //   const watchedFromCountry = watch("fromCountry");
// //   const watchedToCountry = watch("toCountry");
// //   const watchedDepartureDate = watch("departureDate");

// //   // Search filter options layout state handling mechanisms
// //   const [searchFrom, setSearchFrom] = useState("");
// //   const [isOpenFrom, setIsOpenFrom] = useState(false);
// //   const [searchTo, setSearchTo] = useState("");
// //   const [isOpenTo, setIsOpenTo] = useState(false);

// //   // References to detect clicks outside dropdown components
// //   const fromRef = useRef(null);
// //   const toRef = useRef(null);

// //   const todayDateObj = new Date();
// //   const currentYear = todayDateObj.getFullYear();

// //   // Format dates directly from profile configuration props with a bulletproof local calculation fallback
// //   let periodStartStr = `${currentYear - 1}-04-01`;
// //   let periodEndStr = `${currentYear}-03-31`;

// //   if (fyStart && fyEnd && fyStart.trim() !== "" && fyEnd.trim() !== "") {
// //     periodStartStr = fyStart.split("T")[0];
// //     periodEndStr = fyEnd.split("T")[0];
// //   } else {
// //     // Fallback calculation context based on current month position if props are unpopulated
// //     const baseYear = todayDateObj.getMonth() >= 3 ? currentYear : currentYear - 1;
// //     periodStartStr = `${baseYear}-04-01`;
// //     periodEndStr = `${baseYear + 1}-03-31`;
// //   }

// //   // Today's actual date string snapshot format
// //   const todayStr = todayDateObj.toISOString().split("T")[0];

// //   // Dynamic state context tracking validation mechanism
// //   useEffect(() => {
// //     if (initialData) {
// //       reset(initialData);
// //     } else {
// //       reset({
// //         fromCountry: "",
// //         toCountry: "",
// //         departureDate: "",
// //         arrivalDate: "",
// //         purpose: "",
// //       });
// //     }
// //   }, [initialData, reset]);

// //   // Handle outside clicks to close active search windows
// //   useEffect(() => {
// //     function handleClickOutside(event) {
// //       if (fromRef.current && !fromRef.current.contains(event.target))
// //         setIsOpenFrom(false);
// //       if (toRef.current && !toRef.current.contains(event.target))
// //         setIsOpenTo(false);
// //     }
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   // Filter countries array list structurally based on search query strings
// //   const filteredFromCountries = countries.filter(
// //     (c) =>
// //       c.name.toLowerCase().includes(searchFrom.toLowerCase()) ||
// //       c.code.toLowerCase().includes(searchFrom.toLowerCase()),
// //   );

// //   const filteredToCountries = countries.filter(
// //     (c) =>
// //       c.name.toLowerCase().includes(searchTo.toLowerCase()) ||
// //       c.code.toLowerCase().includes(searchTo.toLowerCase()),
// //   );

// //   // Get active text strings for screen layout display indicators
// //   const currentFromLabel =
// //     countries.find((c) => c.code === watchedFromCountry)?.name ||
// //     "Select Origin Country";
// //   const currentToLabel =
// //     countries.find((c) => c.code === watchedToCountry)?.name ||
// //     "Select Destination Country";

// //   const handleFormValidationSubmit = async (data) => {
// //     const newStart = new Date(data.departureDate + "T00:00:00");
// //     const newEnd = new Date(data.arrivalDate + "T00:00:00");

// //     // Exact duplicate check (same departure and arrival)
// //     const isExactDuplicate = travelRecords.some((record) => {
// //       if (initialData && record.recordId === initialData.recordId) return false;
// //       if (!record.departureDate || !record.arrivalDate) return false;
// //       return (
// //         record.departureDate === data.departureDate &&
// //         record.arrivalDate === data.arrivalDate
// //       );
// //     });

// //     if (isExactDuplicate) {
// //       toast.error(
// //         "A travel record already exists for these dates,if you want to change data can edit in histrory table.",
// //       );
// //       return;
// //     }

// //     // Existing overlapping check (preserve prior behavior)
// //     const isOverlapping = travelRecords.some((record) => {
// //       if (initialData && record.recordId === initialData.recordId) return false;
// //       if (!record.departureDate || !record.arrivalDate) return false;

// //       const existStart = new Date(record.departureDate + "T00:00:00");
// //       const existEnd = new Date(record.arrivalDate + "T00:00:00");

// //       return newStart <= existEnd && newEnd >= existStart;
// //     });

// //     if (isOverlapping) {
// //       toast.error(
// //         "A travel record already exists within the selected date range.",
// //       );
// //       return;
// //     }

// //     await onSubmit(data);
// //   };

// //   return (
// //     <form
// //       onSubmit={handleSubmit(handleFormValidationSubmit)}
// //       className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 space-y-4 text-left w-full max-w-full box-border"
// //     >
// //       <div className="flex items-center justify-between border-b border-slate-100 pb-3">
// //         <h3 className="text-base font-bold tracking-tight text-slate-800 uppercase">
// //           {initialData ? "Modify Travel Entry" : "Log New Movement"}
// //         </h3>
// //         {onCancel && (
// //           <button
// //             type="button"
// //             onClick={onCancel}
// //             className="text-slate-400 hover:text-red-600 cursor-pointer"
// //           >
// //             <FiX className="text-lg" />
// //           </button>
// //         )}
// //       </div>

// //       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
// //         {/* Origin Country Dropdown Selection Field */}
// //         <div className="relative min-w-0 w-full" ref={fromRef}>
// //           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
// //             Leaving From
// //           </label>
// //           <input
// //             type="hidden"
// //             {...register("fromCountry", {
// //               required: "Please select your origin country.",
// //             })}
// //           />

// //           <div
// //             onClick={() => setIsOpenFrom(!isOpenFrom)}
// //             className={`w-full min-w-0 flex items-center justify-between px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base transition cursor-pointer outline-none ${
// //               errors.fromCountry
// //                 ? "border-red-400 focus-within:ring-red-200"
// //                 : "border-slate-200 focus-within:ring-blue-500"
// //             }`}
// //           >
// //             <span className="truncate pr-2 block flex-1 text-left">{currentFromLabel}</span>
// //             <FiChevronDown
// //               className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
// //                 isOpenFrom ? "rotate-180" : ""
// //               }`}
// //             />
// //           </div>

// //           {errors.fromCountry && (
// //             <p className="text-red-500 text-xs mt-1 font-medium">
// //               {errors.fromCountry.message}
// //             </p>
// //           )}

// //           {isOpenFrom && (
// //             <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-hidden flex flex-col">
// //               <input
// //                 type="text"
// //                 autoFocus
// //                 placeholder="Search origin country..."
// //                 value={searchFrom}
// //                 onChange={(e) => setSearchFrom(e.target.value)}
// //                 className="w-full px-3 py-2 border-b border-slate-100 text-base outline-none bg-slate-50/50 text-slate-800 focus:bg-white"
// //               />
// //               <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-slate-50">
// //                 {filteredFromCountries.length === 0 ? (
// //                   <div className="p-3 text-xs text-slate-400 italic text-center">
// //                     No match found
// //                   </div>
// //                 ) : (
// //                   filteredFromCountries.map((c) => (
// //                     <div
// //                       key={c.code}
// //                       onClick={() => {
// //                         setValue("fromCountry", c.code, {
// //                           shouldValidate: true,
// //                           shouldDirty: true,
// //                         });
// //                         setIsOpenFrom(false);
// //                         setSearchFrom("");
// //                       }}
// //                       className={`px-3 py-2 text-base cursor-pointer transition-colors hover:bg-slate-50 ${
// //                         watchedFromCountry === c.code
// //                           ? "bg-blue-50/70 font-bold text-blue-600"
// //                           : "text-slate-700"
// //                       }`}
// //                     >
// //                       {c.name}
// //                     </div>
// //                   ))
// //                 )}
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         {/* Destination Dropdown Selection Field */}
// //         <div className="relative min-w-0 w-full" ref={toRef}>
// //           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
// //             Going To
// //           </label>
// //           <input
// //             type="hidden"
// //             {...register("toCountry", {
// //               required: "Please select your destination country.",
// //             })}
// //           />

// //           <div
// //             onClick={() => setIsOpenTo(!isOpenTo)}
// //             className={`w-full min-w-0 flex items-center justify-between px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base transition cursor-pointer outline-none ${
// //               errors.toCountry
// //                 ? "border-red-400 focus-within:ring-red-200"
// //                 : "border-slate-200 focus-within:ring-blue-500"
// //             }`}
// //           >
// //             <span className="truncate pr-2 block flex-1 text-left">{currentToLabel}</span>
// //             <FiChevronDown
// //               className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
// //                 isOpenTo ? "rotate-180" : ""
// //               }`}
// //             />
// //           </div>

// //           {errors.toCountry && (
// //             <p className="text-red-500 text-xs mt-1 font-medium">
// //               {errors.toCountry.message}
// //             </p>
// //           )}

// //           {isOpenTo && (
// //             <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-hidden flex flex-col">
// //               <input
// //                 type="text"
// //                 autoFocus
// //                 placeholder="Search destination..."
// //                 value={searchTo}
// //                 onChange={(e) => setSearchTo(e.target.value)}
// //                 className="w-full px-3 py-2 border-b border-slate-100 text-base outline-none bg-slate-50/50 text-slate-800 focus:bg-white"
// //               />
// //               <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-slate-50">
// //                 {filteredToCountries.length === 0 ? (
// //                   <div className="p-3 text-xs text-slate-400 italic text-center">
// //                     No match found
// //                   </div>
// //                 ) : (
// //                   filteredToCountries.map((c) => (
// //                     <div
// //                       key={c.code}
// //                       onClick={() => {
// //                         setValue("toCountry", c.code, {
// //                           shouldValidate: true,
// //                           shouldDirty: true,
// //                         });
// //                         setIsOpenTo(false);
// //                         setSearchTo("");
// //                       }}
// //                       className={`px-3 py-2 text-base cursor-pointer transition-colors hover:bg-slate-50 ${
// //                         watchedToCountry === c.code
// //                           ? "bg-blue-50/70 font-bold text-blue-600"
// //                           : "text-slate-700"
// //                       }`}
// //                     >
// //                       {c.name}
// //                     </div>
// //                   ))
// //                 )}
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         {/* Travel Start Date Picker Component Block */}
// //         <div className="min-w-0 w-full flex flex-col">
// //           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
// //             Travel Start Date
// //           </label>
// //           <input
// //             type="text"
// //             placeholder="Select Start Date"
// //             onFocus={(e) => (e.target.type = "date")}
// //             onBlur={(e) => {
// //               if (!e.target.value) e.target.type = "text";
// //             }}
// //             min={periodStartStr}
// //             max={periodEndStr}
// //             onKeyDown={(e) => e.preventDefault()}
// //             {...register("departureDate", {
// //               required: "Please select your travel start date.",
// //               validate: {
// //                 withinPeriod: (value) =>
// //                   (value >= periodStartStr && value <= periodEndStr) ||
// //                   `Date must be within your configured period (${periodStartStr} to ${periodEndStr}).`,
// //                 noFutureDays: (value) =>
// //                   value <= todayStr ||
// //                   "Future travel records cannot be logged ahead of time.",
// //               },
// //             })}
// //             className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition placeholder-slate-400 h-[42px] ${
// //               errors.departureDate
// //                 ? "border-red-400 focus:ring-2 focus:ring-red-200"
// //                 : "border-slate-200 focus:ring-2 focus:ring-blue-500"
// //             }`}
// //           />
// //           {errors.departureDate && (
// //             <p className="text-red-500 text-[11px] mt-1 font-medium">
// //               {errors.departureDate.message}
// //             </p>
// //           )}
// //         </div>

// //         {/* Travel End Date Picker Component Block */}
// //         <div className="min-w-0 w-full flex flex-col">
// //           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
// //             Travel End Date
// //           </label>
// //           <input
// //             type="text"
// //             placeholder="Select End Date"
// //             onFocus={(e) => (e.target.type = "date")}
// //             onBlur={(e) => {
// //               if (!e.target.value) e.target.type = "text";
// //             }}
// //             min={periodStartStr}
// //             max={periodEndStr}
// //             onKeyDown={(e) => e.preventDefault()}
// //             {...register("arrivalDate", {
// //               required: "Please select your travel end date.",
// //               validate: {
// //                 withinPeriod: (value) =>
// //                   (value >= periodStartStr && value <= periodEndStr) ||
// //                   `Date must be within your configured period (${periodStartStr} to ${periodEndStr}).`,
// //                 noFutureDays: (value) =>
// //                   value <= todayStr ||
// //                   "Future travel records cannot be logged ahead of time.",
// //                 chronologicalOrder: (value) =>
// //                   !watchedDepartureDate ||
// //                   value >= watchedDepartureDate ||
// //                   "Travel end date must be on or after the start date.",
// //               },
// //             })}
// //             className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition placeholder-slate-400 h-[42px] ${
// //               errors.arrivalDate
// //                 ? "border-red-400 focus:ring-2 focus:ring-red-200"
// //                 : "border-slate-200 focus:ring-2 focus:ring-blue-500"
// //             }`}
// //           />
// //           {errors.arrivalDate && (
// //             <p className="text-red-500 text-[11px] mt-1 font-medium">
// //               {errors.arrivalDate.message}
// //             </p>
// //           )}
// //         </div>

// //         {/* Reason for Travel Field Block */}
// //         <div className="sm:col-span-2 min-w-0 w-full">
// //           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
// //             Reason for Travel
// //           </label>
// //           <input
// //             type="text"
// //             {...register("purpose", {
// //               required: "Please specify the reason for your travel.",
// //               minLength: {
// //                 value: 3,
// //                 message: "Please enter a valid descriptive travel reason.",
// //               },
// //             })}
// //             placeholder="Business, leisure, family emergency..."
// //             className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition ${
// //               errors.purpose
// //                 ? "border-red-400 focus:ring-2 focus:ring-red-200"
// //                 : "border-slate-200 focus:ring-2 focus:ring-blue-500"
// //             }`}
// //           />
// //           {errors.purpose && (
// //             <p className="text-red-500 text-[11px] mt-1 font-medium">
// //               {errors.purpose.message}
// //             </p>
// //           )}
// //         </div>
// //       </div>

// //       <div className="flex items-center justify-end gap-2 pt-2 w-full">
// //         {onCancel && (
// //           <button
// //             type="button"
// //             onClick={onCancel}
// //             className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer"
// //           >
// //             Cancel
// //           </button>
// //         )}
// //         <button
// //           type="submit"
// //           className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer"
// //         >
// //           {initialData ? <FiSave /> : <FiPlus />}
// //           <span>{initialData ? "Update Record" : "Save Record"}</span>
// //         </button>
// //       </div>
// //     </form>
// //   );
// // }
// // // import { useForm } from "react-hook-form";
// // // import { countries } from "../../utils/countries";
// // // import { FiPlus, FiSave, FiX, FiChevronDown } from "react-icons/fi";
// // // import { useEffect, useState, useRef } from "react";
// // // import toast from "react-hot-toast";

// // // export default function TravelForm({
// // //   onSubmit,
// // //   initialData,
// // //   onCancel,
// // //   travelRecords = [],
// // // }) {
// // //   const {
// // //     register,
// // //     handleSubmit,
// // //     reset,
// // //     setValue,
// // //     watch,
// // //     formState: { errors },
// // //   } = useForm({
// // //     defaultValues: initialData || {
// // //       fromCountry: "",
// // //       toCountry: "",
// // //       departureDate: "",
// // //       arrivalDate: "",
// // //       purpose: "",
// // //     },
// // //   });

// // //   // Dynamic values register tracking hooks
// // //   const watchedFromCountry = watch("fromCountry");
// // //   const watchedToCountry = watch("toCountry");
// // //   const watchedDepartureDate = watch("departureDate");

// // //   // Search filter options layout state handling mechanisms
// // //   const [searchFrom, setSearchFrom] = useState("");
// // //   const [isOpenFrom, setIsOpenFrom] = useState(false);
// // //   const [searchTo, setSearchTo] = useState("");
// // //   const [isOpenTo, setIsOpenTo] = useState(false);

// // //   // References to detect clicks outside dropdown components
// // //   const fromRef = useRef(null);
// // //   const toRef = useRef(null);

// // //   // Dynamically calculate the active financial period boundaries based on current system date
// // //   const todayDateObj = new Date();
// // //   const baseFYYear = todayDateObj.getMonth() >= 3
// // //     ? todayDateObj.getFullYear()
// // //     : todayDateObj.getFullYear() - 1;

// // //   const periodStartStr = `${baseFYYear}-04-01`;
// // //   const periodEndStr = `${baseFYYear + 1}-03-31`;

// // //   // Today's actual date string snapshot format
// // //   const todayStr = todayDateObj.toISOString().split("T")[0];

// // //   // Dynamic state context tracking validation mechanism
// // //   useEffect(() => {
// // //     if (initialData) {
// // //       reset(initialData);
// // //     } else {
// // //       reset({
// // //         fromCountry: "",
// // //         toCountry: "",
// // //         departureDate: "",
// // //         arrivalDate: "",
// // //         purpose: "",
// // //       });
// // //     }
// // //   }, [initialData, reset]);

// // //   // Handle outside clicks to close active search windows
// // //   useEffect(() => {
// // //     function handleClickOutside(event) {
// // //       if (fromRef.current && !fromRef.current.contains(event.target))
// // //         setIsOpenFrom(false);
// // //       if (toRef.current && !toRef.current.contains(event.target))
// // //         setIsOpenTo(false);
// // //     }
// // //     document.addEventListener("mousedown", handleClickOutside);
// // //     return () => document.removeEventListener("mousedown", handleClickOutside);
// // //   }, []);

// // //   // Filter countries array list structurally based on search query strings
// // //   const filteredFromCountries = countries.filter(
// // //     (c) =>
// // //       c.name.toLowerCase().includes(searchFrom.toLowerCase()) ||
// // //       c.code.toLowerCase().includes(searchFrom.toLowerCase()),
// // //   );

// // //   const filteredToCountries = countries.filter(
// // //     (c) =>
// // //       c.name.toLowerCase().includes(searchTo.toLowerCase()) ||
// // //       c.code.toLowerCase().includes(searchTo.toLowerCase()),
// // //   );

// // //   // Get active text strings for screen layout display indicators
// // //   const currentFromLabel =
// // //     countries.find((c) => c.code === watchedFromCountry)?.name ||
// // //     "Select Origin Country";
// // //   const currentToLabel =
// // //     countries.find((c) => c.code === watchedToCountry)?.name ||
// // //     "Select Destination Country";

// // //   const handleFormValidationSubmit = async (data) => {
// // //     const newStart = new Date(data.departureDate + "T00:00:00");
// // //     const newEnd = new Date(data.arrivalDate + "T00:00:00");

// // //     // Exact duplicate check (same departure and arrival)
// // //     const isExactDuplicate = travelRecords.some((record) => {
// // //       if (initialData && record.recordId === initialData.recordId) return false;
// // //       if (!record.departureDate || !record.arrivalDate) return false;
// // //       return (
// // //         record.departureDate === data.departureDate &&
// // //         record.arrivalDate === data.arrivalDate
// // //       );
// // //     });

// // //     if (isExactDuplicate) {
// // //       toast.error(
// // //         "A travel record already exists for these dates,if you want to change data can edit in histrory table.",
// // //       );
// // //       return;
// // //     }

// // //     // Existing overlapping check (preserve prior behavior)
// // //     const isOverlapping = travelRecords.some((record) => {
// // //       if (initialData && record.recordId === initialData.recordId) return false;
// // //       if (!record.departureDate || !record.arrivalDate) return false;

// // //       const existStart = new Date(record.departureDate + "T00:00:00");
// // //       const existEnd = new Date(record.arrivalDate + "T00:00:00");

// // //       return newStart <= existEnd && newEnd >= existStart;
// // //     });

// // //     if (isOverlapping) {
// // //       toast.error(
// // //         "A travel record already exists within the selected date range.",
// // //       );
// // //       return;
// // //     }

// // //     await onSubmit(data);
// // //   };

// // //   return (
// // //     <form
// // //       onSubmit={handleSubmit(handleFormValidationSubmit)}
// // //       className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 space-y-4 text-left w-full max-w-full box-border"
// // //     >
// // //       <div className="flex items-center justify-between border-b border-slate-100 pb-3">
// // //         <h3 className="text-base font-bold tracking-tight text-slate-800 uppercase">
// // //           {initialData ? "Modify Travel Entry" : "Log New Movement"}
// // //         </h3>
// // //         {onCancel && (
// // //           <button
// // //             type="button"
// // //             onClick={onCancel}
// // //             className="text-slate-400 hover:text-red-600 cursor-pointer"
// // //           >
// // //             <FiX className="text-lg" />
// // //           </button>
// // //         )}
// // //       </div>

// // //       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
// // //         {/* Origin Country Dropdown Selection Field */}
// // //         <div className="relative min-w-0 w-full" ref={fromRef}>
// // //           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
// // //             Leaving From
// // //           </label>
// // //           <input
// // //             type="hidden"
// // //             {...register("fromCountry", {
// // //               required: "Please select your origin country.",
// // //             })}
// // //           />

// // //           <div
// // //             onClick={() => setIsOpenFrom(!isOpenFrom)}
// // //             className={`w-full min-w-0 flex items-center justify-between px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base transition cursor-pointer outline-none ${
// // //               errors.fromCountry
// // //                 ? "border-red-400 focus-within:ring-red-200"
// // //                 : "border-slate-200 focus-within:ring-blue-500"
// // //             }`}
// // //           >
// // //             <span className="truncate pr-2 block flex-1 text-left">{currentFromLabel}</span>
// // //             <FiChevronDown
// // //               className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
// // //                 isOpenFrom ? "rotate-180" : ""
// // //               }`}
// // //             />
// // //           </div>

// // //           {errors.fromCountry && (
// // //             <p className="text-red-500 text-xs mt-1 font-medium">
// // //               {errors.fromCountry.message}
// // //             </p>
// // //           )}

// // //           {isOpenFrom && (
// // //             <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-hidden flex flex-col">
// // //               <input
// // //                 type="text"
// // //                 autoFocus
// // //                 placeholder="Search origin country..."
// // //                 value={searchFrom}
// // //                 onChange={(e) => setSearchFrom(e.target.value)}
// // //                 className="w-full px-3 py-2 border-b border-slate-100 text-base outline-none bg-slate-50/50 text-slate-800 focus:bg-white"
// // //               />
// // //               <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-slate-50">
// // //                 {filteredFromCountries.length === 0 ? (
// // //                   <div className="p-3 text-xs text-slate-400 italic text-center">
// // //                     No match found
// // //                   </div>
// // //                 ) : (
// // //                   filteredFromCountries.map((c) => (
// // //                     <div
// // //                       key={c.code}
// // //                       onClick={() => {
// // //                         setValue("fromCountry", c.code, {
// // //                           shouldValidate: true,
// // //                           shouldDirty: true,
// // //                         });
// // //                         setIsOpenFrom(false);
// // //                         setSearchFrom("");
// // //                       }}
// // //                       className={`px-3 py-2 text-base cursor-pointer transition-colors hover:bg-slate-50 ${
// // //                         watchedFromCountry === c.code
// // //                           ? "bg-blue-50/70 font-bold text-blue-600"
// // //                           : "text-slate-700"
// // //                       }`}
// // //                     >
// // //                       {c.name}
// // //                     </div>
// // //                   ))
// // //                 )}
// // //               </div>
// // //             </div>
// // //           )}
// // //         </div>

// // //         {/* Destination Dropdown Selection Field */}
// // //         <div className="relative min-w-0 w-full" ref={toRef}>
// // //           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
// // //             Going To
// // //           </label>
// // //           <input
// // //             type="hidden"
// // //             {...register("toCountry", {
// // //               required: "Please select your destination country.",
// // //             })}
// // //           />

// // //           <div
// // //             onClick={() => setIsOpenTo(!isOpenTo)}
// // //             className={`w-full min-w-0 flex items-center justify-between px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base transition cursor-pointer outline-none ${
// // //               errors.toCountry
// // //                 ? "border-red-400 focus-within:ring-red-200"
// // //                 : "border-slate-200 focus-within:ring-blue-500"
// // //             }`}
// // //           >
// // //             <span className="truncate pr-2 block flex-1 text-left">{currentToLabel}</span>
// // //             <FiChevronDown
// // //               className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
// // //                 isOpenTo ? "rotate-180" : ""
// // //               }`}
// // //             />
// // //           </div>

// // //           {errors.toCountry && (
// // //             <p className="text-red-500 text-xs mt-1 font-medium">
// // //               {errors.toCountry.message}
// // //             </p>
// // //           )}

// // //           {isOpenTo && (
// // //             <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-hidden flex flex-col">
// // //               <input
// // //                 type="text"
// // //                 autoFocus
// // //                 placeholder="Search destination..."
// // //                 value={searchTo}
// // //                 onChange={(e) => setSearchTo(e.target.value)}
// // //                 className="w-full px-3 py-2 border-b border-slate-100 text-base outline-none bg-slate-50/50 text-slate-800 focus:bg-white"
// // //               />
// // //               <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-slate-50">
// // //                 {filteredToCountries.length === 0 ? (
// // //                   <div className="p-3 text-xs text-slate-400 italic text-center">
// // //                     No match found
// // //                   </div>
// // //                 ) : (
// // //                   filteredToCountries.map((c) => (
// // //                     <div
// // //                       key={c.code}
// // //                       onClick={() => {
// // //                         setValue("toCountry", c.code, {
// // //                           shouldValidate: true,
// // //                           shouldDirty: true,
// // //                         });
// // //                         setIsOpenTo(false);
// // //                         setSearchTo("");
// // //                       }}
// // //                       className={`px-3 py-2 text-base cursor-pointer transition-colors hover:bg-slate-50 ${
// // //                         watchedToCountry === c.code
// // //                           ? "bg-blue-50/70 font-bold text-blue-600"
// // //                           : "text-slate-700"
// // //                       }`}
// // //                     >
// // //                       {c.name}
// // //                     </div>
// // //                   ))
// // //                 )}
// // //               </div>
// // //             </div>
// // //           )}
// // //         </div>

// // //         {/* Travel Start Date Picker Component Block */}
// // //         <div className="min-w-0 w-full flex flex-col">
// // //           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
// // //             Travel Start Date
// // //           </label>
// // //           <input
// // //             type="text"
// // //             placeholder="Select Start Date"
// // //             onFocus={(e) => (e.target.type = "date")}
// // //             onBlur={(e) => {
// // //               if (!e.target.value) e.target.type = "text";
// // //             }}
// // //             min={periodStartStr}
// // //             max={periodEndStr}
// // //             onKeyDown={(e) => e.preventDefault()}
// // //             {...register("departureDate", {
// // //               required: "Please select your travel start date.",
// // //               validate: {
// // //                 withinPeriod: (value) =>
// // //                   (value >= periodStartStr && value <= periodEndStr) ||
// // //                   "Date must be within selected threshold period.",
// // //                 noFutureDays: (value) =>
// // //                   value <= todayStr ||
// // //                   "Future travel records cannot be logged ahead of time.",
// // //               },
// // //             })}
// // //             className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition placeholder-slate-400 h-[42px] ${
// // //               errors.departureDate
// // //                 ? "border-red-400 focus:ring-2 focus:ring-red-200"
// // //                 : "border-slate-200 focus:ring-2 focus:ring-blue-500"
// // //             }`}
// // //           />
// // //           {errors.departureDate && (
// // //             <p className="text-red-500 text-[11px] mt-1 font-medium">
// // //               {errors.departureDate.message}
// // //             </p>
// // //           )}
// // //         </div>

// // //         {/* Travel End Date Picker Component Block */}
// // //         <div className="min-w-0 w-full flex flex-col">
// // //           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
// // //             Travel End Date
// // //           </label>
// // //           <input
// // //             type="text"
// // //             placeholder="Select End Date"
// // //             onFocus={(e) => (e.target.type = "date")}
// // //             onBlur={(e) => {
// // //               if (!e.target.value) e.target.type = "text";
// // //             }}
// // //             min={periodStartStr}
// // //             max={periodEndStr}
// // //             onKeyDown={(e) => e.preventDefault()}
// // //             {...register("arrivalDate", {
// // //               required: "Please select your travel end date.",
// // //               validate: {
// // //                 withinPeriod: (value) =>
// // //                   (value >= periodStartStr && value <= periodEndStr) ||
// // //                   "Date must be within selected threshold period",
// // //                 noFutureDays: (value) =>
// // //                   value <= todayStr ||
// // //                   "Future travel records cannot be logged ahead of time.",
// // //                 chronologicalOrder: (value) =>
// // //                   !watchedDepartureDate ||
// // //                   value >= watchedDepartureDate ||
// // //                   "Travel end date must be on or after the start date.",
// // //               },
// // //             })}
// // //             className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition placeholder-slate-400 h-[42px] ${
// // //               errors.arrivalDate
// // //                 ? "border-red-400 focus:ring-2 focus:ring-red-200"
// // //                 : "border-slate-200 focus:ring-2 focus:ring-blue-500"
// // //             }`}
// // //           />
// // //           {errors.arrivalDate && (
// // //             <p className="text-red-500 text-[11px] mt-1 font-medium">
// // //               {errors.arrivalDate.message}
// // //             </p>
// // //           )}
// // //         </div>

// // //         {/* Reason for Travel Field Block */}
// // //         <div className="sm:col-span-2 min-w-0 w-full">
// // //           <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
// // //             Reason for Travel
// // //           </label>
// // //           <input
// // //             type="text"
// // //             {...register("purpose", {
// // //               required: "Please specify the reason for your travel.",
// // //               minLength: {
// // //                 value: 3,
// // //                 message: "Please enter a valid descriptive travel reason.",
// // //               },
// // //             })}
// // //             placeholder="Business, leisure, family emergency..."
// // //             className={`w-full px-3 py-2 bg-slate-50 border text-slate-900 rounded-lg text-base focus:bg-white outline-none transition ${
// // //               errors.purpose
// // //                 ? "border-red-400 focus:ring-2 focus:ring-red-200"
// // //                 : "border-slate-200 focus:ring-2 focus:ring-blue-500"
// // //             }`}
// // //           />
// // //           {errors.purpose && (
// // //             <p className="text-red-500 text-[11px] mt-1 font-medium">
// // //               {errors.purpose.message}
// // //             </p>
// // //           )}
// // //         </div>
// // //       </div>

// // //       <div className="flex items-center justify-end gap-2 pt-2 w-full">
// // //         {onCancel && (
// // //           <button
// // //             type="button"
// // //             onClick={onCancel}
// // //             className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer"
// // //           >
// // //             Cancel
// // //           </button>
// // //         )}
// // //         <button
// // //           type="submit"
// // //           className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer"
// // //         >
// // //           {initialData ? <FiSave /> : <FiPlus />}
// // //           <span>{initialData ? "Update Record" : "Save Record"}</span>
// // //         </button>
// // //       </div>
// // //     </form>
// // //   );
// // // }
