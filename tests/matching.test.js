import test from "node:test";
import assert from "node:assert/strict";
import { getAvailableTopics, parseRentRange, rankMatches, scorePair } from "../src/matching.js";

const profile = (overrides = {}) => ({
  "Preferred City\\Area to live in": " Hyderabad ",
  "Monthly Rent Budget": "Rs5,000 - Rs10,000",
  "Sleeping Schedule": "Night Owl",
  "Cleanliness Preference": "4",
  "Cooking Habits": "Prefer cooking",
  "Smoking Habits": "No",
  "Drinking Habits": "No",
  Pets: "Open to pets",
  "Hobbies/Interests": "Cricket, Reading",
  "Preferred Roommate Gender": "Any",
  Gender: "Female",
  ...overrides,
});

test("normalizes rent ranges", () => {
  assert.deepEqual(parseRentRange("Rs5,000 - Rs10,000"), { min: 5000, max: 10000 });
  assert.deepEqual(parseRentRange("Less than Rs5,000"), { min: 0, max: 5000 });
});

test("keeps open-ended rent scores finite", () => {
  const result = scorePair(profile({ "Monthly Rent Budget": "Above Rs15,000" }), profile({ "Monthly Rent Budget": "Above Rs15,000" }));
  assert.equal(Number.isFinite(result.score), true);
  assert.equal(result.score, 100);
});

test("scores equivalent values consistently", () => {
  assert.equal(scorePair(profile(), profile({ "Preferred City\\Area to live in": "hyderabad" })).score, 100);
});

test("excludes self, duplicates, and hard gender conflicts", () => {
  const rows = [profile({ "Preferred Roommate Gender": "Female" }), profile(), profile({ Gender: "Male" }), profile({ Gender: "Male" })];
  const result = rankMatches(rows, 0, 10);
  assert.deepEqual(result.matches.map((match) => match.candidateIndex), [1]);
});

test("returns deterministic tie order and handles empty input", () => {
  const rows = [profile({ Fixture: "first" }), profile({ Fixture: "second" }), profile({ Fixture: "third" })];
  assert.deepEqual(rankMatches(rows, 0, 3).matches.map((match) => match.candidateIndex), [1, 2]);
  assert.deepEqual(rankMatches([], 0).matches, []);
});

test("applies custom topic weights", () => {
  const first = profile({ "Preferred City\\Area to live in": "Pune" });
  const second = profile({ "Preferred City\\Area to live in": "Hyderabad", "Sleeping Schedule": "Early Bird" });
  const result = scorePair(first, second, { city: 10, rent: 0, schedule: 0, cleanliness: 0, cooking: 0, smoking: 0, drinking: 0, pets: 0, hobbies: 0 });
  assert.equal(result.score, 0);
});

test("shows settings only for uploaded columns", () => {
  const rows = [{ "Preferred City\\Area to live in": "Pune", "Monthly Rent Budget": "Rs5,000 - Rs10,000", "Sleeping Schedule": "Night Owl", "Cleanliness Preference": "4" }];
  assert.deepEqual(getAvailableTopics(rows), ["city", "rent", "schedule", "cleanliness"]);
});