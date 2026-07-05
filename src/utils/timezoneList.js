import moment from "moment-timezone";

export const timezones = moment.tz.names()
  .map((tz) => {
    const offset = moment.tz(tz).format("Z");

    return {
      value: tz,
      label: `(GMT${offset}) ${tz.replace(/_/g, " ")}`,
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));