
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Navigation.css";

const API_URL = "http://127.0.0.1:8000";

const SLOT_POSITIONS = [
  { x: 65, y: 25 },
  { x: 285, y: 25 },
  { x: 755, y: 25 },
  { x: 925, y: 25 },
  { x: 1065, y: 25 },

  { x: 65, y: 375 },
  { x: 285, y: 375 },
  { x: 755, y: 375 },
  { x: 925, y: 375 },
  { x: 1065, y: 375 },

  { x: 65, y: 725 },
  { x: 285, y: 725 },
  { x: 755, y: 725 },
  { x: 925, y: 725 },
  { x: 1065, y: 725 },
];

const SLOT_WIDTH = 110;
const SLOT_HEIGHT = 180;
const ROAD_X = 600;
const CROSS_ROADS = [330, 590, 850];

function Navigation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNavigation() {
      try {
        setLoading(true);
        setError("");

        const bookingResponse = await fetch(
          `${API_URL}/navigation/booking/${bookingId}`
        );

        const bookingData = await bookingResponse.json();

        if (!bookingResponse.ok) {
          throw new Error(
            bookingData.detail || "Unable to load booking navigation."
          );
        }

        setBooking(bookingData);

        const layoutResponse = await fetch(
          `${API_URL}/navigation/layout/${bookingData.area_id}`
        );

        const layoutData = await layoutResponse.json();

        if (!layoutResponse.ok) {
          throw new Error(
            layoutData.detail || "Unable to load parking layout."
          );
        }

        setLayout(layoutData);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    if (bookingId) {
      loadNavigation();
    }
  }, [bookingId]);

  const slots = useMemo(() => {
    if (!layout?.slots) return [];

    return [...layout.slots].sort((a, b) => {
      return String(a.slot_no).localeCompare(
        String(b.slot_no),
        undefined,
        { numeric: true }
      );
    });
  }, [layout]);

  const destination = slots.find(
    (slot) => Number(slot.slot_id) === Number(booking?.slot_id)
  );

  const destinationIndex = slots.findIndex(
    (slot) => Number(slot.slot_id) === Number(booking?.slot_id)
  );

  const destinationPosition =
    destinationIndex >= 0 ? SLOT_POSITIONS[destinationIndex] : null;

  const destinationRow =
    destinationIndex >= 0 ? Math.floor(destinationIndex / 5) : -1;

  const routePath = destinationPosition
    ? `M ${ROAD_X} 70
       L ${ROAD_X} ${CROSS_ROADS[destinationRow]}
       L ${destinationPosition.x + SLOT_WIDTH / 2} ${CROSS_ROADS[destinationRow]}
       L ${destinationPosition.x + SLOT_WIDTH / 2} ${destinationPosition.y + SLOT_HEIGHT}`
    : "";

  if (loading) {
    return (
      <div className="navigation-loading">
        <div className="navigation-spinner" />
        <h2>Preparing your parking route...</h2>
        <p>Loading your booking and indoor parking layout.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="navigation-error">
        <h2>Navigation unavailable</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/bookings")}>
          Back to My Bookings
        </button>
      </div>
    );
  }

  if (!booking || !layout) return null;

  const getSlotClass = (slot) => {
    if (Number(slot.slot_id) === Number(booking.slot_id)) {
      return "nav-slot destination-slot";
    }

    if (
      slot.status === "BOOKED" ||
      slot.status === "OCCUPIED" ||
      slot.status === "RESERVED"
    ) {
      return "nav-slot booked-slot";
    }

    return "nav-slot available-slot";
  };

  return (
    <div className="navigation-page">
      <header className="navigation-header">
        <div>
          <span className="navigation-eyebrow">
            SMARTPARK · INDOOR WAYFINDING
          </span>
          <h1>Find Your Parking Space</h1>
          <p>
            Follow your highlighted route from the entrance to your
            reserved parking bay.
          </p>
        </div>

        <button
          className="navigation-back"
          onClick={() => navigate("/bookings")}
        >
          ← My Bookings
        </button>
      </header>

      <section className="navigation-info-grid">
        <div className="navigation-info-card">
          <span>DESTINATION</span>
          <strong>{destination?.slot_no || "Not found"}</strong>
          <small>Your reserved parking bay</small>
        </div>

        <div className="navigation-info-card">
          <span>PARKING AREA</span>
          <strong>{layout.area_name}</strong>
          <small>{layout.location}</small>
        </div>

        <div className="navigation-info-card">
          <span>FLOOR</span>
          <strong>{booking.floorno || "1"}</strong>
          <small>Parking level</small>
        </div>

        <div className="navigation-info-card">
          <span>BOOKING ID</span>
          <strong>#{booking.booking_id}</strong>
          <small>{booking.status}</small>
        </div>
      </section>

      <section className="navigation-main">
        <div className="map-heading">
          <div>
            <span className="navigation-eyebrow">LIVE ROUTE PREVIEW</span>
            <h2>Parking Floor Map</h2>
          </div>

          <div className="map-floor-label">
            FLOOR {booking.floorno || "1"}
          </div>
        </div>

        <div className="map-legend">
          <span><i className="legend-dot available-dot" /> Available</span>
          <span><i className="legend-dot booked-dot" /> Booked / Occupied</span>
          <span><i className="legend-dot destination-dot" /> Your destination</span>
          <span><i className="legend-line" /> Recommended route</span>
        </div>

        <div className="parking-map-shell">
          <svg
            className="parking-map"
            viewBox="0 0 1200 1030"
            role="img"
            aria-label="Indoor parking map showing the route to your reserved slot"
          >
            <defs>
              <pattern
                id="floorGrid"
                width="30"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 30 0 L 0 0 0 30"
                  fill="none"
                  stroke="#d7e0eb"
                  strokeWidth="1"
                />
              </pattern>

              <linearGradient id="roadGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#26364d" />
                <stop offset="50%" stopColor="#354963" />
                <stop offset="100%" stopColor="#26364d" />
              </linearGradient>

              <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#155eef" />
              </linearGradient>

              <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="slotShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="5"
                  floodColor="#1e293b"
                  floodOpacity="0.13"
                />
              </filter>
            </defs>

            {/* Parking floor */}
            <rect x="10" y="10" width="1180" height="1000" rx="22" fill="#e8eef5" />
            <rect x="10" y="10" width="1180" height="1000" rx="22" fill="url(#floorGrid)" />

            {/* Entrance area */}
            <rect x="430" y="10" width="340" height="80" rx="12" fill="#dce8f2" />
            <rect x="475" y="22" width="250" height="48" rx="10" fill="#d1fae5" stroke="#10b981" strokeWidth="2" />
            <text x="600" y="52" textAnchor="middle" className="map-gate-text">
              ↓  ENTRANCE GATE
            </text>

            {/* Main vertical driving road */}
            <rect
              x="510"
              y="90"
              width="180"
              height="820"
              rx="8"
              fill="url(#roadGradient)"
            />

            <line x1="530" y1="100" x2="530" y2="900" className="road-edge-line" />
            <line x1="670" y1="100" x2="670" y2="900" className="road-edge-line" />
            <line x1="600" y1="100" x2="600" y2="900" className="road-center-line" />

            {/* Horizontal cross roads */}
            {CROSS_ROADS.map((y, index) => (
              <g key={index}>
                <rect
                  x="35"
                  y={y - 34}
                  width="1130"
                  height="68"
                  rx="7"
                  fill="url(#roadGradient)"
                />
                <line
                  x1="45"
                  y1={y - 25}
                  x2="1155"
                  y2={y - 25}
                  className="road-edge-line"
                />
                <line
                  x1="45"
                  y1={y + 25}
                  x2="1155"
                  y2={y + 25}
                  className="road-edge-line"
                />
                <text
                  x="600"
                  y={y + 5}
                  textAnchor="middle"
                  className="road-label"
                >
                  ↔   CROSS ACCESS ROAD   ↔
                </text>
                <path
                  d={`M 480 ${y} l -12 -8 m 12 8 l -12 8`}
                  className="road-arrow"
                />
                <path
                  d={`M 720 ${y} l 12 -8 m -12 8 l 12 8`}
                  className="road-arrow"
                />
              </g>
            ))}

            {/* Individual access paths connecting every bay to its road */}
            {slots.map((slot, index) => {
              const position = SLOT_POSITIONS[index];
              if (!position) return null;

              const row = Math.floor(index / 5);
              const centerX = position.x + SLOT_WIDTH / 2;
              const slotBottom = position.y + SLOT_HEIGHT;
              const roadY = CROSS_ROADS[row];

              return (
                <g key={`access-${slot.slot_id}`}>
                  <path
                    d={`M ${centerX} ${slotBottom} L ${centerX} ${roadY}`}
                    className="bay-access-road"
                  />
                  <path
                    d={`M ${centerX - 8} ${slotBottom + 8} L ${centerX + 8} ${slotBottom + 8}`}
                    className="bay-entry-marking"
                  />
                </g>
              );
            })}

            {/* All parking bays */}
            {slots.map((slot, index) => {
              const position = SLOT_POSITIONS[index];
              if (!position) return null;

              const isDestination =
                Number(slot.slot_id) === Number(booking.slot_id);

              const isEV = Boolean(slot.is_ev_charging);

              return (
                <g key={slot.slot_id} filter="url(#slotShadow)">
                  <rect
                    x={position.x}
                    y={position.y}
                    width={SLOT_WIDTH}
                    height={SLOT_HEIGHT}
                    rx="11"
                    className={
                      isDestination
                        ? "svg-slot-destination"
                        : slot.status === "BOOKED" ||
                          slot.status === "OCCUPIED" ||
                          slot.status === "RESERVED"
                        ? "svg-slot-booked"
                        : "svg-slot-available"
                    }
                  />

                  <rect
                    x={position.x + 7}
                    y={position.y + 7}
                    width={SLOT_WIDTH - 14}
                    height={SLOT_HEIGHT - 14}
                    rx="7"
                    className="svg-slot-inner"
                  />

                  <text
                    x={position.x + SLOT_WIDTH / 2}
                    y={position.y + 39}
                    textAnchor="middle"
                    className="svg-car-icon"
                  >
                    {isEV ? "⚡" : "♙"}
                  </text>

                  <text
                    x={position.x + SLOT_WIDTH / 2}
                    y={position.y + 78}
                    textAnchor="middle"
                    className="svg-slot-number"
                  >
                    {slot.slot_no}
                  </text>

                  <text
                    x={position.x + SLOT_WIDTH / 2}
                    y={position.y + 105}
                    textAnchor="middle"
                    className="svg-slot-type"
                  >
                    {isEV ? "EV CHARGING" : "STANDARD"}
                  </text>

                  {isDestination && (
                    <>
                      <circle
                        cx={position.x + SLOT_WIDTH / 2}
                        cy={position.y + 127}
                        r="10"
                        className="destination-pulse"
                      />
                      <text
                        x={position.x + SLOT_WIDTH / 2}
                        y={position.y + 132}
                        textAnchor="middle"
                        className="destination-star"
                      >
                        ★
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Route from entrance, along the correct cross road, into destination */}
            {destinationPosition && (
              <>
                <path
                  d={routePath}
                  className="route-glow"
                  filter="url(#routeGlow)"
                />
                <path d={routePath} className="route-line" />

                <circle cx="600" cy="90" r="13" className="route-start-circle" />
                <text x="600" y="95" textAnchor="middle" className="route-start-text">
                  S
                </text>

                <circle
                  cx={destinationPosition.x + SLOT_WIDTH / 2}
                  cy={destinationPosition.y + SLOT_HEIGHT - 10}
                  r="17"
                  className="route-destination-circle"
                />
                <text
                  x={destinationPosition.x + SLOT_WIDTH / 2}
                  y={destinationPosition.y + SLOT_HEIGHT - 5}
                  textAnchor="middle"
                  className="route-destination-text"
                >
                  ★
                </text>
              </>
            )}

            {/* Exit */}
            <rect x="475" y="925" width="250" height="55" rx="10" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
            <text x="600" y="959" textAnchor="middle" className="map-exit-text">
              EXIT GATE  ↑
            </text>

            <text x="45" y="995" className="map-footer-label">
              SMARTPARK INDOOR WAYFINDING
            </text>
            <text x="1150" y="995" textAnchor="end" className="map-footer-label">
              {slots.length} PARKING BAYS
            </text>
          </svg>
        </div>

        {!destination && (
          <div className="navigation-warning">
            The booked slot was not found in this parking area's layout.
            Please check the booking and slot records.
          </div>
        )}
      </section>

      <section className="navigation-bottom-grid">
        <div className="navigation-directions">
          <span className="navigation-eyebrow">YOUR ROUTE</span>
          <h2>Directions to your space</h2>

          <div className="direction-step">
            <span className="direction-number">01</span>
            <div>
              <strong>Start at the entrance</strong>
              <p>Enter through the main vehicle access gate.</p>
            </div>
          </div>

          <div className="direction-step">
            <span className="direction-number">02</span>
            <div>
              <strong>Follow the main driveway</strong>
              <p>Proceed along the central vertical driving lane.</p>
            </div>
          </div>

          <div className="direction-step">
            <span className="direction-number">03</span>
            <div>
              <strong>Take the connecting road</strong>
              <p>
                Follow the highlighted cross road towards{" "}
                {destination?.slot_no || "your destination"}.
              </p>
            </div>
          </div>

          <div className="direction-step">
            <span className="direction-number">04</span>
            <div>
              <strong>Park at your destination</strong>
              <p>
                Turn into the highlighted parking bay and park your vehicle.
              </p>
            </div>
          </div>
        </div>

        <div className="navigation-destination-card">
          <span className="navigation-eyebrow">RESERVED PARKING SPACE</span>
          <div className="destination-icon">⌖</div>
          <h2>{destination?.slot_no || "Slot unavailable"}</h2>
          <p>{layout.area_name}</p>

          <div className="destination-detail">
            <span>Slot type</span>
            <strong>{destination?.slot_type || booking.slot_type}</strong>
          </div>

          <div className="destination-detail">
            <span>EV charging</span>
            <strong>
              {destination?.is_ev_charging ? "Available" : "Not available"}
            </strong>
          </div>

          <div className="destination-detail">
            <span>Floor</span>
            <strong>{booking.floorno || "1"}</strong>
          </div>

          <div className="destination-detail">
            <span>Booking status</span>
            <strong>{booking.status}</strong>
          </div>

          <button
            className="navigation-done-button"
            onClick={() => navigate("/bookings")}
          >
            Back to My Bookings
          </button>
        </div>
      </section>

      <p className="navigation-disclaimer">
        Demonstration indoor navigation based on the configured parking
        layout. Follow on-site signs and staff instructions.
      </p>
    </div>
  );
}

export default Navigation;
