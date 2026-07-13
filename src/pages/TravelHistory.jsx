import { useForm } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import TravelForm from "../components/tracker/TravelForm";
import {
  addTravelRecord,
  updateTravelRecord,
  deleteTravelRecord,
  subscribeToTravelRecords,
} from "../firebase/firestoreService";
import Swal from "sweetalert2";
import TravelTable from "../components/tracker/TravelTable";
import toast from "react-hot-toast";
import {
  FiMapPin,
  FiPlus,
  FiGlobe,
  FiActivity,
  FiChevronDown,
  FiCalendar,
} from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";
import { countries } from "../utils/countries";
import StayCalendar from "../components/tracker/StayCalendar";
import {
  format,
  parseISO,
  eachDayOfInterval,
  subDays,
  addDays,
  isAfter,
} from "date-fns";
import { calculateResidencyStatus } from "../utils/residencyCalculator";

export default function TravelHistory() {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingLocation, setTrackingLocation] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarModalStyle, setCalendarModalStyle] = useState({
    top: 80,
    left: 0,
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [currentCountry, setCurrentCountry] = useState("");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isCurrentlyTracking = useRef(false);
  const isCreatingInitialHomeStay = useRef(false);

  const getFullCountryName = (code) => {
    if (!code) return "";
    if (code.toUpperCase() === "ABROAD" || code.toUpperCase() === "OTHER")
      return "Abroad";
    const match = countries.find(
      (c) => c.code.toUpperCase() === code.toUpperCase(),
    );
    return match ? match.name : code;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) return;

    const unsubscribe = subscribeToTravelRecords(
      user.uid,
      (data) => {
        setRecords(data);
        loading && setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error("Unable to load travel records");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!showCalendarModal) return undefined;

    const computeOffsets = () => {
      const nav = document.querySelector("nav");
      const top = nav ? nav.getBoundingClientRect().height : 80;
      const isDesktop = window.innerWidth >= 768;
      const left = isDesktop ? 256 : 0;
      setCalendarModalStyle({ top, left });
    };

    computeOffsets();
    window.addEventListener("resize", computeOffsets);
    return () => window.removeEventListener("resize", computeOffsets);
  }, [showCalendarModal]);

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

  // Handle Automatic Initial Home Stay Record Creation & Profile Country Sync Updates
  useEffect(() => {
    if (!user || loading || !profile) return;
    const fyStart = profile?.fyStart || profile?.residencyPeriodStart;
    if (!fyStart) return;

    const rawHomeCountry = profile?.homeCountry || profile?.nativeCountry || "US";
    const initialHomeStayRecord = records.find((r) => r.purpose === "Initial Home Stay");

    if (!initialHomeStayRecord && !isCreatingInitialHomeStay.current) {
      isCreatingInitialHomeStay.current = true;
      const today = new Date();
      const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
      const cleanStartDate = fyStart.includes("T") ? fyStart.split("T")[0] : fyStart;

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
      // FIX: If profile home country changes, automatically update existing Initial Home Stay record
      if (initialHomeStayRecord.fromCountry !== rawHomeCountry || initialHomeStayRecord.toCountry !== rawHomeCountry) {
        updateTravelRecord(initialHomeStayRecord.recordId, {
          fromCountry: rawHomeCountry,
          toCountry: rawHomeCountry,
          departureDate: initialHomeStayRecord.departureDate,
          arrivalDate: initialHomeStayRecord.arrivalDate,
          purpose: "Initial Home Stay"
        }).catch((err) => console.error("[Initial Home Stay Update Sync Error]:", err));
      }
    }
  }, [user, profile, loading, records]);

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleSaveRecord = async (data) => {
    try {
      if (editingRecord) {
        await updateTravelRecord(editingRecord.recordId, data);
        toast.success("Record updated");
      } else {
        await addTravelRecord(user.uid, data);
        toast.success("Record added");
      }
      setShowForm(false);
      setEditingRecord(null);
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Travel Record?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    await deleteTravelRecord(id);
    toast.success("Record deleted");
  };

  const handleTogglePresence = async (dateStr, nextStatus) => {
    try {
      const homeBase = (
        profile?.homeCountry ||
        profile?.nativeCountry ||
        "US"
      ).toUpperCase();
      const cleanDateStr = dateStr.includes("T")
        ? dateStr.split("T")[0]
        : dateStr;

      const normalizeDate = (d) => {
        if (!d) return d;
        return d.includes("T") ? d.split("T")[0] : d;
      };

      const explicitSingleRecord = records.find((r) => {
        const rDept = normalizeDate(r.departureDate);
        const rArr = normalizeDate(r.arrivalDate);
        return (
          rDept === cleanDateStr &&
          rArr === cleanDateStr &&
          (r.purpose === "Calendar Check-In" ||
            r.purpose === "Calendar Check-Out" ||
            r.purpose === "Daily GPS Check-In")
        );
      });

      const parentRangeRecord = records
        .filter((r) => {
          if (!r.departureDate || !r.arrivalDate) return false;
          const rDept = normalizeDate(r.departureDate);
          const rArr = normalizeDate(r.arrivalDate);
          if (
            rDept === rArr &&
            (r.purpose === "Calendar Check-In" ||
              r.purpose === "Calendar Check-Out" ||
              r.purpose === "Daily GPS Check-In")
          ) {
            return false;
          }
          return cleanDateStr >= rDept && cleanDateStr <= rArr;
        })
        .sort((a, b) => {
          const aLength =
            new Date(normalizeDate(a.arrivalDate)) -
            new Date(normalizeDate(a.departureDate));
          const bLength =
            new Date(normalizeDate(b.arrivalDate)) -
            new Date(normalizeDate(b.departureDate));
          return aLength - bLength;
        })[0];

      const targetToCountry =
        nextStatus === "Abroad Stay" ? "ABROAD" : homeBase;
      const targetFromCountry =
        nextStatus === "Abroad Stay" ? homeBase : "ABROAD";
      const targetPurpose =
        nextStatus === "Abroad Stay"
          ? "Calendar Check-In"
          : "Calendar Check-Out";

      if (explicitSingleRecord) {
        await updateTravelRecord(explicitSingleRecord.recordId, {
          departureDate: cleanDateStr,
          arrivalDate: cleanDateStr,
          fromCountry: targetFromCountry,
          toCountry: targetToCountry,
          purpose: targetPurpose,
        });
      } else if (parentRangeRecord) {
        const pStartStr = normalizeDate(parentRangeRecord.departureDate);
        const pEndStr = normalizeDate(parentRangeRecord.arrivalDate);

        const baseProps = {
          fromCountry: parentRangeRecord.fromCountry || homeBase,
          toCountry: parentRangeRecord.toCountry || homeBase,
          purpose:
            parentRangeRecord.purpose === "Initial Home Stay"
              ? "Initial Home Stay"
              : "Automated System Entry",
        };

        const currentDate = parseISO(cleanDateStr);
        const prevDayStr = format(subDays(currentDate, 1), "yyyy-MM-dd");
        const nextDayStr = format(addDays(currentDate, 1), "yyyy-MM-dd");

        if (pStartStr === pEndStr) {
          await updateTravelRecord(parentRangeRecord.recordId, {
            departureDate: cleanDateStr,
            arrivalDate: cleanDateStr,
            fromCountry: targetFromCountry,
            toCountry: targetToCountry,
            purpose: targetPurpose,
          });
        } else if (pStartStr === cleanDateStr) {
          await updateTravelRecord(parentRangeRecord.recordId, {
            ...baseProps,
            departureDate: nextDayStr,
            arrivalDate: pEndStr,
          });

          const existingSingleDayRecord = records.find((r) => {
            const dep = normalizeDate(r.departureDate);
            const arr = normalizeDate(r.arrivalDate);
            return dep === cleanDateStr && arr === cleanDateStr;
          });

          if (!existingSingleDayRecord) {
            await addTravelRecord(user.uid, {
              departureDate: cleanDateStr,
              arrivalDate: cleanDateStr,
              fromCountry: targetFromCountry,
              toCountry: targetToCountry,
              purpose: targetPurpose,
            });
          }
        } else if (pEndStr === cleanDateStr) {
          await updateTravelRecord(parentRangeRecord.recordId, {
            ...baseProps,
            departureDate: pStartStr,
            arrivalDate: prevDayStr,
          });

          const existingSingleDayRecord = records.find((r) => {
            const dep = normalizeDate(r.departureDate);
            const arr = normalizeDate(r.arrivalDate);
            return dep === cleanDateStr && arr === cleanDateStr;
          });

          if (!existingSingleDayRecord) {
            await addTravelRecord(user.uid, {
              departureDate: cleanDateStr,
              arrivalDate: cleanDateStr,
              fromCountry: targetFromCountry,
              toCountry: targetToCountry,
              purpose: targetPurpose,
            });
          }
        } else {
          if (
            isAfter(parseISO(pStartStr), parseISO(prevDayStr)) ||
            isAfter(parseISO(nextDayStr), parseISO(pEndStr))
          ) {
            return;
          }

          const existingSingleDayRecord = records.find((r) => {
            const dep = normalizeDate(r.departureDate);
            const arr = normalizeDate(r.arrivalDate);
            return dep === cleanDateStr && arr === cleanDateStr;
          });

          const operations = [
            updateTravelRecord(parentRangeRecord.recordId, {
              ...baseProps,
              departureDate: pStartStr,
              arrivalDate: prevDayStr,
            }),
            addTravelRecord(user.uid, {
              ...baseProps,
              departureDate: nextDayStr,
              arrivalDate: pEndStr,
              purpose: "Automated System Entry",
            }),
          ];

          if (!existingSingleDayRecord) {
            operations.push(
              addTravelRecord(user.uid, {
                departureDate: cleanDateStr,
                arrivalDate: cleanDateStr,
                fromCountry: targetFromCountry,
                toCountry: targetToCountry,
                purpose: targetPurpose,
              }),
            );
          }

          await Promise.all(operations);
        }
      } else {
        const existingSingleDayRecord = records.find((r) => {
          const dep = normalizeDate(r.departureDate);
          const arr = normalizeDate(r.arrivalDate);
          return dep === cleanDateStr && arr === cleanDateStr;
        });

        if (!existingSingleDayRecord) {
          await addTravelRecord(user.uid, {
            departureDate: cleanDateStr,
            arrivalDate: cleanDateStr,
            fromCountry: targetFromCountry,
            toCountry: targetToCountry,
            purpose: targetPurpose,
          });
        }
      }

      toast.success(`Presence status updated for ${cleanDateStr}`);
    } catch (error) {
      console.error("[Dashboard Error]:", error);
      toast.error("Could not update presence tracking status.");
    }
  };

  const hasValidTravelRecords = records.some(
    (record) =>
      record?.arrivalDate &&
      record?.departureDate &&
      (record?.toCountry || record?.fromCountry),
  );

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <BiLoaderAlt className="animate-spin text-4xl text-blue-600" />
          <p className="text-slate-500">Loading travel records...</p>
        </div>
      </div>
    );
  }

  const computedDayMap = {};
  const homeBase = (
    profile?.homeCountry ||
    profile?.nativeCountry ||
    "US"
  ).toUpperCase();

  if (hasValidTravelRecords) {
    records.forEach((record) => {
      if (!record?.arrivalDate || !record?.departureDate) return;
      if (isAfter(parseISO(record.departureDate), parseISO(record.arrivalDate)))
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

  const calculation = calculateResidencyStatus(records, profile);
  const calendarHomeDays = hasValidTravelRecords
    ? (calculation?.homeDays ?? 0)
    : 0;
  const calendarAbroadDays = hasValidTravelRecords
    ? (calculation?.outsideDays ?? 0)
    : 0;
  const totalRecordsCount = records.length;

  const rawFootprint = currentCountry || records[0]?.toCountry;
  const currentFootprintDisplay =
    records.length > 0
      ? getFullCountryName(rawFootprint) || "Locating..."
      : "No History Saved";

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Travel History
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
            Review your travel timeline and residency records.
          </p>
        </div>

        <div className="relative w-full sm:w-auto shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-md text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer w-full sm:w-auto"
          >
            <FiPlus />
            <span>Add Previous Travel Record</span>
            <FiChevronDown
              className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-full sm:w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setShowCalendarModal(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
              >
                <FiCalendar className="text-blue-500 text-base" />
                <span>Update via Calendar View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setEditingRecord(null);
                  setShowForm(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer border-t border-slate-100"
              >
                <FiPlus className="text-purple-500 text-base" />
                <span>Log via Manual Form</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base text-slate-500">Total Records</p>
              <h2 className="text-4xl font-bold text-slate-900 mt-2">
                {totalRecordsCount}
              </h2>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FiActivity className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base text-slate-500">Current Footprint</p>
              <h2 className="text-xl font-bold text-slate-900 mt-2 break-words">
                {currentFootprintDisplay}
              </h2>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
              <FiMapPin className="text-2xl text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Travel Records
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
                Your complete travel history in one place.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] sm:text-xs font-semibold self-start sm:self-auto shrink-0">
              {records.length} Check-ins
            </span>
          </div>
          <div className="p-5">
            <TravelTable
              records={records}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <TravelForm
              initialData={editingRecord}
              travelRecords={records}
              onSubmit={handleSaveRecord}
              onCancel={() => {
                setShowForm(false);
                setEditingRecord(null);
              }}
            />
          </div>
        </div>
      )}

      {showCalendarModal && (
        <div
          className="fixed flex items-start justify-center p-4"
          style={{
            top: calendarModalStyle.top,
            left: calendarModalStyle.left,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 40,
          }}
        >
          <div className="w-full max-w-4xl bg-white rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[calc(100vh-120px)] overflow-auto mx-auto border border-slate-100 touch-auto">
            <div className="flex justify-between sm:gap-3 mb-2">
              <h2 className="text-xl font-bold text-slate-900">
                Stay Calendar
              </h2>
              <div className="flex flex-wrap gap-3">
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-50 border border-green-200 rounded-xl flex items-center">
                  <span className="text-green-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
                    🏠 Home: {calendarHomeDays} Days
                  </span>
                </div>
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center">
                  <span className="text-blue-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
                    🌍 Abroad: {calendarAbroadDays} Days
                  </span>
                </div>
                <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-purple-700 font-semibold text-sm">
                    Total: &nbsp;{calendarHomeDays + calendarAbroadDays} Days
                  </span>
                </div>
              </div>
            </div>

            <StayCalendar
              dayMap={computedDayMap}
              travelRecords={records}
              fyStart={profile?.fyStart || profile?.residencyPeriodStart}
              fyEnd={profile?.fyEnd || profile?.residencyPeriodEnd}
              onToggleDayPresence={handleTogglePresence}
            />
            <button
              type="button"
              onClick={() => setShowCalendarModal(false)}
              className="mt-4 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition duration-200"
            >
              Close Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}





// import { useForm } from "react-hook-form";
// import { useEffect, useState, useRef } from "react";
// import { useAuth } from "../context/AuthContext";
// import TravelForm from "../components/tracker/TravelForm";
// import {
//   addTravelRecord,
//   updateTravelRecord,
//   deleteTravelRecord,
//   subscribeToTravelRecords,
// } from "../firebase/firestoreService";
// import Swal from "sweetalert2";
// import TravelTable from "../components/tracker/TravelTable";
// import toast from "react-hot-toast";
// import {
//   FiMapPin,
//   FiPlus,
//   FiGlobe,
//   FiActivity,
//   FiChevronDown,
//   FiCalendar,
// } from "react-icons/fi";
// import { BiLoaderAlt } from "react-icons/bi";
// import { countries } from "../utils/countries";
// import StayCalendar from "../components/tracker/StayCalendar";
// import {
//   format,
//   parseISO,
//   eachDayOfInterval,
//   subDays,
//   addDays,
//   isAfter,
// } from "date-fns";
// import { calculateResidencyStatus } from "../utils/residencyCalculator";

// export default function TravelHistory() {
//   const { user, profile } = useAuth();
//   const [records, setRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [trackingLocation, setTrackingLocation] = useState(false);
//   const [showForm, setShowForm] = useState(false);
//   const [showCalendarModal, setShowCalendarModal] = useState(false);
//   const [calendarModalStyle, setCalendarModalStyle] = useState({
//     top: 80,
//     left: 0,
//   });
//   const [editingRecord, setEditingRecord] = useState(null);
//   const [currentCountry, setCurrentCountry] = useState("");

//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const menuRef = useRef(null);

//   const isCurrentlyTracking = useRef(false);
//   const isCreatingInitialHomeStay = useRef(false);

//   const getFullCountryName = (code) => {
//     if (!code) return "";
//     if (code.toUpperCase() === "ABROAD" || code.toUpperCase() === "OTHER")
//       return "Abroad";
//     const match = countries.find(
//       (c) => c.code.toUpperCase() === code.toUpperCase(),
//     );
//     return match ? match.name : code;
//   };

//   useEffect(() => {
//     window.scrollTo(0, 0);
//     if (!user) return;

//     const unsubscribe = subscribeToTravelRecords(
//       user.uid,
//       (data) => {
//         setRecords(data);
//         loading && setLoading(false);
//       },
//       (error) => {
//         console.error(error);
//         toast.error("Unable to load travel records");
//         setLoading(false);
//       },
//     );

//     return () => unsubscribe();
//   }, [user]);

//   useEffect(() => {
//     if (!showCalendarModal) return undefined;

//     const computeOffsets = () => {
//       const nav = document.querySelector("nav");
//       const top = nav ? nav.getBoundingClientRect().height : 80;
//       const isDesktop = window.innerWidth >= 768;
//       const left = isDesktop ? 256 : 0;
//       setCalendarModalStyle({ top, left });
//     };

//     computeOffsets();
//     window.addEventListener("resize", computeOffsets);
//     return () => window.removeEventListener("resize", computeOffsets);
//   }, [showCalendarModal]);

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

//   // Handle Automatic Initial Home Stay Record Creation with absolute concurrency safeguards
//   useEffect(() => {
//     if (!user || loading || !profile || isCreatingInitialHomeStay.current)
//       return;
//     const fyStart = profile?.fyStart || profile?.residencyPeriodStart;
//     if (!fyStart) return;

//     const hasInitialHomeStay = records.some(
//       (r) => r.purpose === "Initial Home Stay",
//     );
//     if (!hasInitialHomeStay) {
//       isCreatingInitialHomeStay.current = true;
//       const today = new Date();
//       const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
//       const rawHomeCountry =
//         profile?.homeCountry || profile?.nativeCountry || "US";
//       const cleanStartDate = fyStart.includes("T")
//         ? fyStart.split("T")[0]
//         : fyStart;

//       addTravelRecord(user.uid, {
//         departureDate: cleanStartDate,
//         arrivalDate: yesterdayStr,
//         fromCountry: rawHomeCountry,
//         toCountry: rawHomeCountry,
//         purpose: "Initial Home Stay",
//       }).catch((err) => {
//         console.error("[Initial Home Stay Auto-Creation Error]:", err);
//         isCreatingInitialHomeStay.current = false;
//       });
//     }
//   }, [user, profile, loading, records]);

//   const handleEdit = (record) => {
//     setEditingRecord(record);
//     setShowForm(true);
//   };

//   const handleSaveRecord = async (data) => {
//     try {
//       if (editingRecord) {
//         await updateTravelRecord(editingRecord.recordId, data);
//         toast.success("Record updated");
//       } else {
//         await addTravelRecord(user.uid, data);
//         toast.success("Record added");
//       }
//       setShowForm(false);
//       setEditingRecord(null);
//     } catch (error) {
//       console.error(error);
//       toast.error("Operation failed");
//     }
//   };

//   const handleDelete = async (id) => {
//     const result = await Swal.fire({
//       title: "Delete Travel Record?",
//       text: "This action cannot be undone.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#dc2626",
//       cancelButtonColor: "#64748b",
//       confirmButtonText: "Delete",
//     });

//     if (!result.isConfirmed) return;

//     await deleteTravelRecord(id);
//     toast.success("Record deleted");
//   };

//   const handleTogglePresence = async (dateStr, nextStatus) => {
//     try {
//       const homeBase = (
//         profile?.homeCountry ||
//         profile?.nativeCountry ||
//         "US"
//       ).toUpperCase();
//       const cleanDateStr = dateStr.includes("T")
//         ? dateStr.split("T")[0]
//         : dateStr;

//       const normalizeDate = (d) => {
//         if (!d) return d;
//         return d.includes("T") ? d.split("T")[0] : d;
//       };

//       const explicitSingleRecord = records.find((r) => {
//         const rDept = normalizeDate(r.departureDate);
//         const rArr = normalizeDate(r.arrivalDate);
//         return (
//           rDept === cleanDateStr &&
//           rArr === cleanDateStr &&
//           (r.purpose === "Calendar Check-In" ||
//             r.purpose === "Calendar Check-Out" ||
//             r.purpose === "Daily GPS Check-In")
//         );
//       });

//       const parentRangeRecord = records
//         .filter((r) => {
//           if (!r.departureDate || !r.arrivalDate) return false;
//           const rDept = normalizeDate(r.departureDate);
//           const rArr = normalizeDate(r.arrivalDate);
//           if (
//             rDept === rArr &&
//             (r.purpose === "Calendar Check-In" ||
//               r.purpose === "Calendar Check-Out" ||
//               r.purpose === "Daily GPS Check-In")
//           ) {
//             return false;
//           }
//           return cleanDateStr >= rDept && cleanDateStr <= rArr;
//         })
//         .sort((a, b) => {
//           const aLength =
//             new Date(normalizeDate(a.arrivalDate)) -
//             new Date(normalizeDate(a.departureDate));
//           const bLength =
//             new Date(normalizeDate(b.arrivalDate)) -
//             new Date(normalizeDate(b.departureDate));
//           return aLength - bLength;
//         })[0];

//       const targetToCountry =
//         nextStatus === "Abroad Stay" ? "ABROAD" : homeBase;
//       const targetFromCountry =
//         nextStatus === "Abroad Stay" ? homeBase : "ABROAD";
//       const targetPurpose =
//         nextStatus === "Abroad Stay"
//           ? "Calendar Check-In"
//           : "Calendar Check-Out";

//       if (explicitSingleRecord) {
//         await updateTravelRecord(explicitSingleRecord.recordId, {
//           departureDate: cleanDateStr,
//           arrivalDate: cleanDateStr,
//           fromCountry: targetFromCountry,
//           toCountry: targetToCountry,
//           purpose: targetPurpose,
//         });
//       } else if (parentRangeRecord) {
//         const pStartStr = normalizeDate(parentRangeRecord.departureDate);
//         const pEndStr = normalizeDate(parentRangeRecord.arrivalDate);

//         const baseProps = {
//           fromCountry: parentRangeRecord.fromCountry || homeBase,
//           toCountry: parentRangeRecord.toCountry || homeBase,
//           purpose:
//             parentRangeRecord.purpose === "Initial Home Stay"
//               ? "Initial Home Stay"
//               : "Automated System Entry",
//         };

//         const currentDate = parseISO(cleanDateStr);
//         const prevDayStr = format(subDays(currentDate, 1), "yyyy-MM-dd");
//         const nextDayStr = format(addDays(currentDate, 1), "yyyy-MM-dd");

//         if (pStartStr === pEndStr) {
//           await updateTravelRecord(parentRangeRecord.recordId, {
//             departureDate: cleanDateStr,
//             arrivalDate: cleanDateStr,
//             fromCountry: targetFromCountry,
//             toCountry: targetToCountry,
//             purpose: targetPurpose,
//           });
//         } else if (pStartStr === cleanDateStr) {
//           await updateTravelRecord(parentRangeRecord.recordId, {
//             ...baseProps,
//             departureDate: nextDayStr,
//             arrivalDate: pEndStr,
//           });

//           const existingSingleDayRecord = records.find((r) => {
//             const dep = normalizeDate(r.departureDate);
//             const arr = normalizeDate(r.arrivalDate);
//             return dep === cleanDateStr && arr === cleanDateStr;
//           });

//           if (!existingSingleDayRecord) {
//             await addTravelRecord(user.uid, {
//               departureDate: cleanDateStr,
//               arrivalDate: cleanDateStr,
//               fromCountry: targetFromCountry,
//               toCountry: targetToCountry,
//               purpose: targetPurpose,
//             });
//           }
//         } else if (pEndStr === cleanDateStr) {
//           await updateTravelRecord(parentRangeRecord.recordId, {
//             ...baseProps,
//             departureDate: pStartStr,
//             arrivalDate: prevDayStr,
//           });

//           const existingSingleDayRecord = records.find((r) => {
//             const dep = normalizeDate(r.departureDate);
//             const arr = normalizeDate(r.arrivalDate);
//             return dep === cleanDateStr && arr === cleanDateStr;
//           });

//           if (!existingSingleDayRecord) {
//             await addTravelRecord(user.uid, {
//               departureDate: cleanDateStr,
//               arrivalDate: cleanDateStr,
//               fromCountry: targetFromCountry,
//               toCountry: targetToCountry,
//               purpose: targetPurpose,
//             });
//           }
//         } else {
//           if (
//             isAfter(parseISO(pStartStr), parseISO(prevDayStr)) ||
//             isAfter(parseISO(nextDayStr), parseISO(pEndStr))
//           ) {
//             return;
//           }

//           const existingSingleDayRecord = records.find((r) => {
//             const dep = normalizeDate(r.departureDate);
//             const arr = normalizeDate(r.arrivalDate);
//             return dep === cleanDateStr && arr === cleanDateStr;
//           });

//           const operations = [
//             updateTravelRecord(parentRangeRecord.recordId, {
//               ...baseProps,
//               departureDate: pStartStr,
//               arrivalDate: prevDayStr,
//             }),
//             addTravelRecord(user.uid, {
//               ...baseProps,
//               departureDate: nextDayStr,
//               arrivalDate: pEndStr,
//               purpose: "Automated System Entry",
//             }),
//           ];

//           if (!existingSingleDayRecord) {
//             operations.push(
//               addTravelRecord(user.uid, {
//                 departureDate: cleanDateStr,
//                 arrivalDate: cleanDateStr,
//                 fromCountry: targetFromCountry,
//                 toCountry: targetToCountry,
//                 purpose: targetPurpose,
//               }),
//             );
//           }

//           await Promise.all(operations);
//         }
//       } else {
//         const existingSingleDayRecord = records.find((r) => {
//           const dep = normalizeDate(r.departureDate);
//           const arr = normalizeDate(r.arrivalDate);
//           return dep === cleanDateStr && arr === cleanDateStr;
//         });

//         if (!existingSingleDayRecord) {
//           await addTravelRecord(user.uid, {
//             departureDate: cleanDateStr,
//             arrivalDate: cleanDateStr,
//             fromCountry: targetFromCountry,
//             toCountry: targetToCountry,
//             purpose: targetPurpose,
//           });
//         }
//       }

//       toast.success(`Presence status updated for ${cleanDateStr}`);
//     } catch (error) {
//       console.error("[Dashboard Error]:", error);
//       toast.error("Could not update presence tracking status.");
//     }
//   };

//   const hasValidTravelRecords = records.some(
//     (record) =>
//       record?.arrivalDate &&
//       record?.departureDate &&
//       (record?.toCountry || record?.fromCountry),
//   );

//   if (loading) {
//     return (
//       <div className="h-[70vh] flex items-center justify-center">
//         <div className="flex flex-col items-center gap-3">
//           <BiLoaderAlt className="animate-spin text-4xl text-blue-600" />
//           <p className="text-slate-500">Loading travel records...</p>
//         </div>
//       </div>
//     );
//   }

//   const computedDayMap = {};
//   const homeBase = (
//     profile?.homeCountry ||
//     profile?.nativeCountry ||
//     "US"
//   ).toUpperCase();

//   if (hasValidTravelRecords) {
//     records.forEach((record) => {
//       if (!record?.arrivalDate || !record?.departureDate) return;
//       if (isAfter(parseISO(record.departureDate), parseISO(record.arrivalDate)))
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

//   const calculation = calculateResidencyStatus(records, profile);
//   const calendarHomeDays = hasValidTravelRecords
//     ? (calculation?.homeDays ?? 0)
//     : 0;
//   const calendarAbroadDays = hasValidTravelRecords
//     ? (calculation?.outsideDays ?? 0)
//     : 0;
//   const totalRecordsCount = records.length;

//   const rawFootprint = currentCountry || records[0]?.toCountry;
//   const currentFootprintDisplay =
//     records.length > 0
//       ? getFullCountryName(rawFootprint) || "Locating..."
//       : "No History Saved";

//   return (
//     <div className="space-y-8 relative">
//       <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
//         <div>
//           <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
//             Travel History
//           </h1>
//           <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
//             Review your travel timeline and residency records.
//           </p>
//         </div>

//         <div className="relative w-full sm:w-auto shrink-0" ref={menuRef}>
//           <button
//             type="button"
//             onClick={() => setIsMenuOpen(!isMenuOpen)}
//             className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-md text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer w-full sm:w-auto"
//           >
//             <FiPlus />
//             <span>Add Previous Travel Record</span>
//             <FiChevronDown
//               className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
//             />
//           </button>

//           {isMenuOpen && (
//             <div className="absolute right-0 mt-2 w-full sm:w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setShowCalendarModal(true);
//                   setIsMenuOpen(false);
//                 }}
//                 className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
//               >
//                 <FiCalendar className="text-blue-500 text-base" />
//                 <span>Update via Calendar View</span>
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setIsMenuOpen(false);
//                   setEditingRecord(null);
//                   setShowForm(true);
//                 }}
//                 className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer border-t border-slate-100"
//               >
//                 <FiPlus className="text-purple-500 text-base" />
//                 <span>Log via Manual Form</span>
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
//         <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-base text-slate-500">Total Records</p>
//               <h2 className="text-4xl font-bold text-slate-900 mt-2">
//                 {totalRecordsCount}
//               </h2>
//             </div>
//             <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
//               <FiActivity className="text-2xl text-blue-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-base text-slate-500">Current Footprint</p>
//               <h2 className="text-xl font-bold text-slate-900 mt-2 break-words">
//                 {currentFootprintDisplay}
//               </h2>
//             </div>
//             <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
//               <FiMapPin className="text-2xl text-green-600" />
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="w-full">
//         <div className="bg-white border border-slate-200 rounded-3xl shadow-sm">
//           <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//             <div>
//               <h2 className="text-base sm:text-lg font-semibold text-slate-900">
//                 Travel Records
//               </h2>
//               <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
//                 Your complete travel history in one place.
//               </p>
//             </div>
//             <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] sm:text-xs font-semibold self-start sm:self-auto shrink-0">
//               {records.length} Check-ins
//             </span>
//           </div>
//           <div className="p-5">
//             <TravelTable
//               records={records}
//               onDelete={handleDelete}
//               onEdit={handleEdit}
//             />
//           </div>
//         </div>
//       </div>

//       {showForm && (
//         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//           <div className="w-full max-w-2xl">
//             <TravelForm
//               initialData={editingRecord}
//               travelRecords={records}
//               onSubmit={handleSaveRecord}
//               onCancel={() => {
//                 setShowForm(false);
//                 setEditingRecord(null);
//               }}
//             />
//           </div>
//         </div>
//       )}

//       {showCalendarModal && (
//         <div
//           className="fixed flex items-start justify-center p-4"
//           style={{
//             top: calendarModalStyle.top,
//             left: calendarModalStyle.left,
//             right: 0,
//             bottom: 0,
//             backgroundColor: "rgba(0,0,0,0.6)",
//             zIndex: 40,
//           }}
//         >
//           <div className="w-full max-w-4xl bg-white rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[calc(100vh-120px)] overflow-auto mx-auto border border-slate-100 touch-auto">
//             <div className="flex justify-between sm:gap-3 mb-2">
//               <h2 className="text-xl font-bold text-slate-900">
//                 Stay Calendar
//               </h2>
//               <div className="flex flex-wrap gap-3">
//                 <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-50 border border-green-200 rounded-xl flex items-center">
//                   <span className="text-green-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
//                     🏠 Home: {calendarHomeDays} Days
//                   </span>
//                 </div>
//                 <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center">
//                   <span className="text-blue-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
//                     🌍 Abroad: {calendarAbroadDays} Days
//                   </span>
//                 </div>
//                 <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
//                   <span className="text-purple-700 font-semibold text-sm">
//                     Total: &nbsp;{calendarHomeDays + calendarAbroadDays} Days
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <StayCalendar
//               dayMap={computedDayMap}
//               travelRecords={records}
//               fyStart={profile?.fyStart || profile?.residencyPeriodStart}
//               fyEnd={profile?.fyEnd || profile?.residencyPeriodEnd}
//               onToggleDayPresence={handleTogglePresence}
//             />
//             <button
//               type="button"
//               onClick={() => setShowCalendarModal(false)}
//               className="mt-4 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition duration-200"
//             >
//               Close Calendar
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






// // import { useEffect, useState, useRef } from "react";
// // import { useAuth } from "../context/AuthContext";
// // import TravelForm from "../components/tracker/TravelForm";
// // import {
// //   addTravelRecord,
// //   updateTravelRecord,
// //   deleteTravelRecord,
// //   subscribeToTravelRecords,
// // } from "../firebase/firestoreService";
// // import Swal from "sweetalert2";
// // import TravelTable from "../components/tracker/TravelTable";
// // import toast from "react-hot-toast";
// // import {
// //   FiMapPin,
// //   FiPlus,
// //   FiGlobe,
// //   FiActivity,
// //   FiChevronDown,
// //   FiCalendar,
// // } from "react-icons/fi";
// // import { BiLoaderAlt } from "react-icons/bi";
// // import { countries } from "../utils/countries";
// // import StayCalendar from "../components/tracker/StayCalendar";
// // import {
// //   format,
// //   parseISO,
// //   eachDayOfInterval,
// //   subDays,
// //   addDays,
// //   isAfter,
// // } from "date-fns";
// // import { calculateResidencyStatus } from "../utils/residencyCalculator";

// // export default function TravelHistory() {
// //   const { user, profile } = useAuth();
// //   const [records, setRecords] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [trackingLocation, setTrackingLocation] = useState(false);
// //   const [showForm, setShowForm] = useState(false);
// //   const [showCalendarModal, setShowCalendarModal] = useState(false);
// //   const [calendarModalStyle, setCalendarModalStyle] = useState({
// //     top: 80,
// //     left: 0,
// //   });
// //   const [editingRecord, setEditingRecord] = useState(null);
// //   const [currentCountry, setCurrentCountry] = useState("");

// //   const [isMenuOpen, setIsMenuOpen] = useState(false);
// //   const menuRef = useRef(null);

// //   const isCurrentlyTracking = useRef(false);
// //   const isCreatingInitialHomeStay = useRef(false);

// //   const getFullCountryName = (code) => {
// //     if (!code) return "";
// //     if (code.toUpperCase() === "ABROAD" || code.toUpperCase() === "OTHER")
// //       return "Abroad";
// //     const match = countries.find(
// //       (c) => c.code.toUpperCase() === code.toUpperCase(),
// //     );
// //     return match ? match.name : code;
// //   };

// //   useEffect(() => {
// //     window.scrollTo(0, 0);
// //     if (!user) return;

// //     const unsubscribe = subscribeToTravelRecords(
// //       user.uid,
// //       (data) => {
// //         setRecords(data);
// //         setLoading(false);
// //       },
// //       (error) => {
// //         console.error(error);
// //         toast.error("Unable to load travel records");
// //         setLoading(false);
// //       },
// //     );

// //     return () => unsubscribe();
// //   }, [user]);

// //   useEffect(() => {
// //     if (!showCalendarModal) return undefined;

// //     const computeOffsets = () => {
// //       const nav = document.querySelector("nav");
// //       const top = nav ? nav.getBoundingClientRect().height : 80;
// //       const isDesktop = window.innerWidth >= 768;
// //       const left = isDesktop ? 256 : 0;
// //       setCalendarModalStyle({ top, left });
// //     };

// //     computeOffsets();
// //     window.addEventListener("resize", computeOffsets);
// //     return () => window.removeEventListener("resize", computeOffsets);
// //   }, [showCalendarModal]);

// //   useEffect(() => {
// //     function handleClickOutsideMenu(event) {
// //       if (menuRef.current && !menuRef.current.contains(event.target)) {
// //         setIsMenuOpen(false);
// //       }
// //     }
// //     document.addEventListener("mousedown", handleClickOutsideMenu);
// //     return () =>
// //       document.removeEventListener("mousedown", handleClickOutsideMenu);
// //   }, []);

// //   // Handle Automatic Initial Home Stay Record Creation with absolute concurrency safeguards
// //   useEffect(() => {
// //     if (!user || loading || !profile || isCreatingInitialHomeStay.current)
// //       return;
// //     const fyStart = profile?.fyStart || profile?.residencyPeriodStart;
// //     if (!fyStart) return;

// //     const hasInitialHomeStay = records.some(
// //       (r) => r.purpose === "Initial Home Stay",
// //     );
// //     if (!hasInitialHomeStay) {
// //       isCreatingInitialHomeStay.current = true;
// //       const todayStr = new Date().toISOString().split("T")[0];
// //       const rawHomeCountry =
// //         profile?.homeCountry || profile?.nativeCountry || "US";
// //       const cleanStartDate = fyStart.includes("T")
// //         ? fyStart.split("T")[0]
// //         : fyStart;

// //       addTravelRecord(user.uid, {
// //         departureDate: cleanStartDate,
// //         arrivalDate: todayStr,
// //         fromCountry: rawHomeCountry,
// //         toCountry: rawHomeCountry,
// //         purpose: "Initial Home Stay",
// //       }).catch((err) => {
// //         console.error("[Initial Home Stay Auto-Creation Error]:", err);
// //         isCreatingInitialHomeStay.current = false;
// //       });
// //     }
// //   }, [user, profile, loading, records]);

// //   const handleEdit = (record) => {
// //     setEditingRecord(record);
// //     setShowForm(true);
// //   };

// //   const handleSaveRecord = async (data) => {
// //     try {
// //       if (editingRecord) {
// //         await updateTravelRecord(editingRecord.recordId, data);
// //         toast.success("Record updated");
// //       } else {
// //         await addTravelRecord(user.uid, data);
// //         toast.success("Record added");
// //       }
// //       setShowForm(false);
// //       setEditingRecord(null);
// //     } catch (error) {
// //       console.error(error);
// //       toast.error("Operation failed");
// //     }
// //   };

// //   const handleDelete = async (id) => {
// //     const result = await Swal.fire({
// //       title: "Delete Travel Record?",
// //       text: "This action cannot be undone.",
// //       icon: "warning",
// //       showCancelButton: true,
// //       confirmButtonColor: "#dc2626",
// //       cancelButtonColor: "#64748b",
// //       confirmButtonText: "Delete",
// //     });

// //     if (!result.isConfirmed) return;

// //     await deleteTravelRecord(id);
// //     toast.success("Record deleted");
// //   };

// //   const handleTogglePresence = async (dateStr, nextStatus) => {
// //     try {
// //       const homeBase = (
// //         profile?.homeCountry ||
// //         profile?.nativeCountry ||
// //         "US"
// //       ).toUpperCase();
// //       const cleanDateStr = dateStr.includes("T")
// //         ? dateStr.split("T")[0]
// //         : dateStr;

// //       const normalizeDate = (d) => {
// //         if (!d) return d;
// //         return d.includes("T") ? d.split("T")[0] : d;
// //       };

// //       const explicitSingleRecord = records.find((r) => {
// //         const rDept = normalizeDate(r.departureDate);
// //         const rArr = normalizeDate(r.arrivalDate);
// //         return (
// //           rDept === cleanDateStr &&
// //           rArr === cleanDateStr &&
// //           (r.purpose === "Calendar Check-In" ||
// //             r.purpose === "Calendar Check-Out" ||
// //             r.purpose === "Daily GPS Check-In")
// //         );
// //       });

// //       const parentRangeRecord = records
// //         .filter((r) => {
// //           if (!r.departureDate || !r.arrivalDate) return false;
// //           const rDept = normalizeDate(r.departureDate);
// //           const rArr = normalizeDate(r.arrivalDate);
// //           if (
// //             rDept === rArr &&
// //             (r.purpose === "Calendar Check-In" ||
// //               r.purpose === "Calendar Check-Out" ||
// //               r.purpose === "Daily GPS Check-In")
// //           ) {
// //             return false;
// //           }
// //           return cleanDateStr >= rDept && cleanDateStr <= rArr;
// //         })
// //         .sort((a, b) => {
// //           const aLength =
// //             new Date(normalizeDate(a.arrivalDate)) -
// //             new Date(normalizeDate(a.departureDate));
// //           const bLength =
// //             new Date(normalizeDate(b.arrivalDate)) -
// //             new Date(normalizeDate(b.departureDate));
// //           return aLength - bLength;
// //         })[0];

// //       const targetToCountry =
// //         nextStatus === "Abroad Stay" ? "ABROAD" : homeBase;
// //       const targetFromCountry =
// //         nextStatus === "Abroad Stay" ? homeBase : "ABROAD";
// //       const targetPurpose =
// //         nextStatus === "Abroad Stay"
// //           ? "Calendar Check-In"
// //           : "Calendar Check-Out";

// //       if (explicitSingleRecord) {
// //         await updateTravelRecord(explicitSingleRecord.recordId, {
// //           departureDate: cleanDateStr,
// //           arrivalDate: cleanDateStr,
// //           fromCountry: targetFromCountry,
// //           toCountry: targetToCountry,
// //           purpose: targetPurpose,
// //         });
// //       } else if (parentRangeRecord) {
// //         const pStartStr = normalizeDate(parentRangeRecord.departureDate);
// //         const pEndStr = normalizeDate(parentRangeRecord.arrivalDate);

// //         const baseProps = {
// //           fromCountry: parentRangeRecord.fromCountry || homeBase,
// //           toCountry: parentRangeRecord.toCountry || "ABROAD",
// //           purpose: parentRangeRecord.purpose || "Automated System Entry",
// //         };

// //         const currentDate = parseISO(cleanDateStr);
// //         const prevDayStr = format(subDays(currentDate, 1), "yyyy-MM-dd");
// //         const nextDayStr = format(addDays(currentDate, 1), "yyyy-MM-dd");

// //         if (pStartStr === pEndStr) {
// //           await updateTravelRecord(parentRangeRecord.recordId, {
// //             departureDate: cleanDateStr,
// //             arrivalDate: cleanDateStr,
// //             fromCountry: targetFromCountry,
// //             toCountry: targetToCountry,
// //             purpose: targetPurpose,
// //           });
// //         } else if (pStartStr === cleanDateStr) {
// //           await updateTravelRecord(parentRangeRecord.recordId, {
// //             ...baseProps,
// //             departureDate: nextDayStr,
// //             arrivalDate: pEndStr,
// //           });

// //           const existingSingleDayRecord = records.find((r) => {
// //             const dep = normalizeDate(r.departureDate);
// //             const arr = normalizeDate(r.arrivalDate);
// //             return dep === cleanDateStr && arr === cleanDateStr;
// //           });

// //           if (!existingSingleDayRecord) {
// //             await addTravelRecord(user.uid, {
// //               departureDate: cleanDateStr,
// //               arrivalDate: cleanDateStr,
// //               fromCountry: targetFromCountry,
// //               toCountry: targetToCountry,
// //               purpose: targetPurpose,
// //             });
// //           }
// //         } else if (pEndStr === cleanDateStr) {
// //           await updateTravelRecord(parentRangeRecord.recordId, {
// //             ...baseProps,
// //             departureDate: pStartStr,
// //             arrivalDate: prevDayStr,
// //           });

// //           const existingSingleDayRecord = records.find((r) => {
// //             const dep = normalizeDate(r.departureDate);
// //             const arr = normalizeDate(r.arrivalDate);
// //             return dep === cleanDateStr && arr === cleanDateStr;
// //           });

// //           if (!existingSingleDayRecord) {
// //             await addTravelRecord(user.uid, {
// //               departureDate: cleanDateStr,
// //               arrivalDate: cleanDateStr,
// //               fromCountry: targetFromCountry,
// //               toCountry: targetToCountry,
// //               purpose: targetPurpose,
// //             });
// //           }
// //         } else {
// //           if (
// //             isAfter(parseISO(pStartStr), parseISO(prevDayStr)) ||
// //             isAfter(parseISO(nextDayStr), parseISO(pEndStr))
// //           ) {
// //             return;
// //           }

// //           const existingSingleDayRecord = records.find((r) => {
// //             const dep = normalizeDate(r.departureDate);
// //             const arr = normalizeDate(r.arrivalDate);
// //             return dep === cleanDateStr && arr === cleanDateStr;
// //           });

// //           const operations = [
// //             updateTravelRecord(parentRangeRecord.recordId, {
// //               ...baseProps,
// //               departureDate: pStartStr,
// //               arrivalDate: prevDayStr,
// //             }),
// //             addTravelRecord(user.uid, {
// //               ...baseProps,
// //               departureDate: nextDayStr,
// //               arrivalDate: pEndStr,
// //             }),
// //           ];

// //           if (!existingSingleDayRecord) {
// //             operations.push(
// //               addTravelRecord(user.uid, {
// //                 departureDate: cleanDateStr,
// //                 arrivalDate: cleanDateStr,
// //                 fromCountry: targetFromCountry,
// //                 toCountry: targetToCountry,
// //                 purpose: targetPurpose,
// //               })
// //             );
// //           }

// //           await Promise.all(operations);
// //         }
// //       } else {
// //         const existingSingleDayRecord = records.find((r) => {
// //           const dep = normalizeDate(r.departureDate);
// //           const arr = normalizeDate(r.arrivalDate);
// //           return dep === cleanDateStr && arr === cleanDateStr;
// //         });

// //         if (!existingSingleDayRecord) {
// //           await addTravelRecord(user.uid, {
// //             departureDate: cleanDateStr,
// //             arrivalDate: cleanDateStr,
// //             fromCountry: targetFromCountry,
// //             toCountry: targetToCountry,
// //             purpose: targetPurpose,
// //           });
// //         }
// //       }

// //       toast.success(`Presence status updated for ${cleanDateStr}`);
// //     } catch (error) {
// //       console.error("[Dashboard Override Error]:", error);
// //       toast.error("Could not update presence tracking status.");
// //     }
// //   };
// //   const hasValidTravelRecords = records.some(
// //     (record) =>
// //       record?.arrivalDate &&
// //       record?.departureDate &&
// //       (record?.toCountry || record?.fromCountry),
// //   );

// //   if (loading) {
// //     return (
// //       <div className="h-[70vh] flex items-center justify-center">
// //         <div className="flex flex-col items-center gap-3">
// //           <BiLoaderAlt className="animate-spin text-4xl text-blue-600" />
// //           <p className="text-slate-500">Loading travel records...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   const computedDayMap = {};
// //   const homeBase = (
// //     profile?.homeCountry ||
// //     profile?.nativeCountry ||
// //     "US"
// //   ).toUpperCase();

// //   if (hasValidTravelRecords) {
// //     records.forEach((record) => {
// //       if (!record?.arrivalDate || !record?.departureDate) return;
// //       if (isAfter(parseISO(record.departureDate), parseISO(record.arrivalDate)))
// //         return;
// //       if (
// //         record.arrivalDate === record.departureDate &&
// //         (record.purpose === "Calendar Check-In" ||
// //           record.purpose === "Calendar Check-Out")
// //       ) {
// //         return;
// //       }

// //       const isRecordHome =
// //         record.toCountry && record.toCountry.toUpperCase() === homeBase;
// //       const days = eachDayOfInterval({
// //         start: new Date(record.departureDate + "T00:00:00"),
// //         end: new Date(record.arrivalDate + "T00:00:00"),
// //       });

// //       days.forEach((day) => {
// //         const key = format(day, "yyyy-MM-dd");
// //         computedDayMap[key] = {
// //           status: isRecordHome ? "Home Stay" : "Abroad Stay",
// //           country: getFullCountryName(record.toCountry),
// //         };
// //       });
// //     });

// //     records.forEach((record) => {
// //       if (!record?.arrivalDate || !record?.departureDate) return;
// //       if (record.arrivalDate !== record.departureDate) return;
// //       if (
// //         record.purpose !== "Calendar Check-In" &&
// //         record.purpose !== "Calendar Check-Out"
// //       )
// //         return;

// //       const key = record.arrivalDate;
// //       const isRecordHome =
// //         record.toCountry && record.toCountry.toUpperCase() === homeBase;

// //       computedDayMap[key] = {
// //         status: isRecordHome ? "Home Stay" : "Abroad Stay",
// //         country: getFullCountryName(record.toCountry),
// //       };
// //     });
// //   }

// //   // Bind the calculation stats using the shared layout engine logic to avoid 1-day drift
// //   const calculation = calculateResidencyStatus(records, profile);
// //   const calendarHomeDays = hasValidTravelRecords
// //     ? (calculation?.homeDays ?? 0)
// //     : 0;
// //   const calendarAbroadDays = hasValidTravelRecords
// //     ? (calculation?.outsideDays ?? 0)
// //     : 0;

// //   const totalRecordsCount = records.length;

// //   const rawFootprint = currentCountry || records[0]?.toCountry;
// //   const currentFootprintDisplay =
// //     records.length > 0
// //       ? getFullCountryName(rawFootprint) || "Locating..."
// //       : "No History Saved";

// //   return (
// //     <div className="space-y-8 relative">
// //       {/* HEADER */}
// //       <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
// //         <div>
// //           <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
// //             Travel History
// //           </h1>
// //           <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
// //             Review your travel timeline and residency records.
// //           </p>
// //         </div>

// //         <div className="relative w-full sm:w-auto shrink-0" ref={menuRef}>
// //           <button
// //             type="button"
// //             onClick={() => setIsMenuOpen(!isMenuOpen)}
// //             className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-md text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer w-full sm:w-auto"
// //           >
// //             <FiPlus />
// //             <span>Add Previous Travel Record</span>
// //             <FiChevronDown
// //               className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
// //             />
// //           </button>

// //           {isMenuOpen && (
// //             <div className="absolute right-0 mt-2 w-full sm:w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
// //               <button
// //                 type="button"
// //                 onClick={() => {
// //                   setShowCalendarModal(true);
// //                   setIsMenuOpen(false);
// //                 }}
// //                 className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
// //               >
// //                 <FiCalendar className="text-blue-500 text-base" />
// //                 <span>Update via Calendar View</span>
// //               </button>
// //               <button
// //                 type="button"
// //                 onClick={() => {
// //                   setIsMenuOpen(false);
// //                   setEditingRecord(null);
// //                   setShowForm(true);
// //                 }}
// //                 className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer border-t border-slate-100"
// //               >
// //                 <FiPlus className="text-purple-500 text-base" />
// //                 <span>Log via Manual Form</span>
// //               </button>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {/* STATS  */}
// //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
// //         <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
// //           <div className="flex items-center justify-between">
// //             <div>
// //               <p className="text-base text-slate-500">Total Records</p>
// //               <h2 className="text-4xl font-bold text-slate-900 mt-2">
// //                 {totalRecordsCount}
// //               </h2>
// //             </div>
// //             <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
// //               <FiActivity className="text-2xl text-blue-600" />
// //             </div>
// //           </div>
// //         </div>

// //         <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
// //           <div className="flex items-center justify-between">
// //             <div>
// //               <p className="text-base text-slate-500">Current Footprint</p>
// //               <h2 className="text-xl font-bold text-slate-900 mt-2 break-words">
// //                 {currentFootprintDisplay}
// //               </h2>
// //             </div>
// //             <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
// //               <FiMapPin className="text-2xl text-green-600" />
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* AUTOMATED TABLE CONTAINER */}
// //       <div className="w-full">
// //         <div className="bg-white border border-slate-200 rounded-3xl shadow-sm">
// //           <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
// //             <div>
// //               <h2 className="text-base sm:text-lg font-semibold text-slate-900">
// //                 Travel Records
// //               </h2>
// //               <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
// //                 Your complete travel history in one place.
// //               </p>
// //             </div>
// //             <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] sm:text-xs font-semibold self-start sm:self-auto shrink-0">
// //               {records.length} Check-ins
// //             </span>
// //           </div>
// //           <div className="p-5">
// //             <TravelTable
// //               records={records}
// //               onDelete={handleDelete}
// //               onEdit={handleEdit}
// //             />
// //           </div>
// //         </div>
// //       </div>

// //       {/* DYNAMIC FORM MODAL WINDOW OVERLAY */}
// //       {showForm && (
// //         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
// //           <div className="w-full max-w-2xl">
// //             <TravelForm
// //               initialData={editingRecord}
// //               travelRecords={records}
// //               onSubmit={handleSaveRecord}
// //               onCancel={() => {
// //                 setShowForm(false);
// //                 setEditingRecord(null);
// //               }}
// //             />
// //           </div>
// //         </div>
// //       )}

// //       {showCalendarModal && (
// //         <div
// //           className="fixed flex items-start justify-center p-4"
// //           style={{
// //             top: calendarModalStyle.top,
// //             left: calendarModalStyle.left,
// //             right: 0,
// //             bottom: 0,
// //             backgroundColor: "rgba(0,0,0,0.6)",
// //             zIndex: 40,
// //           }}
// //         >
// //           <div className="w-full max-w-4xl bg-white rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[calc(100vh-120px)] overflow-auto mx-auto border border-slate-100 touch-auto">
// //             <div className="flex justify-between sm:gap-3 mb-2">
// //               <h2 className="text-xl font-bold text-slate-900">
// //                 Stay Calendar
// //               </h2>
// //               <div className="flex flex-wrap gap-3">
// //                 <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-50 border border-green-200 rounded-xl flex items-center">
// //                   <span className="text-green-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
// //                     🏠 Home: {calendarHomeDays} Days
// //                   </span>
// //                 </div>
// //                 <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center">
// //                   <span className="text-blue-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
// //                     🌍 Abroad: {calendarAbroadDays} Days
// //                   </span>
// //                 </div>
// //               </div>
// //             </div>

// //             <StayCalendar
// //               dayMap={computedDayMap}
// //               travelRecords={records}
// //               fyStart={profile?.fyStart || profile?.residencyPeriodStart}
// //               fyEnd={profile?.fyEnd || profile?.residencyPeriodEnd}
// //               onToggleDayPresence={handleTogglePresence}
// //             />
// //             <button
// //               type="button"
// //               onClick={() => setShowCalendarModal(false)}
// //               className="mt-2 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition duration-200"
// //             >
// //               Close Calendar
// //             </button>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }
