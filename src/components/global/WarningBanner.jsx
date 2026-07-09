import { FiAlertTriangle } from "react-icons/fi";

export default function WarningBanner({ warning }) {
  if (!warning) return null;
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-md rounded-2xl p-4 flex items-start gap-3 shadow-lg">
      <FiAlertTriangle className="text-amber-400 text-xl flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-bold text-amber-200 text-base">Compliance Alert</h3>
        <p className="text-amber-300 text-xs mt-0.5 font-medium leading-relaxed">
          {warning}
        </p>
      </div>
    </div>
  );
}
