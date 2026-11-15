
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
  UserRound,
  Mail,
  Phone,
} from "lucide-react";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (formData.password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      setMessageType("error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://smartparkingreservationsystem.onrender.com/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Registration failed. Please check your details."
        );
      }

      setMessage("Account created successfully! Redirecting to login...");
      setMessageType("success");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to connect to the backend. Make sure the backend is running."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-visual">
        <div className="register-visual-overlay" />

        <div className="register-visual-inner">
          <Link to="/" className="register-brand">
            <span className="register-brand-icon">
              <ParkingSquare size={25} strokeWidth={2.2} />
            </span>
            <span>Smart<span>Park</span></span>
          </Link>

          <div className="register-visual-content">
            <span className="register-visual-tag">
              <span className="register-live-dot" />
              YOUR PARKING JOURNEY BEGINS
            </span>

            <h1>
              Make room
              <br />
              for a <span>better</span>
              <br />
              journey.
            </h1>

            <p>
              Join SmartPark and experience a smarter way to find,
              reserve, and manage parking spaces across your city.
            </p>

            <div className="register-benefits">
              <div className="register-benefit">
                <span className="register-benefit-icon">
                  <MapPin size={19} />
                </span>
                <div>
                  <strong>Discover parking nearby</strong>
                  <small>Explore available parking areas</small>
                </div>
              </div>

              <div className="register-benefit">
                <span className="register-benefit-icon">
                  <Clock3 size={19} />
                </span>
                <div>
                  <strong>Reserve in advance</strong>
                  <small>Plan your parking before arrival</small>
                </div>
              </div>

              <div className="register-benefit">
                <span className="register-benefit-icon">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <strong>One account, everything</strong>
                  <small>Keep your bookings organised</small>
                </div>
              </div>
            </div>
          </div>

          <div className="register-visual-footer">
            <span>SMART PARKING. SMOOTHER JOURNEYS.</span>
            <span>© {new Date().getFullYear()} SmartPark</span>
          </div>
        </div>
      </section>

      <section className="register-form-section">
        <div className="register-form-container">
          <Link to="/" className="register-mobile-brand">
            <span className="register-brand-icon">
              <ParkingSquare size={23} />
            </span>
            <span>Smart<span>Park</span></span>
          </Link>

          <div className="register-form-topline">
            <span className="register-eyebrow">GET STARTED</span>
            <span className="register-secure-label">
              <LockKeyhole size={13} />
              SECURE REGISTRATION
            </span>
          </div>

          <h2>Create your account.</h2>

          <p className="register-description">
            Join SmartPark and make every journey easier.
          </p>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="register-field">
              <label htmlFor="register-name">Full name</label>
              <div className="register-input-wrapper">
                <UserRound size={17} className="register-input-icon" />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-email">Email address</label>
              <div className="register-input-wrapper">
                <Mail size={17} className="register-input-icon" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-phone">Phone number</label>
              <div className="register-input-wrapper">
                <Phone size={17} className="register-input-icon" />
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit phone number"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title="Enter a 10-digit phone number"
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-password">Password</label>
              <div className="register-password-wrapper">
                <LockKeyhole size={17} className="register-input-icon" />
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="register-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-confirm-password">
                Confirm password
              </label>
              <div className="register-password-wrapper">
                <LockKeyhole size={17} className="register-input-icon" />
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="register-toggle-password"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {message && (
              <p
                className={`register-message ${messageType}`}
                role="status"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              className="register-submit-btn"
              disabled={loading}
            >
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="register-divider">
            <span />
            <small>ALREADY A MEMBER?</small>
            <span />
          </div>

          <p className="register-login-text">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>

          <Link to="/" className="register-home-link">
            <ArrowRight size={15} className="register-back-arrow" />
            Back to Home
          </Link>

          <p className="register-form-footer">
            Your parking experience, made effortless.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;
