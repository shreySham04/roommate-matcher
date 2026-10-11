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

export const validateRows = (rows, requiredColumns) => {
  if (!rows.length) return "The CSV does not contain any profiles.";
  const missingColumns = requiredColumns.filter((column) => !(column in rows[0]));
  return missingColumns.length ? `Missing required columns: ${missingColumns.join(", ")}` : null;
};