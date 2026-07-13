import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  loginUser,
  resetPassword,
  checkEmailExists,
} from "../firebase/authService";
import { useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { FiEye, FiEyeOff } from "react-icons/fi";
import backgroundimg from "../assets/loginpageimages.jpg";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const getFriendlyLoginMessage = (error) => {
    if (error?.code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }

    if (error?.code === "auth/user-not-found") {
      return "No account found with this email address. Please register first.";
    }

    if (
      error?.code === "auth/wrong-password" ||
      error?.code === "auth/invalid-password" ||
      error?.code === "auth/invalid-login-credentials" ||
      error?.code === "auth/invalid-credential"
    ) {
      return "Incorrect password. Please try again.";
    }

    if (error?.code === "auth/too-many-requests") {
      return "Too many failed login attempts. Please try again later.";
    }

    return error?.userMessage || "Unable to sign in. Please try again.";
  };
  const onSubmit = async (data) => {
    setLoading(true);

    try {
      await loginUser(data.email, data.password);
      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      console.error("[Login] email/password login failed", {
        code: error?.code,
        message: error?.message,
      });
      toast.error(getFriendlyLoginMessage(error));
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPassword = async () => {
    const email = prompt("Enter your registered email");
    if (!email) return;

    try {
      const emailExists = await checkEmailExists(email);

      if (!emailExists) {
        toast.error(
          "No account found with this email address. Please register first.",
        );
        return;
      }

      await resetPassword(email);

      toast.success(
        "Password reset instructions have been sent to your email.",
      );
    } catch (error) {
      console.error("[Forgot Password Error]", error);

      toast.error(error?.message || "Unable to send password reset email.");
    }
  };
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row overflow-hidden bg-white relative">
      {/* LEFT SIDE: Split-screen Image and Mask Overlay Panel */}
      <div className="hidden md:block md:w-1/2 min-h-full relative">
        <img
          src={backgroundimg}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Residency Management"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-purple-700/60 to-red-700/60 flex flex-col justify-center px-16 text-white">
          <h2 className="text-3xl font-semibold leading-tight max-w-md">
            Welcome Back to Your{" "}
            <span className="text-yellow-400">Residency Tracker</span>
          </h2>

          <p className="mt-4 text-lg text-white/90 max-w-md leading-relaxed">
            Sign in to view your travel history, monitor your stay days, and
            keep track of your residency status across countries.
          </p>

          <div className="flex gap-2 mt-12">
            <div className="h-1.5 w-8 bg-yellow-500 rounded-full"></div>
            <div className="h-1.5 w-8 bg-white/40 rounded-full"></div>
            <div className="h-1.5 w-8 bg-white/40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form Panel */}
      <div className="flex flex-col justify-center w-full px-8 md:w-1/2 lg:px-16 py-6 h-full overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-6 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 bg-clip-text text-transparent sm:text-4xl">
              Identity Gateway
            </h2>
            <p className="mt-2 text-base text-slate-500 font-medium">
              Log in to track tax residency records
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...register("email", {
                  required: "Email address is required",
                  pattern: {
                    value:
                      /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i,
                    message:
                      "Please enter a valid email address (e.g. user@gmail.com or user@companyname.io)",
                  },
                })}
                className={`w-full px-4 py-2 bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-base ${errors.email ? "border-red-500" : "border-slate-200"}`}
                placeholder="name@corporate.com"
              />
              {errors.email && (
                <p className="text-red-500 text-[11px] font-medium mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className={`w-full px-4 py-2 pr-12 bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-base [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${errors.password ? "border-red-500" : "border-slate-200"}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 z-10 cursor-pointer"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-[11px] font-medium mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-md font-semibold text-base text-white bg-gradient-to-r from-blue-600 via-rose-500 to-purple-600 hover:bg-gradient-to-r hover:from-blue-700 hover:via-rose-600 hover:to-purple-700 active:scale-[0.99] transition-all duration-300 shadow-lg disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <BiLoaderAlt className="animate-spin mr-2 text-xl" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="relative flex py-4 items-center">
            <p className="text-[10px] text-center text-slate-500 font-medium leading-relaxed px-1">
              <span className="text-indigo-700 font-bold text-md">Note:</span>{" "}
              Password reset instructions will be sent to your registered email
              address. Please check your Inbox and Spam folder.
            </p>
          </div>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-600">
              Create an account{" "}
              <Link
                to="/register"
                className="text-blue-700 font-semibold hover:underline transition-colors"
              >
                Register Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
