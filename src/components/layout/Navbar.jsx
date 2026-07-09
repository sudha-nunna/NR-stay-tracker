import { FiLogOut, FiUser, FiMenu } from "react-icons/fi";
import { logoutUser } from "../../firebase/authService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Navbar({ onMenuToggle }) {
  const { profile } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to logout");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 md:ml-64 h-20 bg-gradient-to-r from-purple-800 via-indigo-600 to-[#153eb1] shadow-lg z-30 flex items-center justify-between px-4 sm:px-8">
      {/* Dynamic Mobile Layout Hamburger Control Panel Button Asset */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="text-white text-2xl md:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition cursor-pointer"
          title="Open Menu"
        >
          <FiMenu />
        </button>
        <span className="text-white font-extrabold text-lg sm:text-xl tracking-tight truncate">
          Global Residency Tracker
        </span>
      </div>

      {/* User Information & Session Action Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {profile && (
          <div className="hidden sm:flex items-center gap-2 text-white bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-base font-semibold tracking-wide">
            <FiUser className="text-cyan-500 rounded-full bg-blue-100 p-0.5 text-base" />
            <span className="truncate max-w-[120px] md:max-w-none">
              {profile.email}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-base font-bold px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md hover:scale-[1.02] cursor-pointer"
        >
          <FiLogOut />
          <span className="hidden xs:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
