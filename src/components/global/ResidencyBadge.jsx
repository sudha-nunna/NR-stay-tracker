export default function ResidencyBadge({ status }) {
  const getBadgeStyles = (currentStatus) => {
    switch (currentStatus) {
      case "Resident":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";

      case "Temporary Resident":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";

      case "Long-Term Visitor":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";

      case "Non-Resident":
        return "bg-red-500/10 text-red-600 border-red-500/20";

      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-bold tracking-wider border rounded-full uppercase ${getBadgeStyles(status)}`}
    >
      {status}
    </span>
  );
}
