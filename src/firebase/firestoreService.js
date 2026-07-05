import { db } from './firebaseConfig';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';

/**
 * Provisions or updates an extended user profile document in the database.
 * Explicitly synchronizes timeline constraints across all cross-cutting tracking configurations.
 */
export const updateUserProfileInDb = async (uid, profileData) => {
  const docRef = doc(db, 'users', uid);
  
  // Destructure incoming data fields cleanly
  const targetTimezone = profileData.timezone || '';
  const targetCountry = profileData.nativeCountry || '';
  const targetStart = profileData.fyStart || '';
  const targetEnd = profileData.fyEnd || '';
  const currentThreshold = profileData.residencyThreshold || '183';

  return await updateDoc(docRef, {
    timezone: targetTimezone,
    nativeCountry: targetCountry,
    fyStart: targetStart,
    fyEnd: targetEnd,
    
    // REQUIREMENT COMPLIANCE: Synchronize secondary relational field variables cleanly
    homeCountry: targetCountry, 
    residencyThreshold: currentThreshold,
    residencyPeriodStart: targetStart,
    residencyPeriodEnd: targetEnd
  });
};

/**
 * Creates a brand new travel track entry mapped to the active authenticated user account.
 */
export const addTravelRecord = async (uid, record) => {
  const colRef = collection(db, 'travelRecords');
  return await addDoc(colRef, {
    uid,
    fromCountry: record.fromCountry,
    toCountry: record.toCountry,
    departureDate: record.departureDate,
    arrivalDate: record.arrivalDate,
    purpose: record.purpose || '',
    latitude: record.latitude !== undefined ? record.latitude : null,
    longitude: record.longitude !== undefined ? record.longitude : null,
    createdAt: new Date().toISOString()
  });
};

/**
 * Modifies an existing travel track record document inside the system.
 */
export const updateTravelRecord = async (recordId, updatedData) => {
  const docRef = doc(db, 'travelRecords', recordId);
  return await updateDoc(docRef, {
    fromCountry: updatedData.fromCountry,
    toCountry: updatedData.toCountry,
    departureDate: updatedData.departureDate,
    arrivalDate: updatedData.arrivalDate,
    purpose: updatedData.purpose || '',
    latitude: updatedData.latitude !== undefined ? updatedData.latitude : null,
    longitude: updatedData.longitude !== undefined ? updatedData.longitude : null
  });
};

/**
 * Deletes a targeted travel record from the database.
 */
export const deleteTravelRecord = async (recordId) => {
  const docRef = doc(db, 'travelRecords', recordId);
  return await deleteDoc(docRef);
};

/**
 * Subscribes to the travel records stream for a specific user to provide real-time updates.
 */
export const subscribeToTravelRecords = (uid, onUpdate, onError) => {
  const colRef = collection(db, "travelRecords");
  const q = query(colRef, where("uid", "==", uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const records = [];
      snapshot.forEach((doc) => {
        records.push({
          recordId: doc.id,
          ...doc.data(),
        });
      });

      records.sort((a, b) => new Date(b.departureDate) - new Date(a.departureDate));
      onUpdate(records);
    },
    onError
  );
};


