import * as XLSX from "xlsx";

export const parseCsv = (source) => {
  const rows = []; let cell = ""; let row = []; let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]; const next = source[index + 1];
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(cell.trim()); cell = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) { if (character === "\r" && next === "\n") index += 1; row.push(cell.trim()); cell = ""; if (row.some((value) => value)) rows.push(row); row = []; continue; }
    cell += character;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  const headers = rows.shift()?.map((header) => header.replace(/^\uFEFF/, "")) || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
};

export const validateRows = (rows, requiredColumns = []) => {
  if (!rows.length) return "The CSV does not contain any profiles.";
  if (!Object.keys(rows[0]).some((column) => column.trim())) return "The spreadsheet does not contain column headings.";
  const missingColumns = requiredColumns.filter((column) => !(column in rows[0]));
  return missingColumns.length ? `Missing required columns: ${missingColumns.join(", ")}` : null;
};

export const parseSpreadsheet = async (file) => {
  if (file.name.toLowerCase().endsWith(".csv")) return parseCsv(await file.text());
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return firstSheet ? XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) : [];
};