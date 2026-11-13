
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ParkingSquare,
  ShieldCheck,
  Clock3,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";
import "./Login.css";

const API_URL = "http://127.0.0.1:8000";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Login failed. Please check your credentials."
        );
      }

      if (!data.access_token || !data.role) {
        throw new Error("Login information was not returned correctly.");
      }

      const tokenParts = data.access_token.split(".");

      if (tokenParts.length !== 3) {
        throw new Error("Invalid login token.");
      }

      const base64Payload = tokenParts[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const payload = JSON.parse(
        window.atob(
          base64Payload.padEnd(
            Math.ceil(base64Payload.length / 4) * 4,
            "="
          )
        )
      );

      const userId = payload.sub;

      if (!userId) {
        throw new Error("User ID not found in login token.");
      }

      const role = data.role.toUpperCase();
      const token = data.access_token;
      const tokenType = data.token_type || "bearer";

      // One shared login session.
      localStorage.setItem("access_token", token);

      // Compatibility with existing Admin and User pages.
      localStorage.setItem("admin_access_token", token);
      localStorage.setItem("user_access_token", token);

      localStorage.setItem("user_id", String(userId));
      localStorage.setItem("admin_user_id", String(userId));

      localStorage.setItem("user_email", email.trim());
      localStorage.setItem("admin_user_email", email.trim());

      localStorage.setItem("user_role", role);
      localStorage.setItem("role", role);

      localStorage.setItem("user_token_type", tokenType);
      localStorage.setItem("admin_token_type", tokenType);

      if (role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the backend. Make sure FastAPI is running."
        );
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual-overlay" />

        <div className="login-visual-inner">
          <Link to="/" className="login-brand">
            <span className="login-brand-icon">
              <ParkingSquare size={25} strokeWidth={2.2} />
            </span>
            <span>Smart<span>Park</span></span>
          </Link>

          <div className="login-visual-content">
            <span className="login-visual-tag">
              <span className="login-live-dot" />
              SMARTER PARKING STARTS HERE
            </span>

            <h1>
              Your city.
              <br />
              Your space.
              <br />
              <span>Your journey.</span>
            </h1>

            <p>
              A simpler way to find, reserve, and manage your parking.
              Get where you're going without the parking stress.
            </p>

            <div className="login-benefits">
              <div className="login-benefit">
                <span className="login-benefit-icon">
                  <MapPin size={19} />
                </span>
                <div>
                  <strong>Find your spot</strong>
                  <small>Discover available parking spaces</small>
                </div>
              </div>

              <div className="login-benefit">
                <span className="login-benefit-icon">
                  <Clock3 size={19} />
                </span>
                <div>
                  <strong>Save your time</strong>
                  <small>Reserve before you arrive</small>
                </div>
              </div>

              <div className="login-benefit">
                <span className="login-benefit-icon">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <strong>Park with confidence</strong>
                  <small>Manage bookings in one place</small>
                </div>
              </div>
            </div>
          </div>

          <div className="login-visual-footer">
            <span>SMART PARKING. SMOOTHER JOURNEYS.</span>
            <span>© {new Date().getFullYear()} SmartPark</span>
          </div>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-form-container">
          <Link to="/" className="login-mobile-brand">
            <span className="login-brand-icon">
              <ParkingSquare size={23} />
            </span>
            <span>Smart<span>Park</span></span>
          </Link>

          <div className="login-form-topline">
            <span className="login-eyebrow">WELCOME BACK</span>
            <span className="login-secure-label">
              <LockKeyhole size={13} />
              SECURE SIGN IN
            </span>
          </div>

          <h2>Good to see you again.</h2>
          <p className="login-description">
            Sign in to your account and get back to a smoother parking
            experience.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <div className="password-label-row">
                <label htmlFor="login-password">Password</label>
              </div>

              <div className="password-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              <span>{loading ? "Signing in..." : "Sign In to SmartPark"}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-divider">
            <span />
            <small>NEW TO SMARTPARK?</small>
            <span />
          </div>

          <p className="login-register-text">
            Don't have an account?{" "}
            <Link to="/register">Create an account</Link>
          </p>

          <Link to="/" className="login-home-link">
            <ArrowRight size={15} className="login-back-arrow" />
            Back to Home
          </Link>

          <p className="login-form-footer">
            Your parking experience, made effortless.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
