import { parseISO, format, differenceInCalendarDays, isValid } from "date-fns";

export const GLOBAL_MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

/**
 * Generates an array of padded string days matching the max count of a chosen month context
 */
export const getDaysInMonth = (month, year = new Date().getFullYear()) => {
  if (!month) {
    return Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  }
  
  const daysMap = {
    "02": year % 4 === 0 ? 29 : 28,
    "04": 30,
    "06": 30,
    "09": 30,
    "11": 30
  };
  
  const total = daysMap[month] || 31;
  return Array.from({ length: total }, (_, i) => String(i + 1).padStart(2, "0"));
};

/**
 * Safely extracts month and day components from stored profile representations
 */
export const splitMonthDay = (savedValue) => {
  if (!savedValue || savedValue === "not-set") return { month: "", day: "" };
  let target = savedValue;
  if (savedValue.includes("-") && savedValue.split("-").length === 3) {
    const parts = savedValue.split("-");
    target = `${parts[1]}-${parts[2]}`;
  }
  const pieces = target.split("-");
  return { month: pieces[0] || "", day: pieces[1] || "" };
};

/**
 * Cleanly formats absolute timestamps into simplified text segments
 */
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

    if (!isValid(date)) return "N/A";

    return format(date, "dd MMM");
  } catch (error) {
    console.error(error);
    return "N/A";
  }
};

/**
 * Accurately tracks absolute day differences between specific timeframe sets
 */
export const calculateDaysBetween = (startDate, endDate) => {
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

    if (!isValid(start) || !isValid(end)) return 0;

    return Math.max(differenceInCalendarDays(end, start) + 1, 0);
  } catch (error) {
    console.error(error);
    return 0;
  }
};