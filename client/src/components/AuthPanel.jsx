
import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function AuthPanel({ mode, onLogin, onSwitchMode, notice }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    const isRegister = mode === "register";

    if (isRegister && password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegister ? { name: name.trim(), email, password } : { email, password }
          ),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Request failed. Please try again.");
      }

      if (isRegister) {
        onSwitchMode(
          "login",
          "Account created successfully. Please log in."
        );
        return;
      }

      if (!data.token) {
        throw new Error("Login response did not contain a token.");
      }

      localStorage.setItem("token", data.token);
      onLogin(data.token);
    } catch (error) {
      setMessage(error.message || "Could not connect to the server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  const visibleMessage = message || notice;
  const visibleMessageType =
    messageType || (notice ? "success" : "");

  return (
    <main className="auth-page">
      <div className="auth-visual">
        <a
          className="brand auth-brand"
          href="#login"
          onClick={(e) => e.preventDefault()}
        >
          <span className="brand-mark">S</span>
          <span>ShowNest</span>
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

          {visibleMessage && (
            <p
              className={
                visibleMessageType === "error"
                  ? "auth-error-message"
                  : "auth-success-message"
              }
              role={visibleMessageType === "error" ? "alert" : "status"}
            >
              {visibleMessage}
            </p>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <label htmlFor="register-name">Full name</label>
                <input
                  id="register-name"
                  type="text"
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
                mode === "register"
                  ? "At least 8 characters"
                  : "Enter your password"
              }
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              minLength={mode === "register" ? 8 : undefined}
              required
            />

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in →"
                  : "Create account →"}
            </button>
          </form>

          <p className="auth-switch">
            {mode === "login"
              ? "New to ShowNest?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMessage("");
                setMessageType("");
                onSwitchMode(mode === "login" ? "register" : "login", "");
              }}
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


