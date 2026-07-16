import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToTravelRecords,
  addTravelRecord,
  updateTravelRecord,
} from "../firebase/firestoreService";
import { calculateResidencyStatus } from "../utils/residencyCalculator";
import { autoTrackLocation } from "../utils/locationTracker";
import { countries } from "../utils/countries";
import toast from "react-hot-toast";
import {
  format,
  parseISO,
  eachDayOfInterval,
  subDays,
  isAfter,
} from "date-fns";
import { usePresenceToggle } from "./usePresenceToggle";

export function useResidencyDashboard() {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isCreatingInitialHomeStay = useRef(false);

  const { handleTogglePresence } = usePresenceToggle(user, profile, records);

  const getFullCountryName = (code) => {
    if (!code) return "Unknown Base";
    if (code.toUpperCase() === "ABROAD" || code.toUpperCase() === "OTHER")
      return "Abroad";
    const match = countries.find(
      (c) => c.code.toUpperCase() === code.toUpperCase(),
    );
    return match ? match.name : code;
  };

  const formatToMonthDay = (dateStr) => {
    if (!dateStr || dateStr.includes("Open") || dateStr === "not-set")
      return "Not Set";

    try {
      if (/^\d{2}-\d{2}$/.test(dateStr)) {
        const [month, day] = dateStr.split("-");
        const shortMonths = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const monthIndex = parseInt(month, 10) - 1;

        if (monthIndex >= 0 && monthIndex < 12) {
          return `${day} ${shortMonths[monthIndex]}`;
        }
      }
      return format(parseISO(dateStr), "dd MMM");
    } catch (e) {
      return dateStr;
    }
  };

  // 1. Keep the Firebase socket connection running fast and permanent
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) return;

    const unsubscribe = subscribeToTravelRecords(
      user.uid,
      (fetchedRecords) => {
        setRecords(fetchedRecords);
        setMetricsLoading(false);
      },
      (error) => {
        console.error(error);
        setMetricsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]); // Only runs on login/logout to ensure maximum speed

  useEffect(() => {
    function handleClickOutsideMenu(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideMenu);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideMenu);
  }, []);

  // 2. FIXED PROFILE SYNC WORKFLOW: Updates data immediately when country/dates change without slowing down firebase
  useEffect(() => {
    if (!user || metricsLoading || !profile) return;
    const fyStart = profile?.fyStart || profile?.residencyPeriodStart;
    if (!fyStart) return;

    const rawHomeCountry =
      profile?.homeCountry || profile?.nativeCountry || "US";
    const initialHomeStayRecord = records.find(
      (r) => r.purpose === "Initial Home Stay",
    );

    if (!initialHomeStayRecord && !isCreatingInitialHomeStay.current && records.length === 0) {
      isCreatingInitialHomeStay.current = true;
      const today = new Date();
      const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
      const cleanStartDate = fyStart.includes("T") ? fyStart.split("T")[0] : fyStart;

      const isAlreadyListed = records.some(r => r.purpose === "Initial Home Stay");
      if (isAlreadyListed) return;

      addTravelRecord(user.uid, {
        departureDate: cleanStartDate,
        arrivalDate: yesterdayStr,
        fromCountry: rawHomeCountry,
        toCountry: rawHomeCountry,
        purpose: "Initial Home Stay",
      }).catch((err) => {
        console.error("[Initial Home Stay Auto-Creation Error]:", err);
        isCreatingInitialHomeStay.current = false;
      });
    } else if (initialHomeStayRecord) {
      const oldHomeCountry = initialHomeStayRecord.toCountry;
      const cleanStartDate = fyStart.includes("T") ? fyStart.split("T")[0] : fyStart;

      const countryChanged = oldHomeCountry !== rawHomeCountry || initialHomeStayRecord.fromCountry !== rawHomeCountry;
      const dateChanged = initialHomeStayRecord.departureDate !== cleanStartDate;

      if (countryChanged || dateChanged) {
        const syncOperations = [
          updateTravelRecord(initialHomeStayRecord.recordId, {
            ...initialHomeStayRecord,
            fromCountry: rawHomeCountry,
            toCountry: rawHomeCountry,
            departureDate: cleanStartDate,
          }),
        ];

        if (countryChanged) {
          records.forEach((record) => {
            if (
              record.recordId !== initialHomeStayRecord.recordId &&
              record.fromCountry === oldHomeCountry &&
              (record.purpose === "Daily GPS Check-In" ||
                record.purpose === "Country Changed")
            ) {
              syncOperations.push(
                updateTravelRecord(record.recordId, {
                  ...record,
                  fromCountry: rawHomeCountry,
                }),
              );
            }
          });
        }

        Promise.all(syncOperations).catch((err) =>
          console.error("[Profile Sync update failed]:", err),
        );
      }
    }
  }, [user, metricsLoading, records, profile?.fyStart, profile?.fyEnd, profile?.homeCountry, profile?.nativeCountry]);

  // 3. Daily GPS Check-in Handler
  useEffect(() => {
    if (!user || metricsLoading || !profile) return;

    const fyStart = profile?.fyStart || profile?.residencyPeriodStart;
    const hasInitialHomeStay = records.some(
      (r) => r.purpose === "Initial Home Stay",
    );

    if (fyStart && !hasInitialHomeStay) {
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const localStorageKey = `lastLocationTrackDate_${user.uid}`;
    const alreadyTrackedToday = localStorage.getItem(localStorageKey);

    const gpsRecordExistsInDb = records.some((r) => {
      const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;
      return (
        arrival === today &&
        (r.purpose === "Daily GPS Check-In" ||
          r.purpose === "Country Changed")
      );
    });

    if (!gpsRecordExistsInDb && alreadyTrackedToday === today) {
      localStorage.removeItem(localStorageKey);
    }

    if (gpsRecordExistsInDb || window.isLocationTrackingActive === today) {
      return;
    }

    const runTracking = async () => {
      try {
        const tracked = await autoTrackLocation(user, records, profile);
        if (tracked) {
          toast.success("Daily GPS check-in recorded successfully");
          localStorage.setItem(localStorageKey, today);
        }
      } catch (error) {
        console.error("[Dashboard GPS Auto-Track Error]:", error);
      }
    };

    runTracking();
  }, [user, metricsLoading, records, profile]);

  // 4. FIXED DOUBLE DECLARATION: Removed duplicate assignment statement lower down completely
  const calculation = useMemo(() => {
    if (metricsLoading) return null;
    return calculateResidencyStatus(records, profile);
  }, [
    records,
    profile,
    metricsLoading,
    profile?.fyStart,
    profile?.fyEnd,
    profile?.homeCountry,
    profile?.nativeCountry,
    profile?.residencyThreshold
  ]);

  const rawHomeCountry =
    profile?.homeCountry || profile?.nativeCountry || "US";
  const homeCountryName = rawHomeCountry
    ? getFullCountryName(rawHomeCountry)
    : "Configuring Base...";

  const targetTimezone = profile?.timezone || "Not Set";
  const horizonPeriodStart =
    profile?.residencyPeriodStart || profile?.fyStart || "Start Date Open";
  const horizonPeriodEnd =
    profile?.residencyPeriodEnd || profile?.fyEnd || "End Date Open";
  const definedMilestone = parseInt(
    profile?.residencyThreshold || "183",
    10,
  );

  const hasValidTravelRecords = records.some(
    (record) =>
      record?.arrivalDate &&
      record?.departureDate &&
      (record?.toCountry || record?.fromCountry),
  );

  const getRunwayMetrics = () => {
    const targetEnd = profile?.residencyPeriodEnd || profile?.fyEnd;
    const targetStart = profile?.residencyPeriodStart || profile?.fyStart;

    if (!targetEnd || !hasValidTravelRecords || !calculation) {
      return { daysLeftInPeriod: 0, isPossible: true };
    }

    const endDate = new Date(targetEnd);
    const startDate = new Date(targetStart || targetEnd);
    const today = new Date();

    const dayInMilliseconds = 24 * 60 * 60 * 1000;
    const periodDays = Math.max(
      1,
      Math.round((endDate - startDate) / dayInMilliseconds) + 1,
    );
    const daysElapsed = Math.max(0, Math.round((today - startDate) / dayInMilliseconds) + 1);
    const daysLeftInPeriod = Math.max(0, periodDays - daysElapsed);
    const isStillPossible = daysLeftInPeriod >= calculation.daysRemaining;

    return {
      daysLeftInPeriod,
      isPossible: isStillPossible,
    };
  };
  const runway = getRunwayMetrics();

  const displayHomeDays =
    hasValidTravelRecords && calculation ? (calculation?.homeDays ?? 0) : 0;
  const displayOutsideDays =
    hasValidTravelRecords && calculation
      ? (calculation?.outsideDays ?? 0)
      : 0;
  const remainingTargetDays = Math.max(
    0,
    definedMilestone - displayOutsideDays,
  );

  const getCurrentFootprint = () => {
    if (records.length === 0) return homeCountryName;
    const gpsRecords = records.filter(
      (r) =>
        r.purpose === "Daily GPS Check-In" ||
        r.purpose === "Country Changed",
    );
    const targetRecords = gpsRecords.length > 0 ? gpsRecords : records;

    const latestRecord = [...targetRecords].sort((a, b) => {
      const dateA = new Date(a.arrivalDate || a.departureDate || 0);
      const dateB = new Date(b.arrivalDate || b.departureDate || 0);
      return dateB - dateA;
    })[0];

    if (
      latestRecord?.toCountry?.toUpperCase() === "ABROAD" ||
      latestRecord?.toCountry?.toUpperCase() === "OTHER"
    ) {
      return "Abroad";
    }
    return latestRecord?.toCountry
      ? getFullCountryName(latestRecord.toCountry)
      : "Locating...";
  };

  const currentFootprintDisplay = getCurrentFootprint();
  const homeBase = (
    profile?.homeCountry ||
    profile?.nativeCountry ||
    "US"
  ).toUpperCase();
  const computedDayMap = {};

  if (hasValidTravelRecords) {
    records.forEach((record) => {
      if (!record?.arrivalDate || !record?.departureDate) return;
      if (
        isAfter(parseISO(record.departureDate), parseISO(record.arrivalDate))
      )
        return;
      if (
        record.arrivalDate === record.departureDate &&
        (record.purpose === "Calendar Check-In" ||
          record.purpose === "Calendar Check-Out" ||
          record.purpose === "Daily GPS Check-In")
      ) {
        return;
      }

      const isRecordHome =
        record.toCountry && record.toCountry.toUpperCase() === homeBase;
      const days = eachDayOfInterval({
        start: new Date(record.departureDate + "T00:00:00"),
        end: new Date(record.arrivalDate + "T00:00:00"),
      });

      days.forEach((day) => {
        const key = format(day, "yyyy-MM-dd");
        computedDayMap[key] = {
          status: isRecordHome ? "Home Stay" : "Abroad Stay",
          country: getFullCountryName(record.toCountry),
        };
      });
    });

    records.forEach((record) => {
      if (!record?.arrivalDate || !record?.departureDate) return;
      if (record.arrivalDate !== record.departureDate) return;
      if (
        record.purpose !== "Calendar Check-In" &&
        record.purpose !== "Calendar Check-Out" &&
        record.purpose !== "Daily GPS Check-In"
      )
        return;

      const key = record.arrivalDate;
      const isRecordHome =
        record.toCountry && record.toCountry.toUpperCase() === homeBase;

      computedDayMap[key] = {
        status: isRecordHome ? "Home Stay" : "Abroad Stay",
        country: getFullCountryName(record.toCountry),
      };
    });
  }

  const calendarHomeDays = displayHomeDays;
  const calendarAbroadDays = displayOutsideDays;
  const loggedTotalDays =
    Number(calendarHomeDays || 0) + Number(calendarAbroadDays || 0);

  const handleFormSubmitCallback = async (data) => {
    try {
      const normalizeDate = (date) => {
        if (!date) return "";
        return date.includes("T") ? date.split("T")[0] : date;
      };

      const isDuplicate = records.some((record) => {
        if (editingRecord && record.recordId === editingRecord.recordId) {
          return false;
        }

        return (
          normalizeDate(record.departureDate) ===
            normalizeDate(data.departureDate) &&
          normalizeDate(record.arrivalDate) ===
            normalizeDate(data.arrivalDate) &&
          (record.fromCountry || "").toUpperCase() ===
            (data.fromCountry || "").toUpperCase() &&
          (record.toCountry || "").toUpperCase() ===
            (data.toCountry || "").toUpperCase()
        );
      });

      if (isDuplicate) {
        toast.error(
          "A travel record with the same dates and countries already exists.",
        );
        return;
      }

      if (editingRecord) {
        await updateTravelRecord(editingRecord.recordId, data);
        toast.success("Record updated successfully");
      } else {
        await addTravelRecord(user.uid, data);
        toast.success("Travel record added successfully");
      }

      setShowForm(false);
      setEditingRecord(null);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Unable to save travel record");
    }
  };

  return {
    user,
    profile,
    records,
    metricsLoading,
    showForm,
    setShowForm,
    editingRecord,
    setEditingRecord,
    isMenuOpen,
    setIsMenuOpen,
    menuRef,
    handleTogglePresence,
    getFullCountryName,
    formatToMonthDay,
    calculation,
    homeCountryName,
    targetTimezone,
    horizonPeriodStart,
    horizonPeriodEnd,
    definedMilestone,
    hasValidTravelRecords,
    runway,
    displayHomeDays,
    displayOutsideDays,
    remainingTargetDays,
    currentFootprintDisplay,
    computedDayMap,
    calendarHomeDays,
    calendarAbroadDays,
    loggedTotalDays,
    handleFormSubmitCallback,
  };
}




