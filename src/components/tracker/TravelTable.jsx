// // import { FiTrash2, FiGlobe, FiEdit2 } from "react-icons/fi";
// // import { formatDate, calculateDaysBetween } from "../../utils/dateHelpers";
// // import { useState } from "react";

// // export default function TravelTable({ records, onDelete, onEdit }) {
// //   if (records.length === 0) {
// //     return (
// //       <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
// //         <FiGlobe className="mx-auto text-4xl text-slate-300 animate-pulse" />
// //         <h4 className="mt-3 text-base font-bold text-slate-700 uppercase tracking-wider">
// //           No Regions Traversed
// //         </h4>
// //         <p className="text-slate-400 text-xs mt-1 font-medium">
// //           Your current region mapping footprint will show here once tracked.
// //         </p>
// //       </div>
// //     );
// //   }
// //   const [currentPage, setCurrentPage] = useState(1);

// //   const RECORDS_PER_PAGE = 10;

// //   const totalPages = Math.ceil(records.length / RECORDS_PER_PAGE);

// //   const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;

// //   const paginatedRecords = records.slice(
// //     startIndex,
// //     startIndex + RECORDS_PER_PAGE,
// //   );

// //   return (
// //     <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full">
// //       {/* UPDATED: Adjusted container layer with 'overflow-auto' instead of restricting vertical behaviors.
// //         Added 'touch-auto' layout configuration to enforce standard native vertical and horizontal swipe physics.
// //       */}
// //       {/* <div className="w-full overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 active:scrollbar-thumb-slate-300 touch-auto">
// //         <table className="w-full border-collapse text-left text-base min-w-[700px]"> */}
// //       {/* FIXED: Added overscroll-x-contain and -webkit-overflow-scrolling to isolate horizontal table gestures from Safari body movement */}
// //       {/* <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px] overscroll-x-contain [webkit-overflow-scrolling:touch] scrollbar-thin scrollbar-thumb-slate-200 active:scrollbar-thumb-slate-300">
// //         <table className="w-full border-collapse text-left text-base min-w-[700px]">   */}
// //       <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px] overscroll-contain [webkit-overflow-scrolling:touch] [touch-action:pan-x_pan-y] scrollbar-thin scrollbar-thumb-slate-200 active:scrollbar-thumb-slate-300">
// //         <table className="w-full border-collapse text-left text-base min-w-[700px]">
// //           <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
// //             <tr>
// //               <th className="px-6 py-3.5 sticky left-0 bg-slate-50 md:relative z-30">
// //                 Global Route Transition
// //               </th>
// //               <th className="px-6 py-3.5">Departure Track</th>
// //               <th className="px-6 py-3.5">Arrival Track</th>
// //               <th className="px-6 py-3.5">Span Range</th>
// //               <th className="px-6 py-3.5">Logging Context</th>
// //               <th className="px-6 py-3.5 text-right">Actions</th>
// //             </tr>
// //           </thead>
// //           <tbody className="divide-y divide-slate-100 text-slate-700 font-medium text-xs">
// //             {paginatedRecords.map((r) => (
// //               <tr
// //                 key={r.recordId}
// //                 className="hover:bg-slate-50/50 transition-colors"
// //               >
// //                 {/* <td className="px-6 py-4 text-slate-900 font-bold sticky left-0 bg-white/90 backdrop-blur-xs md:relative z-10 whitespace-nowrap shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] md:shadow-none"> */}
// //                 <td className="px-6 py-4 text-slate-900 font-bold sticky left-0 bg-white md:relative z-10 whitespace-nowrap shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] md:shadow-none"> 
// //                   <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 mr-1.5 uppercase text-[10px] sm:text-xs">
// //                     {r.fromCountry}
// //                   </span>
// //                   <span className="text-slate-400 font-normal">&rarr;</span>
// //                   <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 ml-1.5 uppercase text-[10px] sm:text-xs">
// //                     {r.toCountry}
// //                   </span>
// //                 </td>
// //                 <td className="px-6 py-4 whitespace-nowrap">
// //                   {formatDate(r.departureDate)}
// //                 </td>
// //                 <td className="px-6 py-4 whitespace-nowrap">
// //                   {formatDate(r.arrivalDate)}
// //                 </td>
// //                 <td className="px-6 py-4 whitespace-nowrap">
// //                   <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-xs">
// //                     {calculateDaysBetween(r.departureDate, r.arrivalDate)} Day
// //                   </span>
// //                 </td>
// //                 <td className="px-6 py-4 text-slate-400 italic max-w-[150px] sm:max-w-[200px] truncate whitespace-nowrap">
// //                   {r.purpose || "Automated System Entry"}
// //                 </td>
// //                 <td className="px-6 py-4 text-right whitespace-nowrap">
// //                   <button
// //                     onClick={() => onEdit(r)}
// //                     className="text-blue-600 hover:text-blue-800 mr-4 cursor-pointer transition-colors p-1 inline-block"
// //                     title="Modify Entry"
// //                   >
// //                     <FiEdit2 className="text-base" />
// //                   </button>
// //                   <button
// //                     onClick={() => onDelete(r.recordId)}
// //                     className="text-red-600 hover:text-red-800 cursor-pointer transition-colors p-1 inline-block"
// //                     title="Remove Entry"
// //                   >
// //                     <FiTrash2 className="text-base" />
// //                   </button>
// //                 </td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>

// //       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
// //         <p className="text-xs sm:text-sm text-slate-500">
// //           Showing {startIndex + 1}-
// //           {Math.min(startIndex + RECORDS_PER_PAGE, records.length)} of{" "}
// //           {records.length}
// //         </p>

// //         <div className="flex items-center gap-2">
// //           <button
// //             onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
// //             disabled={currentPage === 1}
// //             className="px-3 py-1 border rounded-lg disabled:opacity-50"
// //           >
// //             Previous
// //           </button>

// //           <span className="text-base font-medium">
// //             {currentPage} / {totalPages}
// //           </span>

// //           <button
// //             onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
// //             disabled={currentPage === totalPages}
// //             className="px-3 py-1 border rounded-lg disabled:opacity-50"
// //           >
// //             Next
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }




// import { FiTrash2, FiGlobe, FiEdit2, FiSearch } from "react-icons/fi";
// import { formatDate, calculateDaysBetween } from "../../utils/dateHelpers";
// import { useState } from "react";

// export default function TravelTable({ records, onDelete, onEdit }) {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchQuery, setSearchQuery] = useState("");

//   const RECORDS_PER_PAGE = 10;

//   const filteredRecords = records.filter((r) => {
//     if (!searchQuery.trim()) return true;
//     const q = searchQuery.toLowerCase();
//     return (
//       r.fromCountry?.toLowerCase().includes(q) ||
//       r.toCountry?.toLowerCase().includes(q) ||
//       r.purpose?.toLowerCase().includes(q) ||
//       formatDate(r.departureDate)?.toLowerCase().includes(q) ||
//       formatDate(r.arrivalDate)?.toLowerCase().includes(q)
//     );
//   });

//   const totalPages = Math.max(1, Math.ceil(filteredRecords.length / RECORDS_PER_PAGE));
//   const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
//   const paginatedRecords = filteredRecords.slice(startIndex, startIndex + RECORDS_PER_PAGE);

//   if (records.length === 0) {
//     return (
//       <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
//         <FiGlobe className="mx-auto text-4xl text-slate-300 animate-pulse" />
//         <h4 className="mt-3 text-base font-bold text-slate-700 uppercase tracking-wider">
//           No Regions Traversed
//         </h4>
//         <p className="text-slate-400 text-xs mt-1 font-medium">
//           Your current region mapping footprint will show here once tracked.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full">
//       {/* SEARCH BAR - works for both desktop & mobile */}
//       <div className="p-4 border-b border-slate-200 bg-slate-50">
//         <div className="relative w-full sm:max-w-xs">
//           <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
//           <input
//             type="text"
//             value={searchQuery}
//             onChange={(e) => {
//               setSearchQuery(e.target.value);
//               setCurrentPage(1);
//             }}
//             placeholder="Search records..."
//             className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>
//       </div>

