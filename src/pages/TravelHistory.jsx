
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

  // Automated Geolocation Checking System (Corrected Loop Safety Mechanics)
  useEffect(() => {
    if (loading || !user || isCurrentlyTracking.current) return;

    const autoTrackLocation = async () => {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return;
      }

      // Lock tracking processing window context
      isCurrentlyTracking.current = true;
      setTrackingLocation(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Reverse Geocoding using a free open public boundary endpoint
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            );
            const data = await response.json();
            const currentCountryCode =
              data?.address?.country_code?.toUpperCase();

            if (!currentCountryCode)
              throw new Error("Country code tracking unresolved");

            setCurrentCountry(currentCountryCode);

            const latestRecord = records[0];
            const currentDateIso = new Date().toISOString().split("T")[0];

            // Filter specific conditions parameter flags
            const todayRecordExists = records.some((record) => {
              const recordDate = record.arrivalDate?.split("T")[0] || record.arrivalDate;
              return recordDate === currentDateIso;
            });

            const countryChanged =
              latestRecord && latestRecord.toCountry !== currentCountryCode;

            // CRITICAL STOPPER: Exit loop instantly if verification data already matches database
            if (todayRecordExists && !countryChanged) {
              return;
            }

            const automatedEntry = {
              fromCountry: latestRecord ? latestRecord.toCountry : currentCountryCode,
              toCountry: currentCountryCode,
              departureDate: currentDateIso,
              arrivalDate: currentDateIso,
              purpose: countryChanged ? "Country Changed" : "Daily GPS Check-In",
              latitude,
              longitude,
            };

            await addTravelRecord(user.uid, automatedEntry);

            toast.success(
              countryChanged
                ? `Country changed to ${currentCountryCode}`
                : `Daily check-in recorded`,
            );
          } catch (err) {
            console.error("Automated tracking checkpoint issue:", err);
          } finally {
            // Unlock tracking thread processing frame
            isCurrentlyTracking.current = false;
            setTrackingLocation(false);
          }
        },
        (error) => {
          console.warn("Location permissions withheld: ", error.message);
          isCurrentlyTracking.current = false;
          setTrackingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000 },
      );
    };

    autoTrackLocation();
  }, [loading, user, records.length]); // Track updates metrics changes array length element safely

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
  
  const uniqueCountriesTracked = records.length > 0 
    ? new Set(records.flatMap((r) => [r.fromCountry, r.toCountry]).filter(Boolean)).size 
    : 0;

  const currentFootprintDisplay = records.length > 0 
    ? (currentCountry || records[0]?.toCountry || "Locating...") 
    : "No History Saved";

  return (
    <div className="space-y-8 relative">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Global Movement History
          </h1>
          <p className="mt-2 text-slate-500">
            Automatically monitoring and logging border-crossings via global
            background sensors.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <FiPlus />
          Add Travel Record
        </button>
      </div>

      {/* STATS  */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Records</p>
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
              <p className="text-sm text-slate-500">Countries Tracked</p>
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
              <p className="text-sm text-slate-500">Current Footprint</p>
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
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Verified Travel Logs
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Authentic structural migration timeline records compiled
                instantly.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
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