
import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function AuthPanel({ mode, onLogin, onSwitchMode, notice }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const isRegister = mode === "register";
      const response = await fetch(
        `${API_URL}/api/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegister ? { name, email, password } : { email, password }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed.");
      }

      if (isRegister) {
        setMessage("Account created successfully. Please log in.");
        onSwitchMode("login", "Account created successfully. Please log in.");
        return;
      }

      if (!data.token) {
        throw new Error("Login response did not contain a token.");
      }

      localStorage.setItem("token", data.token);
      onLogin(data.token);
    } catch (error) {
      setMessage(error.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-visual">
        <a className="brand auth-brand" href="#login">
          <span className="brand-mark">e</span>
          <span>eventra</span>
        </a>

        <div className="auth-promo">
          <span className="eyebrow">YOUR NEXT EXPERIENCE STARTS HERE</span>
          <h1>
            Make plans.
            <br />
            Make <span>memories.</span>
          </h1>
          <p>
            Discover live concerts, unforgettable performances and the
            experiences everyone will be talking about.
          </p>
          <div className="promo-tags">
            <span>✦ Live music</span>
            <span>✦ Sports</span>
            <span>✦ Theatre</span>
          </div>
        </div>

        <div className="auth-visual-footer">
          GOOD TIMES ARE BETTER SHARED.
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {mode === "login" ? "WELCOME BACK" : "JOIN THE EXPERIENCE"}
          </span>

          <h2>
            {mode === "login" ? "Sign in" : "Create your account"}
          </h2>

          <p className="auth-subtitle">
            {mode === "login"
              ? "Pick up where your next adventure begins."
              : "Create an account to discover and book events."}
          </p>

          {(notice || message) && (
            <p className="success-message" role="status">
              {message || notice}
            </p>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <label htmlFor="register-name">Full name</label>
                <input
                  id="register-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </>
            )}

            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === "register" ? "Create a password" : "Enter your password"
              }
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              minLength={mode === "register" ? 6 : undefined}
              required
            />

            <button className="primary-button auth-submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in →"
                  : "Create account →"}
            </button>
          </form>

          <p className="auth-switch">
            {mode === "login"
              ? "New to Eventra?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() =>
                onSwitchMode(mode === "login" ? "register" : "login", "")
              }
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>

          <p className="auth-legal">
            Your next great experience is just a few clicks away.
          </p>
        </div>
      </div>
    </main>
  );
}

export default AuthPanel;

