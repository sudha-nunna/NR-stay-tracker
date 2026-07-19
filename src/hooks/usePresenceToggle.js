import { parseISO, format, subDays, addDays, isAfter } from "date-fns";
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
          purpose: parentRangeRecord.purpose,
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

          console.log("Parent Record", parentRangeRecord);
          console.log("DELETE PARENT", parentRangeRecord.recordId, parentRangeRecord);

          await deleteTravelRecord(parentRangeRecord.recordId);
          console.log("DELETE SUCCESS", parentRangeRecord.recordId);

          const createOperations = [];

          const leftSplit = {
            ...baseProps,
            departureDate: pStartStr,
            arrivalDate: prevDayStr,
          };
          const leftSplitExists = records.some((r) => {
            const dep = normalizeDate(r.departureDate);
            const arr = normalizeDate(r.arrivalDate);
            return (
              dep === pStartStr &&
              arr === prevDayStr &&
              (r.purpose || "") === (baseProps.purpose || "") &&
              (r.fromCountry || "").toUpperCase() ===
                (baseProps.fromCountry || "").toUpperCase() &&
              (r.toCountry || "").toUpperCase() ===
                (baseProps.toCountry || "").toUpperCase()
            );
          });
          if (!leftSplitExists) {
            console.log("CREATE LEFT SPLIT", leftSplit);
            createOperations.push(
              addTravelRecord(user.uid, leftSplit),
            );
          } else {
            console.log("Left Split already exists, skipping", leftSplit);
          }

          const rightSplit = {
            ...baseProps,
            departureDate: nextDayStr,
            arrivalDate: pEndStr,
          };
          const rightSplitExists = records.some((r) => {
            const dep = normalizeDate(r.departureDate);
            const arr = normalizeDate(r.arrivalDate);
            return (
              dep === nextDayStr &&
              arr === pEndStr &&
              (r.purpose || "") === (baseProps.purpose || "") &&
              (r.fromCountry || "").toUpperCase() ===
                (baseProps.fromCountry || "").toUpperCase() &&
              (r.toCountry || "").toUpperCase() ===
                (baseProps.toCountry || "").toUpperCase()
            );
          });
          if (!rightSplitExists) {
            console.log("CREATE RIGHT SPLIT", rightSplit);
            createOperations.push(
              addTravelRecord(user.uid, rightSplit),
            );
          } else {
            console.log("Right Split already exists, skipping", rightSplit);
          }

          if (!existingSingleDayRecord) {
            console.log("CREATE TRAVEL RECORD", {
              departureDate: cleanDateStr,
              arrivalDate: cleanDateStr,
              fromCountry: targetFromCountry,
              toCountry: targetToCountry,
              purpose: targetPurpose,
            });
            createOperations.push(
              addTravelRecord(user.uid, {
                departureDate: cleanDateStr,
                arrivalDate: cleanDateStr,
                fromCountry: targetFromCountry,
                toCountry: targetToCountry,
                purpose: targetPurpose,
              }),
            );
          }

          for (const createOp of createOperations) {
            try {
              const result = await createOp;
              console.log("CREATE SUCCESS", result?.id || result);
            } catch (err) {
              console.error("[Split Create Error]:", err);
            }
          }

          const remainingDuplicates = records.filter((r) => {
            if (!r.departureDate || !r.arrivalDate) return false;
            const dep = normalizeDate(r.departureDate);
            const arr = normalizeDate(r.arrivalDate);
            const isSingleDayOverride =
              dep === arr &&
              (r.purpose === "Calendar Check-In" ||
                r.purpose === "Calendar Check-Out" ||
                r.purpose === "Daily GPS Check-In" ||
                r.purpose === "Country Changed");
            if (isSingleDayOverride) return false;
            return cleanDateStr >= dep && cleanDateStr <= arr;
          });

          for (const duplicate of remainingDuplicates) {
            try {
              await deleteTravelRecord(duplicate.recordId);
              console.log("Cleaned up remaining duplicate", duplicate.recordId);
            } catch (err) {
              console.error("[Duplicate Cleanup Error]:", err);
            }
          }
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
      console.error("[Presence Hook Error]:", error);
      toast.error("Could not update presence tracking status.");
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
