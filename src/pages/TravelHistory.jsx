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
} from "date-fns";

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

  // Interactive navigation options selection state management layout
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Strict thread constraint handling switch variable flag to kill recursion loops
  const isCurrentlyTracking = useRef(false);

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
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error("Unable to load travel records");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // Compute calendar modal offsets (below navbar, avoid sidebar on desktop)
  useEffect(() => {
    if (!showCalendarModal) return undefined;

    const computeOffsets = () => {
      const nav = document.querySelector("nav");
      const top = nav ? nav.getBoundingClientRect().height : 80;
      const isDesktop = window.innerWidth >= 768;
      const left = isDesktop ? 256 : 0; // sidebar width in px (w-64 => 16rem => 256px)
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
            r.purpose === "Calendar Check-Out")
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
              r.purpose === "Calendar Check-Out")
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
          toCountry: parentRangeRecord.toCountry || "ABROAD",
          purpose: parentRangeRecord.purpose || "Automated System Entry",
        };

        const currentDate = parseISO(cleanDateStr);
        const prevDayStr = format(subDays(currentDate, 1), "yyyy-MM-dd");
        const nextDayStr = format(addDays(currentDate, 1), "yyyy-MM-dd");

        if (pStartStr === cleanDateStr) {
          await Promise.all([
            updateTravelRecord(parentRangeRecord.recordId, {
              ...baseProps,
              departureDate: nextDayStr,
              arrivalDate: pEndStr,
            }),
            addTravelRecord(user.uid, {
              departureDate: cleanDateStr,
              arrivalDate: cleanDateStr,
              fromCountry: targetFromCountry,
              toCountry: targetToCountry,
              purpose: targetPurpose,
            }),
          ]);
        } else if (pEndStr === cleanDateStr) {
          await Promise.all([
            updateTravelRecord(parentRangeRecord.recordId, {
              ...baseProps,
              departureDate: pStartStr,
              arrivalDate: prevDayStr,
            }),
            addTravelRecord(user.uid, {
              departureDate: cleanDateStr,
              arrivalDate: cleanDateStr,
              fromCountry: targetFromCountry,
              toCountry: targetToCountry,
              purpose: targetPurpose,
            }),
          ]);
        } else {
          await Promise.all([
            updateTravelRecord(parentRangeRecord.recordId, {
              ...baseProps,
              departureDate: pStartStr,
              arrivalDate: prevDayStr,
            }),
            addTravelRecord(user.uid, {
              ...baseProps,
              departureDate: nextDayStr,
              arrivalDate: pEndStr,
            }),
            addTravelRecord(user.uid, {
              departureDate: cleanDateStr,
              arrivalDate: cleanDateStr,
              fromCountry: targetFromCountry,
              toCountry: targetToCountry,
              purpose: targetPurpose,
            }),
          ]);
        }
      } else {
        await addTravelRecord(user.uid, {
          departureDate: cleanDateStr,
          arrivalDate: cleanDateStr,
          fromCountry: targetFromCountry,
          toCountry: targetToCountry,
          purpose: targetPurpose,
        });
      }

      toast.success(`Presence status updated for ${cleanDateStr}`);
    } catch (error) {
      console.error("[Dashboard Override Error]:", error);
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
  if (hasValidTravelRecords) {
    const homeBase = (
      profile?.homeCountry ||
      profile?.nativeCountry ||
      "US"
    ).toUpperCase();

    records.forEach((record) => {
      if (!record?.arrivalDate || !record?.departureDate) return;
      if (
        record.arrivalDate === record.departureDate &&
        (record.purpose === "Calendar Check-In" ||
          record.purpose === "Calendar Check-Out")
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
        record.purpose !== "Calendar Check-Out"
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

  const totalRecordsCount = records.length;

  const uniqueCountriesTracked =
    records.length > 0
      ? new Set(
          records.flatMap((r) => [r.fromCountry, r.toCountry]).filter(Boolean),
        ).size
      : 0;

  const rawFootprint = currentCountry || records[0]?.toCountry;
  const currentFootprintDisplay =
    records.length > 0
      ? getFullCountryName(rawFootprint) || "Locating..."
      : "No History Saved";

  return (
    <div className="space-y-8 relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Travel History
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
            Review your travel timeline and residency records.
          </p>
        </div>

        {/* History Tab Split Action Dropdown Navigation Component */}
        <div className="relative w-full sm:w-auto shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-md text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer w-full sm:w-auto"
          >
            <FiPlus />
            <span>Add Travel Record</span>
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

      {/* STATS  */}
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

      {/* AUTOMATED TABLE CONTAINER */}
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

      {/* DYNAMIC FORM MODAL WINDOW OVERLAY */}
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
          <div className="w-full max-w-4xl bg-transparent rounded-2xl max-h-[85vh] overflow-auto mx-auto">
            <StayCalendar
              dayMap={computedDayMap}
              travelRecords={records}
              fyStart={profile?.fyStart || profile?.residencyPeriodStart}
              fyEnd={profile?.fyEnd || profile?.residencyPeriodEnd}
              onToggleDayPresence={handleTogglePresence}
            />
            <button
              onClick={() => setShowCalendarModal(false)}
              className="mt-4 w-full py-2 bg-red-600 text-white font-bold rounded-lg"
            >
              Close Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