//       {/* ===================== DESKTOP TABLE (full, no scroll/compression) ===================== */}
//       <div className="hidden md:block w-full">
//         <table className="w-full border-collapse text-left text-base">
//           <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
//             <tr>
//               <th className="px-6 py-3.5">Global Route Transition</th>
//               <th className="px-6 py-3.5">Departure Track</th>
//               <th className="px-6 py-3.5">Arrival Track</th>
//               <th className="px-6 py-3.5">Span Range</th>
//               <th className="px-6 py-3.5">Logging Context</th>
//               <th className="px-6 py-3.5 text-right">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100 text-slate-700 font-medium text-xs">
//             {paginatedRecords.map((r) => (
//               <tr
//                 key={r.recordId}
//                 className="hover:bg-slate-50/50 transition-colors"
//               >
//                 <td className="px-6 py-4 text-slate-900 font-bold whitespace-nowrap">
//                   <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 mr-1.5 uppercase text-xs">
//                     {r.fromCountry}
//                   </span>
//                   <span className="text-slate-400 font-normal">&rarr;</span>
//                   <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 ml-1.5 uppercase text-xs">
//                     {r.toCountry}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   {formatDate(r.departureDate)}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   {formatDate(r.arrivalDate)}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold text-xs">
//                     {calculateDaysBetween(r.departureDate, r.arrivalDate)} Day
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 text-slate-400 italic max-w-[200px] truncate whitespace-nowrap">
//                   {r.purpose || "Automated System Entry"}
//                 </td>
//                 <td className="px-6 py-4 text-right whitespace-nowrap">
//                   <button
//                     onClick={() => onEdit(r)}
//                     className="text-blue-600 hover:text-blue-800 mr-4 cursor-pointer transition-colors p-1 inline-block"
//                     title="Modify Entry"
//                   >
//                     <FiEdit2 className="text-base" />
//                   </button>
//                   <button
//                     onClick={() => onDelete(r.recordId)}
//                     className="text-red-600 hover:text-red-800 cursor-pointer transition-colors p-1 inline-block"
//                     title="Remove Entry"
//                   >
//                     <FiTrash2 className="text-base" />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

     
//       {/* ===================== MOBILE CARD VIEW (each row -> its own card) ===================== */}
//       <div className="md:hidden bg-transparent p-4 space-y-4">
//         {paginatedRecords.map((r) => (
//           <div
//             key={r.recordId}
//             className="p-4 space-y-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50/30 transition-colors"
//           >
//             <div className="flex items-center justify-between">
//               <div className="flex items-center flex-wrap gap-1">
//                 <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 uppercase text-[10px]">
//                   {r.fromCountry}
//                 </span>
//                 <span className="text-slate-400 font-normal text-xs">&rarr;</span>
//                 <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 uppercase text-[10px]">
//                   {r.toCountry}
//                 </span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <button
//                   onClick={() => onEdit(r)}
//                   className="text-blue-600 hover:text-blue-800 cursor-pointer transition-colors p-1.5"
//                   title="Modify Entry"
//                 >
//                   <FiEdit2 className="text-base" />
//                 </button>
//                 <button
//                   onClick={() => onDelete(r.recordId)}
//                   className="text-red-600 hover:text-red-800 cursor-pointer transition-colors p-1.5"
//                   title="Remove Entry"
//                 >
//                   <FiTrash2 className="text-base" />
//                 </button>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-3 text-xs">
//               <div>
//                 <p className="text-slate-400 uppercase text-[10px] font-bold tracking-wider mb-1">
//                   Departure Track
//                 </p>
//                 <p className="text-slate-700 font-medium">
//                   {formatDate(r.departureDate)}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-slate-400 uppercase text-[10px] font-bold tracking-wider mb-1">
//                   Arrival Track
//                 </p>
//                 <p className="text-slate-700 font-medium">
//                   {formatDate(r.arrivalDate)}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-slate-400 uppercase text-[10px] font-bold tracking-wider mb-1">
//                   Span Range
//                 </p>
//                 <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block">
//                   {calculateDaysBetween(r.departureDate, r.arrivalDate)} Day
//                 </span>
//               </div>
//               <div>
//                 <p className="text-slate-400 uppercase text-[10px] font-bold tracking-wider mb-1">
//                   Logging Context
//                 </p>
//                 <p className="text-slate-400 italic truncate">
//                   {r.purpose || "Automated System Entry"}
//                 </p>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* ===================== PAGINATION (shared for desktop & mobile) ===================== */}
//       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
//         <p className="text-xs sm:text-sm text-slate-500">
//           Showing {filteredRecords.length === 0 ? 0 : startIndex + 1}-
//           {Math.min(startIndex + RECORDS_PER_PAGE, filteredRecords.length)} of{" "}
//           {filteredRecords.length}
//         </p>

//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//             disabled={currentPage === 1}
//             className="px-3 py-1 border rounded-lg disabled:opacity-50"
//           >
//             Previous
//           </button>

//           <span className="text-base font-medium">
//             {currentPage} / {totalPages}
//           </span>

//           <button
//             onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//             disabled={currentPage === totalPages}
//             className="px-3 py-1 border rounded-lg disabled:opacity-50"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }




import { FiTrash2, FiGlobe, FiEdit2, FiSearch } from "react-icons/fi";
import { formatDate, calculateDaysBetween } from "../../utils/dateHelpers";
import { useState } from "react";

