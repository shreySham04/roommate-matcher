import React, { useState } from "react";
import Papa from "papaparse";

export default function RoommateSelector() {
  const [csvData, setCsvData] = useState([]);
  const [serialNo, setSerialNo] = useState("");
  const [results, setResults] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setResults([]);
      },
    });
  };

  const calculateCompatibility = (user1, user2) => {
    let score = 0;
    let reasons = [];

    const getField = (obj, key) => (obj[key] ? obj[key].toString().toLowerCase().trim() : "");

    // City match
    if (getField(user1, "Preferred City\\Area to live in") && getField(user1, "Preferred City\\Area to live in") === getField(user2, "Preferred City\\Area to live in")) {
      score += 5;
      reasons.push("Same city preference");
    }

    // Sleeping schedule
    if (getField(user1, "Sleeping Schedule") && getField(user1, "Sleeping Schedule") === getField(user2, "Sleeping Schedule")) {
      score += 3;
      reasons.push("Same sleeping schedule");
    }

    // Smoking habits
    if (getField(user1, "Smoking Habits") && getField(user1, "Smoking Habits") === getField(user2, "Smoking Habits")) {
      score += 2;
      reasons.push("Same smoking habit");
    }

    // Drinking habits
    if (getField(user1, "Drinking Habits") && getField(user1, "Drinking Habits") === getField(user2, "Drinking Habits")) {
      score += 2;
      reasons.push("Same drinking habit");
    }

    // Cleanliness preference
    let clean1 = parseInt(user1["Cleanliness Preference"]);
    let clean2 = parseInt(user2["Cleanliness Preference"]);
    if (!isNaN(clean1) && !isNaN(clean2) && Math.abs(clean1 - clean2) <= 1) {
      score += 3;
      reasons.push("Similar cleanliness preference");
    }

    // Cooking habits
    if (getField(user1, "Cooking Habits") && getField(user1, "Cooking Habits") === getField(user2, "Cooking Habits")) {
      score += 2;
      reasons.push("Same cooking habits");
    }

    // Pets
    let pet1 = getField(user1, "Pets");
    let pet2 = getField(user2, "Pets");
    if ((pet1.includes("open") && pet2.includes("open")) || (pet1.includes("not") && pet2.includes("not"))) {
      score += 2;
      reasons.push("Similar pet preference");
    }

    // Hobbies / Interests
    let hobbies1 = new Set(getField(user1, "Hobbies/Interests").split(","));
    let hobbies2 = new Set(getField(user2, "Hobbies/Interests").split(","));
    let common = [...hobbies1].filter((h) => hobbies2.has(h));
    if (common.length > 0) {
      let hobbyScore = Math.min(5, common.length) * 3;
      score += hobbyScore;
      reasons.push("Common hobbies: " + common.join(", "));
    }

    // Roommate gender compatibility
    let pref1 = getField(user1, "Preferred Roommate Gender");
    let gender2 = getField(user2, "Gender");
    let pref2 = getField(user2, "Preferred Roommate Gender");
    let gender1 = getField(user1, "Gender");

    if ((pref1 === "any" || pref1 === gender2) && (pref2 === "any" || pref2 === gender1)) {
      score += 3;
      reasons.push("Roommate gender preference compatible");
    }

    return { score, reasons };
  };

  const findMatches = () => {
    const serial = parseInt(serialNo);
    if (isNaN(serial) || serial < 2 || serial >= csvData.length + 2) {
      alert("Invalid serial number!");
      return;
    }
    const index = serial - 2;
    const user = csvData[index];
    let matches = [];

    csvData.forEach((other, idx) => {
      if (idx === index) return;
      const { score, reasons } = calculateCompatibility(user, other);
      matches.push({ name: other["Full Name"], score, reasons });
    });

    matches.sort((a, b) => b.score - a.score);
    setResults(matches.slice(0, 3));
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Roommate Selector</h2>
      <div>
        <label>Upload CSV file: </label>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>
      <div style={{ marginTop: "10px" }}>
        <label>Enter Serial Number: </label>
        <input type="number" value={serialNo} onChange={(e) => setSerialNo(e.target.value)} />
        <button onClick={findMatches} style={{ marginLeft: "10px" }}>
          Find Matches
        </button>
      </div>
      <div style={{ marginTop: "20px" }}>
        {results.length > 0 && (
          <>
            <h3>Top Matches:</h3>
            {results.map((match, idx) => (
              <div key={idx} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
                <strong>{match.name}</strong> (Score: {match.score})
                <ul>
                  {match.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
