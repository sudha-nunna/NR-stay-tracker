import { parseISO, isWithinInterval, differenceInDays } from "date-fns";

/**
 * Country-Agnostic Global Residency Calculation Engine
 * Computes precise presence metrics against user-configured dynamic rules.
 */
export const calculateResidencyStatus = (travelRecords, profile) => {
  // FIX: Match the exact fallback priority used by the UI components
  const homeCountry = profile?.homeCountry || profile?.homeCountryCode;
  const threshold = parseInt(profile?.residencyThreshold || "183", 10);
  const validTravelRecords = Array.isArray(travelRecords)
    ? travelRecords.filter(
        (record) =>
          record?.arrivalDate && record?.departureDate && record?.toCountry,
      )
    : [];

  if (validTravelRecords.length === 0) {
    return {
      status: "Non-Resident",
      homeDays: 0,
      outsideDays: 0,
      progressPercentage: 0,
      daysRemaining: threshold,
      warning:
        "For accurate residency calculations, add any travel records from earlier in this tracking period.",
      homeCountryCode: homeCountry,
    };
  }

  // Dynamic or standard fiscal year tracking boundary parameters
  const periodStart =
    profile?.residencyPeriodStart ||
    profile?.fyStart ||
    validTravelRecords[validTravelRecords.length - 1]?.arrivalDate;
  const periodEnd =
    profile?.residencyPeriodEnd ||
    profile?.fyEnd ||
    validTravelRecords[0]?.arrivalDate;

  if (!periodStart || !periodEnd) {
    return {
      status: "Non-Resident",
      homeDays: 0,
      outsideDays: 0,
      progressPercentage: 0,
      daysRemaining: threshold,
      warning: null,
      homeCountryCode: homeCountry,
    };
  }

  const start = parseISO(periodStart);
  const end = parseISO(periodEnd);
  const totalPeriodDays = differenceInDays(end, start) + 1;

  const uniqueHomeDays = new Set();
  const uniqueForeignDays = new Set();

  validTravelRecords.forEach((record) => {
    if (!record.departureDate || !record.arrivalDate) return;

    const dep = parseISO(record.departureDate);
    const arr = parseISO(record.arrivalDate);

    let currentPtr = new Date(dep);

    while (currentPtr <= arr) {
      const dayKey = currentPtr.toISOString().split("T")[0];
      if (isWithinInterval(currentPtr, { start, end })) {
        if (record.toCountry === homeCountry) {
          uniqueHomeDays.add(dayKey);
        } else {
          uniqueForeignDays.add(dayKey);
        }
      }
      currentPtr.setDate(currentPtr.getDate() + 1);
    }
  });

  const homeDays = uniqueHomeDays.size;
  const outsideDays = uniqueForeignDays.size;

  // Compute percentage progress toward meeting the target threshold
  const progressPercentage = Math.min(
    Math.round((homeDays / threshold) * 100),
    100,
  );
  const daysRemaining = Math.max(threshold - homeDays, 0);

  // Dynamic status classifications based on configurable milestone completion
  let status = "Non-Resident";
  if (homeDays >= threshold) {
    status = "Resident";
  } else if (homeDays >= Math.floor(threshold * 0.5)) {
    status = "Temporary Resident";
  } else if (homeDays > 0) {
    status = "Long-Term Visitor";
  }

  // Compliance alerting system based on custom parameters
  let warning = null;
  if (daysRemaining > 0 && daysRemaining <= 15) {
    warning = `Compliance Alert: Only ${daysRemaining} day(s) remaining to solidify your configured ${threshold}-day status rule for ${homeCountry}.`;
  } else if (homeDays >= threshold && homeDays < threshold + 5) {
    warning = `Status Achieved: You have crossed the ${threshold}-day threshold and qualify as a Resident of ${homeCountry}.`;
  }

  return {
    status,
    homeDays,
    indiaDays: homeDays,
    outsideDays,
    foreignDays: outsideDays,
    progressPercentage,
    daysRemaining,
    warning,
  };
};
