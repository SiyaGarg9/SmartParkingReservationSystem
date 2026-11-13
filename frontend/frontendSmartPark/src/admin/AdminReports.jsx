
import { useEffect, useState } from "react";
import {
  ChartNoAxesCombined,
  CalendarDays,
  IndianRupee,
  TrendingUp,
  ParkingCircle,
  ArrowUpRight,
  Activity,
  BarChart3,
  MapPin,
  Info,
  Clock3,
  RefreshCw,
  BatteryCharging,
} from "lucide-react";
import "./AdminReports.css";

const API_URL = "http://127.0.0.1:8000";

const PERIODS = [
  { value: "6m", label: "Last 6 Months" },
  { value: "3m", label: "Last 3 Months" },
  { value: "1m", label: "Last 1 Month" },
  { value: "1w", label: "Last 1 Week" },
];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatLabel(value, period) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  if (period === "6m" || period === "3m") {
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function AdminReports() {
  const [period, setPeriod] = useState("6m");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchReports() {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("admin_access_token");

        if (!token) {
          throw new Error(
            "Admin session not found. Please log in again."
          );
        }

        const response = await fetch(
          `${API_URL}/admin/reports?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.detail || "Unable to load reports."
          );
        }

        if (isMounted) {
          setReport(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load reports.");
          setReport(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, [period]);

  const summary = report?.summary || {};
  const trends = report?.trends || [];
  const areas = report?.areas || [];

  const totalBookings = Number(summary.total_bookings || 0);
  const totalRevenue = Number(summary.total_revenue || 0);
  const averageOccupancy = Number(
    summary.average_occupancy || 0
  );

  const maxBookings = Math.max(
    ...trends.map((item) => Number(item.bookings || 0)),
    1
  );

  const maxRevenue = Math.max(
    ...trends.map((item) => Number(item.revenue || 0)),
    1
  );

  const highestBooking = trends.reduce(
    (highest, item) =>
      Number(item.bookings || 0) >
      Number(highest?.bookings || 0)
        ? item
        : highest,
    null
  );

  const highestRevenue = trends.reduce(
    (highest, item) =>
      Number(item.revenue || 0) >
      Number(highest?.revenue || 0)
        ? item
        : highest,
    null
  );

  return (
    <div className="admin-reports">
      {/* HERO */}
      <section className="reports-hero">
        <div className="reports-hero-grid" />
        <div className="reports-hero-glow" />

        <div className="reports-hero-content">
          <div className="reports-eyebrow">
            <ChartNoAxesCombined size={15} />
            SMARTPARK ANALYTICS
          </div>

          <h1>
            Reports &
            <span> Insights.</span>
          </h1>

          <p>
            Understand actual parking performance, bookings,
            revenue patterns, and location-wise utilization
            through your analytics dashboard.
          </p>

          <div className="reports-hero-meta">
            <span>
              <Activity size={15} />
              Live database reports
            </span>
            <span>
              <Clock3 size={15} />
              {report?.period_label || "Selected period"}
            </span>
          </div>
        </div>

        <div className="reports-hero-visual">
          <div className="reports-visual-ring reports-ring-outer" />
          <div className="reports-visual-ring reports-ring-inner" />

          <div className="reports-visual-icon">
            <BarChart3 size={59} strokeWidth={1.3} />
          </div>

          <div className="reports-floating-card reports-floating-top">
            <TrendingUp size={18} />
            <div>
              <strong>
                {loading ? "..." : totalBookings.toLocaleString("en-IN")} Bookings
              </strong>
              <span>Selected period</span>
            </div>
          </div>

          <div className="reports-floating-card reports-floating-bottom">
            <IndianRupee size={18} />
            <div>
              <strong>
                {loading ? "..." : `₹${formatCurrency(totalRevenue)}`}
              </strong>
              <span>Successful payment revenue</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION HEADING */}
      <section className="reports-section-heading">
        <div>
          <span className="reports-section-kicker">
            OVERVIEW
          </span>
          <h2>Performance at a glance</h2>
          <p>
            Actual database metrics for your selected reporting period.
          </p>
        </div>

        <div className="reports-period-control">
          <CalendarDays size={17} />
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            aria-label="Select report period"
          >
            {PERIODS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <div className="reports-note">
          <Info size={17} />
          <p>
            <strong>Unable to load reports:</strong> {error}
          </p>
        </div>
      )}

      {loading && (
        <div className="report-panel" style={{ padding: "35px", textAlign: "center" }}>
          <RefreshCw size={22} />
          <p>Loading actual report data...</p>
        </div>
      )}

      {!loading && !error && report && (
        <>
          {/* SUMMARY CARDS */}
          <section className="reports-summary">
            <div className="report-stat-card report-stat-bookings">
              <div className="report-stat-top">
                <div className="report-stat-icon">
                  <CalendarDays size={21} />
                </div>
                <span className="report-stat-tag">
                  RESERVATIONS
                </span>
              </div>

              <strong>{totalBookings.toLocaleString("en-IN")}</strong>
              <span className="report-stat-label">
                Total bookings
              </span>

              <div className="report-stat-bottom">
                <span>For selected period</span>
                <ArrowUpRight size={17} />
              </div>
            </div>

            <div className="report-stat-card report-stat-revenue">
              <div className="report-stat-top">
                <div className="report-stat-icon">
                  <IndianRupee size={21} />
                </div>
                <span className="report-stat-tag">
                  EARNINGS
                </span>
              </div>

              <strong>₹{formatCurrency(totalRevenue)}</strong>
              <span className="report-stat-label">
                Successful payment revenue
              </span>

              <div className="report-stat-bottom">
                <span>
                  {summary.successful_payments || 0} successful payments
                </span>
                <ArrowUpRight size={17} />
              </div>
            </div>

            <div className="report-stat-card report-stat-occupancy">
              <div className="report-stat-top">
                <div className="report-stat-icon">
                  <Activity size={21} />
                </div>
                <span className="report-stat-tag">
                  LIVE UTILIZATION
                </span>
              </div>

              <strong>{averageOccupancy}%</strong>
              <span className="report-stat-label">
                Current slot occupancy
              </span>

              <div className="report-stat-bottom">
                <span>
                  {summary.occupied_slots || 0} of {summary.total_slots || 0} slots
                </span>
                <ArrowUpRight size={17} />
              </div>
            </div>

            <div className="report-stat-card report-stat-areas">
              <div className="report-stat-top">
                <div className="report-stat-icon">
                  <ParkingCircle size={21} />
                </div>
                <span className="report-stat-tag">
                  LOCATIONS
                </span>
              </div>

              <strong>
                {String(summary.total_areas || 0).padStart(2, "0")}
              </strong>
              <span className="report-stat-label">
                Parking areas
              </span>

              <div className="report-stat-bottom">
                <span>Registered parking areas</span>
                <ArrowUpRight size={17} />
              </div>
            </div>
          </section>

          {/* BOOKING STATUS */}
          <section className="reports-section-heading reports-charts-heading">
            <div>
              <span className="reports-section-kicker">
                BOOKING OVERVIEW
              </span>
              <h2>Booking status</h2>
              <p>
                Actual booking records created during the selected period.
              </p>
            </div>
          </section>

          <section className="reports-summary">
            <div className="report-stat-card report-stat-bookings">
              <strong>{summary.booked || 0}</strong>
              <span className="report-stat-label">Booked</span>
            </div>

            <div className="report-stat-card report-stat-occupancy">
              <strong>{summary.in_progress || 0}</strong>
              <span className="report-stat-label">In progress</span>
            </div>

            <div className="report-stat-card report-stat-revenue">
              <strong>{summary.completed || 0}</strong>
              <span className="report-stat-label">Completed</span>
            </div>

            <div className="report-stat-card report-stat-areas">
              <strong>{summary.cancelled || 0}</strong>
              <span className="report-stat-label">Cancelled</span>
            </div>
          </section>

          {/* CHARTS */}
          <section className="reports-section-heading reports-charts-heading">
            <div>
              <span className="reports-section-kicker">
                TREND ANALYSIS
              </span>
              <h2>Bookings & revenue</h2>
              <p>
                Actual booking and successful payment trends.
              </p>
            </div>
          </section>

          <div className="reports-chart-grid">
            {/* BOOKINGS CHART */}
            <section className="report-panel">
              <div className="report-panel-heading">
                <div>
                  <div className="report-panel-icon bookings-panel-icon">
                    <CalendarDays size={19} />
                  </div>
                  <h2>Booking Trends</h2>
                  <p className="report-subtitle">
                    Reservations recorded by date
                  </p>
                </div>

                <span className="report-chart-period">
                  {period.toUpperCase()}
                </span>
              </div>

              <div className="report-chart-highlight">
                <div>
                  <span>Total reservations</span>
                  <strong>
                    {totalBookings.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="report-highlight-note">
                  <TrendingUp size={16} />
                  <span>
                    Peak: {highestBooking
                      ? formatLabel(highestBooking.label, period)
                      : "—"}
                  </span>
                </div>
              </div>

              {trends.length > 0 ? (
                <div className="report-bar-chart">
                  {trends.map((item) => (
                    <div className="report-bar-item" key={item.label}>
                      <span className="report-bar-value">
                        {item.bookings}
                      </span>

                      <div className="report-bar-track">
                        <div
                          className={`report-bar-fill bookings-fill ${
                            item === highestBooking ? "report-bar-peak" : ""
                          }`}
                          style={{
                            height: `${(Number(item.bookings || 0) / maxBookings) * 100}%`,
                          }}
                        />
                      </div>

                      <span className="report-bar-label">
                        {formatLabel(item.label, period)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="report-subtitle">
                  No bookings were recorded during this period.
                </p>
              )}

              <div className="report-chart-footer">
                <span>
                  <i className="report-legend-dot bookings-dot" />
                  Actual reservations
                </span>
                <span>
                  Highest: {highestBooking?.bookings || 0}
                </span>
              </div>
            </section>

            {/* REVENUE CHART */}
            <section className="report-panel">
              <div className="report-panel-heading">
                <div>
                  <div className="report-panel-icon revenue-panel-icon">
                    <IndianRupee size={19} />
                  </div>
                  <h2>Revenue Trends</h2>
                  <p className="report-subtitle">
                    Successful payments in Indian rupees
                  </p>
                </div>

                <span className="report-chart-period">
                  {period.toUpperCase()}
                </span>
              </div>

              <div className="report-chart-highlight">
                <div>
                  <span>Total revenue</span>
                  <strong>₹{formatCurrency(totalRevenue)}</strong>
                </div>

                <div className="report-highlight-note revenue-highlight">
                  <TrendingUp size={16} />
                  <span>
                    Peak: {highestRevenue
                      ? formatLabel(highestRevenue.label, period)
                      : "—"}
                  </span>
                </div>
              </div>

              {trends.length > 0 ? (
                <div className="report-bar-chart">
                  {trends.map((item) => (
                    <div className="report-bar-item" key={item.label}>
                      <span className="report-bar-value">
                        ₹{(Number(item.revenue || 0) / 1000).toFixed(1)}k
                      </span>

                      <div className="report-bar-track">
                        <div
                          className={`report-bar-fill revenue-fill ${
                            item === highestRevenue ? "report-bar-peak" : ""
                          }`}
                          style={{
                            height: `${(Number(item.revenue || 0) / maxRevenue) * 100}%`,
                          }}
                        />
                      </div>

                      <span className="report-bar-label">
                        {formatLabel(item.label, period)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="report-subtitle">
                  No successful payments were recorded during this period.
                </p>
              )}

              <div className="report-chart-footer">
                <span>
                  <i className="report-legend-dot revenue-dot" />
                  Successful payment revenue
                </span>
                <span>
                  Highest: ₹{formatCurrency(highestRevenue?.revenue || 0)}
                </span>
              </div>
            </section>
          </div>

          {/* PARKING PERFORMANCE */}
          <section className="report-panel parking-performance">
            <div className="report-panel-heading performance-heading">
              <div>
                <div className="report-panel-icon performance-panel-icon">
                  <MapPin size={19} />
                </div>
                <h2>Parking Area Performance</h2>
                <p className="report-subtitle">
                  Actual bookings by location and current slot occupancy
                </p>
              </div>

              <span className="report-chart-period">
                {areas.length} LOCATIONS
              </span>
            </div>

            <div className="performance-table-wrapper">
              <table className="performance-table">
                <thead>
                  <tr>
                    <th>PARKING LOCATION</th>
                    <th>TOTAL BOOKINGS</th>
                    <th>CURRENT OCCUPANCY</th>
                    <th>PERFORMANCE</th>
                  </tr>
                </thead>

                <tbody>
                  {areas.length > 0 ? (
                    areas.map((area) => (
                      <tr key={area.area_id}>
                        <td>
                          <div className="performance-location">
                            <div className="performance-location-icon">
                              <ParkingCircle size={18} />
                            </div>
                            <strong>{area.name}</strong>
                          </div>
                        </td>

                        <td>
                          <span className="performance-bookings">
                            {area.bookings}
                          </span>
                        </td>

                        <td>
                          <div className="occupancy-cell">
                            <div className="occupancy-track">
                              <div
                                className="occupancy-fill"
                                style={{
                                  width: `${area.occupancy}%`,
                                }}
                              />
                            </div>
                            <span>{area.occupancy}%</span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`performance-badge ${
                              area.occupancy >= 80
                                ? "performance-high"
                                : area.occupancy >= 50
                                ? "performance-medium"
                                : "performance-normal"
                            }`}
                          >
                            {area.occupancy >= 80
                              ? "High"
                              : area.occupancy >= 50
                              ? "Moderate"
                              : "Low"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">
                        No parking area records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="performance-footer">
              <span>
                <Activity size={15} />
                Current occupancy across all locations
              </span>
              <strong>{averageOccupancy}%</strong>
            </div>
          </section>

          {/* EV CHARGING */}
          <section className="report-panel parking-performance">
            <div className="report-panel-heading">
              <div>
                <div className="report-panel-icon performance-panel-icon">
                  <BatteryCharging size={19} />
                </div>
                <h2>EV Charger Status</h2>
                <p className="report-subtitle">
                  Current EV charger availability
                </p>
              </div>
            </div>

            <div className="reports-summary">
              <div className="report-stat-card report-stat-bookings">
                <strong>{summary.total_ev_chargers || 0}</strong>
                <span className="report-stat-label">Total chargers</span>
              </div>

              <div className="report-stat-card report-stat-occupancy">
                <strong>{summary.ev_chargers_in_use || 0}</strong>
                <span className="report-stat-label">Currently in use</span>
              </div>

              <div className="report-stat-card report-stat-revenue">
                <strong>{summary.available_ev_chargers || 0}</strong>
                <span className="report-stat-label">Available chargers</span>
              </div>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="reports-insights">
            <div className="reports-insight-icon">
              <TrendingUp size={21} />
            </div>

            <div className="reports-insight-content">
              <span className="reports-section-kicker">
                PERFORMANCE HIGHLIGHT
              </span>

              <h3>
                {highestBooking
                  ? `${formatLabel(highestBooking.label, period)} recorded the highest bookings`
                  : "No booking activity in this period"}
              </h3>

              <p>
                {highestBooking
                  ? `${highestBooking.bookings} bookings were recorded in this period's busiest reporting interval.`
                  : "New bookings will appear here when users make reservations through the user portal."}
                {" "}
                Successful payment revenue for this period is ₹
                {formatCurrency(totalRevenue)}.
              </p>
            </div>
          </section>

          {/* DATA NOTE */}
          <div className="reports-note">
            <Info size={17} />
            <p>
              <strong>Live database report:</strong> Booking and payment
              figures are calculated from actual database records.
              Refunded payments are excluded from revenue. Slot and
              EV charger occupancy represent their current status.
            </p>
          </div>

          <div className="reports-page-footer">
            <span>SMARTPARK · REPORTING & ANALYTICS</span>
            <span>{report.period_label}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminReports;
