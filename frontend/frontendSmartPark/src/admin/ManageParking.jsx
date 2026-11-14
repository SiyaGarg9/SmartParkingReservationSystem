
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleParking,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
  Layers3,
  Search,
  LoaderCircle,
} from "lucide-react";
import "./ManageParking.css";

const API_URL = "https://smartparkingreservationsystem.onrender.com";

function ManageParking() {
  const [parkingAreas, setParkingAreas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    location: "",
  });

  const apiRequest = async (url, options = {}) => {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.detail || data.message || "Something went wrong."
      );
    }

    return data;
  };

  const fetchParkingData = async () => {
    try {
      setLoading(true);
      setError("");

      const [areas, slots] = await Promise.all([
        apiRequest("/parking/areas"),
        apiRequest("/parking/slots"),
      ]);

      const updatedAreas = areas.map((area) => {
        const areaSlots = slots.filter(
          (slot) => slot.area_id === area.area_id
        );

        const availableSlots = areaSlots.filter(
          (slot) => slot.status === "AVAILABLE"
        ).length;

        return {
          ...area,
          totalSlots: areaSlots.length,
          availableSlots,
        };
      });

      setParkingAreas(updatedAreas);
    } catch (err) {
      setError(err.message || "Unable to load parking areas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
    });

    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.location.trim()) {
      alert("Please enter the parking area name and location.");
      return;
    }

    try {
      setSubmitting(true);

      const areaData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
      };

      if (editingId !== null) {
        await apiRequest(`/parking/areas/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(areaData),
        });

        alert("Parking area updated successfully!");
      } else {
        await apiRequest("/parking/areas", {
          method: "POST",
          body: JSON.stringify(areaData),
        });

        alert("Parking area added successfully!");
      }

      resetForm();
      await fetchParkingData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (area) => {
    setEditingId(area.area_id);

    setFormData({
      name: area.name,
      location: area.location,
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (area) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${area.name}?`
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/parking/areas/${area.area_id}`, {
        method: "DELETE",
      });

      alert("Parking area deleted successfully!");
      await fetchParkingData();
    } catch (err) {
      alert(
        `Could not delete this parking area.\n${err.message}\n\nIt may contain parking slots or related bookings.`
      );
    }
  };

  const totalSlots = parkingAreas.reduce(
    (sum, area) => sum + area.totalSlots,
    0
  );

  const totalAvailable = parkingAreas.reduce(
    (sum, area) => sum + area.availableSlots,
    0
  );

  const occupiedSlots = totalSlots - totalAvailable;

  const filteredAreas = parkingAreas.filter((area) => {
    const search = searchTerm.toLowerCase();

    return (
      area.name?.toLowerCase().includes(search) ||
      area.location?.toLowerCase().includes(search) ||
      String(area.area_id).includes(search)
    );
  });

  if (loading) {
    return (
      <div className="manage-parking loading-parking">
        <div className="parking-loading-icon">
          <LoaderCircle size={30} />
        </div>
        <h2>Loading parking locations</h2>
        <p>Retrieving parking areas and slot information...</p>
      </div>
    );
  }

  return (
    <div className="manage-parking">
      <section className="manage-parking-hero">
        <div className="parking-hero-content">
          <div className="parking-eyebrow">
            <span className="parking-eyebrow-dot" />
            PARKING INFRASTRUCTURE
          </div>

          <h1>
            Manage your
            <span> parking network.</span>
          </h1>

          <p>
            Control parking locations, monitor slot capacity,
            and keep your SmartPark infrastructure organized.
          </p>

          <div className="parking-hero-actions">
            <button
              className="parking-primary-btn"
              onClick={() => {
                resetForm();
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Plus size={18} />
              Add parking area
            </button>

            <button
              className="parking-refresh-btn"
              onClick={fetchParkingData}
            >
              <RefreshCw size={16} />
              Refresh data
            </button>
          </div>
        </div>

        <div className="parking-hero-visual">
          <div className="parking-visual-orbit orbit-one" />
          <div className="parking-visual-orbit orbit-two" />
          <div className="parking-visual-core">
            <CircleParking size={76} strokeWidth={1.2} />
          </div>
          <div className="parking-visual-tag">
            <Activity size={14} />
            Infrastructure active
          </div>
          <div className="parking-visual-number">
            <strong>{parkingAreas.length}</strong>
            <span>ACTIVE LOCATIONS</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="parking-error-banner">
          <div>
            <strong>Unable to load parking data</strong>
            <p>{error}</p>
          </div>
          <button onClick={fetchParkingData}>
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      )}

      <section className="parking-overview-grid">
        <div className="parking-overview-card">
          <div className="parking-overview-top">
            <span className="parking-overview-icon teal">
              <Building2 size={20} />
            </span>
            <span className="parking-overview-label">LOCATIONS</span>
          </div>
          <strong>{parkingAreas.length}</strong>
          <p>Registered parking areas</p>
          <div className="parking-overview-bottom">
            <span>Infrastructure</span>
            <ArrowUpRight size={15} />
          </div>
        </div>

        <div className="parking-overview-card">
          <div className="parking-overview-top">
            <span className="parking-overview-icon blue">
              <Layers3 size={20} />
            </span>
            <span className="parking-overview-label">TOTAL CAPACITY</span>
          </div>
          <strong>{totalSlots}</strong>
          <p>Parking slots across all areas</p>
          <div className="parking-overview-bottom">
            <span>Network capacity</span>
            <ArrowUpRight size={15} />
          </div>
        </div>

        <div className="parking-overview-card">
          <div className="parking-overview-top">
            <span className="parking-overview-icon green">
              <CheckCircle2 size={20} />
            </span>
            <span className="parking-overview-label">AVAILABLE</span>
          </div>
          <strong>{totalAvailable}</strong>
          <p>Slots currently available</p>
          <div className="parking-overview-bottom">
            <span>Ready for booking</span>
            <ArrowUpRight size={15} />
          </div>
        </div>

        <div className="parking-overview-card">
          <div className="parking-overview-top">
            <span className="parking-overview-icon amber">
              <Activity size={20} />
            </span>
            <span className="parking-overview-label">OCCUPIED</span>
          </div>
          <strong>{occupiedSlots}</strong>
          <p>Slots currently occupied</p>
          <div className="parking-overview-bottom">
            <span>Live slot usage</span>
            <ArrowUpRight size={15} />
          </div>
        </div>
      </section>

      {showForm && (
        <section className="parking-form-section">
          <div className="parking-form-heading">
            <div className="parking-form-heading-icon">
              {editingId !== null ? (
                <Pencil size={21} />
              ) : (
                <Plus size={22} />
              )}
            </div>

            <div>
              <span className="parking-section-kicker">
                LOCATION CONFIGURATION
              </span>
              <h2>
                {editingId !== null
                  ? "Edit parking area"
                  : "Create a parking area"}
              </h2>
              <p>
                Enter the location details below to update your network.
              </p>
            </div>

            <button
              type="button"
              className="parking-close-form"
              onClick={resetForm}
              disabled={submitting}
              aria-label="Close form"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="parking-form-grid">
              <label>
                <span>Parking area name</span>
                <div className="parking-input-wrap">
                  <Building2 size={17} />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. City Center Parking"
                    required
                  />
                </div>
              </label>

              <label>
                <span>Location / address</span>
                <div className="parking-input-wrap">
                  <MapPin size={17} />
                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter the parking location"
                    required
                  />
                </div>
              </label>
            </div>

            <div className="parking-form-actions">
              <button
                type="submit"
                className="parking-primary-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <LoaderCircle size={17} className="parking-spin" />
                ) : (
                  <Save size={17} />
                )}
                {submitting
                  ? "Saving..."
                  : editingId !== null
                  ? "Save changes"
                  : "Create parking area"}
              </button>

              <button
                type="button"
                className="parking-secondary-btn"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="parking-locations-section">
        <div className="parking-locations-heading">
          <div>
            <span className="parking-section-kicker">
              YOUR INFRASTRUCTURE
            </span>
            <h2>Parking locations</h2>
            <p>Manage every registered location from one place.</p>
          </div>

          <div className="parking-location-tools">
            <div className="parking-search-box">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="parking-result-count">
              {filteredAreas.length} locations
            </span>
          </div>
        </div>

        {!error && (
          <div className="parking-area-grid">
            {filteredAreas.map((area, index) => {
              const availability = area.totalSlots
                ? Math.round(
                    (area.availableSlots / area.totalSlots) * 100
                  )
                : 0;

              return (
                <article
                  className="parking-area-card"
                  key={area.area_id}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <div className="parking-card-top">
                    <div className="parking-card-symbol">
                      <CircleParking size={25} />
                    </div>

                    <span className="parking-area-status">
                      <span />
                      Active
                    </span>
                  </div>

                  <div className="parking-card-id">
                    LOCATION  /  {String(area.area_id).padStart(2, "0")}
                  </div>

                  <h3>{area.name}</h3>

                  <p className="parking-location">
                    <MapPin size={15} />
                    {area.location}
                  </p>

                  <div className="parking-card-capacity">
                    <div className="parking-capacity-heading">
                      <span>Slot availability</span>
                      <strong>{availability}%</strong>
                    </div>
                    <div className="parking-capacity-track">
                      <div
                        className="parking-capacity-fill"
                        style={{ width: `${availability}%` }}
                      />
                    </div>
                  </div>

                  <div className="parking-slot-details">
                    <div>
                      <span>Total slots</span>
                      <strong>{area.totalSlots}</strong>
                    </div>
                    <div>
                      <span>Available</span>
                      <strong className="available-number">
                        {area.availableSlots}
                      </strong>
                    </div>
                  </div>

                  <div className="parking-card-actions">
                    <button
                      className="parking-edit-btn"
                      onClick={() => handleEdit(area)}
                    >
                      <Pencil size={15} />
                      Edit area
                    </button>

                    <button
                      className="parking-delete-btn"
                      onClick={() => handleDelete(area)}
                      aria-label={`Delete ${area.name}`}
                      title="Delete parking area"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {parkingAreas.length > 0 && filteredAreas.length === 0 && (
          <div className="parking-empty-state">
            <Search size={28} />
            <h3>No matching locations</h3>
            <p>Try another name, location, or area ID.</p>
          </div>
        )}

        {parkingAreas.length === 0 && !error && (
          <div className="parking-empty-state">
            <Building2 size={30} />
            <h3>No parking areas yet</h3>
            <p>Create your first parking area to get started.</p>
            <button
              className="parking-primary-btn"
              onClick={() => setShowForm(true)}
            >
              <Plus size={17} />
              Add first location
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default ManageParking;
