import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Core Application Routing Engine */}
        <AppRoutes />

        {/* Global Toast Notification System configured purely via Tailwind Utility Classes */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerStyle={{
            top: 20,
            right: 20,
          }}
          toastOptions={{
            duration: 3500,
            className:
              "bg-white text-slate-800 border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-base font-medium",
            success: {
              className:
                "bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl shadow-lg",
              iconTheme: {
                primary: "#10B981",
                secondary: "#FFFFFF",
              },
            },
            error: {
              className:
                "bg-red-50 text-red-800 border border-red-200 rounded-xl shadow-lg",
              iconTheme: {
                primary: "#EF4444",
                secondary: "#FFFFFF",
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