export default function TravelTable({ records, onDelete, onEdit }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const RECORDS_PER_PAGE = 10;

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.fromCountry?.toLowerCase().includes(q) ||
      r.toCountry?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q) ||
      formatDate(r.departureDate)?.toLowerCase().includes(q) ||
      formatDate(r.arrivalDate)?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / RECORDS_PER_PAGE));
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + RECORDS_PER_PAGE);

  if (records.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center m-4">
        <FiGlobe className="mx-auto text-4xl text-slate-300 animate-pulse" />
        <h4 className="mt-3 text-base font-bold text-slate-700 uppercase tracking-wider">
          No Regions Traversed
        </h4>
        <p className="text-slate-400 text-xs mt-1 font-medium">
          Your current region mapping footprint will show here once tracked.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* INTEGRATED SEARCH STRIP CONTAINER - Nested directly within the element block */}
      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/30">
        <div className="relative w-full sm:max-w-xs">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Quick search timeline records..."
            className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium placeholder-slate-400 focus:border-slate-300"
          />
        </div>
      </div>

      {/* ===================== DESKTOP LIVE TABLE SCREEN FRAMEWORK ===================== */}
      <div className="hidden md:block w-full">
        <table className="w-full border-collapse text-left text-base">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-3">Global Route Transition</th>
              <th className="px-6 py-3">Departure Track</th>
              <th className="px-6 py-3">Arrival Track</th>
              <th className="px-6 py-3">Span Range</th>
              <th className="px-6 py-3">Logging Context</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium text-xs">
            {paginatedRecords.map((r) => (
              <tr key={r.recordId} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3 text-slate-900 font-bold whitespace-nowrap">
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 mr-1.5 uppercase text-xs">
                    {r.fromCountry}
                  </span>
                  <span className="text-slate-400 font-normal">&rarr;</span>
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 ml-1.5 uppercase text-xs">
                    {r.toCountry}
                  </span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">{formatDate(r.departureDate)}</td>
                <td className="px-6 py-3 whitespace-nowrap">{formatDate(r.arrivalDate)}</td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold text-xs">
                    {calculateDaysBetween(r.departureDate, r.arrivalDate)} Day
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-400 italic max-w-[200px] truncate whitespace-nowrap">
                  {r.purpose || "Automated System Entry"}
                </td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => onEdit(r)}
                    className="text-blue-600 hover:text-blue-800 mr-4 cursor-pointer p-1 inline-block"
                  >
                    <FiEdit2 className="text-sm" />
                  </button>
                  <button
                    onClick={() => onDelete(r.recordId)}
                    className="text-red-600 hover:text-red-800 cursor-pointer p-1 inline-block"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===================== MOBILE HIGH DENSITY CARD SYSTEM ===================== */}
      <div className="md:hidden bg-transparent p-3 space-y-2.5">
        {paginatedRecords.map((r) => (
          <div
            key={r.recordId}
            className="p-3 space-y-2 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-wrap gap-1">
                <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 uppercase text-[9px] font-bold">
                  {r.fromCountry}
                </span>
                <span className="text-slate-400 font-normal text-xs">&rarr;</span>
                <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 uppercase text-[9px] font-bold">
                  {r.toCountry}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => onEdit(r)} className="text-blue-600 p-1">
                  <FiEdit2 className="text-sm" />
                </button>
                <button onClick={() => onDelete(r.recordId)} className="text-red-600 p-1">
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="text-slate-400 uppercase text-[9px] font-bold tracking-wider mb-0.5">Departure</p>
                <p className="text-slate-700 font-medium">{formatDate(r.departureDate)}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-[9px] font-bold tracking-wider mb-0.5">Arrival</p>
                <p className="text-slate-700 font-medium">{formatDate(r.arrivalDate)}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-[9px] font-bold tracking-wider mb-0.5">Span</p>
                <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-bold text-[9px] inline-block">
                  {calculateDaysBetween(r.departureDate, r.arrivalDate)} Day
                </span>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-[9px] font-bold tracking-wider mb-0.5">Context</p>
                <p className="text-slate-400 italic truncate font-medium">{r.purpose || "Automated Entry"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===================== CONTROLLER FOOTER PAGINATION STRIP ===================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2 border-t border-slate-200 bg-slate-50 text-slate-600 font-medium">
        <p className="text-[11px] text-slate-500">
          Showing {filteredRecords.length === 0 ? 0 : startIndex + 1}-
          {Math.min(startIndex + RECORDS_PER_PAGE, filteredRecords.length)} of {filteredRecords.length}
        </p>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 bg-white border border-slate-200 shadow-sm rounded-md disabled:opacity-50 cursor-pointer font-bold text-slate-700"
          >
            Previous
          </button>
          <span className="font-extrabold text-slate-800 px-1">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 bg-white border border-slate-200 shadow-sm rounded-md disabled:opacity-50 cursor-pointer font-bold text-slate-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}