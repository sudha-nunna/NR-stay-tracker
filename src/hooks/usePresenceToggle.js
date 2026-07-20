import { parseISO, format, subDays, addDays } from "date-fns";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import toast from "react-hot-toast";
import {
  addTravelRecord,
  updateTravelRecord,
  deleteTravelRecord,
} from "../firebase/firestoreService";

let isSplitting = false;
export const setSplittingFlag = (flag) => {
  isSplitting = flag;
};
export const getSplittingFlag = () => isSplitting;

export function usePresenceToggle(user, profile, records) {
  const handleTogglePresence = async (dateStr, nextStatus) => {
    try {
      if (!user || !profile) return;

      setSplittingFlag(true);

      const homeBase = (
        profile?.homeCountry ||
        profile?.nativeCountry ||
        "US"
      ).toUpperCase();

      const normalizeDate = (d) => {
        if (!d) return d;
        return d.includes("T") ? d.split("T")[0] : d;
      };

      const cleanDateStr = normalizeDate(
        dateStr.includes("T") ? dateStr.split("T")[0] : dateStr,
      );

      const isSingleDayOverride = (r) => {
        const dep = normalizeDate(r.departureDate);
        const arr = normalizeDate(r.arrivalDate);
        return (
          dep === arr &&
          (r.purpose === "Calendar Check-In" ||
            r.purpose === "Calendar Check-Out" ||
            r.purpose === "Daily GPS Check-In" ||
            r.purpose === "Country Changed")
        );
      };

      const targetToCountry =
        nextStatus === "Abroad Stay" ? "ABROAD" : homeBase;
      const targetFromCountry =
        nextStatus === "Abroad Stay" ? homeBase : "ABROAD";
      const targetPurpose =
        nextStatus === "Abroad Stay"
          ? "Calendar Check-In"
          : "Calendar Check-Out";

      const centerSlice = {
        departureDate: cleanDateStr,
        arrivalDate: cleanDateStr,
        fromCountry: targetFromCountry,
        toCountry: targetToCountry,
        purpose: targetPurpose,
      };

      const explicitSingleRecord = records.find(
        (r) =>
          normalizeDate(r.departureDate) === cleanDateStr &&
          normalizeDate(r.arrivalDate) === cleanDateStr &&
          (r.purpose === "Calendar Check-In" ||
            r.purpose === "Calendar Check-Out" ||
            r.purpose === "Daily GPS Check-In"),
      );

      if (explicitSingleRecord) {
        await updateTravelRecord(explicitSingleRecord.recordId, centerSlice);
        toast.success(`Presence status updated for ${cleanDateStr}`);
        return;
      }

      const overlappingRecords = records.filter((r) => {
        if (!r.departureDate || !r.arrivalDate) return false;
        if (isSingleDayOverride(r)) return false;
        const dep = normalizeDate(r.departureDate);
        const arr = normalizeDate(r.arrivalDate);
        return cleanDateStr >= dep && cleanDateStr <= arr;
      });

      if (overlappingRecords.length > 0) {
        const idsToDelete = new Set();
        overlappingRecords.forEach((r) => {
          if (r.recordId) idsToDelete.add(r.recordId);
        });

        const uniqueParentsMap = new Map();
        overlappingRecords.forEach((r) => {
          const key = `${normalizeDate(r.departureDate)}|${normalizeDate(r.arrivalDate)}|${r.purpose}|${(r.fromCountry || "").toUpperCase()}|${(r.toCountry || "").toUpperCase()}`;
          if (!uniqueParentsMap.has(key)) {
            uniqueParentsMap.set(key, r);
          }
        });

        const uniqueParents = Array.from(uniqueParentsMap.values());
        uniqueParents.sort((a, b) => {
          const aStart = normalizeDate(a.departureDate);
          const bStart = normalizeDate(b.departureDate);
          const aSpan =
            new Date(normalizeDate(a.arrivalDate)) - new Date(aStart);
          const bSpan =
            new Date(normalizeDate(b.arrivalDate)) - new Date(bStart);
          if (aStart !== bStart) return aStart < bStart ? -1 : 1;
          return bSpan - aSpan;
        });

        const primaryParent = uniqueParents[0];
        const pStart = normalizeDate(primaryParent.departureDate);
        const pEnd = normalizeDate(primaryParent.arrivalDate);
        const baseProps = {
          fromCountry: primaryParent.fromCountry || homeBase,
          toCountry: primaryParent.toCountry || homeBase,
          purpose: primaryParent.purpose,
        };

        const prevDayStr = format(subDays(parseISO(cleanDateStr), 1), "yyyy-MM-dd");
        const nextDayStr = format(addDays(parseISO(cleanDateStr), 1), "yyyy-MM-dd");
        const hasBefore = pStart < cleanDateStr;
        const hasAfter = pEnd > cleanDateStr;

        for (const recordId of idsToDelete) {
          try {
            await deleteTravelRecord(recordId);
          } catch (err) {
            console.error("[Calendar Split Delete Error]:", err, recordId);
          }
        }

        if (primaryParent.recordId) {
          const docRef = doc(db, "travelRecords", primaryParent.recordId);
          const checkDoc = await getDoc(docRef);
          if (checkDoc.exists()) {
            console.error(
              "[Calendar Split] Parent delete failed — record still exists:",
              primaryParent.recordId,
            );
          }
        }

        const pendingCreates = [];

        if (pStart === pEnd) {
          pendingCreates.push(centerSlice);
        } else {
          if (hasBefore) {
            pendingCreates.push({
              departureDate: pStart,
              arrivalDate: prevDayStr,
              ...baseProps,
            });
          }

          pendingCreates.push(centerSlice);

          if (hasAfter) {
            const rightSplitPurpose =
              baseProps.purpose === "Initial Home Stay"
                ? "Automated System Entry"
                : baseProps.purpose;
            pendingCreates.push({
              departureDate: nextDayStr,
              arrivalDate: pEnd,
              fromCountry: baseProps.fromCountry,
              toCountry: baseProps.toCountry,
              purpose: rightSplitPurpose,
            });
          }
        }

        for (const payload of pendingCreates) {
          try {
            await addTravelRecord(user.uid, payload);
          } catch (err) {
            console.error("[Calendar Split Create Error]:", err, payload);
          }
        }

        for (const overlap of overlappingRecords) {
          if (!overlap.recordId || !idsToDelete.has(overlap.recordId)) continue;
          try {
            const docRef = doc(db, "travelRecords", overlap.recordId);
            const checkDoc = await getDoc(docRef);
            if (checkDoc.exists()) {
              await deleteTravelRecord(overlap.recordId);
            }
          } catch (err) {
            console.error("[Calendar Split Cleanup Error]:", err);
          }
        }

        for (const r of records) {
          if (!r.recordId || idsToDelete.has(r.recordId)) continue;
          if (isSingleDayOverride(r)) continue;
          const dep = normalizeDate(r.departureDate);
          const arr = normalizeDate(r.arrivalDate);
          if (cleanDateStr >= dep && cleanDateStr <= arr) {
            try {
              await deleteTravelRecord(r.recordId);
            } catch (err) {
              console.error("[Calendar Stale Overlap Cleanup Error]:", err);
            }
          }
        }
      } else {
        const existingSingleDayRecord = records.find(
          (r) =>
            normalizeDate(r.departureDate) === cleanDateStr &&
            normalizeDate(r.arrivalDate) === cleanDateStr,
        );

        if (!existingSingleDayRecord) {
          await addTravelRecord(user.uid, centerSlice);
        }
      }

      toast.success(`Presence status updated for ${cleanDateStr}`);
    } catch (error) {
      console.error("[Presence Hook Error]:", error);
      toast.error("Could not update presence tracking status.");
    } finally {
      setSplittingFlag(false);
    }
  };

  // Same splitting logic as handleTogglePresence, generalized for a
  // multi-day range coming from the manual Travel Form instead of a
  // single calendar day click.
  const handleAddTravelRange = async (
    startDateStr,
    endDateStr,
    toCountry,
    fromCountry,
    purpose,
  ) => {
    try {
      if (!user || !profile) return;

      setSplittingFlag(true);

      const homeBase = (
        profile?.homeCountry ||
        profile?.nativeCountry ||
        "US"
      ).toUpperCase();

      const normalizeDate = (d) => {
        if (!d) return d;
        return d.includes("T") ? d.split("T")[0] : d;
      };

      const cleanStart = normalizeDate(startDateStr);
      const cleanEnd = normalizeDate(endDateStr);

      // Find existing Home-stay parent record(s) that overlap the new range
      // NEW — drop the home-only restriction, match ANY overlapping multi-day record
      const overlappingRecords = records.filter((r) => {
        if (!r.departureDate || !r.arrivalDate) return false;
        const rDept = normalizeDate(r.departureDate);
        const rArr = normalizeDate(r.arrivalDate);

        const isSingleDayOverride =
          rDept === rArr &&
          (r.purpose === "Calendar Check-In" ||
            r.purpose === "Calendar Check-Out" ||
            r.purpose === "Daily GPS Check-In" ||
            r.purpose === "Country Changed");
        if (isSingleDayOverride) return false;

        return cleanStart <= rArr && cleanEnd >= rDept;
      });
      // const overlappingHomeRecords = records.filter((r) => {
      //   if (!r.departureDate || !r.arrivalDate) return false;
      //   const rDept = normalizeDate(r.departureDate);
      //   const rArr = normalizeDate(r.arrivalDate);
      //   const isHomeRecord =
      //     (r.toCountry || "").toUpperCase() === homeBase &&
      //     (r.purpose === "Initial Home Stay" ||
      //       r.purpose === "Automated System Entry");
      //   if (!isHomeRecord) return false;
      //   return cleanStart <= rArr && cleanEnd >= rDept;
      // });

      const pendingCreates = [];
      const idsToDelete = new Set();
      let hasBefore = false;
      let hasAfter = false;
      let pStart = cleanStart;
      let pEnd = cleanEnd;
      let beforeEnd = cleanStart;
      let afterStart = cleanEnd;
      let primaryParent = null;

      if (overlappingRecords.length > 0) {
        const uniqueParentsMap = new Map();
        overlappingRecords.forEach((r) => {
          if (r.recordId) {
            idsToDelete.add(r.recordId);
          }
          const key = `${normalizeDate(r.departureDate)}|${normalizeDate(r.arrivalDate)}|${r.purpose}|${(r.fromCountry || "").toUpperCase()}|${(r.toCountry || "").toUpperCase()}`;
          if (!uniqueParentsMap.has(key)) {
            uniqueParentsMap.set(key, r);
          }
        });

        const uniqueParents = Array.from(uniqueParentsMap.values());
        uniqueParents.sort((a, b) => {
          const aStart = normalizeDate(a.departureDate);
          const bStart = normalizeDate(b.departureDate);
          const aSpan =
            new Date(normalizeDate(a.arrivalDate)) - new Date(aStart);
          const bSpan =
            new Date(normalizeDate(b.arrivalDate)) - new Date(bStart);
          if (aStart !== bStart) return aStart < bStart ? -1 : 1;
          return bSpan - aSpan;
        });

        primaryParent = uniqueParents[0];

        pStart = normalizeDate(primaryParent.departureDate);
        pEnd = normalizeDate(primaryParent.arrivalDate);

        const baseProps = {
          fromCountry: primaryParent.fromCountry || homeBase,
          toCountry: primaryParent.toCountry || homeBase,
          purpose: primaryParent.purpose,
        };

        beforeEnd = format(subDays(parseISO(cleanStart), 1), "yyyy-MM-dd");
        afterStart = format(addDays(parseISO(cleanEnd), 1), "yyyy-MM-dd");

        hasBefore = pStart < cleanStart;
        hasAfter = pEnd > cleanEnd;

        const splitExists = (dep, arr, purpose, fromCountry, toCountry) =>
          records.some((r) => {
            return (
              normalizeDate(r.departureDate) === dep &&
              normalizeDate(r.arrivalDate) === arr &&
              (r.purpose || "") === (purpose || "") &&
              (r.fromCountry || "").toUpperCase() ===
                (fromCountry || "").toUpperCase() &&
              (r.toCountry || "").toUpperCase() ===
                (toCountry || "").toUpperCase()
            );
          });

        if (hasBefore) {
          const leftSplit = {
            departureDate: pStart,
            arrivalDate: beforeEnd,
            ...baseProps,
          };
          if (
            !splitExists(
              pStart,
              beforeEnd,
              baseProps.purpose,
              baseProps.fromCountry,
              baseProps.toCountry,
            )
          ) {
            pendingCreates.push(leftSplit);
          }
        }

        if (hasAfter) {
          const rightSplitPurpose =
            baseProps.purpose === "Initial Home Stay"
              ? "Automated System Entry"
              : baseProps.purpose;
          const rightSplit = {
            departureDate: afterStart,
            arrivalDate: pEnd,
            fromCountry: baseProps.fromCountry,
            toCountry: baseProps.toCountry,
            purpose: rightSplitPurpose,
          };
          if (
            !splitExists(
              afterStart,
              pEnd,
              rightSplitPurpose,
              baseProps.fromCountry,
              baseProps.toCountry,
            )
          ) {
            pendingCreates.push(rightSplit);
          }
        }
      }

      const travelRecord = {
        departureDate: cleanStart,
        arrivalDate: cleanEnd,
        fromCountry,
        toCountry,
        purpose,
      };
      pendingCreates.push(travelRecord);

      console.log(
        "DELETE PARENT",
        primaryParent
          ? { recordId: primaryParent.recordId, ...primaryParent }
          : [...idsToDelete],
      );

      for (const recordId of idsToDelete) {
        try {
          await deleteTravelRecord(recordId);
          console.log("DELETE SUCCESS", recordId);
        } catch (err) {
          console.error("[Split Delete Error]:", err, recordId);
        }
      }

      if (primaryParent?.recordId) {
        const docRef = doc(db, "travelRecords", primaryParent.recordId);
        const checkDoc = await getDoc(docRef);
        if (checkDoc.exists()) {
          console.error(
            "PARENT DELETE FAILED - parent still exists in Firestore!",
            primaryParent.recordId,
          );
        }
      }

      for (const payload of pendingCreates) {
        if (payload === travelRecord) {
          console.log("CREATE TRAVEL RECORD", payload);
        } else if (hasBefore && payload.departureDate === pStart) {
          console.log("CREATE LEFT SPLIT", payload);
        } else if (hasAfter && payload.departureDate === afterStart) {
          console.log("CREATE RIGHT SPLIT", payload);
        }
        try {
          const result = await addTravelRecord(user.uid, payload);
          console.log("CREATE SUCCESS", result?.id || result, payload);
        } catch (err) {
          console.error("[Split Create Error]:", err, payload);
        }
      }

      for (const overlap of overlappingRecords) {
        if (!overlap.recordId || !idsToDelete.has(overlap.recordId)) continue;
        const isNewSplit = pendingCreates.some(
          (payload) =>
            normalizeDate(payload.departureDate) ===
              normalizeDate(overlap.departureDate) &&
            normalizeDate(payload.arrivalDate) ===
              normalizeDate(overlap.arrivalDate),
        );
        if (isNewSplit) continue;

        try {
          const docRef = doc(db, "travelRecords", overlap.recordId);
          const checkDoc = await getDoc(docRef);
          if (checkDoc.exists()) {
            console.log("Cleaning up remaining overlap", overlap.recordId);
            await deleteTravelRecord(overlap.recordId);
            console.log("Cleanup DELETE SUCCESS", overlap.recordId);
          }
        } catch (err) {
          console.error("[Cleanup Delete Error]:", err);
        }
      }
    } catch (error) {
      console.error("[Presence Range Hook Error]:", error);
      toast.error("Could not save travel record with calendar sync.");
      throw error;
    } finally {
      setSplittingFlag(false);
    }
  };

  return { handleTogglePresence, handleAddTravelRange };
}
