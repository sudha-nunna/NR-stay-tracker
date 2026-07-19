

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import BottomNav from "../components/layout/BottomNav";
import { useState } from "react";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import TripsOverview from "../pages/TripsOverview";
import TravelHistory from "../pages/TravelHistory";
import Analytics from "../pages/Analytics";
import Profile from "../pages/Profile";

function MainLayoutShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full min-w-0 bg-slate-50 relative flex flex-col antialiased font-sans">
      {/* Navbar */}
      <Navbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />

      {/* Main Content */}
      <main
        className="
          pt-22
          sm:pt-24
          md:pt-28
          px-4
          pb-24
          md:pb-8
          md:px-8
          md:ml-64
          min-h-screen
          overflow-x-hidden
        "
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation (mobile only) */}
      <BottomNav />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayoutShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="trips-overview" element={<TripsOverview />} />
        <Route path="travel-history" element={<TravelHistory />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
