
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  LoaderCircle,
  MapPin,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import "./ManageBookings.css";

const API_URL = "http://127.0.0.1:8000";

function getDisplayStatus(status) {
  const statusMap = {
    BOOKED: "Confirmed",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  return statusMap[status] || status || "Unknown";
}

function formatDate(dateValue) {
  if (!dateValue) return "Not available";
  return new Date(dateValue).toLocaleDateString("en-CA");
}

function formatTime(start, end) {
  if (!start || !end) return "Not available";

  return `${new Date(start).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${new Date(end).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Entry and exit scanner
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState("entry");
  const [scanMessage, setScanMessage] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanning, setScanning] = useState(false);

  const scannerRef = useRef(null);
  const scanHandledRef = useRef(false);

  // =====================================================
  // FETCH BOOKINGS
  // =====================================================

  async function fetchBookings(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const token = localStorage.getItem("admin_access_token");

      if (!token) {
        throw new Error("Please log in as administrator.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [bookingResponse, areaResponse, slotResponse] =
        await Promise.all([
          fetch(`${API_URL}/admin/bookings`, { headers }),
          fetch(`${API_URL}/admin/areas`, { headers }),
          fetch(`${API_URL}/admin/slots`, { headers }),
        ]);

      const bookingData = await bookingResponse.json();
      const areaData = await areaResponse.json();
      const slotData = await slotResponse.json();

      if (!bookingResponse.ok) {
        throw new Error(
          bookingData.detail || "Unable to fetch bookings."
        );
      }

      if (!areaResponse.ok) {
        throw new Error(
          areaData.detail || "Unable to fetch parking areas."
        );
      }

      if (!slotResponse.ok) {
        throw new Error(
          slotData.detail || "Unable to fetch parking slots."
        );
      }

      const areas = Array.isArray(areaData) ? areaData : [];
      const slots = Array.isArray(slotData) ? slotData : [];
      const bookingList = Array.isArray(bookingData) ? bookingData : [];

      const areaMap = {};
      const slotMap = {};

      areas.forEach((area) => {
        areaMap[area.area_id] = area;
      });

      slots.forEach((slot) => {
        slotMap[slot.slot_id] = slot;
      });

      const bookingsWithDetails = await Promise.all(
        bookingList.map(async (booking) => {
          const slot = slotMap[booking.slot_id];
          const area = slot ? areaMap[slot.area_id] : null;

          let payment = null;

          try {
            const paymentResponse = await fetch(
              `${API_URL}/payments/booking/${booking.booking_id}`
            );

            if (paymentResponse.ok) {
              payment = await paymentResponse.json();
            }
          } catch (err) {
            console.error("Payment fetch error:", err);
          }

          return {
            id: booking.booking_id,
            userId: booking.user_id,
            user: booking.user_name || "Unknown User",
            email: booking.email || "Not available",
            parkingArea: area?.name || "Not available",
            slot: slot?.slot_no || booking.slot_no || booking.slot_id,
            date: formatDate(booking.start_time),
            time: formatTime(
              booking.start_time,
              booking.end_time
            ),
            amount: payment?.amount ?? "—",
            status: getDisplayStatus(booking.status),
            rawStatus: booking.status,
            paymentStatus:
              payment?.payment_status || "Not available",
          };
        })
      );

      setBookings(bookingsWithDetails);

      setSelectedBooking((previous) => {
        if (!previous) return null;

        return (
          bookingsWithDetails.find(
            (booking) => booking.id === previous.id
          ) || null
        );
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  // =====================================================
  // OPEN ENTRY OR EXIT SCANNER
  // =====================================================

  function openScanner(mode) {
    setScannerMode(mode);
    setScanMessage("");
    setScanSuccess(false);
    setScannerOpen(true);
  }

  // =====================================================
  // PROCESS SCANNED QR
  // =====================================================

  async function handleQrScan(decodedText) {
    if (scanHandledRef.current) return;

    scanHandledRef.current = true;
    setScanning(true);

    const isEntry = scannerMode === "entry";

    setScanMessage(
      isEntry
        ? "Verifying parking entry..."
        : "Processing vehicle exit..."
    );

    try {
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }

      const endpoint = isEntry
        ? `${API_URL}/qr/entry/${encodeURIComponent(decodedText)}`
        : `${API_URL}/qr/exit/${encodeURIComponent(decodedText)}`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            (isEntry
              ? "Entry verification failed."
              : "Exit verification failed.")
        );
      }

      setScanSuccess(true);

      setScanMessage(
        data.message ||
          (isEntry
            ? "Entry approved successfully. Exit QR has been generated automatically."
            : "Exit approved successfully. Booking is now completed.")
      );

      await fetchBookings(false);
    } catch (err) {
      setScanSuccess(false);
      setScanMessage(err.message || "QR verification failed.");
    } finally {
      setScanning(false);
      setScannerOpen(false);
      scanHandledRef.current = false;
    }
  }

  // =====================================================
  // START AND STOP CAMERA SCANNER
  // =====================================================

  useEffect(() => {
    if (!scannerOpen) return;

    scanHandledRef.current = false;

    const scanner = new Html5QrcodeScanner(
      "booking-qr-reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        handleQrScan(decodedText);
      },
      () => {}
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err) =>
            console.log("Scanner cleanup:", err)
          );

        scannerRef.current = null;
      }
    };
  }, [scannerOpen, scannerMode]);

  // =====================================================
  // SEARCH AND FILTER
  // =====================================================

  const filteredBookings = bookings.filter((booking) => {
    const query = search.toLowerCase();

    const matchesSearch =
      String(booking.id).toLowerCase().includes(query) ||
      booking.user.toLowerCase().includes(query) ||
      booking.email.toLowerCase().includes(query) ||
      booking.parkingArea.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" ||
      booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const confirmedCount = bookings.filter(
    (booking) => booking.rawStatus === "BOOKED"
  ).length;

  const pendingCount = bookings.filter(
    (booking) => booking.rawStatus === "PENDING"
  ).length;

  const completedCount = bookings.filter(
    (booking) => booking.rawStatus === "COMPLETED"
  ).length;

  const inProgressCount = bookings.filter(
    (booking) => booking.rawStatus === "IN_PROGRESS"
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.rawStatus === "CANCELLED"
  ).length;

  const getStatusClass = (status) =>
    status.toLowerCase().replace(/\s+/g, "-");

  // =====================================================
  // CANCEL BOOKING
  // =====================================================

  async function cancelBooking(booking) {
    if (
      booking.rawStatus === "COMPLETED" ||
      booking.rawStatus === "CANCELLED"
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel booking #${booking.id}?`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("admin_access_token");

      if (!token) {
        throw new Error("Please log in as administrator.");
      }

      const response = await fetch(
        `${API_URL}/admin/bookings/${booking.id}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to cancel booking."
        );
      }

      alert("Booking cancelled successfully!");
      await fetchBookings(false);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="manage-bookings bookings-loading">
        <div className="bookings-loading-icon">
          <LoaderCircle size={30} />
        </div>
        <h2>Loading reservations</h2>
        <p>
          Retrieving booking and customer information...
        </p>
      </div>
    );
  }

  return (
    <div className="manage-bookings">

      {/* HERO */}
      <section className="bookings-hero">
        <div className="bookings-hero-content">
          <div className="bookings-eyebrow">
            <span />
            RESERVATION CONTROL CENTRE
          </div>

          <h1>
            Manage every
            <span> reservation.</span>
          </h1>

          <p>
            Track customer bookings, monitor parking activity,
            and manage secure vehicle entries and exits from
            one central dashboard.
          </p>

          <div className="bookings-hero-actions">
            <button
              className="bookings-scan-btn"
              onClick={() => openScanner("entry")}
              disabled={scanning}
            >
              <QrCode size={17} />
              Scan Entry QR
            </button>

            <button
              className="bookings-scan-btn"
              onClick={() => openScanner("exit")}
              disabled={scanning}
            >
              <QrCode size={17} />
              Scan Exit QR
            </button>

            <button
              className="bookings-refresh-btn"
              onClick={() => fetchBookings(false)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "bookings-spin" : ""
                }
              />
              {refreshing ? "Refreshing..." : "Refresh data"}
            </button>
          </div>
        </div>

        <div className="bookings-hero-visual">
          <div className="bookings-hero-orbit orbit-one" />
          <div className="bookings-hero-orbit orbit-two" />

          <div className="bookings-hero-icon">
            <Ticket size={67} strokeWidth={1.3} />
          </div>

          <div className="bookings-hero-floating">
            <ShieldCheck size={15} />
            Secure reservations
          </div>

          <div className="bookings-hero-count">
            <strong>{bookings.length}</strong>
            <span>TOTAL RESERVATIONS</span>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="bookings-error">
          <div>
            <strong>Unable to complete the request</strong>
            <p>{error}</p>
          </div>

          <button onClick={() => fetchBookings(false)}>
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <section className="booking-summary">
        <article className="booking-summary-card">
          <div className="booking-summary-top">
            <span className="booking-summary-icon total">
              <CalendarDays size={20} />
            </span>
            <span className="booking-summary-label">
              TOTAL BOOKINGS
            </span>
          </div>
          <strong>{bookings.length}</strong>
          <p>All registered reservations</p>
          <div className="booking-summary-foot">
            <span>Reservation records</span>
            <ArrowUpRight size={15} />
          </div>
        </article>

        <article className="booking-summary-card">
          <div className="booking-summary-top">
            <span className="booking-summary-icon confirmed">
              <CheckCircle2 size={20} />
            </span>
            <span className="booking-summary-label">
              CONFIRMED
            </span>
          </div>
          <strong>{confirmedCount}</strong>
          <p>Confirmed parking bookings</p>
          <div className="booking-summary-foot">
            <span>Ready for parking</span>
            <ArrowUpRight size={15} />
          </div>
        </article>

        <article className="booking-summary-card">
          <div className="booking-summary-top">
            <span className="booking-summary-icon progress">
              <Activity size={20} />
            </span>
            <span className="booking-summary-label">
              IN PROGRESS
            </span>
          </div>
          <strong>{inProgressCount}</strong>
          <p>Vehicles currently parked</p>
          <div className="booking-summary-foot">
            <span>Active parking sessions</span>
            <ArrowUpRight size={15} />
          </div>
        </article>

        <article className="booking-summary-card">
          <div className="booking-summary-top">
            <span className="booking-summary-icon completed">
              <ShieldCheck size={20} />
            </span>
            <span className="booking-summary-label">
              COMPLETED
            </span>
          </div>
          <strong>{completedCount}</strong>
          <p>Successfully completed visits</p>
          <div className="booking-summary-foot">
            <span>Closed reservations</span>
            <ArrowUpRight size={15} />
          </div>
        </article>
      </section>

      {/* STATUS OVERVIEW */}
      <section className="bookings-status-overview">
        <div className="bookings-status-heading">
          <div>
            <span className="bookings-section-kicker">
              BOOKING ACTIVITY
            </span>
            <h3>Reservation status overview</h3>
          </div>

          <span className="bookings-status-total">
            {bookings.length} RECORDS
          </span>
        </div>

        <div className="bookings-status-grid">
          <div className="bookings-status-item">
            <span className="status-dot confirmed-dot" />
            <span>Confirmed</span>
            <strong>{confirmedCount}</strong>
          </div>

          <div className="bookings-status-item">
            <span className="status-dot progress-dot" />
            <span>In progress</span>
            <strong>{inProgressCount}</strong>
          </div>

          <div className="bookings-status-item">
            <span className="status-dot pending-dot" />
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="bookings-status-item">
            <span className="status-dot completed-dot" />
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>

          <div className="bookings-status-item">
            <span className="status-dot cancelled-dot" />
            <span>Cancelled</span>
            <strong>{cancelledCount}</strong>
          </div>
        </div>
      </section>

      {/* BOOKINGS INVENTORY */}
      <section className="bookings-inventory">
        <div className="bookings-inventory-heading">
          <div>
            <span className="bookings-section-kicker">
              CUSTOMER RESERVATIONS
            </span>
            <h2>All bookings</h2>
            <p>
              View customer information, payment status,
              and parking details.
            </p>
          </div>

          <div className="bookings-record-count">
            <strong>{filteredBookings.length}</strong>
            <span>DISPLAYED</span>
          </div>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="booking-controls">
          <div className="bookings-search-box">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search booking ID, customer, email, or parking area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search bookings"
            />
          </div>

          <div className="bookings-filter-select">
            <Activity size={16} />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              aria-label="Filter bookings by status"
            >
              <option value="All">All statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="bookings-table-wrapper">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Customer</th>
                <th>Parking details</th>
                <th>Schedule</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <div className="booking-id-cell">
                      <span className="booking-id-icon">
                        <Ticket size={16} />
                      </span>
                      <div>
                        <strong>#{booking.id}</strong>
                        <small>Reservation ID</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="booking-customer">
                      <strong>{booking.user}</strong>
                      <span>{booking.email}</span>
                    </div>
                  </td>

                  <td>
                    <div className="booking-parking">
                      <strong>{booking.parkingArea}</strong>
                      <span>
                        <MapPin size={12} />
                        Slot {booking.slot}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="booking-schedule">
                      <strong>{booking.date}</strong>
                      <span>
                        <Clock3 size={12} />
                        {booking.time}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className="booking-amount">
                      {booking.amount === "—"
                        ? "—"
                        : `₹${booking.amount}`}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`admin-booking-status ${getStatusClass(
                        booking.status
                      )}`}
                    >
                      <span />
                      {booking.status}
                    </span>
                  </td>

                  <td>
                    <div className="booking-actions">
                      <button
                        className="booking-view-btn"
                        onClick={() =>
                          setSelectedBooking(booking)
                        }
                        title="View booking"
                        aria-label={`View booking ${booking.id}`}
                      >
                        <Eye size={15} />
                      </button>

                      {booking.rawStatus !== "COMPLETED" &&
                        booking.rawStatus !== "CANCELLED" && (
                          <button
                            className="booking-cancel-btn"
                            onClick={() => cancelBooking(booking)}
                            title="Cancel booking"
                            aria-label={`Cancel booking ${booking.id}`}
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBookings.length === 0 && (
            <div className="bookings-empty">
              <Search size={28} />
              <h3>No bookings found</h3>
              <p>
                Try changing your search or selecting
                a different status.
              </p>
            </div>
          )}
        </div>

        <div className="bookings-table-footer">
          <span>
            Showing {filteredBookings.length} of {bookings.length} bookings
          </span>
          <span>
            <ShieldCheck size={13} />
            SmartPark booking records
          </span>
        </div>
      </section>

      {/* BOOKING DETAILS MODAL */}
      {selectedBooking && (
        <div
          className="booking-modal-overlay"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="booking-modal-header">
              <div className="booking-modal-title-icon">
                <Ticket size={21} />
              </div>

              <div className="booking-modal-title-copy">
                <span>RESERVATION INFORMATION</span>
                <h2 id="booking-modal-title">
                  Booking details
                </h2>
              </div>

              <button
                className="booking-modal-close"
                onClick={() => setSelectedBooking(null)}
                aria-label="Close booking details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="booking-modal-id">
              <span>BOOKING REFERENCE</span>
              <strong>#{selectedBooking.id}</strong>
              <span
                className={`admin-booking-status ${getStatusClass(
                  selectedBooking.status
                )}`}
              >
                <span />
                {selectedBooking.status}
              </span>
            </div>

            <div className="booking-detail-section">
              <h3>
                <UserRound size={16} />
                Customer information
              </h3>

              <div className="booking-detail-grid">
                <div>
                  <span>Customer name</span>
                  <strong>{selectedBooking.user}</strong>
                </div>

                <div>
                  <span>User ID</span>
                  <strong>{selectedBooking.userId}</strong>
                </div>

                <div className="booking-detail-full">
                  <span>Email address</span>
                  <strong>{selectedBooking.email}</strong>
                </div>
              </div>
            </div>

            <div className="booking-detail-section">
              <h3>
                <MapPin size={16} />
                Parking information
              </h3>

              <div className="booking-detail-grid">
                <div>
                  <span>Parking area</span>
                  <strong>{selectedBooking.parkingArea}</strong>
                </div>

                <div>
                  <span>Slot number</span>
                  <strong>{selectedBooking.slot}</strong>
                </div>

                <div>
                  <span>Booking date</span>
                  <strong>{selectedBooking.date}</strong>
                </div>

                <div>
                  <span>Reserved time</span>
                  <strong>{selectedBooking.time}</strong>
                </div>
              </div>
            </div>

            <div className="booking-detail-section">
              <h3>
                <CreditCard size={16} />
                Payment information
              </h3>

              <div className="booking-detail-grid">
                <div>
                  <span>Booking amount</span>
                  <strong>
                    {selectedBooking.amount === "—"
                      ? "—"
                      : `₹${selectedBooking.amount}`}
                  </strong>
                </div>

                <div>
                  <span>Payment status</span>
                  <strong>
                    {selectedBooking.paymentStatus}
                  </strong>
                </div>
              </div>
            </div>

            <button
              className="booking-modal-done"
              onClick={() => setSelectedBooking(null)}
            >
              Close details
            </button>
          </div>
        </div>
      )}

      {/* ENTRY / EXIT QR SCANNER MODAL */}
      {scannerOpen && (
        <div
          className="booking-modal-overlay"
          onClick={() => {
            if (!scanning) setScannerOpen(false);
          }}
        >
          <div
            className="booking-modal booking-scanner-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="booking-modal-header">
              <div className="booking-modal-title-icon">
                <QrCode size={21} />
              </div>

              <div className="booking-modal-title-copy">
                <span>
                  {scannerMode === "entry"
                    ? "PARKING ENTRY VERIFICATION"
                    : "PARKING EXIT VERIFICATION"}
                </span>
                <h2>
                  {scannerMode === "entry"
                    ? "Scan customer entry QR"
                    : "Scan customer exit QR"}
                </h2>
              </div>

              <button
                className="booking-modal-close"
                onClick={() => {
                  if (!scanning) setScannerOpen(false);
                }}
                disabled={scanning}
                aria-label="Close scanner"
              >
                <X size={19} />
              </button>
            </div>

            <div className="booking-scanner-instructions">
              <div className="booking-scanner-icon">
                <QrCode size={22} />
              </div>

              <div>
                <strong>
                  Position the QR code inside the frame
                </strong>
                <p>
                  {scannerMode === "entry"
                    ? "Scan the entry QR displayed in the customer's booking. The system will automatically generate the exit QR."
                    : "Scan the exit QR displayed by the customer to complete the booking and release the parking slot."}
                </p>
              </div>
            </div>

            <div
              id="booking-qr-reader"
              className="booking-scanner-reader"
            />

            {scanning && (
              <div className="booking-scanner-processing">
                <LoaderCircle
                  size={17}
                  className="bookings-spin"
                />
                Verifying QR code...
              </div>
            )}

            <button
              className="booking-modal-done"
              onClick={() => setScannerOpen(false)}
              disabled={scanning}
            >
              Close scanner
            </button>
          </div>
        </div>
      )}

      {/* QR SCAN RESULT MODAL */}
      {scanMessage && !scannerOpen && (
        <div
          className="booking-modal-overlay"
          onClick={() => setScanMessage("")}
        >
          <div
            className="booking-modal booking-result-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="booking-result-icon">
              {scanSuccess ? (
                <CheckCircle2 size={34} />
              ) : (
                <XCircle size={34} />
              )}
            </div>

            <span className="bookings-section-kicker">
              {scanSuccess
                ? "QR VERIFICATION SUCCESSFUL"
                : "QR VERIFICATION FAILED"}
            </span>

            <h2>
              {scanSuccess ? "Verification complete" : "Scan failed"}
            </h2>

            <p>{scanMessage}</p>

            <button
              className="booking-modal-done"
              onClick={() => setScanMessage("")}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageBookings;