// import { useEffect, useState, useRef } from "react";
// import { useAuth } from "../context/AuthContext";
// import {
//   subscribeToTravelRecords,
//   addTravelRecord,
//   updateTravelRecord,
// } from "../firebase/firestoreService";
// import { calculateResidencyStatus } from "../utils/residencyCalculator";
// import { autoTrackLocation } from "../utils/locationTracker";
// import { countries } from "../utils/countries";
// import toast from "react-hot-toast";
// import {
//   format,
//   parseISO,
//   eachDayOfInterval,
//   subDays,
//   isAfter,
// } from "date-fns";
// import { usePresenceToggle } from "./usePresenceToggle";

// export function useResidencyDashboard() {
//   const { user, profile } = useAuth();
//   const [records, setRecords] = useState([]);
//   const [metricsLoading, setMetricsLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [editingRecord, setEditingRecord] = useState(null);

//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const menuRef = useRef(null);

//   const isCreatingInitialHomeStay = useRef(false);

//   const { handleTogglePresence } = usePresenceToggle(user, profile, records);

//   const getFullCountryName = (code) => {
//     if (!code) return "Unknown Base";
//     if (code.toUpperCase() === "ABROAD" || code.toUpperCase() === "OTHER")
//       return "Abroad";
//     const match = countries.find(
//       (c) => c.code.toUpperCase() === code.toUpperCase(),
//     );
//     return match ? match.name : code;
//   };

