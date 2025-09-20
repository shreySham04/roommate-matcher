import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";

// --- Dashboard Component ---
function Dashboard({ handleLogout }) {
  const [data, setData] = useState([]);
  const [selectedPersonIndex, setSelectedPersonIndex] = useState(null);
  const [matches, setMatches] = useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && window.Papa) {
      window.Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setData(result.data);
          setMatches([]);
          setSelectedPersonIndex(null);
        },
      });
    }
  };

  const findMatches = (personIndex) => {
    if (personIndex === null || personIndex === "" || !data[personIndex]) {
        setMatches([]);
        return;
    };
    const person = data[personIndex];
    const scores = data
      .map((other, i) => {
        if (i === parseInt(personIndex, 10)) return null;
        let score = 0;
        const weights = { city: 3, rent: 2, schedule: 2, cleanliness: 1, cooking: 1, smoking: 1 };
        if (person["Preferred City\\Area to live in"] === other["Preferred City\\Area to live in"]) score += weights.city;
        if (person["Monthly Rent Budget"] === other["Monthly Rent Budget"]) score += weights.rent;
        if (person["Sleeping Schedule"] === other["Sleeping Schedule"]) score += weights.schedule;
        if (person["Cleanliness Preference"] === other["Cleanliness Preference"]) score += weights.cleanliness;
        if (person["Cooking Habits"] === other["Cooking Habits"]) score += weights.cooking;
        if (person["Smoking Habits"] === other["Smoking Habits"]) score += weights.smoking;
        return { name: other["Full Name"], score };
      })
      .filter(Boolean);
    const sorted = scores.sort((a, b) => b.score - a.score);
    setMatches(sorted.slice(0, 3));
  };
  
  const handleSelectionChange = (e) => {
      const index = e.target.value;
      setSelectedPersonIndex(index);
      findMatches(index);
  }

  return (
    <div>
      <header className="dashboard-header">
        <h1 className="dashboard-title">Roomer</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
      <main className="dashboard-main">
        <div className="panel">
          <h2>Find Matches</h2>
          <div className="panel-content">
            <div>
              <label htmlFor="csv-upload">1. Upload CSV File</label>
              <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} disabled={!scriptLoaded}/>
               {!scriptLoaded && <p style={{fontSize: '0.8rem', color: '#666'}}>Loading CSV parser...</p>}
            </div>
            {data.length > 0 && (
              <div>
                <label htmlFor="person-select">2. Select a Person</label>
                <select id="person-select" value={selectedPersonIndex === null ? '' : selectedPersonIndex} onChange={handleSelectionChange}>
                  <option value="" disabled>-- Choose --</option>
                  {data.map((row, i) => (<option key={i} value={i}>{row["Full Name"] || `Row ${i + 1}`}</option>))}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="panel">
          <h2>Top 3 Matches</h2>
          {matches.length > 0 ? (
            <ul className="matches-list">
              {matches.map((m, i) => (
                <li key={i} className="match-item">
                  <span className="match-name">{i + 1}. {m.name}</span>
                  <span className="match-score">Score: {m.score}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-matches"><p>Please upload a file and select a person to see matches.</p></div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- Main App Component ---
function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={setLoggedInUser} />} />
        <Route
          path="/"
          element={
            loggedInUser ? (
              <Dashboard handleLogout={() => setLoggedInUser(null)} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
