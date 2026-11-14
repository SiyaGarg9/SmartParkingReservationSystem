
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  CarFront,
  CircleParking,
  Clock3,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import "./AdminDashboard.css";

const API_URL = "https://smartparkingreservationsystem.onrender.com";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const requestInProgress = useRef(false);

  async function fetchDashboard(isRefresh = false) {
    if (requestInProgress.current) return;

    requestInProgress.current = true;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("admin_access_token");

      if (!token) {
        throw new Error("Please log in to access the admin dashboard.");
      }

      const response = await fetch(`${API_URL}/admin/dashboard`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to load dashboard data."
        );
      }

      setDashboard(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      requestInProgress.current = false;
    }
  }

  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 5000);

    const handleFocus = () => {
      fetchDashboard(true);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard admin-loading">
        <div className="admin-loader"></div>
        <h2>Preparing your control centre</h2>
        <p>Retrieving the latest SmartPark statistics...</p>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="admin-dashboard">
        <div className="admin-error">
          <ShieldCheck size={38} />
          <h2>Dashboard unavailable</h2>
          <p>{error}</p>
          <button onClick={() => fetchDashboard()}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const totalAreas = Number(dashboard.total_parking_areas) || 0;
  const totalSlots = Number(dashboard.total_slots) || 0;
  const availableSlots = Number(dashboard.available_slots) || 0;
  const totalUsers = Number(dashboard.total_users) || 0;
  const totalBookings = Number(dashboard.total_bookings) || 0;
  const activeBookings = Number(dashboard.active_bookings) || 0;

  const occupiedSlots = Math.max(0, totalSlots - availableSlots);

  const occupancyRate =
    totalSlots > 0
      ? Math.min(100, Math.round((occupiedSlots / totalSlots) * 100))
      : 0;

  const availabilityRate =
    totalSlots > 0
      ? Math.min(100, Math.round((availableSlots / totalSlots) * 100))
      : 0;

  const otherBookings = Math.max(0, totalBookings - activeBookings);

  const activeBookingRate =
    totalBookings > 0
      ? Math.min(100, (activeBookings / totalBookings) * 100)
      : 0;

  const otherBookingRate =
    totalBookings > 0
      ? Math.min(100, (otherBookings / totalBookings) * 100)
      : 0;

  const formatNumber = (value) => value.toLocaleString("en-IN");

  const stats = [
    {
      title: "Parking Locations",
      value: totalAreas,
      description: "Managed parking areas",
      icon: Building2,
      accent: "violet",
      index: "01",
    },
    {
      title: "Total Parking Slots",
      value: totalSlots,
      description: "Across all locations",
      icon: CircleParking,
      accent: "blue",
      index: "02",
    },
    {
      title: "Active Bookings",
      value: activeBookings,
      description: "Currently active reservations",
      icon: CalendarCheck,
      accent: "orange",
      index: "03",
    },
    {
      title: "Registered Users",
      value: totalUsers,
      description: "Total registered accounts",
      icon: Users,
      accent: "green",
      index: "04",
    },
    {
      title: "Total Bookings",
      value: totalBookings,
      description: "All booking records",
      icon: Activity,
      accent: "pink",
      index: "05",
    },
  ];

  return (
    <div className="admin-dashboard">
      {/* DASHBOARD HERO */}
      <section className="admin-hero">
        <div className="admin-hero-content">
          <div className="admin-hero-label">
            <LayoutDashboard size={15} />
            <span>SMARTPARK / ADMINISTRATION</span>
          </div>

          <h1>
            Command your
            <br />
            <span>parking operations.</span>
          </h1>

          <p>
            Your central overview for monitoring parking capacity,
            reservations, users, and system activity.
          </p>

          <div className="admin-hero-bottom">
            <div className="admin-system-status">
              <span className="admin-online-dot"></span>
              <span>System connected</span>
            </div>

            <span className="admin-hero-divider"></span>

            <span className="admin-hero-caption">
              LIVE MANAGEMENT OVERVIEW
            </span>
          </div>
        </div>

        <div className="admin-hero-visual">
          <div className="admin-hero-orbit orbit-one"></div>
          <div className="admin-hero-orbit orbit-two"></div>

          <div className="admin-hero-emblem">
            <CircleParking size={78} strokeWidth={1.1} />
            <span>SMARTPARK</span>
            <small>ADMIN CONTROL</small>
          </div>

          <div className="admin-hero-floating-card">
            <div className="floating-card-icon">
              <Activity size={17} />
            </div>
            <div>
              <strong>Operations active</strong>
              <span>Dashboard monitoring enabled</span>
            </div>
          </div>
        </div>
      </section>

      {/* HEADER AND REFRESH */}
      <div className="admin-section-heading">
        <div>
          <span className="admin-section-kicker">AT A GLANCE</span>
          <h2>Dashboard Overview</h2>
          <p>Key metrics and performance of your parking network.</p>
        </div>

        <div className="admin-header-actions">
          <div className="admin-badge">
            <ShieldCheck size={17} />
            Administrator
          </div>

          <button
            className="admin-refresh-btn"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "refresh-spinning" : ""}
            />
            {refreshing ? "Refreshing" : "Refresh data"}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-inline-error">
          <span>{error}</span>
          <button onClick={() => fetchDashboard(true)}>Retry</button>
        </div>
      )}

      {/* STATISTICS */}
      <section className="admin-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className={`admin-stat-card stat-${stat.accent}`}
              key={stat.title}
            >
              <div className="admin-stat-top">
                <div className="admin-stat-icon">
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <span className="admin-stat-index">{stat.index}</span>
              </div>

              <div className="admin-stat-value">
                {formatNumber(stat.value)}
              </div>

              <h3>{stat.title}</h3>
              <p>{stat.description}</p>

              <div className="admin-stat-bottom">
                <span>LIVE STATISTIC</span>
                <ArrowUpRight size={15} />
              </div>
            </article>
          );
        })}
      </section>

      {/* ANALYTICS */}
      <section className="admin-analytics-grid">
        {/* OCCUPANCY */}
        <article className="admin-panel occupancy-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-section-kicker">CAPACITY ANALYSIS</span>
              <h2>Parking Occupancy</h2>
              <p>Current utilisation of your parking network.</p>
            </div>

            <div className="admin-panel-icon">
              <CircleParking size={21} />
            </div>
          </div>

          <div className="occupancy-content">
            <div
              className="occupancy-donut"
              style={{
                background: `conic-gradient(#20c6b5 0% ${occupancyRate}%, #263b50 ${occupancyRate}% 100%)`,
              }}
            >
              <div className="occupancy-donut-inner">
                <strong>{occupancyRate}%</strong>
                <span>OCCUPIED</span>
              </div>
            </div>

            <div className="occupancy-legend">
              <div className="legend-item">
                <span className="legend-dot occupied-dot"></span>
                <div>
                  <p>Occupied slots</p>
                  <strong>{formatNumber(occupiedSlots)}</strong>
                </div>
              </div>

              <div className="legend-item">
                <span className="legend-dot available-dot"></span>
                <div>
                  <p>Available slots</p>
                  <strong>{formatNumber(availableSlots)}</strong>
                </div>
              </div>

              <div className="legend-item">
                <span className="legend-dot total-dot"></span>
                <div>
                  <p>Total capacity</p>
                  <strong>{formatNumber(totalSlots)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="occupancy-progress-section">
            <div className="progress-heading">
              <span>Network utilisation</span>
              <strong>{occupancyRate}%</strong>
            </div>

            <div className="admin-progress-track">
              <div
                className="admin-progress-fill"
                style={{ width: `${occupancyRate}%` }}
              ></div>
            </div>
          </div>
        </article>

        {/* BOOKING SUMMARY */}
        <article className="admin-panel booking-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-section-kicker">RESERVATION ACTIVITY</span>
              <h2>Booking Summary</h2>
              <p>Current reservation statistics.</p>
            </div>

            <div className="admin-panel-icon">
              <CalendarCheck size={21} />
            </div>
          </div>

          <div className="booking-summary-number">
            <strong>{formatNumber(totalBookings)}</strong>
            <span>Total bookings recorded</span>
          </div>

          <div className="booking-metric">
            <div className="booking-metric-heading">
              <span>Active bookings</span>
              <strong>{formatNumber(activeBookings)}</strong>
            </div>

            <div className="admin-progress-track">
              <div
                className="booking-progress-active"
                style={{ width: `${activeBookingRate}%` }}
              ></div>
            </div>
          </div>

          <div className="booking-metric">
            <div className="booking-metric-heading">
              <span>Other booking records</span>
              <strong>{formatNumber(otherBookings)}</strong>
            </div>

            <div className="admin-progress-track">
              <div
                className="booking-progress-other"
                style={{ width: `${otherBookingRate}%` }}
              ></div>
            </div>
          </div>

          <div className="booking-panel-footer">
            <span>Active booking ratio</span>
            <strong>
              {formatNumber(activeBookings)} / {formatNumber(totalBookings)}
            </strong>
          </div>
        </article>
      </section>

      {/* AVAILABILITY */}
      <section className="admin-panel availability-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-section-kicker">SPACE DISTRIBUTION</span>
            <h2>Slot Availability</h2>
            <p>How parking capacity is distributed across the system.</p>
          </div>

          <div className="admin-panel-icon">
            <Activity size={21} />
          </div>
        </div>

        <div className="availability-overview">
          <div>
            <strong>{formatNumber(availableSlots)}</strong>
            <span>Available out of {formatNumber(totalSlots)} slots</span>
          </div>
          <div className="availability-percentage">
            {availabilityRate}% <span>available</span>
          </div>
        </div>

        <div className="availability-bar">
          <div
            className="availability-bar-occupied"
            style={{ width: `${occupancyRate}%` }}
            title={`Occupied: ${occupiedSlots}`}
          ></div>

          <div
            className="availability-bar-free"
            style={{ width: `${availabilityRate}%` }}
            title={`Available: ${availableSlots}`}
          ></div>
        </div>

        <div className="availability-details">
          <div>
            <span className="legend-dot occupied-dot"></span>
            <span>Occupied</span>
            <strong>{occupancyRate}%</strong>
          </div>

          <div>
            <span className="legend-dot available-dot"></span>
            <span>Available</span>
            <strong>{availabilityRate}%</strong>
          </div>

          <div className="availability-capacity">
            <CircleParking size={16} />
            <span>Total capacity: {formatNumber(totalSlots)}</span>
          </div>
        </div>
      </section>

      {/* SYSTEM INSIGHTS */}
      <section className="admin-panel insights-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-section-kicker">SYSTEM SNAPSHOT</span>
            <h2>Operational Insights</h2>
            <p>A quick overview of your SmartPark infrastructure.</p>
          </div>

          <div className="admin-panel-icon">
            <Zap size={21} />
          </div>
        </div>

        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-icon">
              <Building2 size={21} />
            </div>
            <div>
              <strong>{formatNumber(totalAreas)}</strong>
              <p>Parking locations managed</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">
              <CarFront size={21} />
            </div>
            <div>
              <strong>{occupancyRate}%</strong>
              <p>Current parking occupancy</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">
              <Clock3 size={21} />
            </div>
            <div>
              <strong>{formatNumber(availableSlots)}</strong>
              <p>Slots currently available</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">
              <Users size={21} />
            </div>
            <div>
              <strong>{formatNumber(totalUsers)}</strong>
              <p>Registered system users</p>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-dashboard-footer">
        <div>
          <span className="admin-online-dot"></span>
          SmartPark monitoring is active
        </div>
        <span>ADMIN CONTROL CENTRE</span>
      </div>
    </div>
  );
}

export default AdminDashboard;
