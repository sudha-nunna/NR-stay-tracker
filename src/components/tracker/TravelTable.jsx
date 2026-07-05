import { FiTrash2, FiGlobe ,FiEdit2} from 'react-icons/fi';
import { formatDate, calculateDaysBetween } from '../../utils/dateHelpers';

export default function TravelTable({ records, onDelete, onEdit }) {
  if (records.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
        <FiGlobe className="mx-auto text-4xl text-slate-300 animate-pulse" />
        <h4 className="mt-3 text-sm font-bold text-slate-700 uppercase tracking-wider">No Regions Traversed</h4>
        <p className="text-slate-400 text-xs mt-1 font-medium">Your current region mapping footprint will show here once tracked.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full">
      {/* CRITICAL RESPONSIVE UPDATE: 
        Added 'overflow-x-auto whitespace-nowrap' and custom touch-scroll properties 
        to ensure smooth swipe physics on smaller mobile screen breakpoints view layers.
      */}
      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 active:scrollbar-thumb-slate-300 touch-pan-x">
        <table className="w-full border-collapse text-left text-sm min-w-[700px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-3.5 sticky left-0 bg-slate-50 md:relative z-10">Global Route Transition</th>
              <th className="px-6 py-3.5">Departure Track</th>
              <th className="px-6 py-3.5">Arrival Track</th>
              <th className="px-6 py-3.5">Span Range</th>
              <th className="px-6 py-3.5">Logging Context</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium text-xs">
            {records.map((r) => (
              <tr key={r.recordId} className="hover:bg-slate-50/50 transition-colors">
                {/* Fixed position sticky label anchor helper layer for easy read on smallest split device ratios */}
                <td className="px-6 py-4 text-slate-900 font-bold sticky left-0 bg-white/90 backdrop-blur-xs md:relative z-10 whitespace-nowrap shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] md:shadow-none">
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 mr-1.5 uppercase text-[10px] sm:text-xs">{r.fromCountry}</span>
                  <span className="text-slate-400 font-normal">&rarr;</span> 
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 ml-1.5 uppercase text-[10px] sm:text-xs">{r.toCountry}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(r.departureDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(r.arrivalDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-xs">
                    {calculateDaysBetween(r.departureDate, r.arrivalDate)} Day
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 italic max-w-[150px] sm:max-w-[200px] truncate whitespace-nowrap">
                  {r.purpose || 'Automated System Entry'}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button onClick={() => onEdit(r)} className="text-blue-600 hover:text-blue-800 mr-4 cursor-pointer transition-colors p-1 inline-block" title="Modify Entry">
                    <FiEdit2 className="text-sm" />
                  </button>
                  <button onClick={() => onDelete(r.recordId)} className="text-red-600 hover:text-red-800 cursor-pointer transition-colors p-1 inline-block" title="Remove Entry">
                    <FiTrash2 className="text-sm" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}