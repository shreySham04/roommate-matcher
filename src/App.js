import React, { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage.js";
import { parseSpreadsheet, validateRows } from "./csv.js";
import { getAvailableTopics, rankMatches, REQUIRED_COLUMNS, TOPIC_LABELS, WEIGHTS } from "./matching.js";

function Dashboard({ handleLogout }) {
  const [data, setData] = useState([]);
  const [selectedPersonIndex, setSelectedPersonIndex] = useState("");
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [weights, setWeights] = useState({ ...WEIGHTS });
  const availableTopics = getAvailableTopics(data);

  const profileLabel = (row, index) => {
    const serial = row["Serial No"] || row["Serial Number"] || row.Serial || row.ID;
    const name = row["Full Name"] || row.Name;
    if (serial && name) return `${serial} - ${name}`;
    if (serial) return `Serial ${serial}`;
    if (name) return name;
    return `Candidate ${index + 1}`;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setFileName(file.name);
    if (!/\.(csv|xlsx)$/i.test(file.name)) return setError("Choose a CSV or XLSX file.");
    if (file.size > 2 * 1024 * 1024) return setError("CSV files must be smaller than 2 MB.");
    parseSpreadsheet(file).then((rows) => {
      try {
        const validationError = validateRows(rows, REQUIRED_COLUMNS);
        if (validationError) throw new Error(validationError);
        setData(rows); setMatches([]); setSelectedPersonIndex("");
      } catch (uploadError) {
        setData([]); setMatches([]); setError(uploadError.message || "The CSV could not be read.");
      }
    }).catch(() => setError("The spreadsheet could not be read."));
  };

  const handleSelectionChange = (event) => {
    const index = event.target.value;
    setSelectedPersonIndex(index);
    setMatches(rankMatches(data, index, 3, weights).matches);
  };

  const handleWeightChange = (topic, value) => {
    const nextWeights = { ...weights, [topic]: Math.max(0, Math.min(10, Number(value) || 0)) };
    setWeights(nextWeights);
    if (selectedPersonIndex !== "") setMatches(rankMatches(data, selectedPersonIndex, 3, nextWeights).matches);
  };

  const clearUploadedData = () => {
    setData([]);
    setMatches([]);
    setSelectedPersonIndex("");
    setFileName("");
    setError("");
  };

  return <div className="app-shell">
    <header className="dashboard-header"><div><p className="eyebrow">ROOMER / DEMO MODE</p><h1 className="dashboard-title">Find a better fit.</h1></div><button type="button" onClick={handleLogout} className="logout-button">Exit demo</button></header>
    <main className="dashboard-main">
      <section className="panel setup-panel"><p className="eyebrow">01 / PROFILE DATA</p><h2>Start with a safe dataset</h2><p className="panel-intro">Upload synthetic or anonymized survey data. Roomer never displays contact details in recommendations.</p>
        <div className="panel-content"><div><label htmlFor="csv-upload">Choose CSV or XLSX</label><input id="csv-upload" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileUpload} />{fileName && <p className="file-name">{fileName}</p>}{data.length > 0 && <button type="button" className="clear-button" onClick={clearUploadedData}>Clear uploaded data</button>}</div>
          {data.length > 0 && <div><label htmlFor="person-select">Profile to match</label><select id="person-select" value={selectedPersonIndex} onChange={handleSelectionChange}><option value="" disabled>Choose a profile</option>{data.map((row, index) => <option key={index} value={index}>{profileLabel(row, index)}</option>)}</select><p className="field-help">Names and serials are shown locally. Email addresses and phone numbers are never displayed.</p></div>}
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="privacy-note"><strong>Privacy first.</strong> Names and serials can be shown locally; emails, phone numbers, and free-text notes are excluded.</div>
      </section>
      <section className="panel settings-panel"><p className="eyebrow">02 / SETTINGS</p><h2>Adjust priorities</h2><p className="panel-intro">Set each topic from 0 to 10. Only topics found in the uploaded file are shown.</p>{availableTopics.length > 0 ? <div className="weight-grid">{availableTopics.map((topic) => <label key={topic} className="weight-control"><span>{TOPIC_LABELS[topic]}</span><input type="number" min="0" max="10" step="1" value={weights[topic]} onChange={(event) => handleWeightChange(topic, event.target.value)} /></label>)}</div> : <p className="field-help">Upload a CSV or XLSX file to see settings for its available topics.</p>}</section>
      <section className="panel results-panel"><div className="results-heading"><div><p className="eyebrow">03 / COMPATIBILITY</p><h2>Top eligible matches</h2></div><span className="score-legend">Rule-based score / 100</span></div>
        {matches.length > 0 ? <ol className="matches-list">{matches.map((match) => <li key={match.candidateIndex} className="match-item"><div className="match-rank">{String(match.candidateIndex + 1).padStart(2, "0")}</div><div className="match-content"><div className="match-topline"><h3>{match.displayName}</h3><strong>{match.score}</strong></div><p>{match.shared.length ? `Shared: ${match.shared.join(", ")}.` : "No shared preferences were found."}</p><div className="contribution-list">{match.contributions.slice(0, 4).map((item) => <span key={item.key}>{item.label}: {Math.round(item.similarity * 100)}%</span>)}</div></div></li>)}</ol> : <div className="no-matches"><span>—</span><p>Upload a dataset and choose a profile to see explainable recommendations.</p></div>}
        <p className="disclaimer">Scores summarize selected preferences. They are not probabilities of successful cohabitation.</p>
      </section>
    </main>
  </div>;
}

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  return <BrowserRouter><Routes><Route path="/login" element={<LoginPage onLogin={setLoggedInUser} />} /><Route path="/" element={loggedInUser ? <Dashboard handleLogout={() => setLoggedInUser(null)} /> : <Navigate to="/login" />} /></Routes></BrowserRouter>;
}

export default App;