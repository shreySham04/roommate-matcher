const FIELD_LABELS = {
  city: "location",
  rent: "rent budget",
  schedule: "sleeping schedule",
  cleanliness: "cleanliness",
  cooking: "cooking habits",
  smoking: "smoking habits",
  drinking: "drinking habits",
  pets: "pet preference",
  hobbies: "shared interests",
};

export const REQUIRED_COLUMNS = [
  "Preferred City\\Area to live in",
  "Monthly Rent Budget",
  "Sleeping Schedule",
  "Cleanliness Preference",
];

export const WEIGHTS = {
  city: 3,
  rent: 3,
  schedule: 2,
  cleanliness: 2,
  cooking: 1,
  smoking: 2,
  drinking: 1,
  pets: 1,
  hobbies: 1,
};

const text = (value) => String(value ?? "").trim().toLowerCase();
const missing = (value) => ["", "null", "none", "n/a", "na", "unknown"].includes(text(value));

export const normalizeCity = (value) => text(value).replace(/\s+/g, " ").replace(/\bhyderabad telangana\b/g, "hyderabad");

const parseNumber = (value) => {
  const match = String(value ?? "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

export const parseRentRange = (value) => {
  const source = text(value).replace(/rs\.?/g, "").replace(/₹/g, "");
  if (missing(source)) return null;
  const numbers = source.match(/\d+(?:,\d+)*(?:\.\d+)?/g)?.map((item) => Number(item.replace(/,/g, ""))) || [];
  if (source.includes("less") && numbers[0] != null) return { min: 0, max: numbers[0] };
  if (source.includes("above") && numbers[0] != null) return { min: numbers[0], max: Number.POSITIVE_INFINITY };
  if (numbers.length >= 2) return { min: Math.min(numbers[0], numbers[1]), max: Math.max(numbers[0], numbers[1]) };
  return numbers.length === 1 ? { min: numbers[0], max: numbers[0] } : null;
};

const rangeSimilarity = (left, right) => {
  const first = parseRentRange(left);
  const second = parseRentRange(right);
  if (!first || !second) return null;
  const overlap = Math.max(0, Math.min(first.max, second.max) - Math.max(first.min, second.min));
  const span = Math.max(first.max, second.max) - Math.min(first.min, second.min);
  return span === 0 ? 1 : overlap / span;
};

const setSimilarity = (left, right) => {
  const toSet = (value) => new Set(text(value).split(/[,;]+/).map((item) => item.trim()).filter(Boolean));
  const first = toSet(left);
  const second = toSet(right);
  if (!first.size || !second.size) return null;
  const intersection = [...first].filter((item) => second.has(item)).length;
  return intersection / new Set([...first, ...second]).size;
};

const cleanlinessSimilarity = (left, right) => {
  const first = parseNumber(left);
  const second = parseNumber(right);
  if (first == null || second == null || first < 1 || first > 5 || second < 1 || second > 5) return null;
  return 1 - Math.abs(first - second) / 4;
};

const valueSimilarity = (left, right) => {
  if (missing(left) || missing(right)) return null;
  return text(left) === text(right) ? 1 : 0;
};

const petSimilarity = (left, right) => {
  if (missing(left) || missing(right)) return null;
  const first = text(left).includes("not") ? "no" : "yes";
  const second = text(right).includes("not") ? "no" : "yes";
  return first === second ? 1 : 0;
};

const similarityFor = (key, first, second) => {
  if (key === "city") return valueSimilarity(normalizeCity(first), normalizeCity(second));
  if (key === "rent") return rangeSimilarity(first, second);
  if (key === "cleanliness") return cleanlinessSimilarity(first, second);
  if (key === "hobbies") return setSimilarity(first, second);
  if (key === "pets") return petSimilarity(first, second);
  const fields = {
    schedule: "Sleeping Schedule",
    cooking: "Cooking Habits",
    smoking: "Smoking Habits",
    drinking: "Drinking Habits",
  };
  return valueSimilarity(first[fields[key]], second[fields[key]]);
};

const genderEligible = (person, candidate) => {
  const preference = text(person["Preferred Roommate Gender"]);
  if (missing(preference) || preference === "any") return true;
  return preference === text(candidate.Gender);
};

export const getExclusionReason = (person, candidate) => {
  if (!genderEligible(person, candidate)) return "Does not meet the selected roommate gender requirement.";
  return null;
};

export const scorePair = (person, candidate) => {
  const fields = {
    city: [person["Preferred City\\Area to live in"], candidate["Preferred City\\Area to live in"]],
    rent: [person["Monthly Rent Budget"], candidate["Monthly Rent Budget"]],
    schedule: [person, candidate],
    cleanliness: [person["Cleanliness Preference"], candidate["Cleanliness Preference"]],
    cooking: [person, candidate],
    smoking: [person, candidate],
    drinking: [person, candidate],
    pets: [person.Pets, candidate.Pets],
    hobbies: [person["Hobbies/Interests"], candidate["Hobbies/Interests"]],
  };
  const contributions = [];
  let weightedTotal = 0;
  let validWeight = 0;
  Object.entries(WEIGHTS).forEach(([key, weight]) => {
    const similarity = similarityFor(key, fields[key][0], fields[key][1]);
    if (similarity == null) return;
    const points = similarity * weight;
    weightedTotal += points;
    validWeight += weight;
    contributions.push({ key, label: FIELD_LABELS[key], similarity, points });
  });
  return {
    score: validWeight ? Math.round((weightedTotal / validWeight) * 100) : 0,
    contributions: contributions.sort((left, right) => right.points - left.points),
  };
};

export const rankMatches = (rows, selectedIndex, topN = 3) => {
  const person = rows[selectedIndex];
  if (!person) return { matches: [], error: "Select a valid profile." };
  const rowKey = (row) => JSON.stringify(Object.keys(row).sort().map((key) => [key, row[key]]));
  const seen = new Set([rowKey(person)]);
  const matches = rows
    .map((candidate, index) => {
      const key = rowKey(candidate);
      if (index === Number(selectedIndex) || seen.has(key)) return null;
      seen.add(key);
      const exclusion = getExclusionReason(person, candidate);
      if (exclusion) return null;
      const result = scorePair(person, candidate);
      return {
        candidate,
        candidateIndex: index,
        displayName: `Candidate ${index + 1}`,
        ...result,
        shared: result.contributions.filter((item) => item.similarity > 0).map((item) => item.label),
        differences: result.contributions.filter((item) => item.similarity === 0).map((item) => item.label),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.candidateIndex - right.candidateIndex);
  return { matches: matches.slice(0, topN), eligibleCount: matches.length };
};
