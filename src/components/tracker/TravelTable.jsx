import { FiTrash2, FiGlobe, FiEdit2 } from "react-icons/fi";
import { formatDate, calculateDaysBetween } from "../../utils/dateHelpers";
import { useState } from "react";

export default function TravelTable({ records, onDelete, onEdit }) {
  if (records.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
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
  const [currentPage, setCurrentPage] = useState(1);

  const RECORDS_PER_PAGE = 10;

  const totalPages = Math.ceil(records.length / RECORDS_PER_PAGE);

  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;

  const paginatedRecords = records.slice(
    startIndex,
    startIndex + RECORDS_PER_PAGE,
  );

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full">
      {/* UPDATED: Adjusted container layer with 'overflow-auto' instead of restricting vertical behaviors.
        Added 'touch-auto' layout configuration to enforce standard native vertical and horizontal swipe physics.
      */}
      {/* <div className="w-full overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 active:scrollbar-thumb-slate-300 touch-auto">
        <table className="w-full border-collapse text-left text-base min-w-[700px]"> */}
      {/* FIXED: Added overscroll-x-contain and -webkit-overflow-scrolling to isolate horizontal table gestures from Safari body movement */}
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px] overscroll-x-contain [webkit-overflow-scrolling:touch] scrollbar-thin scrollbar-thumb-slate-200 active:scrollbar-thumb-slate-300">
        <table className="w-full border-collapse text-left text-base min-w-[700px]">  
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
            <tr>
              <th className="px-6 py-3.5 sticky left-0 bg-slate-50 md:relative z-30">
                Global Route Transition
              </th>
              <th className="px-6 py-3.5">Departure Track</th>
              <th className="px-6 py-3.5">Arrival Track</th>
              <th className="px-6 py-3.5">Span Range</th>
              <th className="px-6 py-3.5">Logging Context</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium text-xs">
            {paginatedRecords.map((r) => (
              <tr
                key={r.recordId}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4 text-slate-900 font-bold sticky left-0 bg-white/90 backdrop-blur-xs md:relative z-10 whitespace-nowrap shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] md:shadow-none">
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 mr-1.5 uppercase text-[10px] sm:text-xs">
                    {r.fromCountry}
                  </span>
                  <span className="text-slate-400 font-normal">&rarr;</span>
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 ml-1.5 uppercase text-[10px] sm:text-xs">
                    {r.toCountry}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(r.departureDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(r.arrivalDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-xs">
                    {calculateDaysBetween(r.departureDate, r.arrivalDate)} Day
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 italic max-w-[150px] sm:max-w-[200px] truncate whitespace-nowrap">
                  {r.purpose || "Automated System Entry"}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => onEdit(r)}
                    className="text-blue-600 hover:text-blue-800 mr-4 cursor-pointer transition-colors p-1 inline-block"
                    title="Modify Entry"
                  >
                    <FiEdit2 className="text-base" />
                  </button>
                  <button
                    onClick={() => onDelete(r.recordId)}
                    className="text-red-600 hover:text-red-800 cursor-pointer transition-colors p-1 inline-block"
                    title="Remove Entry"
                  >
                    <FiTrash2 className="text-base" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50">
        <p className="text-xs sm:text-sm text-slate-500">
          Showing {startIndex + 1}-
          {Math.min(startIndex + RECORDS_PER_PAGE, records.length)} of{" "}
          {records.length}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-base font-medium">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// import { FiTrash2, FiGlobe, FiEdit2 } from "react-icons/fi";
// import { formatDate, calculateDaysBetween } from "../../utils/dateHelpers";
// import { useState } from "react";

// export default function TravelTable({ records, onDelete, onEdit }) {
//   if (records.length === 0) {
//     return (
//       <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center w-full max-w-full">
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
//   const [currentPage, setCurrentPage] = useState(1);

//   const RECORDS_PER_PAGE = 10;

//   const totalPages = Math.ceil(records.length / RECORDS_PER_PAGE);

//   const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;

//   const paginatedRecords = records.slice(
//     startIndex,
//     startIndex + RECORDS_PER_PAGE,
//   );

//   return (
//     // <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full max-w-full block">
//     //   {/* FIXED: isolated layout containing blocks to stop layout shifts in Safari Mobile */}
//     //   <div className="w-full max-w-full overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 active:scrollbar-thumb-slate-300 touch-auto block">
//     <div className="bg-white border border-slate-200 shadow-sm rounded-2xl w-full max-w-full overflow-x-auto block select-none">
//       {/* CHANGED: Switched to strict inline-block layout matrix with touch-pan-x configuration to lock down gesture physics inside the data container */}
//       <div className="w-full min-w-full inline-block align-middle overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 active:scrollbar-thumb-slate-300 touch-pan-x">
//         <table className="w-full border-collapse text-left text-base min-w-[700px] table-auto">
//           <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
//             <tr>
//               <th className="px-6 py-3.5 sticky left-0 bg-slate-50 md:relative z-30 border-b border-slate-200">
//                 Global Route Transition
//               </th>
//               <th className="px-6 py-3.5 border-b border-slate-200">
//                 Departure Track
//               </th>
//               <th className="px-6 py-3.5 border-b border-slate-200">
//                 Arrival Track
//               </th>
//               <th className="px-6 py-3.5 border-b border-slate-200">
//                 Span Range
//               </th>
//               <th className="px-6 py-3.5 border-b border-slate-200">
//                 Logging Context
//               </th>
//               <th className="px-6 py-3.5 text-right border-b border-slate-200">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100 text-slate-700 font-medium text-xs">
//             {paginatedRecords.map((r) => (
//               <tr
//                 key={r.recordId}
//                 className="hover:bg-slate-50/50 transition-colors"
//               >
//                 {/* FIXED: Enforced strict white background and absolute block layouts inside sticky table cell bounds for Safari */}
//                 {/* <td className="px-6 py-4 text-slate-900 font-bold sticky left-0 bg-white md:relative z-10 whitespace-nowrap shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)] md:shadow-none">
//                   <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 mr-1.5 uppercase text-base inline-block">
//                     {r.fromCountry}
//                   </span>
//                   <span className="text-slate-400 font-normal inline-block align-middle">&rarr;</span>
//                   <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 ml-1.5 uppercase text-base inline-block">
//                     {r.toCountry}
//                   </span>
//                 </td> */}
//                 {/* CHANGED: Restored identical text layout sizes (text-[10px] sm:text-xs) from original code to eliminate enlarged fonts in Safari mobile viewports */}
//                 <td className="px-6 py-4 text-slate-900 font-bold sticky left-0 bg-white/95 backdrop-blur-xs md:relative z-10 whitespace-nowrap shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] md:shadow-none">
//                   <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 mr-1.5 uppercase text-[10px] sm:text-xs inline-block">
//                     {r.fromCountry}
//                   </span>
//                   <span className="text-slate-400 font-normal inline-block align-middle">
//                     &rarr;
//                   </span>
//                   <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 ml-1.5 uppercase text-[10px] sm:text-xs inline-block">
//                     {r.toCountry}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-base">
//                   {formatDate(r.departureDate)}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-base">
//                   {formatDate(r.arrivalDate)}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold text-base inline-block">
//                     {calculateDaysBetween(r.departureDate, r.arrivalDate)} Day
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 text-slate-400 italic max-w-[150px] sm:max-w-[200px] truncate whitespace-nowrap text-base">
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

//       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 w-full max-w-full">
//         <p className="text-base text-slate-500">
//           Showing {startIndex + 1}-
//           {Math.min(startIndex + RECORDS_PER_PAGE, records.length)} of{" "}
//           {records.length}
//         </p>

//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//             disabled={currentPage === 1}
//             className="px-3 py-1 border rounded-lg bg-white disabled:opacity-50 text-base cursor-pointer"
//           >
//             Previous
//           </button>

//           <span className="text-base font-medium text-slate-700">
//             {currentPage} / {totalPages}
//           </span>

//           <button
//             onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//             disabled={currentPage === totalPages}
//             className="px-3 py-1 border rounded-lg bg-white disabled:opacity-50 text-base cursor-pointer"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
