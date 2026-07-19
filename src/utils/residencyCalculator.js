
import {
  parseISO,
  isWithinInterval,
  differenceInDays,
  isAfter,
} from "date-fns";

/**
 * Country-Agnostic Global Residency Calculation Engine
 * Computes precise presence metrics with explicit single-day override priority resolution.
 */
export const calculateResidencyStatus = (travelRecords, profile) => {
  // Aligned to match all key structures perfectly across profile and dashboard variants
  const homeCountry = (
    profile?.nativeCountry ||
    profile?.homeCountry ||
    profile?.homeCountryCode ||
    "US"
  ).toUpperCase();
  const threshold = parseInt(profile?.residencyThreshold || "183", 10);

  const validTravelRecords = Array.isArray(travelRecords)
    ? travelRecords.filter(
        (record) =>
          record?.arrivalDate &&
          record?.departureDate &&
          (record?.toCountry || record?.fromCountry),
      )
    : [];

  if (validTravelRecords.length === 0) {
    const rawStart = profile?.residencyPeriodStart || profile?.fyStart;

    if (!rawStart) {
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

    const startDate = parseISO(rawStart);
    const today = new Date();

    const homeDays = Math.max(differenceInDays(today, startDate) + 1, 0);
    const outsideDays = 0;

    const progressPercentage = Math.min(
      Math.round((outsideDays / threshold) * 100),
      100,
    );

    const daysRemaining = Math.max(threshold - outsideDays, 0);
    return {
      status: homeDays >= threshold ? "Residency Achieved" : "In Progress",
      homeDays,
      indiaDays: homeDays,
      outsideDays: 0,
      foreignDays: 0,
      totalDays: homeDays,
      progressPercentage,
      daysRemaining: Math.max(threshold - homeDays, 0),
      warning: null,
      homeCountryCode: homeCountry,
    };
  }

  // Handle cross-cutting field conversions safely across date schemas
  const rawStart = profile?.residencyPeriodStart || profile?.fyStart;
  const rawEnd = profile?.residencyPeriodEnd || profile?.fyEnd;

  // Re-verify string parsing arrays or fall back directly to record boundaries
  let periodStart = rawStart;
  let periodEnd = rawEnd;

  // Format shorthand 'MM-DD' back to implicit calendar year markers to avoid invalid range checks
  const currentYear = new Date().getFullYear();
  if (periodStart && periodStart.length === 5 && periodStart.includes("-")) {
    periodStart = `${currentYear}-${periodStart}`;
  }
  if (periodEnd && periodEnd.length === 5 && periodEnd.includes("-")) {
    periodEnd = `${currentYear}-${periodEnd}`;
  }

  // Final fallback initialization matching your fallback structural architecture
  if (!periodStart || periodStart === "not-set") {
    periodStart = `${currentYear}-01-01`;
  }
  if (!periodEnd || periodEnd === "not-set") {
    periodEnd = `${currentYear}-12-31`;
  }

  const start = parseISO(periodStart);
  const end = parseISO(periodEnd);

  // Separate records into base background segments and fine single-day overrides
  const overrides = new Map();
  const backgroundSegments = [];

  validTravelRecords.forEach((record) => {
    const depStr = record.departureDate.split("T")[0];
    const arrStr = record.arrivalDate.split("T")[0];

    if (
      depStr === arrStr &&
      (record.purpose === "Calendar Check-In" ||
        record.purpose === "Calendar Check-Out" ||
        record.purpose === "Daily GPS Check-In" ||
        record.purpose === "Country Changed")
    ) {
      overrides.set(depStr, record);
    } else {
      if (!isAfter(parseISO(depStr), parseISO(arrStr))) {
        backgroundSegments.push(record);
      }
    }
  });

  backgroundSegments.sort((a, b) => {
    const aDep = a.departureDate.split("T")[0];
    const aArr = a.arrivalDate.split("T")[0];
    const bDep = b.departureDate.split("T")[0];
    const bArr = b.arrivalDate.split("T")[0];
    const aLen = new Date(aArr) - new Date(aDep);
    const bLen = new Date(bArr) - new Date(bDep);
    if (aLen !== bLen) return aLen - bLen;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const uniqueHomeDays = new Set();
  const uniqueForeignDays = new Set();

  // Evaluate day-by-day across tracking boundaries to ensure accurate override prioritization
  let currentPtr = new Date(start);
  const endLimit = new Date(end);

  while (currentPtr <= endLimit) {
    const dayKey = currentPtr.toISOString().split("T")[0];

    try {
      // PRIORITY 1: Check if an explicit override is present for this exact date
      if (overrides.has(dayKey)) {
        const record = overrides.get(dayKey);
        const targetCountry = (
          record.toCountry ||
          record.fromCountry ||
          homeCountry
        ).toUpperCase();

        if (targetCountry === homeCountry) {
          uniqueForeignDays.delete(dayKey);
          uniqueHomeDays.add(dayKey);
        } else {
          uniqueHomeDays.delete(dayKey);
          uniqueForeignDays.add(dayKey);
        }
      }
      // PRIORITY 2: Fall back to wide-range background segments if no manual overlay exists
      else {
        const hasOverrideForDay = overrides.has(dayKey);

        const matchingParent = !hasOverrideForDay
          ? backgroundSegments.find((record) => {
              const depStr = record.departureDate.split("T")[0];
              const arrStr = record.arrivalDate.split("T")[0];

              return dayKey >= depStr && dayKey <= arrStr;
            })
          : null;
        // const matchingParent = backgroundSegments.find((record) => {
        //   const depStr = record.departureDate.split("T")[0];
        //   const arrStr = record.arrivalDate.split("T")[0];
        //   return dayKey >= depStr && dayKey <= arrStr;
        // });

        if (matchingParent) {
          const targetCountry = (
            matchingParent.toCountry ||
            matchingParent.fromCountry ||
            homeCountry
          ).toUpperCase();

          if (targetCountry === homeCountry) {
            uniqueHomeDays.add(dayKey);
          } else {
            uniqueForeignDays.add(dayKey);
          }
        }
      }
    } catch (err) {
      // Boundary fallback protection block
    }

    currentPtr.setDate(currentPtr.getDate() + 1);
  }

  const allDays = new Set([...uniqueHomeDays, ...uniqueForeignDays]);

  const homeDays = uniqueHomeDays.size;
  const outsideDays = uniqueForeignDays.size;
  const totalDays = allDays.size;

  // Compute percentage progress toward meeting target baseline thresholds
  const progressPercentage = Math.min(
    Math.round((outsideDays / threshold) * 100),
    100,
  );
  const daysRemaining = Math.max(threshold - outsideDays, 0);

  // Status mappings logic matching your existing business specifications
  let status = "Not Started";
  if (outsideDays >= threshold) {
    status = "Residency Achieved";
  } else if (outsideDays >= Math.floor(threshold * 0.5)) {
    status = "On Track";
  } else if (outsideDays > 0) {
    status = "In Progress";
  }

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
    totalDays,
    progressPercentage,
    daysRemaining,
    warning,
  };
};





// import { parseISO, isWithinInterval, differenceInDays, isAfter } from "date-fns";

// /**
//  * Country-Agnostic Global Residency Calculation Engine
//  * Computes precise presence metrics with explicit single-day override priority resolution.
//  */
// export const calculateResidencyStatus = (travelRecords, profile) => {
//   // Aligned to match all key structures perfectly across profile and dashboard variants
//   const homeCountry = (
//     profile?.nativeCountry ||
//     profile?.homeCountry ||
//     profile?.homeCountryCode ||
//     "US"
//   ).toUpperCase();
//   const threshold = parseInt(profile?.residencyThreshold || "183", 10);

//   const validTravelRecords = Array.isArray(travelRecords)
//     ? travelRecords.filter(
//         (record) =>
//           record?.arrivalDate &&
//           record?.departureDate &&
//           (record?.toCountry || record?.fromCountry),
//       )
//     : [];

//   if (validTravelRecords.length === 0) {
//     const rawStart = profile?.residencyPeriodStart || profile?.fyStart;

//     if (!rawStart) {
//       return {
//         status: "Non-Resident",
//         homeDays: 0,
//         outsideDays: 0,
//         progressPercentage: 0,
//         daysRemaining: threshold,
//         warning:
//           "For accurate residency calculations, add any travel records from earlier in this tracking period.",
//         homeCountryCode: homeCountry,
//       };
//     }

//     const startDate = parseISO(rawStart);
//     const today = new Date();

//     const homeDays = Math.max(differenceInDays(today, startDate) + 1, 0);
//     const outsideDays = 0;

//     const progressPercentage = Math.min(
//       Math.round((outsideDays / threshold) * 100),
//       100,
//     );

//     const daysRemaining = Math.max(threshold - outsideDays, 0);
//     return {
//       status: homeDays >= threshold ? "Residency Achieved" : "In Progress",
//       homeDays,
//       indiaDays: homeDays,
//       outsideDays: 0,
//       foreignDays: 0,
//       totalDays: homeDays,
//       progressPercentage,
//       daysRemaining: Math.max(threshold - homeDays, 0),
//       warning: null,
//       homeCountryCode: homeCountry,
//     };
//   }

//   // Handle cross-cutting field conversions safely across date schemas
//   const rawStart = profile?.residencyPeriodStart || profile?.fyStart;
//   const rawEnd = profile?.residencyPeriodEnd || profile?.fyEnd;

//   // Re-verify string parsing arrays or fall back directly to record boundaries
//   let periodStart = rawStart;
//   let periodEnd = rawEnd;

//   // Format shorthand 'MM-DD' back to implicit calendar year markers to avoid invalid range checks
//   const currentYear = new Date().getFullYear();
//   if (periodStart && periodStart.length === 5 && periodStart.includes("-")) {
//     periodStart = `${currentYear}-${periodStart}`;
//   }
//   if (periodEnd && periodEnd.length === 5 && periodEnd.includes("-")) {
//     periodEnd = `${currentYear}-${periodEnd}`;
//   }

//   // Final fallback initialization matching your fallback structural architecture
//   if (!periodStart || periodStart === "not-set") {
//     periodStart = `${currentYear}-01-01`;
//   }
//   if (!periodEnd || periodEnd === "not-set") {
//     periodEnd = `${currentYear}-12-31`;
//   }

//   const start = parseISO(periodStart);
//   const end = parseISO(periodEnd);

//   // Separate records into base background segments and fine single-day overrides
//   const overrides = new Map();
//   const backgroundSegments = [];

//   validTravelRecords.forEach((record) => {
//     const depStr = record.departureDate.split("T")[0];
//     const arrStr = record.arrivalDate.split("T")[0];

//     if (
//       depStr === arrStr &&
//       (record.purpose === "Calendar Check-In" ||
//         record.purpose === "Calendar Check-Out")
//     ) {
//       overrides.set(depStr, record);
//     } else {
//       if (!isAfter(parseISO(depStr), parseISO(arrStr))) {
//         backgroundSegments.push(record);
//       }
//     }
//   });

//   const uniqueHomeDays = new Set();
//   const uniqueForeignDays = new Set();

//   // Evaluate day-by-day across tracking boundaries strictly limited to where records or parameters exist
//   let currentPtr = new Date(start);
//   const endLimit = new Date(end);
//   const today = new Date();

//   // Dynamic upper boundary limits calculation exactly to the active date constraint window
//   const calculationEndLimit = endLimit > today ? today : endLimit;

//   while (currentPtr <= calculationEndLimit) {
//     const dayKey = currentPtr.toISOString().split("T")[0];

//     try {
//       // PRIORITY 1: Check if an explicit calendar override is present for this exact date
//       if (overrides.has(dayKey)) {
//         const record = overrides.get(dayKey);
//         const targetCountry = (
//           record.toCountry ||
//           record.fromCountry ||
//           homeCountry
//         ).toUpperCase();

//         if (targetCountry === homeCountry) {
//           uniqueHomeDays.add(dayKey);
//         } else {
//           uniqueForeignDays.add(dayKey);
//         }
//       }
//       // PRIORITY 2: Fall back to wide-range background segments if no manual overlay exists
//       else {
//         const matchingParent = backgroundSegments.find((record) => {
//           const depStr = record.departureDate.split("T")[0];
//           const arrStr = record.arrivalDate.split("T")[0];
//           return dayKey >= depStr && dayKey <= arrStr;
//         });

//         if (matchingParent) {
//           const targetCountry = (
//             matchingParent.toCountry ||
//             matchingParent.fromCountry ||
//             homeCountry
//           ).toUpperCase();

//           if (targetCountry === homeCountry) {
//             uniqueHomeDays.add(dayKey);
//           } else {
//             uniqueForeignDays.add(dayKey);
//           }
//         } else {
//           // If no travel history specifies otherwise, standard base days are counted as Home Stays
//           uniqueHomeDays.add(dayKey);
//         }
//       }
//     } catch (err) {
//       // Boundary fallback protection block
//     }

//     currentPtr.setDate(currentPtr.getDate() + 1);
//   }

//   const allDays = new Set([...uniqueHomeDays, ...uniqueForeignDays]);

//   const homeDays = uniqueHomeDays.size;
//   const outsideDays = uniqueForeignDays.size;
//   const totalDays = allDays.size;

//   // Compute percentage progress toward meeting target baseline thresholds
//   const progressPercentage = Math.min(
//     Math.round((outsideDays / threshold) * 100),
//     100,
//   );
//   const daysRemaining = Math.max(threshold - outsideDays, 0);

//   // Status mappings logic matching your existing business specifications
//   let status = "Not Started";
//   if (outsideDays >= threshold) {
//     status = "Residency Achieved";
//   } else if (outsideDays >= Math.floor(threshold * 0.5)) {
//     status = "On Track";
//   } else if (outsideDays > 0) {
//     status = "In Progress";
//   }

//   let warning = null;
//   if (daysRemaining > 0 && daysRemaining <= 15) {
//     warning = `Compliance Alert: Only ${daysRemaining} day(s) remaining to solidify your configured ${threshold}-day status rule for ${homeCountry}.`;
//   } else if (homeDays >= threshold && homeDays < threshold + 5) {
//     warning = `Status Achieved: You have crossed the ${threshold}-day threshold and qualify as a Resident of ${homeCountry}.`;
//   }

//   return {
//     status,
//     homeDays,
//     indiaDays: homeDays,
//     outsideDays,
//     foreignDays: outsideDays,
//     totalDays,
//     progressPercentage,
//     daysRemaining,
//     warning,
//   };
// };
