
import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  ArrowUpRight,
  Menu,
  ChevronDown,
} from "lucide-react";
import "./Navbar.css";

const API_URL = "https://smartparkingreservationsystem.onrender.com";

function Navbar() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const token = localStorage.getItem("access_token");

  const fetchNotifications = async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = await response.json();
      const items = Array.isArray(data)
        ? data
        : data.notifications || data.items || [];

      setNotifications(items);
      setUnreadCount(
        items.filter(
          (item) => !(item.is_read ?? item.read ?? false)
        ).length
      );
    } catch (error) {
      console.error("Unable to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!token) return;

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${id}/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) fetchNotifications();
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/read-all`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) fetchNotifications();
    } catch (error) {
      console.error("Unable to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) fetchNotifications();
    } catch (error) {
      console.error("Unable to delete notification:", error);
    }
  };

  const closeMenus = () => {
    setMobileMenu(false);
    setShowNotifications(false);
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Find Parking", path: "/search" },
    { label: "My Bookings", path: "/bookings" },
  ];

  return (
    <header className="sp-navbar">
      <div className="sp-navbar-inner">
        <Link to="/" className="sp-brand" onClick={closeMenus}>
          <span className="sp-brand-mark">
            <span className="sp-brand-mark-line" />
            <span className="sp-brand-mark-line" />
            <span className="sp-brand-mark-line" />
          </span>

          <span className="sp-brand-name">
            Smart<span>Park</span>
            <small>SMART PARKING. SIMPLIFIED.</small>
          </span>
        </Link>

        <nav className={`sp-nav-links ${mobileMenu ? "sp-nav-open" : ""}`}>
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={closeMenus}
              className={({ isActive }) =>
                `sp-nav-link ${isActive ? "sp-nav-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="sp-mobile-auth">
            <Link to="/login" onClick={closeMenus}>Login</Link>
            <Link to="/register" onClick={closeMenus}>Create Account</Link>
          </div>
        </nav>

        <div className="sp-navbar-actions">
          {token && (
            <div className="sp-notification-wrap">
              <button
                className={`sp-notification-button ${
                  showNotifications ? "sp-notification-selected" : ""
                }`}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell size={19} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span className="sp-notification-count">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="sp-dropdown-backdrop"
                    onClick={() => setShowNotifications(false)}
                  />

                  <div className="sp-notification-dropdown">
                    <div className="sp-notification-heading">
                      <div>
                        <span className="sp-dropdown-eyebrow">YOUR UPDATES</span>
                        <h3>Notifications</h3>
                        <p>
                          {unreadCount > 0
                            ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
                            : "You're all caught up"}
                        </p>
                      </div>

                      <button
                        className="sp-dropdown-close"
                        onClick={() => setShowNotifications(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {notifications.length > 0 && unreadCount > 0 && (
                      <button
                        className="sp-mark-all"
                        onClick={markAllAsRead}
                      >
                        <CheckCheck size={15} />
                        Mark all as read
                      </button>
                    )}

                    <div className="sp-notification-list">
                      {notifications.length === 0 ? (
                        <div className="sp-empty-notifications">
                          <Bell size={25} />
                          <strong>No notifications yet</strong>
                          <span>Important parking updates will appear here.</span>
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const isRead = item.is_read ?? item.read ?? false;

                          return (
                            <div
                              key={item.id}
                              className={`sp-notification-item ${
                                !isRead ? "sp-unread" : ""
                              }`}
                            >
                              <div className="sp-notification-dot" />

                              <div className="sp-notification-content">
                                <strong>
                                  {item.title || "Parking update"}
                                </strong>
                                <p>
                                  {item.message || item.description || "You have a new update."}
                                </p>
                                {item.created_at && (
                                  <span className="sp-notification-date">
                                    {new Date(item.created_at).toLocaleString()}
                                  </span>
                                )}
                              </div>

                              <div className="sp-notification-controls">
                                {!isRead && (
                                  <button
                                    title="Mark as read"
                                    onClick={() => markAsRead(item.id)}
                                  >
                                    <Check size={15} />
                                  </button>
                                )}
                                <button
                                  title="Delete notification"
                                  onClick={() => deleteNotification(item.id)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <Link to="/login" className="sp-login-link">
            Login
          </Link>

          <Link to="/register" className="sp-register-button">
            Get Started
            <ArrowUpRight size={16} />
          </Link>

          <button
            className="sp-mobile-toggle"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle navigation"
          >
            {mobileMenu ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
