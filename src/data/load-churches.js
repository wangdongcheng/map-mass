import readExcelFile from "read-excel-file/browser";
import workbookUrl from "../map/malta_all_church_mass_times.xlsx?url";
import {
  normaliseChurches,
  rowsToRecords
} from "./normalise-churches.js";

export async function loadChurches() {
  const response = await fetch(workbookUrl);

  if (!response.ok) {
    throw new Error(`Could not load church data (${response.status})`);
  }

  const sheets = await readExcelFile(await response.blob());
  const churchesSheet = sheets.find((sheet) => sheet.sheet === "Churches");
  const massTimesSheet = sheets.find((sheet) => sheet.sheet === "Mass Times");

  if (!churchesSheet || !massTimesSheet) {
    throw new Error("The church workbook is missing a required sheet");
  }

  const churches = normaliseChurches(
    rowsToRecords(churchesSheet.data, "No."),
    rowsToRecords(massTimesSheet.data, "Church No.")
  );

  if (!churches.length) {
    throw new Error("The church workbook contains no churches with valid coordinates");
  }

  return churches;
}