//   const formatToMonthDay = (dateStr) => {
//     if (!dateStr || dateStr.includes("Open") || dateStr === "not-set")
//       return "Not Set";

//     try {
//       if (/^\d{2}-\d{2}$/.test(dateStr)) {
//         const [month, day] = dateStr.split("-");
//         const shortMonths = [
//           "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
//         ];
//         const monthIndex = parseInt(month, 10) - 1;

//         if (monthIndex >= 0 && monthIndex < 12) {
//           return `${day} ${shortMonths[monthIndex]}`;
//         }
//       }
//       return format(parseISO(dateStr), "dd MMM");
//     } catch (e) {
//       return dateStr;
//     }
//   };

//  // 1. Keep the Firebase socket connection running fast and permanent
//   useEffect(() => {
//     window.scrollTo(0, 0);
//     if (!user) return;

//     const unsubscribe = subscribeToTravelRecords(
//       user.uid,
//       (fetchedRecords) => {
//         setRecords(fetchedRecords);
//         setMetricsLoading(false);
//       },
//       (error) => {
//         console.error(error);
//         setMetricsLoading(false);
//       },
//     );

//     return () => unsubscribe();
//   }, [user]); // Only run when user logs in or out

//   // 2. Force calculations to re-evaluate instantly when profile properties modify
//   const calculation = useMemo(() => {
//     if (metricsLoading) return null;
//     return calculateResidencyStatus(records, profile);
//   }, [
//     records, 
//     profile, 
//     metricsLoading,
//     profile?.fyStart,
//     profile?.fyEnd,
//     profile?.homeCountry,
//     profile?.nativeCountry,
//     profile?.residencyThreshold
//   ]);
//   useEffect(() => {
//     function handleClickOutsideMenu(event) {
//       if (menuRef.current && !menuRef.current.contains(event.target)) {
//         setIsMenuOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutsideMenu);
//     return () =>
//       document.removeEventListener("mousedown", handleClickOutsideMenu);
//   }, []);

