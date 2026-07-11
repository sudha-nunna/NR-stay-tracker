import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiActivity,
  FiPieChart,
  FiUser,
  FiGlobe,
  FiX,
} from "react-icons/fi";

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  const menuItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: FiGrid,
    },
    {
      path: "/travel-history",
      label: "Travel History",
      icon: FiActivity,
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: FiPieChart,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: FiUser,
    },
  ];

  return (
    <>
      {/* Background Dim Backdrop Overlay Panel specifically for Mobile Interactivity screen states */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 min-h-full bg-gradient-to-b from-[#1d41a7] via-[#312e81] to-[#581c87] border-r border-white/10 flex flex-col z-50 md:z-40 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header containing the newly consolidated system icon logo asset */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
              <FiGlobe
                className="text-white text-2xl animate-spin"
                style={{ animationDuration: "30s" }}
              />
            </div>

            <div>
              <h2 className="text-white font-bold text-base leading-none tracking-tight mt-2">
                Global Residency
              </h2>
              <p className="text-slate-300 text-[10px] uppercase font-bold tracking-wider mt-1.5">
                Intelligence Platform
              </p>
            </div>
          </div>

          {/* Close Menu Button inside sidebar overlay structure for layout breakpoints context checks */}
          <button
            onClick={() => setIsOpen(false)}
            className="text-white text-xl md:hidden p-1 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <FiX />
          </button>
        </div>

        {/* Navigation Links List */}
        <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setIsOpen(false)} // Safe execution parameter close menu item check link handler click mobile views
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-yellow-600 to-purple-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`text-lg ${
                        isActive ? "text-white" : "text-slate-400"
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Information Segment Panel */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <h3 className="text-white text-base font-semibold">
              Residency Tracking
            </h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Track global travel movements and jurisdictional residency rules
              efficiently.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
