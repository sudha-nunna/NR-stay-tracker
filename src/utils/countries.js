import { getData } from "country-list";

export const countries = getData()
  .map(country => {
    let cleanName = country.name;

    // 1. Remove trailing "(the)" or " (the)"
    cleanName = cleanName.replace(/\s*\(the\)$/i, "");

    // 2. Remove trailing ", the" or ", The"
    cleanName = cleanName.replace(/,\s*the$/i, "");

    // 3. Fix specific cases like "Tanzania, the United Republic of" -> "Tanzania"
    if (cleanName.includes(",")) {
      cleanName = cleanName.split(",")[0].trim();
    }

    return {
      code: country.code,
      name: cleanName.trim()
    };
  })
  // Sort alphabetically by the final clean names
  .sort((a, b) => a.name.localeCompare(b.name));