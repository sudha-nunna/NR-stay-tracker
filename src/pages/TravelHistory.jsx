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
import { FiMapPin, FiPlus, FiGlobe, FiActivity } from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";

export default function TravelHistory() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingLocation, setTrackingLocation] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [currentCountry, setCurrentCountry] = useState("");

  // Strict thread constraint handling switch variable flag to kill recursion loops
  const isCurrentlyTracking = useRef(false);

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

  const totalRecordsCount = records.length;

  const uniqueCountriesTracked =
    records.length > 0
      ? new Set(
          records.flatMap((r) => [r.fromCountry, r.toCountry]).filter(Boolean),
        ).size
      : 0;

  const currentFootprintDisplay =
    records.length > 0
      ? currentCountry || records[0]?.toCountry || "Locating..."
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

        <button
          onClick={() => {
            setEditingRecord(null);
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-md text-xs sm:text-sm transition-all duration-300 cursor-pointer w-full sm:w-auto shrink-0"
        >
          <FiPlus />
          Add Travel Record
        </button>
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
              <p className="text-base text-slate-500">Countries Tracked</p>
              <h2 className="text-4xl font-bold text-slate-900 mt-2">
                {uniqueCountriesTracked}
              </h2>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
              <FiGlobe className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base text-slate-500">Current Footprint</p>
              <h2 className="text-xl font-bold text-slate-900 mt-2 truncate">
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
              onSubmit={handleSaveRecord}
              onCancel={() => {
                setShowForm(false);
                setEditingRecord(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
