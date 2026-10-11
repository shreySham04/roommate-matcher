import React, { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage.js";
import { parseCsv, validateRows } from "./csv.js";
import { rankMatches, REQUIRED_COLUMNS } from "./matching.js";

function Dashboard({ handleLogout }) {
  const [data, setData] = useState([]);
  const [selectedPersonIndex, setSelectedPersonIndex] = useState("");
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setFileName(file.name);
    if (!file.name.toLowerCase().endsWith(".csv")) return setError("Choose a CSV file.");
    if (file.size > 2 * 1024 * 1024) return setError("CSV files must be smaller than 2 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result));
        const validationError = validateRows(rows, REQUIRED_COLUMNS);
        if (validationError) throw new Error(validationError);
        setData(rows); setMatches([]); setSelectedPersonIndex("");
      } catch (uploadError) {
        setData([]); setMatches([]); setError(uploadError.message || "The CSV could not be read.");
      }
    };
    reader.onerror = () => setError("The file could not be read.");
    reader.readAsText(file);
  };

  const handleSelectionChange = (event) => {
    const index = event.target.value;
    setSelectedPersonIndex(index);
    setMatches(rankMatches(data, index).matches);
  };

  return <div className="app-shell">
    <header className="dashboard-header"><div><p className="eyebrow">ROOMER / DEMO MODE</p><h1 className="dashboard-title">Find a better fit.</h1></div><button type="button" onClick={handleLogout} className="logout-button">Exit demo</button></header>
    <main className="dashboard-main">
      <section className="panel setup-panel"><p className="eyebrow">01 / PROFILE DATA</p><h2>Start with a safe dataset</h2><p className="panel-intro">Upload synthetic or anonymized survey data. Roomer never displays contact details in recommendations.</p>
        <div className="panel-content"><div><label htmlFor="csv-upload">Choose CSV</label><input id="csv-upload" type="file" accept=".csv,text/csv" onChange={handleFileUpload} />{fileName && <p className="file-name">{fileName}</p>}</div>
          {data.length > 0 && <div><label htmlFor="person-select">Profile to match</label><select id="person-select" value={selectedPersonIndex} onChange={handleSelectionChange}><option value="" disabled>Choose a synthetic profile</option>{data.map((row, index) => <option key={index} value={index}>Candidate {index + 1}</option>)}</select></div>}
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="privacy-note"><strong>Privacy first.</strong> Names, emails, phone numbers, and free-text notes are excluded from matching display.</div>
      </section>
      <section className="panel results-panel"><div className="results-heading"><div><p className="eyebrow">02 / COMPATIBILITY</p><h2>Top eligible matches</h2></div><span className="score-legend">Rule-based score / 100</span></div>
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