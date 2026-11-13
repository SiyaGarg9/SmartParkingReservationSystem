
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  MapPin,
  CalendarDays,
  Clock3,
  SlidersHorizontal,
  Zap,
  ShieldCheck,
  ArrowRight,
  ParkingCircle,
  CarFront,
  RefreshCw,
  Building2,
  CheckCircle2,
} from "lucide-react";
import "./Search.css";

function Search() {
  const navigate = useNavigate();

  const [parkingData, setParkingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [vehicle, setVehicle] = useState("All");
  const [evOnly, setEvOnly] = useState(false);
  const [searched, setSearched] = useState(false);

  function formatLocalDateTime(dateObject) {
    const pad = (number) => String(number).padStart(2, "0");

    return (
      `${dateObject.getFullYear()}-` +
      `${pad(dateObject.getMonth() + 1)}-` +
      `${pad(dateObject.getDate())}T` +
      `${pad(dateObject.getHours())}:` +
      `${pad(dateObject.getMinutes())}:` +
      `${pad(dateObject.getSeconds())}`
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function loadParkingData() {
      try {
        setError("");

        const startDateTime =
          date && time
            ? `${date}T${time}:00`
            : formatLocalDateTime(new Date());

        const startDate = new Date(startDateTime);

        if (Number.isNaN(startDate.getTime())) {
          throw new Error("Please select a valid arrival date and time.");
        }

        const endDateTime = formatLocalDateTime(
          new Date(startDate.getTime() + 60 * 60 * 1000)
        );

        const areasResponse = await fetch(
          "http://127.0.0.1:8000/parking/areas"
        );

        if (!areasResponse.ok) {
          throw new Error("Could not fetch parking areas.");
        }

        const areasData = await areasResponse.json();

        const areas = Array.isArray(areasData)
          ? areasData
          : areasData.areas || areasData.data || [];

        const formattedAreas = await Promise.all(
          areas.map(async (area) => {
            const areaId = area.id ?? area.area_id;

            const slotsResponse = await fetch(
              `http://127.0.0.1:8000/parking/areas/${areaId}/slots`
            );

            if (!slotsResponse.ok) {
              throw new Error(
                `Could not fetch slots for parking area ${areaId}.`
              );
            }

            const slotsData = await slotsResponse.json();

            const allSlots = Array.isArray(slotsData)
              ? slotsData
              : slotsData.slots || slotsData.data || [];

            const searchParams = new URLSearchParams({
              area_name: area.name ?? area.area_name ?? "",
              start_time: startDateTime,
              end_time: endDateTime,
            });

            const availabilityResponse = await fetch(
              `http://127.0.0.1:8000/parking/search?${searchParams.toString()}`
            );

            if (!availabilityResponse.ok) {
              throw new Error(
                `Could not fetch live availability for ${area.name ?? areaId}.`
              );
            }

            const availabilityData = await availabilityResponse.json();

            const availableSlots = Array.isArray(availabilityData)
              ? availabilityData
              : [];

            const availableEVSlots = availableSlots.filter(
              (slot) => slot.is_ev_charging === true
            );

            return {
              id: areaId,
              name:
                area.name ??
                area.area_name ??
                "Parking Area " + areaId,
              location:
                area.location ??
                area.zone ??
                area.address ??
                "Parking area",
              price: area.price ?? area.hourly_rate ?? null,
              available: availableSlots.length,
              total: allSlots.length,
              evCharging: availableEVSlots.length > 0,
              evAvailableCount: availableEVSlots.length,
              covered: area.covered ?? area.is_covered ?? null,
            };
          })
        );

        if (isMounted) {
          setParkingData(formattedAreas);
        }
      } catch (err) {
        console.error("Parking data error:", err);

        if (isMounted) {
          setError(
            err.message ||
              "Unable to load parking data. Please check the backend."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadParkingData();

    const refreshInterval = setInterval(() => {
      loadParkingData();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [date, time]);

  const filteredParking = parkingData.filter((parking) => {
    const searchText = location.trim().toLowerCase();

    const matchesLocation =
      parking.name.toLowerCase().includes(searchText) ||
      parking.location.toLowerCase().includes(searchText);

    const matchesEV = !evOnly || parking.evCharging;

    return matchesLocation && matchesEV;
  });

  function handleSearch(event) {
    event.preventDefault();
    setSearched(true);
  }

  function clearFilters() {
    setLocation("");
    setEvOnly(false);
    setVehicle("All");
    setDate("");
    setTime("");
    setSearched(false);
  }

  return (
    <div className="search-parking-page">
      <section className="search-hero">
        <div className="search-hero-overlay" />

        <div className="search-hero-inner">
          <div className="search-heading">
            <span className="search-tag">
              <span className="search-tag-dot" />
              SMART PARKING, MADE SIMPLE
            </span>

            <h1>
              Your space.
              <br />
              <span>Your time. Your way.</span>
            </h1>

            <p>
              Discover convenient parking locations, check live availability
              and reserve your spot before you arrive.
            </p>

            <div className="search-trust-row">
              <span>
                <ShieldCheck size={16} />
                Secure reservations
              </span>
              <span>
                <Zap size={16} />
                Live availability
              </span>
              <span>
                <Clock3 size={16} />
                Save time
              </span>
            </div>
          </div>

          <div className="search-form-container">
            <div className="search-panel-heading">
              <div>
                <span className="search-panel-eyebrow">PLAN YOUR ARRIVAL</span>
                <h2>Find available parking</h2>
              </div>

              <div className="search-panel-icon">
                <ParkingCircle size={25} />
              </div>
            </div>

            <form className="parking-search-form" onSubmit={handleSearch}>
              <div className="search-field">
                <label htmlFor="parking-location">
                  <MapPin size={15} />
                  Parking location
                </label>

                <input
                  id="parking-location"
                  type="text"
                  placeholder="Enter area or parking name"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="search-field">
                <label htmlFor="parking-date">
                  <CalendarDays size={15} />
                  Arrival date
                </label>

                <input
                  id="parking-date"
                  type="date"
                  min={formatLocalDateTime(new Date()).slice(0, 10)}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="search-field">
                <label htmlFor="parking-time">
                  <Clock3 size={15} />
                  Arrival time
                </label>

                <input
                  id="parking-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <button type="submit" className="parking-search-btn">
                <SearchIcon size={18} />
                Search
              </button>
            </form>

            <div className="search-panel-footer">
              <span>
                <CheckCircle2 size={14} />
                Availability updates automatically
              </span>
              <span>60-minute reservation window</span>
            </div>
          </div>
        </div>
      </section>

      <section className="parking-results-section">
        <div className="results-header">
          <div>
            <span className="results-eyebrow">DISCOVER YOUR OPTIONS</span>
            <h2>Parking locations</h2>
            <p>Choose a convenient space for your next journey.</p>
          </div>

          <div className="results-count">
            <Building2 size={17} />
            {loading ? "Loading..." : `${filteredParking.length} locations`}
          </div>
        </div>

        <div className="parking-filters">
          <div className="filter-heading">
            <SlidersHorizontal size={17} />
            <span>Refine your search</span>
          </div>

          <div className="vehicle-filter">
            <label htmlFor="vehicle-type">Vehicle type</label>

            <select
              id="vehicle-type"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
            >
              <option value="All">All vehicles</option>
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
              <option value="EV">Electric vehicle</option>
            </select>
          </div>

          <label className="ev-filter">
            <input
              type="checkbox"
              checked={evOnly}
              onChange={(e) => setEvOnly(e.target.checked)}
            />
            <span className="ev-filter-icon">
              <Zap size={15} />
            </span>
            EV charging available
          </label>

          {(location || date || time || evOnly || vehicle !== "All") && (
            <button className="reset-filters" onClick={clearFilters}>
              <RefreshCw size={14} />
              Reset filters
            </button>
          )}
        </div>

        {searched && (
          <div className="search-feedback">
            <SearchIcon size={16} />
            <span>
              Showing results for{" "}
              <strong>{location.trim() || "all locations"}</strong>
              {date && ` on ${date}`}
              {time && ` at ${time}`}
              {!date && !time && " for the current one-hour window"}.
            </span>
          </div>
        )}

        <div className="parking-results">
          {loading && (
            <div className="search-loading">
              <div className="search-loader" />
              <h3>Finding your parking options</h3>
              <p>Checking parking areas and live slot availability...</p>
            </div>
          )}

          {!loading && error && (
            <div className="no-parking-results">
              <div className="empty-result-icon">
                <RefreshCw size={27} />
              </div>
              <h3>Unable to load parking data</h3>
              <p>{error}</p>
              <button
                className="clear-search-btn"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            filteredParking.map((parking, index) => (
              <article className="parking-card" key={parking.id}>
                <div
                  className={`parking-card-visual parking-visual-${(index % 4) + 1}`}
                >
                  <div className="parking-visual-shade" />

                  <div className="parking-card-visual-top">
                    <span className="parking-type-label">
                      <Building2 size={13} />
                      SMARTPARK LOCATION
                    </span>

                    <span
                      className={`parking-availability-badge ${
                        parking.available > 0 ? "is-available" : "is-full"
                      }`}
                    >
                      <span />
                      {parking.available > 0 ? "Available" : "Fully occupied"}
                    </span>
                  </div>

                  <div className="parking-visual-bottom">
                    <div className="parking-symbol">
                      <ParkingCircle size={37} />
                    </div>

                    <div className="parking-visual-title">
                      <span>YOUR NEXT STOP</span>
                      <h3>{parking.name}</h3>
                    </div>
                  </div>

                  <div className="parking-visual-number">
                    {String(parking.id).padStart(2, "0")}
                  </div>
                </div>

                <div className="parking-card-content">
                  <div className="parking-card-heading">
                    <div className="parking-location">
                      <MapPin size={15} />
                      <span>{parking.location}</span>
                    </div>
                  </div>

                  <div className="parking-card-stats">
                    <div className="parking-stat">
                      <span className="parking-stat-icon available-icon">
                        <ParkingCircle size={17} />
                      </span>
                      <div>
                        <strong>{parking.available}</strong>
                        <span>Available</span>
                      </div>
                    </div>

                    <div className="parking-stat-divider" />

                    <div className="parking-stat">
                      <span className="parking-stat-icon total-icon">
                        <CarFront size={17} />
                      </span>
                      <div>
                        <strong>{parking.total}</strong>
                        <span>Total slots</span>
                      </div>
                    </div>
                  </div>

                  <div className="parking-facilities">
                    <span>
                      <ShieldCheck size={14} />
                      {parking.covered === null
                        ? "Covering details unavailable"
                        : parking.covered
                          ? "Covered parking"
                          : "Open parking"}
                    </span>

                    {parking.evCharging && (
                      <span className="facility-ev">
                        <Zap size={14} />
                        {parking.evAvailableCount} EV slots
                      </span>
                    )}
                  </div>

                  <div className="parking-card-bottom">
                    <span>
                      {parking.available} of {parking.total} spaces free
                    </span>

                    <button
                      className="book-parking-btn"
                      disabled={parking.available === 0}
                      onClick={() =>
                        navigate("/booking", {
                          state: {
                            parkingId: parking.id,
                            parkingName: parking.name,
                            location: parking.location,
                            ratePerHour: parking.price,
                            date,
                            time,
                            vehicle,
                          },
                        })
                      }
                    >
                      {parking.available > 0 ? (
                        <>
                          Reserve spot <ArrowRight size={16} />
                        </>
                      ) : (
                        "No spaces available"
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}

          {!loading && !error && filteredParking.length === 0 && (
            <div className="no-parking-results">
              <div className="empty-result-icon">
                <SearchIcon size={28} />
              </div>

              <h3>No parking areas found</h3>
              <p>Try another location or change your search filters.</p>

              <button className="clear-search-btn" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
        </div>

        <div className="sample-data-note">
          <ShieldCheck size={15} />
          Slot availability is checked against bookings for your selected
          one-hour window.
        </div>
      </section>
    </div>
  );
}

export default Search;
