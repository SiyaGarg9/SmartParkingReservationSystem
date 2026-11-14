
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BatteryCharging,
  Building2,
  CheckCircle2,
  CircleParking,
  Clock3,
  Layers3,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import "./ManageSlots.css";

const API_URL = "https://smartparkingreservationsystem.onrender.com";

const emptyForm = {
  slot_no: "",
  area_id: "",
  floorNo: "Ground",
  slot_type: "NORMAL",
  status: "AVAILABLE",
  is_ev_charging: false,
};

function ManageSlots() {
  const [slots, setSlots] = useState([]);
  const [areas, setAreas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formData, setFormData] = useState(emptyForm);

  // Fetch actual parking slots and areas from the backend.
  const fetchData = async () => {
    try {
      setError("");

      const [slotsResponse, areasResponse] = await Promise.all([
        fetch(`${API_URL}/parking/slots`),
        fetch(`${API_URL}/parking/areas`),
      ]);

      if (!slotsResponse.ok) {
        throw new Error("Unable to fetch parking slots.");
      }

      if (!areasResponse.ok) {
        throw new Error("Unable to fetch parking areas.");
      }

      const slotsData = await slotsResponse.json();
      const areasData = await areasResponse.json();

      setSlots(Array.isArray(slotsData) ? slotsData : []);
      setAreas(Array.isArray(areasData) ? areasData : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and automatic refresh every 5 seconds.
  useEffect(() => {
    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Get parking area name.
  const getAreaName = (areaId) => {
    const area = areas.find(
      (item) => Number(item.area_id) === Number(areaId)
    );

    return area ? area.name : `Area #${areaId}`;
  };

  // Filter slots.
  const filteredSlots = slots.filter((slot) => {
    const slotNumber = String(slot.slot_no || "").toLowerCase();
    const parkingArea = getAreaName(slot.area_id).toLowerCase();
    const searchValue = search.toLowerCase();

    const matchesSearch =
      slotNumber.includes(searchValue) ||
      parkingArea.includes(searchValue);

    const matchesStatus =
      statusFilter === "All" || slot.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Reset form.
  const resetForm = () => {
    setFormData({
      ...emptyForm,
      area_id: areas.length > 0 ? String(areas[0].area_id) : "",
    });

    setEditingId(null);
    setShowForm(false);
  };

  // Add or update slot.
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.area_id) {
      alert("Please select a parking area.");
      return;
    }

    const payload = {
      slot_no: formData.slot_no.trim(),
      floorNo: formData.floorNo.trim(),
      slot_type: formData.slot_type,
      status: formData.status,
      is_ev_charging: formData.is_ev_charging,
    };

    try {
      setSaving(true);
      setError("");

      let response;

      if (editingId !== null) {
        response = await fetch(
          `${API_URL}/parking/slots/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch(`${API_URL}/parking/slots`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...payload,
            area_id: Number(formData.area_id),
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to save parking slot."
        );
      }

      alert(
        editingId !== null
          ? "Parking slot updated successfully!"
          : "Parking slot added successfully!"
      );

      resetForm();
      await fetchData();
    } catch (err) {
      setError(err.message || "Unable to save parking slot.");
    } finally {
      setSaving(false);
    }
  };

  // Edit slot.
  const handleEdit = (slot) => {
    setEditingId(slot.slot_id);

    setFormData({
      slot_no: slot.slot_no,
      area_id: String(slot.area_id),
      floorNo: slot.floorNo || "Ground",
      slot_type: slot.slot_type,
      status: slot.status,
      is_ev_charging: slot.is_ev_charging,
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete slot.
  const handleDelete = async (slotId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this parking slot?"
      )
    ) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/parking/slots/${slotId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to delete parking slot."
        );
      }

      alert("Parking slot deleted successfully!");
      await fetchData();
    } catch (err) {
      setError(err.message || "Unable to delete parking slot.");
    }
  };

  // Change slot status.
  const updateStatus = async (slot, newStatus) => {
    try {
      setError("");

      const payload = {
        slot_no: slot.slot_no,
        floorNo: slot.floorNo || "Ground",
        slot_type: slot.slot_type,
        status: newStatus,
        is_ev_charging: slot.is_ev_charging,
      };

      const response = await fetch(
        `${API_URL}/parking/slots/${slot.slot_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update slot status."
        );
      }

      await fetchData();
    } catch (err) {
      setError(err.message || "Unable to update slot status.");
      await fetchData();
    }
  };

  // Statistics from actual database slot records.
  const availableCount = slots.filter(
    (slot) => slot.status === "AVAILABLE"
  ).length;

  const occupiedCount = slots.filter(
    (slot) => slot.status === "OCCUPIED"
  ).length;

  const maintenanceCount = slots.filter(
    (slot) => slot.status === "MAINTENANCE"
  ).length;

  const evCount = slots.filter(
    (slot) => slot.is_ev_charging
  ).length;

  const availabilityRate = slots.length
    ? Math.round((availableCount / slots.length) * 100)
    : 0;

  const getStatusClass = (status) =>
    String(status || "").toLowerCase().replace(/\s+/g, "-");

  if (loading) {
    return (
      <div className="manage-slots slots-loading">
        <div className="slots-loading-icon">
          <LoaderCircle size={30} />
        </div>
        <h2>Loading parking slots</h2>
        <p>Retrieving your parking infrastructure...</p>
      </div>
    );
  }

  return (
    <div className="manage-slots">
      {/* HERO */}
      <section className="slots-hero">
        <div className="slots-hero-content">
          <div className="slots-eyebrow">
            <span />
            SLOT MANAGEMENT SYSTEM
          </div>

          <h1>
            Every slot.
            <span> Under control.</span>
          </h1>

          <p>
            Monitor parking capacity, manage individual spaces,
            and configure EV charging across your SmartPark network.
          </p>

          <div className="slots-hero-actions">
            <button
              className="slots-primary-btn"
              onClick={() => {
                setFormData({
                  ...emptyForm,
                  area_id:
                    areas.length > 0 ? String(areas[0].area_id) : "",
                });
                setEditingId(null);
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Plus size={17} />
              Add new slot
            </button>

            <button
              className="slots-refresh-btn"
              onClick={fetchData}
            >
              <RefreshCw size={16} />
              Refresh data
            </button>
          </div>
        </div>

        <div className="slots-hero-visual">
          <div className="slots-hero-ring ring-one" />
          <div className="slots-hero-ring ring-two" />

          <div className="slots-hero-icon">
            <CircleParking size={72} strokeWidth={1.25} />
          </div>

          <div className="slots-hero-floating">
            <Zap size={15} />
            Smart slot control
          </div>

          <div className="slots-hero-total">
            <strong>{slots.length}</strong>
            <span>REGISTERED SLOTS</span>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="slots-error">
          <div>
            <strong>Action could not be completed</strong>
            <p>{error}</p>
          </div>
          <button onClick={fetchData}>
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <section className="slots-summary">
        <article className="slots-summary-card">
          <div className="slots-summary-top">
            <span className="slots-summary-icon total">
              <Layers3 size={20} />
            </span>
            <span className="slots-summary-label">TOTAL CAPACITY</span>
          </div>
          <strong>{slots.length}</strong>
          <p>Registered parking spaces</p>
          <div className="slots-summary-foot">
            <span>Across {areas.length} locations</span>
            <ArrowUpRight size={15} />
          </div>
        </article>

        <article className="slots-summary-card">
          <div className="slots-summary-top">
            <span className="slots-summary-icon available">
              <CheckCircle2 size={20} />
            </span>
            <span className="slots-summary-label">AVAILABLE</span>
          </div>
          <strong>{availableCount}</strong>
          <p>Ready for reservations</p>
          <div className="slots-summary-foot">
            <span>{availabilityRate}% availability</span>
            <ArrowUpRight size={15} />
          </div>
        </article>

        <article className="slots-summary-card">
          <div className="slots-summary-top">
            <span className="slots-summary-icon occupied">
              <Activity size={20} />
            </span>
            <span className="slots-summary-label">OCCUPIED</span>
          </div>
          <strong>{occupiedCount}</strong>
          <p>Currently occupied spaces</p>
          <div className="slots-summary-foot">
            <span>Live slot status</span>
            <ArrowUpRight size={15} />
          </div>
        </article>

        <article className="slots-summary-card">
          <div className="slots-summary-top">
            <span className="slots-summary-icon maintenance">
              <ShieldCheck size={20} />
            </span>
            <span className="slots-summary-label">MAINTENANCE</span>
          </div>
          <strong>{maintenanceCount}</strong>
          <p>Slots under maintenance</p>
          <div className="slots-summary-foot">
            <span>Service monitoring</span>
            <ArrowUpRight size={15} />
          </div>
        </article>
      </section>

      {/* EV OVERVIEW */}
      <section className="slots-ev-overview">
        <div className="slots-ev-icon">
          <BatteryCharging size={25} />
        </div>

        <div className="slots-ev-copy">
          <span>EV INFRASTRUCTURE</span>
          <h3>Electric vehicle charging spaces</h3>
          <p>
            Dedicated charging-enabled parking spaces across your network.
          </p>
        </div>

        <div className="slots-ev-count">
          <strong>{evCount}</strong>
          <span>EV SLOTS</span>
        </div>
      </section>

      {/* ADD / EDIT FORM */}
      {showForm && (
        <section className="slots-form">
          <div className="slots-form-heading">
            <div className="slots-form-heading-icon">
              {editingId !== null ? (
                <Pencil size={21} />
              ) : (
                <Plus size={22} />
              )}
            </div>

            <div>
              <span className="slots-section-kicker">
                SLOT CONFIGURATION
              </span>
              <h2>
                {editingId !== null
                  ? "Edit parking slot"
                  : "Create a new slot"}
              </h2>
              <p>
                Configure the details and availability of this parking space.
              </p>
            </div>

            <button
              type="button"
              className="slots-close-form"
              onClick={resetForm}
              disabled={saving}
              aria-label="Close form"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="slots-form-grid">
              <label>
                <span>Slot number</span>
                <div className="slots-input-wrap">
                  <CircleParking size={17} />
                  <input
                    value={formData.slot_no}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slot_no: e.target.value,
                      })
                    }
                    placeholder="e.g. A01"
                    required
                  />
                </div>
              </label>

              <label>
                <span>Parking area</span>
                <div className="slots-input-wrap">
                  <Building2 size={17} />
                  <select
                    value={formData.area_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        area_id: e.target.value,
                      })
                    }
                    required
                    disabled={editingId !== null}
                  >
                    {areas.map((area) => (
                      <option
                        key={area.area_id}
                        value={area.area_id}
                      >
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                {editingId !== null && (
                  <small>
                    The parking area cannot be changed through the current
                    backend update API.
                  </small>
                )}
              </label>

              <label>
                <span>Floor number</span>
                <div className="slots-input-wrap">
                  <Layers3 size={17} />
                  <input
                    value={formData.floorNo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        floorNo: e.target.value,
                      })
                    }
                    placeholder="e.g. Ground"
                    required
                  />
                </div>
              </label>

              <label>
                <span>Slot type</span>
                <div className="slots-input-wrap">
                  <CircleParking size={17} />
                  <select
                    value={formData.slot_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slot_type: e.target.value,
                      })
                    }
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="COMPACT">Compact</option>
                    <option value="LARGE">Large</option>
                    <option value="EV">EV</option>
                  </select>
                </div>
              </label>

              <label>
                <span>Slot status</span>
                <div className="slots-input-wrap">
                  <Activity size={17} />
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </label>

              <label className="slots-ev-checkbox">
                <input
                  type="checkbox"
                  checked={formData.is_ev_charging}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_ev_charging: e.target.checked,
                    })
                  }
                />
                <span className="slots-checkbox-visual">
                  <Zap size={18} />
                </span>
                <span className="slots-checkbox-copy">
                  <strong>EV charging enabled</strong>
                  <small>Mark this space as EV charging compatible.</small>
                </span>
              </label>
            </div>

            <div className="slots-form-actions">
              <button
                type="submit"
                className="slots-primary-btn"
                disabled={saving}
              >
                {saving ? (
                  <LoaderCircle size={17} className="slots-spin" />
                ) : (
                  <Save size={17} />
                )}
                {saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Save changes"
                  : "Create parking slot"}
              </button>

              <button
                type="button"
                className="slots-cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* SLOT INVENTORY */}
      <section className="slots-inventory">
        <div className="slots-inventory-heading">
          <div>
            <span className="slots-section-kicker">
              PARKING INVENTORY
            </span>
            <h2>All parking slots</h2>
            <p>Search, inspect, and update individual parking spaces.</p>
          </div>

          <div className="slots-inventory-total">
            <strong>{filteredSlots.length}</strong>
            <span>DISPLAYED</span>
          </div>
        </div>

        {/* FILTERS */}
        <div className="slots-filters">
          <div className="slots-search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search slot number or parking area..."
              aria-label="Search slots"
            />
          </div>

          <div className="slots-filter-select">
            <Activity size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter slots by status"
            >
              <option value="All">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="slots-table-wrapper">
          <table className="slots-table">
            <thead>
              <tr>
                <th>Parking slot</th>
                <th>Location</th>
                <th>Type / Floor</th>
                <th>EV charging</th>
                <th>Current status</th>
                <th>Update status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSlots.map((slot) => (
                <tr key={slot.slot_id}>
                  <td>
                    <div className="slots-table-slot">
                      <span className="slots-table-slot-icon">
                        <CircleParking size={17} />
                      </span>
                      <div>
                        <strong>{slot.slot_no}</strong>
                        <small>ID #{slot.slot_id}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="slots-table-location">
                      <MapPin size={14} />
                      {getAreaName(slot.area_id)}
                    </div>
                  </td>

                  <td>
                    <div className="slots-table-type">
                      <strong>{slot.slot_type}</strong>
                      <small>{slot.floorNo || "Ground"}</small>
                    </div>
                  </td>

                  <td>
                    {slot.is_ev_charging ? (
                      <span className="slots-ev-tag">
                        <Zap size={13} />
                        Enabled
                      </span>
                    ) : (
                      <span className="slots-no-ev">Standard</span>
                    )}
                  </td>

                  <td>
                    <span
                      className={`slot-status ${getStatusClass(
                        slot.status
                      )}`}
                    >
                      <span />
                      {slot.status.charAt(0) +
                        slot.status.slice(1).toLowerCase()}
                    </span>
                  </td>

                  <td>
                    <select
                      className="slots-status-select"
                      value={slot.status}
                      onChange={(e) =>
                        updateStatus(slot, e.target.value)
                      }
                      aria-label={`Change status for ${slot.slot_no}`}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </td>

                  <td>
                    <div className="slots-row-actions">
                      <button
                        className="slots-edit-action"
                        onClick={() => handleEdit(slot)}
                        aria-label={`Edit ${slot.slot_no}`}
                        title="Edit slot"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        className="slots-delete-action"
                        onClick={() => handleDelete(slot.slot_id)}
                        aria-label={`Delete ${slot.slot_no}`}
                        title="Delete slot"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSlots.length === 0 && (
            <div className="slots-empty">
              <Search size={27} />
              <h3>No parking slots found</h3>
              <p>
                Try changing your search or status filter.
              </p>
            </div>
          )}
        </div>

        <div className="slots-table-footer">
          <span>
            Showing {filteredSlots.length} of {slots.length} parking slots
          </span>
          <span>
            <Clock3 size={13} />
            Live database refresh: every 5 seconds
          </span>
        </div>
      </section>
    </div>
  );
}

export default ManageSlots;
