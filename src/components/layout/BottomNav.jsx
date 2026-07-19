import { NavLink } from "react-router-dom";
import { FiGrid, FiActivity, FiMap, FiPieChart, FiUser } from "react-icons/fi";

export default function BottomNav() {
  const menuItems = [
    { path: "/", label: "Dashboard", icon: FiGrid, end: true },
     { path: "/travel-history", label: "History", icon: FiActivity },
    { path: "/trips-overview", label: "Trips", icon: FiMap },
   
    { path: "/analytics", label: "Analytics", icon: FiPieChart },
    { path: "/profile", label: "Profile", icon: FiUser },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-between px-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-all duration-200 ${
                  isActive ? "text-purple-700" : "text-slate-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-yellow-600 to-purple-600 text-white shadow-md"
                        : "text-slate-500"
                    }`}
                  >
                    <Icon className="text-lg" />
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}