
import { FiGlobe, FiTrendingUp, FiCalendar, FiShield } from 'react-icons/fi';

export default function SummaryCards({ calculation, profile, totalRecordsLength = 0 }) {
  // Extract configuration parameters safely with zero base hooks protection limits
  const isDataEmpty = totalRecordsLength === 0;
  const indiaDays = isDataEmpty ? 0 : (calculation?.homeDays ?? calculation?.indiaDays ?? 0);
  const foreignDays = isDataEmpty ? 0 : (calculation?.outsideDays ?? calculation?.foreignDays ?? 0);
  const status = calculation?.status ?? 'NRI';
  const fyStart = profile?.fyStart ? new Date(profile.fyStart).getFullYear() : '----';
  const fyEnd = profile?.fyEnd ? new Date(profile.fyEnd).getFullYear() : '----';

  const totalPeriodDays =
    profile?.residencyPeriodStart && profile?.residencyPeriodEnd
      ? Math.ceil(
          (new Date(profile.residencyPeriodEnd) - new Date(profile.residencyPeriodStart)) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : profile?.fyStart && profile?.fyEnd
      ? Math.ceil(
          (new Date(profile.fyEnd) - new Date(profile.fyStart)) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 365;

  const getStatusBadgeStyle = (currentStatus) => {
    switch (currentStatus) {
      case 'Resident': 
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'RNOR': 
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: 
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  const metricCards = [
    {
      title: 'Total Days in India',
      value: indiaDays,
      caption: 'Computed stays inside borders',
      icon: FiGlobe,
      colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Total Days Outside India',
      value: foreignDays,
      caption: 'Inferred foreign log windows',
      icon: FiTrendingUp,
      colorClass: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Active Total Horizon',
      value: `${indiaDays + foreignDays} / ${totalPeriodDays} Days`,
      caption: 'Total cumulative time logged',
      icon: FiCalendar,
      colorClass: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Current Status',
      value: status,
      caption: 'Verified compliance standing',
      icon: FiShield,
      isBadge: true,
      colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {metricCards.map((card, index) => {
        const IconComponent = card.icon;
        
        return (
          <div 
            key={index} 
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start justify-between transition-all duration-200 hover:shadow-md"
          >
            <div className="space-y-1.5 max-w-[70%]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {card.title}
              </p>
              
              {card.isBadge ? (
                <div className="pt-1">
                  <span className={`inline-block px-3 py-0.5 text-xs font-bold border rounded-full uppercase tracking-wider ${getStatusBadgeStyle(card.value)}`}>
                    {card.value}
                  </span>
                </div>
              ) : (
                <p className="text-xl font-black text-slate-900 tracking-tight truncate">
                  {card.value}
                </p>
              )}
              
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {card.caption}
              </p>
            </div>

            <div className={`p-3 rounded-xl border flex-shrink-0 ${card.colorClass}`}>
              <IconComponent className="text-xl" />
            </div>
          </div>
        );
      })}
    </div>
  );
}