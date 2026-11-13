
import { useState } from "react";
import {
  Settings,
  Building2,
  Headphones,
  IndianRupee,
  CalendarDays,
  Clock3,
  Bell,
  Mail,
  CalendarCheck,
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import "./AdminSettings.css";

const defaultSettings = {
  systemName: "SmartPark",
  supportEmail: "support@smartpark.com",
  supportPhone: "",
  hourlyRate: "30",
  advanceBookingDays: "30",
  cancellationHours: "2",
  emailNotifications: true,
  bookingNotifications: true,
  maintenanceMode: false,
};

function AdminSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const hourlyRate = Number(settings.hourlyRate);
    const advanceBookingDays = Number(settings.advanceBookingDays);
    const cancellationHours = Number(settings.cancellationHours);

    if (
      !settings.systemName.trim() ||
      !settings.supportEmail.trim() ||
      !Number.isFinite(hourlyRate) ||
      hourlyRate < 0 ||
      !Number.isInteger(advanceBookingDays) ||
      advanceBookingDays < 1 ||
      !Number.isInteger(cancellationHours) ||
      cancellationHours < 0
    ) {
      setMessageType("error");
      setMessage("Please enter valid settings before saving.");
      return;
    }

    setMessageType("success");
    setMessage("Settings saved for this session.");
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setMessageType("success");
    setMessage("Settings restored to their default values.");
  };

  return (
    <div className="admin-settings">
      <div className="settings-hero">
        <div className="settings-hero-content">
          <div className="settings-eyebrow">
            <span className="settings-eyebrow-dot"></span>
            ADMINISTRATION CENTER
          </div>

          <h1>
            System <span>Settings</span>
          </h1>

          <p>
            Fine-tune your SmartPark experience. Manage platform details,
            booking policies, notifications and system preferences.
          </p>

          <div className="settings-hero-meta">
            <span><SlidersHorizontal size={15} /> Configuration</span>
            <span><ShieldAlert size={15} /> Administrator access</span>
          </div>
        </div>

        <div className="settings-hero-visual">
          <div className="settings-orbit settings-orbit-one"></div>
          <div className="settings-orbit settings-orbit-two"></div>
          <div className="settings-hero-icon">
            <Settings size={52} strokeWidth={1.4} />
          </div>
          <div className="settings-orbit-dot settings-dot-one"></div>
          <div className="settings-orbit-dot settings-dot-two"></div>
          <div className="settings-orbit-dot settings-dot-three"></div>
          <div className="settings-visual-label">
            <span className="settings-live-dot"></span>
            CONTROL PANEL
          </div>
        </div>
      </div>

      <div className="settings-overview">
        <div className="settings-overview-card">
          <div className="settings-overview-icon teal">
            <Building2 size={21} />
          </div>
          <div>
            <span>Platform</span>
            <strong>{settings.systemName || "Not configured"}</strong>
          </div>
        </div>

        <div className="settings-overview-card">
          <div className="settings-overview-icon blue">
            <IndianRupee size={21} />
          </div>
          <div>
            <span>Base hourly rate</span>
            <strong>₹{settings.hourlyRate || "0"}</strong>
          </div>
        </div>

        <div className="settings-overview-card">
          <div className="settings-overview-icon purple">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>Advance booking</span>
            <strong>{settings.advanceBookingDays} days</strong>
          </div>
        </div>

        <div className="settings-overview-card">
          <div className="settings-overview-icon amber">
            <Bell size={21} />
          </div>
          <div>
            <span>Notifications</span>
            <strong>
              {settings.emailNotifications || settings.bookingNotifications
                ? "Enabled"
                : "Disabled"}
            </strong>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section-heading">
          <div>
            <span className="settings-section-kicker">PREFERENCES</span>
            <h2>Configuration workspace</h2>
            <p>Manage the core preferences of your parking platform.</p>
          </div>
          <div className="settings-heading-icon">
            <Zap size={22} />
          </div>
        </div>

        <section className="settings-section">
          <div className="settings-section-top">
            <div className="settings-section-icon teal">
              <Building2 size={21} />
            </div>
            <div>
              <h2>General Information</h2>
              <p>Manage the identity and support details of your platform.</p>
            </div>
            <span className="settings-section-number">01</span>
          </div>

          <div className="settings-form-grid">
            <label>
              <span>System Name</span>
              <div className="settings-input-wrap">
                <Building2 size={17} />
                <input
                  name="systemName"
                  value={settings.systemName}
                  onChange={handleChange}
                  placeholder="Enter system name"
                  required
                />
              </div>
            </label>

            <label>
              <span>Support Email</span>
              <div className="settings-input-wrap">
                <Mail size={17} />
                <input
                  name="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={handleChange}
                  placeholder="support@example.com"
                  required
                />
              </div>
            </label>

            <label>
              <span>Support Phone</span>
              <div className="settings-input-wrap">
                <Headphones size={17} />
                <input
                  name="supportPhone"
                  type="tel"
                  value={settings.supportPhone}
                  onChange={handleChange}
                  placeholder="Enter support phone"
                />
              </div>
            </label>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-top">
            <div className="settings-section-icon blue">
              <IndianRupee size={21} />
            </div>
            <div>
              <h2>Booking & Pricing Rules</h2>
              <p>Set the default rates and reservation policies.</p>
            </div>
            <span className="settings-section-number">02</span>
          </div>

          <div className="settings-form-grid">
            <label>
              <span>Default Hourly Rate</span>
              <div className="settings-input-wrap">
                <IndianRupee size={17} />
                <input
                  name="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.hourlyRate}
                  onChange={handleChange}
                  required
                />
              </div>
              <small>Base parking price per hour.</small>
            </label>

            <label>
              <span>Advance Booking Limit</span>
              <div className="settings-input-wrap">
                <CalendarDays size={17} />
                <input
                  name="advanceBookingDays"
                  type="number"
                  min="1"
                  step="1"
                  value={settings.advanceBookingDays}
                  onChange={handleChange}
                  required
                />
              </div>
              <small>Maximum number of days in advance.</small>
            </label>

            <label>
              <span>Cancellation Cut-off</span>
              <div className="settings-input-wrap">
                <Clock3 size={17} />
                <input
                  name="cancellationHours"
                  type="number"
                  min="0"
                  step="1"
                  value={settings.cancellationHours}
                  onChange={handleChange}
                  required
                />
              </div>
              <small>Hours before booking start time.</small>
            </label>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-top">
            <div className="settings-section-icon purple">
              <Bell size={21} />
            </div>
            <div>
              <h2>Notification Preferences</h2>
              <p>Choose which platform notifications are enabled.</p>
            </div>
            <span className="settings-section-number">03</span>
          </div>

          <div className="settings-toggle-list">
            <label className="settings-toggle">
              <div className="settings-toggle-icon">
                <Mail size={19} />
              </div>
              <span className="settings-toggle-content">
                <strong>Email Notifications</strong>
                <small>Enable email-related notifications.</small>
              </span>
              <span className="settings-switch">
                <input
                  name="emailNotifications"
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                />
                <span className="settings-switch-track"></span>
              </span>
            </label>

            <label className="settings-toggle">
              <div className="settings-toggle-icon">
                <CalendarCheck size={19} />
              </div>
              <span className="settings-toggle-content">
                <strong>Booking Notifications</strong>
                <small>Enable notifications about new bookings.</small>
              </span>
              <span className="settings-switch">
                <input
                  name="bookingNotifications"
                  type="checkbox"
                  checked={settings.bookingNotifications}
                  onChange={handleChange}
                />
                <span className="settings-switch-track"></span>
              </span>
            </label>
          </div>
        </section>

        <section className="settings-section settings-system-section">
          <div className="settings-section-top">
            <div className="settings-section-icon amber">
              <ShieldAlert size={21} />
            </div>
            <div>
              <h2>System Status</h2>
              <p>Manage the maintenance preference for this settings page.</p>
            </div>
            <span className="settings-section-number">04</span>
          </div>

          <div className="settings-maintenance-card">
            <div className="settings-maintenance-icon">
              <ShieldAlert size={23} />
            </div>
            <div className="settings-maintenance-content">
              <strong>Maintenance Mode</strong>
              <p>
                {settings.maintenanceMode
                  ? "Maintenance preference is switched on."
                  : "Maintenance preference is currently switched off."}
              </p>
              <small>
                This switch changes only the value displayed here. It does
                not disable the live website.
              </small>
            </div>
            <span className="settings-switch">
              <input
                name="maintenanceMode"
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={handleChange}
              />
              <span className="settings-switch-track"></span>
            </span>
          </div>
        </section>

        {message && (
          <div
            className={`settings-message ${messageType}`}
            role="status"
          >
            {messageType === "success" ? (
              <CheckCircle2 size={19} />
            ) : (
              <AlertCircle size={19} />
            )}
            <span>{message}</span>
          </div>
        )}

        <div className="settings-actions">
          <div className="settings-actions-note">
            <ShieldAlert size={17} />
            <span>Review your changes before saving.</span>
          </div>

          <div className="settings-action-buttons">
            <button
              type="button"
              className="settings-reset-btn"
              onClick={handleReset}
            >
              <RotateCcw size={17} />
              Reset Defaults
            </button>

            <button type="submit" className="settings-save-btn">
              <Save size={17} />
              Save Settings
            </button>
          </div>
        </div>
      </form>

      <div className="settings-footer">
        <div className="settings-footer-icon">
          <ShieldAlert size={17} />
        </div>
        <p>
          <strong>Administrator note:</strong> These preferences are currently
          managed locally in this page and are not persisted to the backend.
        </p>
      </div>
    </div>
  );
}

export default AdminSettings;
