// import { useForm } from "react-hook-form";
// import { useNavigate, Link } from "react-router-dom";
// import toast from "react-hot-toast";
// import { registerUser } from "../firebase/authService";
// import { countries } from "../utils/countries";
// import { timezones, getTimezoneByCountry } from "../utils/timezoneList";
// import { GLOBAL_MONTHS, getDaysInMonth } from "../utils/dateHelpers"; // Shared imports
// import { useState, useRef, useEffect } from "react";
// import { BiLoaderAlt } from "react-icons/bi";
// import { FiSearch, FiChevronDown } from "react-icons/fi";
// import { FiEye, FiEyeOff } from "react-icons/fi";
// import backgroundimg from "../assets/registerpageimg.jpg";

// export default function Register() {
//   const {
//     register,
//     handleSubmit,
//     watch,
//     setValue,
//     formState: { errors, touchedFields },
//   } = useForm({
//     mode: "onChange",
//     reValidateMode: "onChange",
//     defaultValues: {
//       timezone: "",
//       homeCountry: "",
//       residencyThreshold: "",
//       residencyPeriodStart: "",
//       residencyPeriodEnd: "",
//     },
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   // Watch values for inline validation and calculation criteria mapping
//   const periodStartValue = watch("residencyPeriodStart");
//   const passwordValue = watch("password");
//   const selectedCountryCode = watch("homeCountry");
//   const selectedTimezoneValue = watch("timezone");

//   // Searchable Dropdown States
//   const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
//   const [countrySearchQuery, setCountrySearchQuery] = useState("");
//   const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);
//   const [timezoneSearchQuery, setTimezoneSearchQuery] = useState("");

//   const countryRef = useRef(null);
//   const timezoneRef = useRef(null);

//   // Month-Day Custom Picker Local States
//   const currentYear = new Date().getFullYear(); // Fresh tracking per calendar year
//   const [startMonth, setStartMonth] = useState("01");
//   const [startDay, setStartDay] = useState("01");
//   const [endMonth, setEndMonth] = useState("12");
//   const [endDay, setEndDay] = useState("31");
//   const [endTouched, setEndTouched] = useState(false);
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);
//   // Sync Start Month/Day custom state to React Hook Form text strings
//   useEffect(() => {
//     if (startMonth && startDay) {
//       setValue(
//         "residencyPeriodStart",
//         `${currentYear}-${startMonth}-${startDay}`,
//         { shouldValidate: true },
//       );
//     }
//   }, [startMonth, startDay, setValue, currentYear]);

//   // Sync End Month/Day custom state to React Hook Form text strings
//   useEffect(() => {
//     if (endMonth && endDay) {
//       setValue("residencyPeriodEnd", `${currentYear}-${endMonth}-${endDay}`, {
//         shouldValidate: true,
//       });
//     }
//   }, [endMonth, endDay, setValue, currentYear]);

