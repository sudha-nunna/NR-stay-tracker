
import {
  parseISO,
  format,
  differenceInCalendarDays,
  isValid,
} from "date-fns";

export const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";

  try {
    let date;

    if (typeof dateValue === "string") {
      date = parseISO(dateValue);
    } else if (dateValue?.seconds) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }

    if (!isValid(date)) {
      return "N/A";
    }

    return format(date, "dd MMM yyyy");
  } catch (error) {
    console.error(error);
    return "N/A";
  }
};

export const calculateDaysBetween = (
  startDate,
  endDate
) => {
  if (!startDate || !endDate) return 0;

  try {
    let start;
    let end;

    if (typeof startDate === "string") {
      start = parseISO(startDate);
    } else if (startDate?.seconds) {
      start = new Date(startDate.seconds * 1000);
    } else {
      start = new Date(startDate);
    }

    if (typeof endDate === "string") {
      end = parseISO(endDate);
    } else if (endDate?.seconds) {
      end = new Date(endDate.seconds * 1000);
    } else {
      end = new Date(endDate);
    }

    if (!isValid(start) || !isValid(end)) {
      return 0;
    }

    return Math.max(
      differenceInCalendarDays(end, start) + 1,
      0
    );
  } catch (error) {
    console.error(error);
    return 0;
  }
};