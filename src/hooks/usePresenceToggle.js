import { parseISO, format, subDays, addDays, isAfter } from "date-fns";
import toast from "react-hot-toast";
import { addTravelRecord, updateTravelRecord } from "../firebase/firestoreService";

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
      console.error("[Presence Hook Error]:", error);
      toast.error("Could not update presence tracking status.");
    }
  };

  return { handleTogglePresence };
}