//   // useEffect(() => {
//   //   if (!user || metricsLoading || !profile) return;
//   //   const fyStart = profile?.fyStart || profile?.residencyPeriodStart;
//   //   if (!fyStart) return;

//   //   const rawHomeCountry =
//   //     profile?.homeCountry || profile?.nativeCountry || "US";
//   //   const initialHomeStayRecord = records.find(
//   //     (r) => r.purpose === "Initial Home Stay",
//   //   );

//   //  if (!initialHomeStayRecord && !isCreatingInitialHomeStay.current && records.length === 0 && !metricsLoading) {
//   //     isCreatingInitialHomeStay.current = true;
//   //     const today = new Date();
//   //     const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
//   //     const cleanStartDate = fyStart.includes("T")
//   //       ? fyStart.split("T")[0]
//   //       : fyStart;

//   //     // Add check inside local scope execution to absolutely make sure double firing is stopped
//   //     const isAlreadyListed = records.some(r => r.purpose === "Initial Home Stay");
//   //     if (isAlreadyListed) return;

//   //     addTravelRecord(user.uid, {
//   //       departureDate: cleanStartDate,
//   //       arrivalDate: yesterdayStr,
//   //       fromCountry: rawHomeCountry,
//   //       toCountry: rawHomeCountry,
//   //       purpose: "Initial Home Stay",
//   //     }).catch((err) => {
//   //       console.error("[Initial Home Stay Auto-Creation Error]:", err);
//   //       isCreatingInitialHomeStay.current = false;
//   //     });
//   //   }else if (initialHomeStayRecord) {
//   //     const oldHomeCountry = initialHomeStayRecord.toCountry;

