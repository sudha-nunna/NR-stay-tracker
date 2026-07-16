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
  FiActivity,
  FiChevronDown,
  FiDownloadCloud,
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
  isAfter,
} from "date-fns";
import { calculateResidencyStatus } from "../utils/residencyCalculator";
import * as XLSX from "xlsx";

import { usePresenceToggle } from "../hooks/usePresenceToggle";

export default function TravelHistory() {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarModalStyle, setCalendarModalStyle] = useState({
    top: 80,
    left: 0,
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [currentCountry] = useState("");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isCreatingInitialHomeStay = useRef(false);

  // CONSUME SHARED MULTI-RANGE SPLITTING LOGIC FROM DEDICATED LOCATION HOOK
  const { handleTogglePresence } = usePresenceToggle(user, profile, records);
  const getFullCountryName = (code) => {
    if (!code) return "";
    if (code.toUpperCase() === "ABROAD" || code.toUpperCase() === "OTHER")
      return "Abroad";
    const match = countries.find(
      (c) => c.code.toUpperCase() === code.toUpperCase(),
    );
    return match ? match.name : code;
  };

  const handleExportData = () => {
    if (records.length === 0) return;

    const rawHomeCountry =
      profile?.homeCountry || profile?.nativeCountry || "US";
    const homeCountryName = getFullCountryName(rawHomeCountry);

    const structuredRows = records.map((record, index) => ({
      "Log Index": records.length - index,
      "Origin Country": getFullCountryName(record.fromCountry) || "N/A",
      "Destination Country": getFullCountryName(record.toCountry) || "N/A",
      "Departure Date": record.departureDate || "N/A",
      "Arrival Date": record.arrivalDate || "N/A",
      "Purpose of Travel": record.purpose || "Automated System Entry",
      "GPS Latitude": record.latitude || "N/A",
      "GPS Longitude": record.longitude || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(structuredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Travel History Logs");

    const maxColumnWidths = Object.keys(structuredRows[0] || {}).map((key) => {
      const headerLength = key.length;
      const longestCellLength = structuredRows.reduce(
        (max, row) => Math.max(max, String(row[key] || "").length),
        0,
      );
      return { wch: Math.max(headerLength, longestCellLength) + 3 };
    });
    worksheet["!cols"] = maxColumnWidths;

    XLSX.writeFile(workbook, `Residency_Audit_Report_${homeCountryName}.xlsx`);
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

  useEffect(() => {
    if (!user || loading || !profile) return;
    const fyStart = profile?.fyStart || profile?.residencyPeriodStart;
    if (!fyStart) return;

    const rawHomeCountry =
      profile?.homeCountry || profile?.nativeCountry || "US";
    const initialHomeStayRecord = records.find(
      (r) => r.purpose === "Initial Home Stay",
    );

    if (!initialHomeStayRecord && !isCreatingInitialHomeStay.current) {
      isCreatingInitialHomeStay.current = true;
      const today = new Date();
      const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
      const cleanStartDate = fyStart.includes("T")
        ? fyStart.split("T")[0]
        : fyStart;

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
      const cleanStartDate = fyStart.includes("T")
        ? fyStart.split("T")[0]
        : fyStart;

      const countryChanged =
        oldHomeCountry !== rawHomeCountry ||
        initialHomeStayRecord.fromCountry !== rawHomeCountry;
      const dateChanged =
        initialHomeStayRecord.departureDate !== cleanStartDate;

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
          console.error("[Profile dynamic sync cascade update failed]:", err),
        );
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

        {/* <div className="relative w-full sm:w-auto shrink-0" ref={menuRef}>
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
          </button> */}
       {/* Changed mx-auto sm:mx-0 to ml-auto to pull the button cleanly to the right on all devices */}
        <div className="relative w-max max-w-full ml-auto shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-md text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer w-auto"
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
      {/* {records.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExportData}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer"
          >
            <FiDownloadCloud className="text-base text-indigo-600" />
            Export Excel Report
          </button>
        </div>
      )} */}
       {records.length > 0 && (
        <div className="flex justify-end sm:justify-end">
          <button
            type="button"
            onClick={handleExportData}
            className="w-auto flex items-center justify-center gap-2 px-4 py-2  bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-md text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer w-auto"
          >
            <FiDownloadCloud className="text-base text-white" />
            Export Excel Report
          </button>
        </div>
      )}
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
              fyStart={profile?.fyStart || profile?.residencyPeriodStart}
              fyEnd={profile?.fyEnd || profile?.residencyPeriodEnd}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <h2 className="text-xl font-bold text-slate-900">
                Stay Calendar
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
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
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center">
                  <span className="text-purple-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
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