//   // Close dropdowns on outside clicks
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (countryRef.current && !countryRef.current.contains(event.target)) {
//         setCountryDropdownOpen(false);
//       }
//       if (timezoneRef.current && !timezoneRef.current.contains(event.target)) {
//         setTimezoneDropdownOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Filter systems dynamically based on input match conditions
//   const filteredCountries = countries.filter((c) => {
//     const query = countrySearchQuery.toLowerCase().trim();
//     return (
//       c.name.toLowerCase().includes(query) ||
//       c.code.toLowerCase().includes(query)
//     );
//   });

//   const filteredTimezones = timezones.filter((t) => {
//     const query = timezoneSearchQuery.toLowerCase().trim();
//     return (
//       t.label.toLowerCase().includes(query) ||
//       t.value.toLowerCase().includes(query)
//     );
//   });

//   const currentCountryName =
//     countries.find((c) => c.code === selectedCountryCode)?.name ||
//     "Select Country";
//   const currentTimezoneLabel =
//     timezones.find((t) => t.value === selectedTimezoneValue)?.label ||
//     "Select Timezone";

//   // Timezone macro mapping configuration rules
//   const handleCountrySelect = (countryCode) => {
//     setValue("homeCountry", countryCode);
//     setCountryDropdownOpen(false);
//     setCountrySearchQuery("");

//     const detectedTimezone = getTimezoneByCountry(countryCode);

//     if (detectedTimezone) {
//       setValue("timezone", detectedTimezone, {
//         shouldValidate: true,
//       });
//     }
//   };

//   const handleTimezoneSelect = (tzValue) => {
//     setValue("timezone", tzValue);
//     setTimezoneDropdownOpen(false);
//     setTimezoneSearchQuery("");
//   };

//   const onSubmit = async (data) => {
//     setLoading(true);
//     try {
//       await registerUser(data.email, data.password, {
//         homeCountry: data.homeCountry,
//         timezone: data.timezone,
//         residencyThreshold: parseInt(data.residencyThreshold, 10),
//         residencyPeriodStart: data.residencyPeriodStart,
//         residencyPeriodEnd: data.residencyPeriodEnd,
//         nativeCountry: data.homeCountry,
//       });
//       toast.success("Account created successfully! Please sign in.");
//       navigate("/login");
//     } catch (error) {
//       switch (error.code) {
//         case "auth/email-already-in-use":
//           toast.error("An account with this email already exists");
//           break;
//         case "auth/invalid-email":
//           toast.error("Please enter a valid email address");
//           break;
//         case "auth/weak-password":
//           toast.error("Password is too weak");
//           break;
//         default:
//           toast.error("Registration failed. Please try again");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-white">
//       {/* LEFT SIDE: Registration Form Panel */}
//       <div className="flex flex-col justify-center w-full px-8 md:w-1/2 lg:px-16 py-12 max-h-screen overflow-y-auto no-scrollbar">
//         <div className="w-full max-w-xl mx-auto">
//           <div className="mb-5 mt-20">
//             <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 bg-clip-text text-transparent sm:text-4xl">
//               Create Your Account
//             </h2>
//             <p className="mt-2 text-base text-slate-500 font-medium">
//               Track Your Stay Days Easily
//             </p>
//           </div>

//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//             {/* Section 1 */}
//             <div className="space-y-4">
//               <div className="inline-block">
//                 <h3 className="text-base font-bold uppercase tracking-wider text-[#2B4593]">
//                   1. Account Details
//                 </h3>
//               </div>

//               <div>
//                 <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
//                   Email Address
//                 </label>
//                 <input
//                   type="email"
//                   {...register("email", {
//                     required: "Email address is required",
//                     pattern: {
//                       value:
//                         /^[a-z0-9._%+-]+@[a-z]+([.-]?[a-z]+)*\.[a-z]{2,}$/i,
//                       message:
//                         "Please enter a valid email address (e.g. user@gmail.com or user@companyname.io)",
//                     },
//                   })}
//                   className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
//                   placeholder="name@example.com"
//                 />
//                 {errors.email && (
//                   <p className="text-red-500 text-base mt-1">
//                     {errors.email.message}
//                   </p>
//                 )}
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
//                     Password
//                   </label>
//                   <div className="relative">
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       autoComplete="new-password"
//                       {...register("password", {
//                         required: "Password is required",
//                         minLength: {
//                           value: 8,
//                           message:
//                             "Password must be at least 8 characters long",
//                         },
//                         pattern: {
//                           value:
//                             /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
//                           message:
//                             "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
//                         },
//                       })}
//                       className="w-full px-4 py-2 pr-12 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
//                       placeholder="••••••••"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 cursor-pointer z-10"
//                     >
//                       {showPassword ? (
//                         <FiEyeOff size={18} />
//                       ) : (
//                         <FiEye size={18} />
//                       )}
//                     </button>
//                   </div>
//                   {errors.password && (
//                     <p className="text-red-500 text-base mt-1">
//                       {errors.password.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
//                     Confirm Password
//                   </label>
//                   <div className="relative">
//                     <input
//                       type={showConfirmPassword ? "text" : "password"}
//                       autoComplete="new-password"
//                       {...register("confirmPassword", {
//                         required: "Please confirm your password",
//                         validate: (v) =>
//                           v === passwordValue || "Passwords do not match",
//                       })}
//                       className="w-full px-4 py-2 pr-12 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
//                       placeholder="••••••••"
//                     />
//                     <button
//                       type="button"
//                       onClick={() =>
//                         setShowConfirmPassword(!showConfirmPassword)
//                       }
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 cursor-pointer z-10"
//                     >
//                       {showConfirmPassword ? (
//                         <FiEyeOff size={18} />
//                       ) : (
//                         <FiEye size={18} />
//                       )}
//                     </button>
//                   </div>
//                   {errors.confirmPassword && touchedFields.confirmPassword && (
//                     <p className="text-red-500 text-base mt-1">
//                       {errors.confirmPassword.message}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Section 2 */}
//             <div className="space-y-4">
//               <div>
//                 <h3 className="text-base font-bold uppercase tracking-wider text-[#2B4593]">
//                   2. Residency Settings
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                 {/* SEARCHABLE COUNTRY SELECT DROPDOWN */}
//                 <div className="relative" ref={countryRef}>
//                   <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
//                     Your Home Country
//                   </label>
//                   <div
//                     onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
//                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base flex items-center justify-between cursor-pointer hover:bg-white transition"
//                   >
//                     <span className="truncate">{currentCountryName}</span>
//                     <FiChevronDown
//                       className={`text-slate-400 transition-transform duration-200 ${countryDropdownOpen ? "rotate-180" : ""}`}
//                     />
//                   </div>

//                   {countryDropdownOpen && (
//                     <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col">
//                       <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
//                         <FiSearch className="text-slate-400 shrink-0 ml-1" />
//                         <input
//                           type="text"
//                           value={countrySearchQuery}
//                           onChange={(e) =>
//                             setCountrySearchQuery(e.target.value)
//                           }
//                           placeholder="Search country..."
//                           className="w-full bg-transparent border-none outline-none text-[16px] text-slate-900 py-1"
//                           // className="w-full bg-transparent border-none outline-none text-base text-slate-900 py-1"
//                           autoFocus
//                         />
//                       </div>
//                       <div className="overflow-y-auto flex-1 no-scrollbar">
//                         {filteredCountries.length === 0 ? (
//                           <div className="px-4 py-3 text-base text-slate-400 italic text-center">
//                             No countries matched
//                           </div>
//                         ) : (
//                           filteredCountries.map((c) => (
//                             <div
//                               key={c.code}
//                               onClick={() => handleCountrySelect(c.code)}
//                               className={`px-4 py-2 text-base text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer flex items-center justify-between ${selectedCountryCode === c.code ? "bg-slate-100 font-bold text-slate-900" : ""}`}
//                             >
//                               <span className="truncate">{c.name}</span>
//                               <span className="text-slate-400 uppercase text-[10px] font-mono font-medium">
//                                 {c.code}
//                               </span>
//                             </div>
//                           ))
//                         )}
//                       </div>
//                     </div>
//                   )}
//                   <input
//                     type="hidden"
//                     {...register("homeCountry", {
//                       required: "Home Country is required",
//                     })}
//                   />
//                   {errors.homeCountry && (
//                     <p className="text-red-500 text-base mt-1">
//                       {errors.homeCountry.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
//                     Minimum Days Required
//                   </label>
//                   <input
//                     type="number"
//                     placeholder="183"
//                     {...register("residencyThreshold", {
//                       required: "Residency threshold is required",
//                       min: { value: 1, message: "Must be greater than 0" },
//                       max: { value: 365, message: "Cannot exceed 365 days" },
//                     })}
//                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
//                   />
//                   {errors.residencyThreshold && (
//                     <p className="text-red-500 text-base mt-1">
//                       {errors.residencyThreshold.message}
//                     </p>
//                   )}
//                 </div>

//                 {/* SEARCHABLE TIMEZONE SELECT DROPDOWN */}
//                 <div className="relative" ref={timezoneRef}>
//                   <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
//                     Your Time Zone
//                   </label>
//                   <div
//                     onClick={() =>
//                       setTimezoneDropdownOpen(!timezoneDropdownOpen)
//                     }
//                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base flex items-center justify-between cursor-pointer hover:bg-white transition"
//                   >
//                     <span className="truncate">{currentTimezoneLabel}</span>
//                     <FiChevronDown
//                       className={`text-slate-400 transition-transform duration-200 ${timezoneDropdownOpen ? "rotate-180" : ""}`}
//                     />
//                   </div>

//                   {timezoneDropdownOpen && (
//                     <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col">
//                       <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
//                         <FiSearch className="text-slate-400 shrink-0 ml-1" />
//                         <input
//                           type="text"
//                           value={timezoneSearchQuery}
//                           onChange={(e) =>
//                             setTimezoneSearchQuery(e.target.value)
//                           }
//                           placeholder="Search timezone..."
//                           className="w-full bg-transparent border-none outline-none text-[16px] text-slate-900 py-1"
//                           autoFocus
//                         />
//                       </div>
//                       <div className="overflow-y-auto flex-1 no-scrollbar">
//                         {filteredTimezones.length === 0 ? (
//                           <div className="px-4 py-3 text-[16px] text-slate-400 italic text-center">
//                             No timezones matched
//                           </div>
//                         ) : (
//                           filteredTimezones.map((t) => (
//                             <div
//                               key={t.value}
//                               onClick={() => handleTimezoneSelect(t.value)}
//                               className={`px-4 py-2 text-[16px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer flex items-center justify-between ${selectedTimezoneValue === t.value ? "bg-slate-100 font-bold text-slate-900" : ""}`}
//                             >
//                               <span className="truncate">{t.label}</span>
//                             </div>
//                           ))
//                         )}
//                       </div>
//                     </div>
//                   )}
//                   <input
//                     type="hidden"
//                     {...register("timezone", {
//                       required: "Timezone is required",
//                     })}
//                   />
//                   {errors.timezone && (
//                     <p className="text-red-500 text-base mt-1">
//                       {errors.timezone.message}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Section 3: Refactored Day-Month Range Pickers */}
//             <div className="space-y-4">
//               <div>
//                 <h3 className="text-base font-bold uppercase tracking-wider text-[#2B4593]">
//                   3. Residency Period
//                 </h3>
//               </div>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 {/* Start Date Selection Panel */}
//                 <div>
//                   <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
//                     Start (Month & Day)
//                   </label>
//                   <div className="flex gap-2">
//                     <select
//                       value={startMonth}
//                       onChange={(e) => setStartMonth(e.target.value)}
//                       className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
//                     >
//                       {GLOBAL_MONTHS.map((m) => (
//                         <option key={m.value} value={m.value}>
//                           {m.label}
//                         </option>
//                       ))}
//                     </select>
//                     <select
//                       value={startDay}
//                       onChange={(e) => setStartDay(e.target.value)}
//                       className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
//                     >
//                       {getDaysInMonth(startMonth).map((d) => (
//                         <option key={d} value={d}>
//                           {d}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <input
//                     type="hidden"
//                     {...register("residencyPeriodStart", {
//                       required: "Start Date is required",
//                     })}
//                   />
//                   {errors.residencyPeriodStart && (
//                     <p className="text-red-500 text-base mt-1">
//                       {errors.residencyPeriodStart.message}
//                     </p>
//                   )}
//                 </div>

//                 {/* End Date Selection Panel */}
//                 <div>
//                   <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
//                     End (Month & Day)
//                   </label>
//                   <div className="flex gap-2">
//                     <select
//                       value={endMonth}
//                       onChange={(e) => {
//                         setEndMonth(e.target.value);
//                         setEndTouched(true);
//                       }}
//                       className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
//                     >
//                       {GLOBAL_MONTHS.map((m) => (
//                         <option key={m.value} value={m.value}>
//                           {m.label}
//                         </option>
//                       ))}
//                     </select>
//                     <select
//                       value={endDay}
//                       onChange={(e) => {
//                         setEndDay(e.target.value);
//                         setEndTouched(true);
//                       }}
//                       className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
//                     >
//                       {getDaysInMonth(endMonth).map((d) => (
//                         <option key={d} value={d}>
//                           {d}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <input
//                     type="hidden"
//                     {...register("residencyPeriodEnd", {
//                       required: "End Date is required",
//                       validate: {
//                         afterStart: (v) =>
//                           new Date(v) > new Date(periodStartValue) ||
//                           "End date must be after the start date",
//                       },
//                     })}
//                   />
//                   {errors.residencyPeriodEnd &&
//                     (touchedFields.residencyPeriodEnd || endTouched) && (
//                       <p className="text-red-500 text-base mt-1">
//                         {errors.residencyPeriodEnd.message}
//                       </p>
//                     )}
//                 </div>
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-3.5 rounded-md font-semibold text-base text-white bg-gradient-to-r from-blue-600 via-rose-500 to-purple-600 hover:bg-gradient-to-r hover:from-blue-700 hover:via-rose-600 hover:to-purple-700 transition-all duration-300 shadow-lg disabled:opacity-50 flex items-center justify-center cursor-pointer"
//             >
//               {loading ? (
//                 <BiLoaderAlt className="animate-spin mr-2 text-xl" />
//               ) : (
//                 "Create Account"
//               )}
//             </button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-base text-gray-400">
//               Already have an account?{" "}
//               <Link
//                 to="/login"
//                 className="text-blue-700 font-medium hover:underline"
//               >
//                 Sign In
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* RIGHT SIDE: Split-screen Image and Mask Overlay Restored */}
//       <div className="hidden md:block md:w-1/2 relative">
//         <img
//           src={backgroundimg}
//           className="absolute inset-0 w-full h-full object-cover"
//           alt="Residency Management"
//         />