//   //     if (
//   //       oldHomeCountry !== rawHomeCountry ||
//   //       initialHomeStayRecord.fromCountry !== rawHomeCountry
//   //     ) {
//   //       const syncOperations = [
//   //         updateTravelRecord(initialHomeStayRecord.recordId, {
//   //           fromCountry: rawHomeCountry,
//   //           toCountry: rawHomeCountry,
//   //           departureDate: initialHomeStayRecord.departureDate,
//   //           arrivalDate: initialHomeStayRecord.arrivalDate,
//   //           purpose: "Initial Home Stay",
//   //         }),
//   //       ];

//   //       records.forEach((record) => {
//   //         if (
//   //           record.recordId !== initialHomeStayRecord.recordId &&
//   //           record.fromCountry === oldHomeCountry &&
//   //           (record.purpose === "Daily GPS Check-In" ||
//   //             record.purpose === "Country Changed")
//   //         ) {
//   //           syncOperations.push(
//   //             updateTravelRecord(record.recordId, {
//   //               ...record,
//   //               fromCountry: rawHomeCountry,
//   //             }),
//   //           );
//   //         }
//   //       });

//   //       Promise.all(syncOperations).catch((err) =>
//   //         console.error(
//   //           "[Profile Country Sync cascading update failed]:",
//   //           err,
//   //         ),
//   //       );
//   //     }
//   //   }
//   // }, [user, profile, metricsLoading, records]);

//   useEffect(() => {
//     if (!user || metricsLoading || !profile) return;

//     const fyStart = profile?.fyStart || profile?.residencyPeriodStart;
//     const hasInitialHomeStay = records.some(
//       (r) => r.purpose === "Initial Home Stay",
//     );

//     if (fyStart && !hasInitialHomeStay) {
//       return;
//     }

//     const today = new Date().toISOString().split("T")[0];
//     const localStorageKey = `lastLocationTrackDate_${user.uid}`;
//     const alreadyTrackedToday = localStorage.getItem(localStorageKey);

//     const gpsRecordExistsInDb = records.some((r) => {
//       const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;
//       return (
//         arrival === today &&
//         (r.purpose === "Daily GPS Check-In" ||
//           r.purpose === "Country Changed")
//       );
//     });

//     if (!gpsRecordExistsInDb && alreadyTrackedToday === today) {
//       localStorage.removeItem(localStorageKey);
//     }

