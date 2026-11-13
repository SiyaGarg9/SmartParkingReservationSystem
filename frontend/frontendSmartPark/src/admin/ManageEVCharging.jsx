
import { useEffect, useMemo, useState } from "react";
import {
  Zap,
  BatteryCharging,
  Activity,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  Trash2,
  X,
  Save,
  MapPin,
  Gauge,
  ArrowUpRight,
  PlugZap,
  Building2,
  RefreshCw,
} from "lucide-react";
import "./ManageEVCharging.css";

const API = "http://127.0.0.1:8000";

const EV_POWER = 22;
const EV_TYPE = "AC Type 2";
const EV_EXTRA_CHARGE = 18;

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_USE", label: "In Use" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

const getToken = () => localStorage.getItem("admin_access_token");

const getStatusLabel = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "IN_USE") return "In Use";
  if (normalized === "MAINTENANCE") return "Maintenance";

  return "Available";
};

const getPower = (charger) =>
  Number(
    charger.powerVal ??
    charger.powerval ??
    charger.power ??
    0
  );

function ManageEVCharging() {
  const [stations, setStations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [areas, setAreas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formData, setFormData] = useState({
    slotId: "",
  });

  const token = getToken();

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const fetchData = async () => {
    if (!token) {
      setError(
        "Admin session not found. Please log in again through the Admin Portal."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [chargerResponse, slotResponse, areaResponse] =
        await Promise.all([
          fetch(`${API}/admin/ev-chargers`, {
            headers: authHeaders,
          }),
          fetch(`${API}/admin/slots`, {
            headers: authHeaders,
          }),
          fetch(`${API}/admin/areas`, {
            headers: authHeaders,
          }),
        ]);

      if (
        chargerResponse.status === 401 ||
        chargerResponse.status === 403 ||
        slotResponse.status === 401 ||
        slotResponse.status === 403 ||
        areaResponse.status === 401 ||
        areaResponse.status === 403
      ) {
        throw new Error(
          "Admin authorization failed. Please log in again."
        );
      }

      if (
        !chargerResponse.ok ||
        !slotResponse.ok ||
        !areaResponse.ok
      ) {
        throw new Error(
          "Unable to load EV charging information from the server."
        );
      }

      const chargerData = await chargerResponse.json();
      const slotData = await slotResponse.json();
      const areaData = await areaResponse.json();

      setStations(Array.isArray(chargerData) ? chargerData : []);
      setSlots(Array.isArray(slotData) ? slotData : []);
      setAreas(Array.isArray(areaData) ? areaData : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const areaMap = useMemo(() => {
    const map = {};

    areas.forEach((area) => {
      map[area.area_id] = area;
    });

    return map;
  }, [areas]);

  const slotMap = useMemo(() => {
    const map = {};

    slots.forEach((slot) => {
      map[slot.slot_id] = slot;
    });

    return map;
  }, [slots]);

  const evSlots = useMemo(
    () =>
      slots.filter(
        (slot) =>
          slot.is_ev_charging === true ||
          slot.is_ev_charging === "true" ||
          String(slot.slot_type || "").toUpperCase() === "EV"
      ),
    [slots]
  );

  const registeredSlotIds = useMemo(
    () => new Set(stations.map((station) => Number(station.slot_id))),
    [stations]
  );

  const unregisteredSlots = evSlots.filter(
    (slot) => !registeredSlotIds.has(Number(slot.slot_id))
  );

  const getStationDetails = (station) => {
    const slot = slotMap[station.slot_id];
    const area = areaMap[station.area_id ?? slot?.area_id];

    const slotNumber =
      station.slot_no ??
      slot?.slot_no ??
      "Slot number unavailable";

    const areaName =
      area?.name ??
      "Parking area unavailable";

    return {
      slotNumber,
      areaName,
      name: `${areaName} Charger`,
      power: getPower(station),
      chargerType: station.charger_type || "Not specified",
      status: getStatusLabel(station.status),
    };
  };

  const filteredStations = stations.filter((station) => {
    const details = getStationDetails(station);
    const query = search.toLowerCase();

    const matchesSearch =
      details.name.toLowerCase().includes(query) ||
      details.areaName.toLowerCase().includes(query) ||
      String(details.slotNumber).toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" ||
      details.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const availableCount = stations.filter(
    (station) => station.status === "AVAILABLE"
  ).length;

  const inUseCount = stations.filter(
    (station) => station.status === "IN_USE"
  ).length;

  const maintenanceCount = stations.filter(
    (station) => station.status === "MAINTENANCE"
  ).length;

  const totalPower = stations.reduce(
    (sum, station) => sum + getPower(station),
    0
  );

  const resetForm = () => {
    setFormData({ slotId: "" });
    setShowForm(false);
  };

  const handleAddStation = async (e) => {
    e.preventDefault();

    if (!formData.slotId) {
      setError("Please select an EV-enabled parking slot.");
      return;
    }

    const slotId = Number(formData.slotId);

    if (registeredSlotIds.has(slotId)) {
      setError("A charger is already registered for this slot.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const params = new URLSearchParams({
        slot_id: String(slotId),
        charger_type: EV_TYPE,
        powerVal: String(EV_POWER),
      });

      const response = await fetch(
        `${API}/admin/ev-chargers?${params.toString()}`,
        {
          method: "POST",
          headers: authHeaders,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Unable to register this EV charger."
        );
      }

      setSuccess("EV charging station registered successfully.");
      resetForm();
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (chargerId, newStatus) => {
    setError("");
    setSuccess("");

    try {
      const params = new URLSearchParams({
        status_value: newStatus,
      });

      const response = await fetch(
        `${API}/admin/ev-chargers/${chargerId}/status?${params.toString()}`,
        {
          method: "PUT",
          headers: authHeaders,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Unable to update charger status."
        );
      }

      setSuccess("Charger status updated successfully.");
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteStation = async (chargerId, slotNumber) => {
    const confirmed = window.confirm(
      `Delete the EV charger registered for slot ${slotNumber}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API}/admin/ev-chargers/${chargerId}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Unable to delete this charger."
        );
      }

      setSuccess("EV charger deleted successfully.");
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="manage-ev">
      <section className="ev-hero">
        <div className="ev-hero-grid" />
        <div className="ev-hero-glow" />

        <div className="ev-hero-content">
          <div className="ev-eyebrow">
            <Zap size={15} />
            SMARTPARK ELECTRIC MOBILITY
          </div>

          <h1>
            EV Charging
            <span> Management.</span>
          </h1>

          <p>
            Monitor registered EV charging stations, manage
            availability and oversee charging locations across
            your SmartPark network.
          </p>

          <div className="ev-hero-meta">
            <span>
              <Activity size={15} />
              Charging infrastructure
            </span>
            <span>
              <Building2 size={15} />
              Multi-location management
            </span>
          </div>

          <button
            className="ev-primary-btn"
            onClick={() => {
              setError("");
              setSuccess("");
              setFormData({
                slotId: unregisteredSlots[0]
                  ? String(unregisteredSlots[0].slot_id)
                  : "",
              });
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={unregisteredSlots.length === 0}
          >
            <Plus size={18} />
            Add Charging Station
          </button>
        </div>

        <div className="ev-hero-visual">
          <div className="ev-orbit ev-orbit-outer" />
          <div className="ev-orbit ev-orbit-middle" />
          <div className="ev-orbit ev-orbit-inner" />

          <div className="ev-hero-bolt">
            <Zap size={76} strokeWidth={1.4} />
          </div>

          <div className="ev-floating-label ev-floating-top">
            <span className="ev-live-dot" />
            <div>
              <strong>EV NETWORK</strong>
              <small>{stations.length} registered stations</small>
            </div>
          </div>

          <div className="ev-floating-label ev-floating-bottom">
            <BatteryCharging size={22} />
            <div>
              <strong>{totalPower} kW</strong>
              <small>Installed capacity</small>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="ev-message ev-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="ev-message ev-success" role="status">
          {success}
        </div>
      )}

      <section className="ev-section-heading">
        <div>
          <span className="ev-section-kicker">NETWORK OVERVIEW</span>
          <h2>Charging station status</h2>
          <p>Live information retrieved from your database.</p>
        </div>

        <button
          className="ev-cancel-btn"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </section>

      <section className="ev-summary">
        <div className="ev-summary-card ev-card-total">
          <div className="ev-summary-top">
            <div className="ev-summary-icon">
              <PlugZap size={21} />
            </div>
            <span>NETWORK</span>
          </div>
          <strong>{String(stations.length).padStart(2, "0")}</strong>
          <p>Total stations</p>
          <div className="ev-summary-footer">
            <span>Registered chargers</span>
            <ArrowUpRight size={16} />
          </div>
        </div>

        <div className="ev-summary-card ev-card-available">
          <div className="ev-summary-top">
            <div className="ev-summary-icon">
              <CheckCircle2 size={21} />
            </div>
            <span>READY</span>
          </div>
          <strong>{String(availableCount).padStart(2, "0")}</strong>
          <p>Available stations</p>
          <div className="ev-summary-footer">
            <span>Ready for charging</span>
            <ArrowUpRight size={16} />
          </div>
        </div>

        <div className="ev-summary-card ev-card-inuse">
          <div className="ev-summary-top">
            <div className="ev-summary-icon">
              <Activity size={21} />
            </div>
            <span>ACTIVE</span>
          </div>
          <strong>{String(inUseCount).padStart(2, "0")}</strong>
          <p>Currently in use</p>
          <div className="ev-summary-footer">
            <span>Active charging sessions</span>
            <ArrowUpRight size={16} />
          </div>
        </div>

        <div className="ev-summary-card ev-card-maintenance">
          <div className="ev-summary-top">
            <div className="ev-summary-icon">
              <Clock3 size={21} />
            </div>
            <span>SERVICE</span>
          </div>
          <strong>{String(maintenanceCount).padStart(2, "0")}</strong>
          <p>Under maintenance</p>
          <div className="ev-summary-footer">
            <span>Service required</span>
            <ArrowUpRight size={16} />
          </div>
        </div>
      </section>

      <section className="ev-capacity-panel">
        <div className="ev-capacity-icon">
          <Gauge size={25} />
        </div>
        <div className="ev-capacity-info">
          <span>INSTALLED CHARGING CAPACITY</span>
          <strong>{totalPower} kW</strong>
          <p>
            Actual combined power of registered chargers.
            New chargers use {EV_POWER} kW AC Type 2.
          </p>
        </div>
        <div className="ev-capacity-side">
          <Zap size={22} />
          <span>Electric mobility network</span>
        </div>
      </section>

      <section className="ev-capacity-panel">
        <div className="ev-capacity-icon">
          <PlugZap size={25} />
        </div>
        <div className="ev-capacity-info">
          <span>EV PARKING SURCHARGE</span>
          <strong>₹{EV_EXTRA_CHARGE}/hour</strong>
          <p>
            Additional EV parking fee over the regular ₹100/hour
            parking charge.
          </p>
        </div>
        <div className="ev-capacity-side">
          <span>EV parking total: ₹118/hour</span>
        </div>
      </section>

      {showForm && (
        <section className="ev-form-section">
          <div className="ev-form-heading">
            <div>
              <span className="ev-section-kicker">
                STATION CONFIGURATION
              </span>
              <h2>Add New Charging Station</h2>
              <p>
                Register a charger against an existing EV-enabled
                parking slot.
              </p>
            </div>

            <button
              type="button"
              className="ev-close-form"
              onClick={resetForm}
              aria-label="Close form"
            >
              <X size={19} />
            </button>
          </div>

          <form className="ev-form" onSubmit={handleAddStation}>
            <div className="ev-form-grid">
              <label>
                <span>Select EV Parking Slot</span>
                <select
                  value={formData.slotId}
                  onChange={(e) =>
                    setFormData({ slotId: e.target.value })
                  }
                  required
                >
                  <option value="">Select an unregistered EV slot</option>

                  {unregisteredSlots.map((slot) => {
                    const area = areaMap[slot.area_id];

                    return (
                      <option
                        key={slot.slot_id}
                        value={slot.slot_id}
                      >
                        {area?.name || "Parking area"} — Slot{" "}
                        {slot.slot_no} (ID: {slot.slot_id})
                      </option>
                    );
                  })}
                </select>
              </label>

              <label>
                <span>Charger Type</span>
                <input value={EV_TYPE} disabled />
              </label>

              <label>
                <span>Power Output</span>
                <input value={`${EV_POWER} kW`} disabled />
              </label>

              <label>
                <span>Additional EV Parking Fee</span>
                <input value={`₹${EV_EXTRA_CHARGE} per hour`} disabled />
              </label>
            </div>

            {unregisteredSlots.length === 0 && (
              <p>
                All existing EV-enabled slots already have registered
                chargers, or no EV-enabled slots are configured.
              </p>
            )}

            <div className="ev-form-actions">
              <button
                type="submit"
                className="ev-primary-btn"
                disabled={saving || !formData.slotId}
              >
                <Save size={17} />
                {saving ? "Registering..." : "Register Charger"}
              </button>

              <button
                type="button"
                className="ev-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="ev-directory-section">
        <div className="ev-directory-heading">
          <div>
            <span className="ev-section-kicker">
              INFRASTRUCTURE CONTROL
            </span>
            <h2>Charging station directory</h2>
            <p>
              Each charger is linked to its actual parking slot.
            </p>
          </div>

          <div className="ev-directory-count">
            {filteredStations.length} STATIONS
          </div>
        </div>

        <div className="ev-controls">
          <div className="ev-search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search station, area or slot number..."
              aria-label="Search charging stations"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter charging stations by status"
          >
            <option value="All">All</option>
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        <div className="ev-table-wrapper">
          {loading ? (
            <div className="ev-empty">
              <div>
                <RefreshCw size={28} />
              </div>
              <h3>Loading EV stations...</h3>
              <p>Fetching charging station information.</p>
            </div>
          ) : (
            <table className="ev-table">
              <thead>
                <tr>
                  <th>CHARGING STATION</th>
                  <th>PARKING AREA</th>
                  <th>SLOT NUMBER</th>
                  <th>CHARGER TYPE</th>
                  <th>POWER</th>
                  <th>EV FEE / HOUR</th>
                  <th>STATUS</th>
                  <th>UPDATE STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredStations.map((station) => {
                  const details = getStationDetails(station);

                  return (
                    <tr key={station.charger_id}>
                      <td>
                        <div className="ev-station-name">
                          <div className="ev-station-icon">
                            <Zap size={18} />
                          </div>
                          <strong>
                            {details.name}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <div className="ev-location">
                          <MapPin size={14} />
                          {details.areaName}
                        </div>
                      </td>

                      <td>
                        <strong className="ev-power-value">
                          {details.slotNumber}
                        </strong>
                      </td>

                      <td>
                        <span className="ev-type-label">
                          {details.chargerType}
                        </span>
                      </td>

                      <td>
                        <strong className="ev-power-value">
                          {details.power} kW
                        </strong>
                      </td>

                      <td>
                        <strong className="ev-price-value">
                          ₹{EV_EXTRA_CHARGE}/hour
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`ev-status ${details.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          <span />
                          {details.status}
                        </span>
                      </td>

                      <td>
                        <select
                          className="ev-status-select"
                          value={station.status}
                          onChange={(e) =>
                            updateStatus(
                              station.charger_id,
                              e.target.value
                            )
                          }
                          aria-label={`Update status for slot ${details.slotNumber}`}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <div className="ev-row-actions">
                          <button
                            className="ev-delete-btn"
                            onClick={() =>
                              deleteStation(
                                station.charger_id,
                                details.slotNumber
                              )
                            }
                            title="Delete charger"
                            aria-label={`Delete charger for slot ${details.slotNumber}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && filteredStations.length === 0 && (
            <div className="ev-empty">
              <div>
                <Search size={28} />
              </div>
              <h3>No charging stations found</h3>
              <p>
                Try another search or register a charger against an
                existing EV-enabled slot.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="ev-page-footer">
        <span>SMARTPARK · ELECTRIC MOBILITY MANAGEMENT</span>
        <span>{stations.length} registered charging stations</span>
      </div>
    </div>
  );
}

export default ManageEVCharging;