//         <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-purple-700/60 to-red-700/60 flex flex-col justify-center px-16 text-white">
//           <h2 className="text-3xl font-semibold leading-tight max-w-md">
//             Track Your <span className="text-yellow-400">Global Stays</span>
//           </h2>

//           <p className="mt-4 text-lg text-white/90 max-w-md leading-relaxed">
//             Monitor your travel history, stay days, and residency status across
//             countries—all from one simple dashboard.
//           </p>

//           <div className="flex gap-2 mt-12">
//             <div className="h-1.5 w-8 bg-yellow-500 rounded-full"></div>
//             <div className="h-1.5 w-8 bg-white/40 rounded-full"></div>
//             <div className="h-1.5 w-8 bg-white/40 rounded-full"></div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { registerUser } from "../firebase/authService";
import { countries } from "../utils/countries";
import { timezones, getTimezoneByCountry } from "../utils/timezoneList";
import {
  GLOBAL_MONTHS,
  getDaysInMonth,
  FINANCIAL_YEARS_BY_COUNTRY,
} from "../utils/dateHelpers";
import { useState, useRef, useEffect } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import { FiEye, FiEyeOff } from "react-icons/fi";
import backgroundimg from "../assets/registerpageimg.jpg";

export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, touchedFields },
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      timezone: "",
      homeCountry: "",
      residencyThreshold: "183", // Default set to 183
      residencyPeriodStart: "",
      residencyPeriodEnd: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Watch form fields
  const periodStartValue = watch("residencyPeriodStart");
  const passwordValue = watch("password");
  const selectedCountryCode = watch("homeCountry");
  const selectedTimezoneValue = watch("timezone");

  // Dropdown UI states
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);
  const [timezoneSearchQuery, setTimezoneSearchQuery] = useState("");

  const countryRef = useRef(null);
  const timezoneRef = useRef(null);

  // Picker dates local state tracking
  const startYear = new Date().getFullYear();
  const [startMonth, setStartMonth] = useState("01");
  const [startDay, setStartDay] = useState("01");
  const [endMonth, setEndMonth] = useState("12");
  const [endDay, setEndDay] = useState("31");
  const [endTouched, setEndTouched] = useState(false);

  // Compute End Year dynamically based on Cross-Year financial cycles
  const endYear =
    Number(endMonth) < Number(startMonth) ? startYear + 1 : startYear;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync Start Selection Picker to Form Object
  useEffect(() => {
    if (startMonth && startDay) {
      setValue(
        "residencyPeriodStart",
        `${startYear}-${startMonth}-${startDay}`,
        { shouldValidate: true },
      );
    }
  }, [startMonth, startDay, setValue, startYear]);

  // Sync End Selection Picker to Form Object (with matching context year shift)
  useEffect(() => {
    if (endMonth && endDay) {
      setValue("residencyPeriodEnd", `${endYear}-${endMonth}-${endDay}`, {
        shouldValidate: true,
      });
    }
  }, [endMonth, endDay, setValue, endYear]);

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

  const filteredCountries = countries.filter((c) => {
    const query = countrySearchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(query) ||
      c.code.toLowerCase().includes(query)
    );
  });

  const filteredTimezones = timezones.filter((t) => {
    const query = timezoneSearchQuery.toLowerCase().trim();
    return (
      t.label.toLowerCase().includes(query) ||
      t.value.toLowerCase().includes(query)
    );
  });

  const currentCountryName =
    countries.find((c) => c.code === selectedCountryCode)?.name ||
    "Select Country";
  const currentTimezoneLabel =
    timezones.find((t) => t.value === selectedTimezoneValue)?.label ||
    "Select Timezone";

  // Country interaction updates selectors immediately
  const handleCountrySelect = (countryCode) => {
    setValue("homeCountry", countryCode, { shouldValidate: true });
    setCountryDropdownOpen(false);
    setCountrySearchQuery("");

    const detectedTimezone = getTimezoneByCountry(countryCode);
    if (detectedTimezone) {
      setValue("timezone", detectedTimezone, { shouldValidate: true });
    }

    const fyDates = FINANCIAL_YEARS_BY_COUNTRY?.[countryCode.toUpperCase()] ||
      FINANCIAL_YEARS_BY_COUNTRY?.["DEFAULT"] || {
        startMonth: "01",
        startDay: "01",
        endMonth: "12",
        endDay: "31",
      };

    setStartMonth(fyDates.startMonth);
    setStartDay(fyDates.startDay);
    setEndMonth(fyDates.endMonth);
    setEndDay(fyDates.endDay);

    const calculatedEndYear =
      Number(fyDates.endMonth) < Number(fyDates.startMonth)
        ? startYear + 1
        : startYear;

    setValue(
      "residencyPeriodStart",
      `${startYear}-${fyDates.startMonth}-${fyDates.startDay}`,
      { shouldValidate: true },
    );
    setValue(
      "residencyPeriodEnd",
      `${calculatedEndYear}-${fyDates.endMonth}-${fyDates.endDay}`,
      { shouldValidate: true },
    );
  };

  const handleTimezoneSelect = (tzValue) => {
    setValue("timezone", tzValue, { shouldValidate: true });
    setTimezoneDropdownOpen(false);
    setTimezoneSearchQuery("");
  };

 const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, {
        homeCountry: data.homeCountry,
        nativeCountry: data.homeCountry,
        timezone: data.timezone,
        residencyThreshold: parseInt(data.residencyThreshold, 10),
        residencyPeriodStart: data.residencyPeriodStart,
        residencyPeriodEnd: data.residencyPeriodEnd,
        // Added these two lines so dashboard calculation gets valid dates immediately
        fyStart: data.residencyPeriodStart, 
        fyEnd: data.residencyPeriodEnd,
      });
      toast.success("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (error) {
      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("An account with this email already exists");
          break;
        case "auth/invalid-email":
          toast.error("Please enter a valid email address");
          break;
        case "auth/weak-password":
          toast.error("Password is too weak");
          break;
        default:
          toast.error("Registration failed. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white fixed inset-0">
     <div className="flex flex-col w-full px-8 md:w-1/2 lg:px-16 pt-10 pb-12 h-full overflow-y-auto no-scrollbar">
        <div className="w-full max-w-xl mx-auto">
          <div className="mb-5 mt-6">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 bg-clip-text text-transparent sm:text-4xl">
              Create Your Account
            </h2>
            <p className="mt-2 text-base text-slate-500 font-medium">
              Track Your Stay Days Easily
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1 */}
            <div className="space-y-4">
              <div className="inline-block">
                <h3 className="text-base font-bold uppercase tracking-wider text-[#2B4593]">
                  1. Account Details
                </h3>
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email", {
                    required: "Email address is required",
                    pattern: {
                      value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
                      message: "Please enter a valid email address",
                    },
                  })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="name@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-base mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message:
                            "Password must be at least 8 characters long",
                        },
                        pattern: {
                          value:
                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
                          message:
                            "Password must include uppercase, lowercase, number, and special character",
                        },
                      })}
                      className="w-full px-4 py-2 pr-12 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 cursor-pointer z-10"
                    >
                      {showPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-base mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: (v) =>
                          v === passwordValue || "Passwords do not match",
                      })}
                      className="w-full px-4 py-2 pr-12 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 cursor-pointer z-10"
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && touchedFields.confirmPassword && (
                    <p className="text-red-500 text-base mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-[#2B4593]">
                  2. Residency Settings
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative" ref={countryRef}>
                  <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    Your Home Country
                  </label>
                  <div
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base flex items-center justify-between cursor-pointer hover:bg-white transition"
                  >
                    <span className="truncate">{currentCountryName}</span>
                    <FiChevronDown
                      className={`text-slate-400 transition-transform duration-200 ${countryDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {countryDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col">
                      <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <FiSearch className="text-slate-400 shrink-0 ml-1" />
                        <input
                          type="text"
                          value={countrySearchQuery}
                          onChange={(e) =>
                            setCountrySearchQuery(e.target.value)
                          }
                          placeholder="Search country..."
                          className="w-full bg-transparent border-none outline-none text-[16px] text-slate-900 py-1"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto flex-1 no-scrollbar">
                        {filteredCountries.length === 0 ? (
                          <div className="px-4 py-3 text-base text-slate-400 italic text-center">
                            No countries matched
                          </div>
                        ) : (
                          filteredCountries.map((c) => (
                            <div
                              key={c.code}
                              onClick={() => handleCountrySelect(c.code)}
                              className={`px-4 py-2 text-base text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer flex items-center justify-between ${selectedCountryCode === c.code ? "bg-slate-100 font-bold text-slate-900" : ""}`}
                            >
                              <span className="truncate">{c.name}</span>
                              <span className="text-slate-400 uppercase text-[10px] font-mono font-medium">
                                {c.code}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  <input
                    type="hidden"
                    {...register("homeCountry", {
                      required: "Home Country is required",
                    })}
                  />
                  {errors.homeCountry && (
                    <p className="text-red-500 text-base mt-1">
                      {errors.homeCountry.message}
                    </p>
                  )}
                </div>

                <div className="relative" ref={timezoneRef}>
                  <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    Your Time Zone
                  </label>
                  <div
                    onClick={() =>
                      setTimezoneDropdownOpen(!timezoneDropdownOpen)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base flex items-center justify-between cursor-pointer hover:bg-white transition"
                  >
                    <span className="truncate">{currentTimezoneLabel}</span>
                    <FiChevronDown
                      className={`text-slate-400 transition-transform duration-200 ${timezoneDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {timezoneDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col">
                      <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <FiSearch className="text-slate-400 shrink-0 ml-1" />
                        <input
                          type="text"
                          value={timezoneSearchQuery}
                          onChange={(e) =>
                            setTimezoneSearchQuery(e.target.value)
                          }
                          placeholder="Search timezone..."
                          className="w-full bg-transparent border-none outline-none text-[16px] text-slate-900 py-1"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto flex-1 no-scrollbar">
                        {filteredTimezones.length === 0 ? (
                          <div className="px-4 py-3 text-[16px] text-slate-400 italic text-center">
                            No timezones matched
                          </div>
                        ) : (
                          filteredTimezones.map((t) => (
                            <div
                              key={t.value}
                              onClick={() => handleTimezoneSelect(t.value)}
                              className={`px-4 py-2 text-[16px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer flex items-center justify-between ${selectedTimezoneValue === t.value ? "bg-slate-100 font-bold text-slate-900" : ""}`}
                            >
                              <span className="truncate">{t.label}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  <input
                    type="hidden"
                    {...register("timezone", {
                      required: "Timezone is required",
                    })}
                  />
                  {errors.timezone && (
                    <p className="text-red-500 text-base mt-1">
                      {errors.timezone.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Minimum Days Required
                </label>
                <input
                  type="number"
                  placeholder="183"
                  {...register("residencyThreshold", {
                    required: "Residency threshold is required",
                    min: { value: 1, message: "Must be greater than 0" },
                    max: { value: 365, message: "Cannot exceed 365 days" },
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                />
                {errors.residencyThreshold && (
                  <p className="text-red-500 text-base mt-1">
                    {errors.residencyThreshold.message}
                  </p>
                )}
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-[#2B4593]">
                  3. Residency Period
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    Start (Month & Day)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={startMonth}
                      onChange={(e) => setStartMonth(e.target.value)}
                      className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-[16px] outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                    >
                      {GLOBAL_MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={startDay}
                      onChange={(e) => setStartDay(e.target.value)}
                      className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-[16px] outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                    >
                      {getDaysInMonth(startMonth).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="hidden"
                    {...register("residencyPeriodStart", {
                      required: "Start Date is required",
                    })}
                  />
                  {errors.residencyPeriodStart && (
                    <p className="text-red-500 text-base mt-1">
                      {errors.residencyPeriodStart.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    End (Month & Day)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={endMonth}
                      onChange={(e) => {
                        setEndMonth(e.target.value);
                        setEndTouched(true);
                      }}
                      className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-[16px] outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                    >
                      {GLOBAL_MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={endDay}
                      onChange={(e) => {
                        setEndDay(e.target.value);
                        setEndTouched(true);
                      }}
                      className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-[16px] outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                    >
                      {getDaysInMonth(endMonth).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="hidden"
                    {...register("residencyPeriodEnd", {
                      required: "End Date is required",
                      validate: {
                        afterStart: (v) => {
                          if (!v || !periodStartValue) return true;
                          return (
                            new Date(v) >= new Date(periodStartValue) ||
                            "End date must be after the start date"
                          );
                        },
                      },
                    })}
                  />
                  {errors.residencyPeriodEnd &&
                    (touchedFields.residencyPeriodEnd || endTouched) && (
                      <p className="text-red-500 text-base mt-1">
                        {errors.residencyPeriodEnd.message}
                      </p>
                    )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-md font-semibold text-base text-white bg-gradient-to-r from-blue-600 via-rose-500 to-purple-600 hover:bg-gradient-to-r hover:from-blue-700 hover:via-rose-600 hover:to-purple-700 transition-all duration-300 shadow-lg disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <BiLoaderAlt className="animate-spin mr-2 text-xl" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-base text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-700 font-medium hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Visual Cover Panel */}
      <div className="hidden md:block md:w-1/2 relative">
        <img
          src={backgroundimg}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Residency Management"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-purple-700/60 to-red-700/60 flex flex-col justify-center px-16 text-white">
          <h2 className="text-3xl font-semibold leading-tight max-w-md">
            Track Your <span className="text-yellow-400">Global Stays</span>
          </h2>
          <p className="mt-4 text-lg text-white/90 max-w-md leading-relaxed">
            Monitor your travel history, stay days, and residency status across
            countries—all from one simple dashboard.
          </p>
          <div className="flex gap-2 mt-12">
            <div className="h-1.5 w-8 bg-yellow-500 rounded-full"></div>
            <div className="h-1.5 w-8 bg-white/40 rounded-full"></div>
            <div className="h-1.5 w-8 bg-white/40 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