//     if (gpsRecordExistsInDb || window.isLocationTrackingActive === today) {
//       return;
//     }

//     const runTracking = async () => {
//       try {
//         const tracked = await autoTrackLocation(user, records, profile);
//         if (tracked) {
//           toast.success("Daily GPS check-in recorded successfully");
//           localStorage.setItem(localStorageKey, today);
//         }
//       } catch (error) {
//         console.error("[Dashboard GPS Auto-Track Error]:", error);
//       }
//     };

//     runTracking();
//   }, [user, metricsLoading, records, profile]);

//   const calculation = metricsLoading
//     ? null
//     : calculateResidencyStatus(records, profile);

//   const rawHomeCountry =
//     profile?.homeCountry || profile?.nativeCountry || "US";
//   const homeCountryName = rawHomeCountry
//     ? getFullCountryName(rawHomeCountry)
//     : "Configuring Base...";

//   const targetTimezone = profile?.timezone || "Not Set";
//   const horizonPeriodStart =
//     profile?.residencyPeriodStart || profile?.fyStart || "Start Date Open";
//   const horizonPeriodEnd =
//     profile?.residencyPeriodEnd || profile?.fyEnd || "End Date Open";
//   const definedMilestone = parseInt(
//     profile?.residencyThreshold || "183",
//     10,
//   );

//   const hasValidTravelRecords = records.some(
//     (record) =>
//       record?.arrivalDate &&
//       record?.departureDate &&
//       (record?.toCountry || record?.fromCountry),
//   );

//   const getRunwayMetrics = () => {
//     const targetEnd = profile?.residencyPeriodEnd || profile?.fyEnd;
//     const targetStart = profile?.residencyPeriodStart || profile?.fyStart;

//     if (!targetEnd || !hasValidTravelRecords || !calculation) {
//       return { daysLeftInPeriod: 0, isPossible: true };
//     }

//     const endDate = new Date(targetEnd);
//     const startDate = new Date(targetStart || targetEnd);
//     const today = new Date();

//     const dayInMilliseconds = 24 * 60 * 60 * 1000;
//     const periodDays = Math.max(
//       1,
//       Math.round((endDate - startDate) / dayInMilliseconds) + 1,
//     );
//     const daysElapsed = Math.max(0, Math.round((today - startDate) / dayInMilliseconds) + 1);
//     const daysLeftInPeriod = Math.max(0, periodDays - daysElapsed);
//     const isStillPossible = daysLeftInPeriod >= calculation.daysRemaining;

//     return {
//       daysLeftInPeriod,
//       isPossible: isStillPossible,
//     };
//   };
//   const runway = getRunwayMetrics();

//   const displayHomeDays =
//     hasValidTravelRecords && calculation ? (calculation?.homeDays ?? 0) : 0;
//   const displayOutsideDays =
//     hasValidTravelRecords && calculation
//       ? (calculation?.outsideDays ?? 0)
//       : 0;
//   const remainingTargetDays = Math.max(
//     0,
//     definedMilestone - displayOutsideDays,
//   );

//   const getCurrentFootprint = () => {
//     if (records.length === 0) return homeCountryName;
//     const gpsRecords = records.filter(
//       (r) =>
//         r.purpose === "Daily GPS Check-In" ||
//         r.purpose === "Country Changed",
//     );
//     const targetRecords = gpsRecords.length > 0 ? gpsRecords : records;

//     const latestRecord = [...targetRecords].sort((a, b) => {
//       const dateA = new Date(a.arrivalDate || a.departureDate || 0);
//       const dateB = new Date(b.arrivalDate || b.departureDate || 0);
//       return dateB - dateA;
//     })[0];

//     if (
//       latestRecord?.toCountry?.toUpperCase() === "ABROAD" ||
//       latestRecord?.toCountry?.toUpperCase() === "OTHER"
//     ) {
//       return "Abroad";
//     }
//     return latestRecord?.toCountry
//       ? getFullCountryName(latestRecord.toCountry)
//       : "Locating...";
//   };

//   const currentFootprintDisplay = getCurrentFootprint();
//   const homeBase = (
//     profile?.homeCountry ||
//     profile?.nativeCountry ||
//     "US"
//   ).toUpperCase();
//   const computedDayMap = {};

