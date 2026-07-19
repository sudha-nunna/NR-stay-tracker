import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
} from "firebase/firestore";

/**
 * Provisions or updates an extended user profile document in the database.
 * Explicitly synchronizes timeline constraints across all cross-cutting tracking configurations.
 */
export const updateUserProfileInDb = async (uid, profileData) => {
  const docRef = doc(db, "users", uid);

  // Destructure incoming data fields cleanly
  const targetTimezone = profileData.timezone || "";
  const targetCountry = profileData.nativeCountry || "";
  const targetStart = profileData.fyStart || "";
  const targetEnd = profileData.fyEnd || "";
  const currentThreshold = profileData.residencyThreshold || "183";

  return await updateDoc(docRef, {
    timezone: targetTimezone,
    nativeCountry: targetCountry,
    fyStart: targetStart,
    fyEnd: targetEnd,

    // REQUIREMENT COMPLIANCE: Synchronize secondary relational field variables cleanly
    homeCountry: targetCountry,
    residencyThreshold: currentThreshold,
    residencyPeriodStart: targetStart,
    residencyPeriodEnd: targetEnd,
  });
};

/**
 * Creates a brand new travel track entry mapped to the active authenticated user account.
 * Includes safeguard to prevent duplicate records with identical dates.
 */
export const addTravelRecord = async (uid, record) => {
  const colRef = collection(db, "travelRecords");

  // Normalize dates to YYYY-MM-DD format to ensure consistent comparison
  const normalizeDate = (dateStr) => {
    if (!dateStr) return dateStr;
    return dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  };

  const normDeparture = normalizeDate(record.departureDate);
  const normArrival = normalizeDate(record.arrivalDate);

  // Check for existing record with identical dates to prevent duplicates
  const q = query(
    colRef,
    where("uid", "==", uid),
    where("departureDate", "==", normDeparture),
    where("arrivalDate", "==", normArrival),
  );

  const existingSnapshot = await getDocs(q);

  // If identical record already exists, return the existing one instead of creating duplicate
  if (!existingSnapshot.empty) {
    return { id: existingSnapshot.docs[0].id };
  }

  console.log("CREATE TRAVEL RECORD", {
    departureDate: normDeparture,
    arrivalDate: normArrival,
    fromCountry: record.fromCountry,
    toCountry: record.toCountry,
    purpose: record.purpose || "",
  });

  const created = await addDoc(colRef, {
    uid,
    fromCountry: record.fromCountry,
    toCountry: record.toCountry,
    departureDate: normDeparture,
    arrivalDate: normArrival,
    purpose: record.purpose || "",
    latitude: record.latitude !== undefined ? record.latitude : null,
    longitude: record.longitude !== undefined ? record.longitude : null,
    createdAt: new Date().toISOString(),
  });

  console.log("CREATE SUCCESS", created.id);
  return created;
};

/**
 * Modifies an existing travel track record document inside the system.
 * Includes safeguard to normalize dates and prevent date format mismatches.
 */
export const updateTravelRecord = async (recordId, updatedData) => {
  const docRef = doc(db, "travelRecords", recordId);

  // Normalize dates to YYYY-MM-DD format for consistency
  const normalizeDate = (dateStr) => {
    if (!dateStr) return dateStr;
    return dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  };

  return await updateDoc(docRef, {
    fromCountry: updatedData.fromCountry,
    toCountry: updatedData.toCountry,
    departureDate: normalizeDate(updatedData.departureDate),
    arrivalDate: normalizeDate(updatedData.arrivalDate),
    purpose: updatedData.purpose || "",
    latitude: updatedData.latitude !== undefined ? updatedData.latitude : null,
    longitude:
      updatedData.longitude !== undefined ? updatedData.longitude : null,
  });
};

/**
 * Deletes a targeted travel record from the database.
 */
export const deleteTravelRecord = async (recordId) => {
  if (!recordId) {
    console.error("DELETE PARENT skipped - missing recordId");
    throw new Error("Cannot delete travel record without recordId");
  }
  console.log("DELETE PARENT", recordId);
  const docRef = doc(db, "travelRecords", recordId);
  await deleteDoc(docRef);
  console.log("DELETE SUCCESS", recordId);
  return recordId;
};

/**
 * Subscribes to the travel records stream for a specific user to provide real-time updates.
 * Normalizes dates in returned records to ensure consistency.
 */
export const subscribeToTravelRecords = (uid, onUpdate, onError) => {
  const colRef = collection(db, "travelRecords");
  const q = query(colRef, where("uid", "==", uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const records = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const docId = doc.id;
        records.push({
          ...data,
          recordId: docId,
          departureDate: data.departureDate?.includes("T")
            ? data.departureDate.split("T")[0]
            : data.departureDate,
          arrivalDate: data.arrivalDate?.includes("T")
            ? data.arrivalDate.split("T")[0]
            : data.arrivalDate,
        });
        if (data.recordId && data.recordId !== docId) {
          console.warn("RECORD ID MISMATCH", { docId, storedRecordId: data.recordId });
        }
      });

      records.sort(
        (a, b) => new Date(b.departureDate) - new Date(a.departureDate),
      );
      onUpdate(records);
    },
    onError,
  );
};
