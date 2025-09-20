import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Effect to load the tsParticles script from a CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/tsparticles-slim@2.12.0/tsparticles.slim.min.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Effect to initialize particles once the script is loaded
  useEffect(() => {
    if (scriptLoaded && window.tsParticles) {
      window.tsParticles.load("particles-bg", {
        background: {
          color: {
            value: "#111827",
          },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "repulse",
            },
            resize: true,
          },
          modes: {
            repulse: {
              distance: 100,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: "#ffffff",
          },
          links: {
            color: "#ffffff",
            distance: 150,
            enable: true,
            opacity: 0.2,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 2,
            straight: false,
          },
          number: {
            density: {
              enable: true,
            },
            value: 80,
          },
          opacity: {
            value: 0.2,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 5 },
          },
        },
        detectRetina: true,
      });
    }
  }, [scriptLoaded]);

  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username') || 'Demo User';
    onLogin({ name: username });
    navigate("/");
  };

  return (
    <div className="login-container">
      <div id="particles-bg"></div>
      <h1 className="login-title">Welcome to Roomer</h1>
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
          />
          <input
            type="password"
            placeholder="Password"
            required
          />
          <button type="submit">Enter</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;