//   if (hasValidTravelRecords) {
//     records.forEach((record) => {
//       if (!record?.arrivalDate || !record?.departureDate) return;
//       if (
//         isAfter(parseISO(record.departureDate), parseISO(record.arrivalDate))
//       )
//         return;
//       if (
//         record.arrivalDate === record.departureDate &&
//         (record.purpose === "Calendar Check-In" ||
//           record.purpose === "Calendar Check-Out" ||
//           record.purpose === "Daily GPS Check-In")
//       ) {
//         return;
//       }

//       const isRecordHome =
//         record.toCountry && record.toCountry.toUpperCase() === homeBase;
//       const days = eachDayOfInterval({
//         start: new Date(record.departureDate + "T00:00:00"),
//         end: new Date(record.arrivalDate + "T00:00:00"),
//       });

//       days.forEach((day) => {
//         const key = format(day, "yyyy-MM-dd");
//         computedDayMap[key] = {
//           status: isRecordHome ? "Home Stay" : "Abroad Stay",
//           country: getFullCountryName(record.toCountry),
//         };
//       });
//     });

//     records.forEach((record) => {
//       if (!record?.arrivalDate || !record?.departureDate) return;
//       if (record.arrivalDate !== record.departureDate) return;
//       if (
//         record.purpose !== "Calendar Check-In" &&
//         record.purpose !== "Calendar Check-Out" &&
//         record.purpose !== "Daily GPS Check-In"
//       )
//         return;

//       const key = record.arrivalDate;
//       const isRecordHome =
//         record.toCountry && record.toCountry.toUpperCase() === homeBase;

//       computedDayMap[key] = {
//         status: isRecordHome ? "Home Stay" : "Abroad Stay",
//         country: getFullCountryName(record.toCountry),
//       };
//     });
//   }

//   const calendarHomeDays = displayHomeDays;
//   const calendarAbroadDays = displayOutsideDays;
//   const loggedTotalDays =
//     Number(calendarHomeDays || 0) + Number(calendarAbroadDays || 0);

//   const handleFormSubmitCallback = async (data) => {
//     try {
//       const normalizeDate = (date) => {
//         if (!date) return "";
//         return date.includes("T") ? date.split("T")[0] : date;
//       };

//       const isDuplicate = records.some((record) => {
//         if (editingRecord && record.recordId === editingRecord.recordId) {
//           return false;
//         }

//         return (
//           normalizeDate(record.departureDate) ===
//             normalizeDate(data.departureDate) &&
//           normalizeDate(record.arrivalDate) ===
//             normalizeDate(data.arrivalDate) &&
//           (record.fromCountry || "").toUpperCase() ===
//             (data.fromCountry || "").toUpperCase() &&
//           (record.toCountry || "").toUpperCase() ===
//             (data.toCountry || "").toUpperCase()
//         );
//       });

//       if (isDuplicate) {
//         toast.error(
//           "A travel record with the same dates and countries already exists.",
//         );
//         return;
//       }

//       if (editingRecord) {
//         await updateTravelRecord(editingRecord.recordId, data);
//         toast.success("Record updated successfully");
//       } else {
//         await addTravelRecord(user.uid, data);
//         toast.success("Travel record added successfully");
//       }

//       setShowForm(false);
//       setEditingRecord(null);
//     } catch (error) {
//       console.error(error);
//       toast.error(error?.message || "Unable to save travel record");
//     }
//   };

//   return {
//     user,
//     profile,
//     records,
//     metricsLoading,
//     showForm,
//     setShowForm,
//     editingRecord,
//     setEditingRecord,
//     isMenuOpen,
//     setIsMenuOpen,
//     menuRef,
//     handleTogglePresence,
//     getFullCountryName,
//     formatToMonthDay,
//     calculation,
//     homeCountryName,
//     targetTimezone,
//     horizonPeriodStart,
//     horizonPeriodEnd,
//     definedMilestone,
//     hasValidTravelRecords,
//     runway,
//     displayHomeDays,
//     displayOutsideDays,
//     remainingTargetDays,
//     currentFootprintDisplay,
//     computedDayMap,
//     calendarHomeDays,
//     calendarAbroadDays,
//     loggedTotalDays,
//     handleFormSubmitCallback,
//   };
// }