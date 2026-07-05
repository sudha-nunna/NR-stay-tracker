import { getData } from "country-list";

export const countries = getData()
  .map(country => ({
    code: country.code,
    name: country.name
  }))
  .sort((a, b) => a.name.localeCompare(b.name));