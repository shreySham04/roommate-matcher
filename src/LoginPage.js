import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const handleLogin = (event) => { event.preventDefault(); onLogin({ name: name.trim() || "Guest" }); navigate("/"); };
  return <div className="login-container"><div className="login-copy"><p className="eyebrow">ROOMER / FIND YOUR FIT</p><h1>Living together starts with knowing what matters.</h1><p>Explore transparent, preference-based roommate recommendations using synthetic demo data.</p></div><div className="login-card"><h2>Enter the demo</h2><form onSubmit={handleLogin}><label htmlFor="username">Display name</label><input id="username" type="text" name="username" value={name} onChange={(event) => setName(event.target.value)} placeholder="Guest" autoComplete="off" /><button type="submit">Continue as guest</button></form><small>No account or password is collected in this demo.</small></div></div>;
}

export default LoginPage;