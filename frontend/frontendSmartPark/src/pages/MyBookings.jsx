
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarDays,
  Clock,
  MapPin,
  ParkingSquare,
  CreditCard,
  QrCode,
  Navigation,
  CheckCircle2,
  Star,
  CarFront,
  Zap,
  Layers,
  Hash,
  UserRound,
  RefreshCw,
  Search,
} from "lucide-react";
import "./MyBookings.css";

const API_URL = "http://127.0.0.1:8000";

function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [qrCodes, setQrCodes] = useState({});
  const [generatingQR, setGeneratingQR] = useState(null);
  const [qrError, setQrError] = useState("");

  const [exitQrCodes, setExitQrCodes] = useState({});
  const [exitQrLoading, setExitQrLoading] = useState(null);
  const [exitQrError, setExitQrError] = useState({});

  const [feedbackByBooking, setFeedbackByBooking] = useState({});
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [feedbackBusy, setFeedbackBusy] = useState(null);
  const [feedbackMessages, setFeedbackMessages] = useState({});

  // Booking ID search
  const [bookingSearch, setBookingSearch] = useState("");
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [searchRequest, setSearchRequest] = useState(0);

  const bookingCardRefs = useRef({});

  // Scroll to the searched booking
  useEffect(() => {
    if (!highlightedBookingId || !searchRequest) return;

    const card = bookingCardRefs.current[highlightedBookingId];

    if (card) {
      card.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    const highlightTimer = setTimeout(() => {
      setHighlightedBookingId(null);
    }, 3000);

    return () => clearTimeout(highlightTimer);
  }, [highlightedBookingId, searchRequest]);

  // Search booking by exact ID
  function handleBookingSearch(event) {
    event.preventDefault();

    const enteredId = bookingSearch.trim();

    if (!enteredId) {
      setSearchMessage("Please enter a Booking ID.");
      setHighlightedBookingId(null);
      return;
    }

    if (!/^\d+$/.test(enteredId)) {
      setSearchMessage("Please enter a valid numeric Booking ID.");
      setHighlightedBookingId(null);
      return;
    }

    const matchedBooking = bookings.find(
      (booking) => String(booking.booking_id) === enteredId
    );

    if (!matchedBooking) {
      setSearchMessage(`Booking #${enteredId} was not found.`);
      setHighlightedBookingId(null);
      return;
    }

    setSearchMessage(`Booking #${enteredId} found successfully.`);
    setHighlightedBookingId(Number(enteredId));
    setSearchRequest((previous) => previous + 1);
  }

  // Fetch all user bookings and their payment and parking details
  useEffect(() => {
    async function fetchBookings() {
      try {
        const token = localStorage.getItem("access_token");
        const userId = localStorage.getItem("user_id");

        if (!token || !userId) {
          setError("Please log in to view your bookings.");
          return;
        }

        const response = await fetch(
          `${API_URL}/bookings/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            typeof data.detail === "string"
              ? data.detail
              : "Unable to fetch bookings."
          );
        }

        const bookingList = Array.isArray(data) ? data : [];

        const areasResponse = await fetch(`${API_URL}/parking/areas`);
        let areas = [];

        if (areasResponse.ok) {
          const areasData = await areasResponse.json();
          areas = Array.isArray(areasData)
            ? areasData
            : areasData.areas || areasData.data || [];
        }

        const slotsByArea = await Promise.all(
          areas.map(async (parkingArea) => {
            const areaId = parkingArea.area_id ?? parkingArea.id;

            try {
              const slotsResponse = await fetch(
                `${API_URL}/parking/areas/${areaId}/slots`
              );

              if (!slotsResponse.ok) return [];

              const slotsData = await slotsResponse.json();

              const slots = Array.isArray(slotsData)
                ? slotsData
                : slotsData.slots || slotsData.data || [];

              return slots.map((slot) => ({
                ...slot,
                _area: parkingArea,
              }));
            } catch (err) {
              console.error("Slot fetch error:", err);
              return [];
            }
          })
        );

        const allSlots = slotsByArea.flat();

        const bookingsWithDetails = await Promise.all(
          bookingList.map(async (booking) => {
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

            const matchingSlot = allSlots.find(
              (item) => item.slot_id === booking.slot_id
            );

            return {
              ...booking,
              payment,
              slot: matchingSlot || null,
              area: matchingSlot?._area || null,
            };
          })
        );

        setBookings(bookingsWithDetails);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  // Fetch existing feedback
  useEffect(() => {
    async function fetchMyFeedback() {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) return;

        const response = await fetch(`${API_URL}/feedback/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();

        const feedbackList = Array.isArray(data)
          ? data
          : data.feedback || [];

        const feedbackMap = {};
        const drafts = {};

        feedbackList.forEach((item) => {
          feedbackMap[item.booking_id] = item;

          drafts[item.booking_id] = {
            rating: item.rating,
            comment: item.comment || "",
          };
        });

        setFeedbackByBooking(feedbackMap);
        setFeedbackDrafts(drafts);
      } catch (err) {
        console.error("Feedback fetch error:", err);
      }
    }

    fetchMyFeedback();
  }, []);

  // Generate or retrieve both Entry and Exit QR codes
  async function generateQR(bookingId) {
    try {
      setGeneratingQR(bookingId);
      setQrError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/qr/generate/${bookingId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to generate QR codes."
        );
      }

      if (!data.qr_token || !data.exit_qr_token) {
        throw new Error(
          "Entry or Exit QR token was not returned by the server. Please check the backend QR generation endpoint."
        );
      }

      // Save Entry QR
      setQrCodes((previous) => ({
        ...previous,
        [bookingId]: data.qr_token,
      }));

      // Save Exit QR
      setExitQrCodes((previous) => ({
        ...previous,
        [bookingId]: data.exit_qr_token,
      }));

      setExitQrError((previous) => ({
        ...previous,
        [bookingId]: "",
      }));
    } catch (err) {
      setQrError(err.message);
    } finally {
      setGeneratingQR(null);
    }
  }

  // Retrieve an already generated Exit QR
  async function fetchExitQR(bookingId) {
    try {
      setExitQrLoading(bookingId);

      setExitQrError((previous) => ({
        ...previous,
        [bookingId]: "",
      }));

      const response = await fetch(`${API_URL}/qr/${bookingId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to retrieve Exit QR."
        );
      }

      if (!data.exit_qr_token) {
        throw new Error(
          "Your Exit QR has not been generated yet. Please generate your Entry QR first."
        );
      }

      setExitQrCodes((previous) => ({
        ...previous,
        [bookingId]: data.exit_qr_token,
      }));
    } catch (err) {
      setExitQrError((previous) => ({
        ...previous,
        [bookingId]: err.message,
      }));
    } finally {
      setExitQrLoading(null);
    }
  }

  // Cancel booking
  async function cancelBooking(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/cancel`,
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
          typeof data.detail === "string"
            ? data.detail
            : "Unable to cancel booking."
        );
      }

      setBookings((previousBookings) =>
        previousBookings.map((booking) =>
          booking.booking_id === bookingId
            ? {
                ...booking,
                status: "CANCELLED",
                payment: booking.payment
                  ? {
                      ...booking.payment,
                      payment_status:
                        data.payment_status ||
                        (data.payment?.payment_status === "REFUNDED"
                          ? "REFUNDED"
                          : booking.payment.payment_status),
                    }
                  : booking.payment,
              }
            : booking
        )
      );

      setQrCodes((previous) => {
        const updated = { ...previous };
        delete updated[bookingId];
        return updated;
      });

      setExitQrCodes((previous) => {
        const updated = { ...previous };
        delete updated[bookingId];
        return updated;
      });

      alert("Booking cancelled successfully!");
    } catch (err) {
      alert(err.message);
    }
  }

  // Update feedback draft
  function updateFeedbackDraft(bookingId, field, value) {
    setFeedbackDrafts((previous) => ({
      ...previous,
      [bookingId]: {
        rating: previous[bookingId]?.rating || 5,
        comment: previous[bookingId]?.comment || "",
        [field]: value,
      },
    }));
  }

  // Submit or update feedback
  async function submitFeedback(bookingId) {
    try {
      const token = localStorage.getItem("user_access_token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const existingFeedback = feedbackByBooking[bookingId];

      const draft = feedbackDrafts[bookingId] || {
        rating: 5,
        comment: "",
      };

      setFeedbackBusy(bookingId);

      setFeedbackMessages((previous) => ({
        ...previous,
        [bookingId]: "",
      }));

      const url = existingFeedback
        ? `${API_URL}/feedback/${existingFeedback.feedback_id}`
        : `${API_URL}/feedback/?booking_id=${bookingId}`;

      const response = await fetch(url, {
        method: existingFeedback ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: draft.rating,
          comment: draft.comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to submit feedback."
        );
      }

      const savedFeedback = data.feedback || data;

      setFeedbackByBooking((previous) => ({
        ...previous,
        [bookingId]: savedFeedback,
      }));

      setFeedbackDrafts((previous) => ({
        ...previous,
        [bookingId]: {
          rating: savedFeedback.rating ?? draft.rating,
          comment: savedFeedback.comment ?? draft.comment,
        },
      }));

      setFeedbackMessages((previous) => ({
        ...previous,
        [bookingId]: "Feedback saved successfully!",
      }));
    } catch (err) {
      setFeedbackMessages((previous) => ({
        ...previous,
        [bookingId]: err.message,
      }));
    } finally {
      setFeedbackBusy(null);
    }
  }

  // Delete feedback
  async function deleteFeedback(bookingId) {
    const existingFeedback = feedbackByBooking[bookingId];

    if (!existingFeedback) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this feedback?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("access_token");

      setFeedbackBusy(bookingId);

      const response = await fetch(
        `${API_URL}/feedback/${existingFeedback.feedback_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to delete feedback."
        );
      }

      setFeedbackByBooking((previous) => {
        const updated = { ...previous };
        delete updated[bookingId];
        return updated;
      });

      setFeedbackDrafts((previous) => ({
        ...previous,
        [bookingId]: {
          rating: 5,
          comment: "",
        },
      }));

      setFeedbackMessages((previous) => ({
        ...previous,
        [bookingId]: "Feedback deleted successfully.",
      }));
    } catch (err) {
      setFeedbackMessages((previous) => ({
        ...previous,
        [bookingId]: err.message,
      }));
    } finally {
      setFeedbackBusy(null);
    }
  }

  const upcomingBookings = bookings.filter(
    (booking) =>
      booking.status !== "CANCELLED" &&
      new Date(booking.start_time) >= new Date()
  );

  const pastBookings = bookings.filter(
    (booking) =>
      booking.status === "CANCELLED" ||
      new Date(booking.start_time) < new Date()
  );

  // Date formatting
  function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString();
  }

  // Individual booking card
  function renderBooking(booking) {
    const payment = booking.payment;
    const slot = booking.slot;
    const area = booking.area;

    const bookingId = booking.booking_id;
    const qrToken = qrCodes[bookingId];
    const exitQrToken = exitQrCodes[bookingId];

    const canGenerateQR =
      booking.status === "BOOKED" &&
      payment?.payment_status === "SUCCESS";

    const canGiveFeedback =
      booking.status === "IN_PROGRESS" ||
      booking.status === "COMPLETED";

    const feedbackDraft = feedbackDrafts[bookingId] || {
      rating: 5,
      comment: "",
    };

    const existingFeedback = feedbackByBooking[bookingId];

    const statusClass =
      booking.status === "CANCELLED"
        ? "status-cancelled"
        : "status-confirmed";

    const isHighlighted =
      Number(highlightedBookingId) === Number(bookingId);

    return (
      <article
        className={`booking-card ${
          isHighlighted ? "booking-card-highlighted" : ""
        }`}
        key={bookingId}
        id={`booking-${bookingId}`}
        ref={(element) => {
          if (element) {
            bookingCardRefs.current[bookingId] = element;
          } else {
            delete bookingCardRefs.current[bookingId];
          }
        }}
        style={{
          scrollMarginTop: "110px",
          outline: isHighlighted ? "3px solid #16a085" : "none",
          boxShadow: isHighlighted
            ? "0 0 0 5px rgba(22, 160, 133, 0.15)"
            : undefined,
          transition: "outline 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        {/* Card heading */}
        <div className="booking-card-top">
          <div className="booking-icon">
            <ParkingSquare size={27} />
          </div>

          <div className="booking-title">
            <h3>Parking Reservation</h3>
            <p>
              Parking Slot: {slot?.slot_no || booking.slot_id}
            </p>
          </div>

          <span className={`booking-status ${statusClass}`}>
            {booking.status}
          </span>
        </div>

        {/* Booking information */}
        <div className="booking-details">
          <div>
            <span className="detail-label">
              <MapPin size={13} /> Parking Area
            </span>
            <strong>{area?.name || "Not available"}</strong>
          </div>

          <div>
            <span className="detail-label">
              <MapPin size={13} /> Location
            </span>
            <strong>{area?.location || "Not available"}</strong>
          </div>

          <div>
            <span className="detail-label">
              <ParkingSquare size={13} /> Slot Number
            </span>
            <strong>{slot?.slot_no || booking.slot_id}</strong>
          </div>

          <div>
            <span className="detail-label">
              <Layers size={13} /> Floor
            </span>
            <strong>
              {slot?.floorNo || slot?.floorno || "Not available"}
            </strong>
          </div>

          <div>
            <span className="detail-label">
              <CarFront size={13} /> Slot Type
            </span>
            <strong>{slot?.slot_type || "Not available"}</strong>
          </div>

          <div>
            <span className="detail-label">
              <Zap size={13} /> EV Charging
            </span>
            <strong>
              {slot
                ? slot.is_ev_charging
                  ? "Available"
                  : "Not available"
                : "Not available"}
            </strong>
          </div>

          <div>
            <span className="detail-label">
              <CalendarDays size={13} /> Arrival
            </span>
            <strong>{formatDate(booking.start_time)}</strong>
          </div>

          <div>
            <span className="detail-label">
              <Clock size={13} /> Departure
            </span>
            <strong>{formatDate(booking.end_time)}</strong>
          </div>

          <div>
            <span className="detail-label">
              <UserRound size={13} /> User ID
            </span>
            <strong>{booking.user_id}</strong>
          </div>

          <div>
            <span className="detail-label">
              <Hash size={13} /> Booking ID
            </span>
            <strong>{bookingId}</strong>
          </div>
        </div>

        {/* Payment details */}
        <div className="booking-payment-panel">
          <h3>
            <CreditCard size={18} /> Payment Details
          </h3>

          {payment ? (
            <div className="payment-information">
              <p>
                <strong>Payment Status:</strong>{" "}
                {payment.payment_status}
              </p>

              <p>
                <strong>Amount Paid:</strong> ₹{payment.amount}
              </p>

              <p>
                <strong>Payment Method:</strong>{" "}
                {payment.payment_method}
              </p>

              <p>
                <strong>Transaction ID:</strong>{" "}
                {payment.transaction_id || "Not available"}
              </p>

              <p>
                <strong>Payment Date:</strong>{" "}
                {formatDate(payment.payment_time)}
              </p>
            </div>
          ) : (
            <p className="payment-not-paid">Payment not found.</p>
          )}
        </div>

        {/* Entry QR */}
        {canGenerateQR && (
          <div className="booking-qr-panel">
            <h3>
              <QrCode size={19} /> Parking Entry QR Code
            </h3>

            <p>
              Show this QR code at the parking entrance for
              booking verification.
            </p>

            {!qrToken ? (
              <button
                className="find-more-btn"
                onClick={() => generateQR(bookingId)}
                disabled={generatingQR === bookingId}
              >
                {generatingQR === bookingId
                  ? "Generating QR Codes..."
                  : "View Entry and Exit QR Codes"}
              </button>
            ) : (
              <>
                <div className="booking-qr-image">
                  <QRCodeSVG
                    value={qrToken}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>

                <p>
                  <strong>Booking ID:</strong> {bookingId}
                </p>

                <p className="qr-instruction">
                  Show this Entry QR to the administrator when you arrive.
                </p>

                <button
                  className="find-more-btn"
                  onClick={() => window.print()}
                >
                  Print Entry QR
                </button>
              </>
            )}

            {qrError && (
              <p className="booking-error-message">{qrError}</p>
            )}
          </div>
        )}

        {/* Exit QR available before arrival */}
        {booking.status === "BOOKED" && qrToken && exitQrToken && (
          <div className="booking-qr-panel exit-qr-panel">
            <h3>
              <QrCode size={19} /> Parking Exit QR Code
            </h3>

            <p>
              Your Exit QR has already been generated. Keep it ready
              and show it to the administrator when leaving the parking area.
            </p>

            <div className="booking-qr-image">
              <QRCodeSVG
                value={exitQrToken}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <p>
              <strong>Booking ID:</strong> {bookingId}
            </p>

            <p className="qr-instruction">
              This is your pre-generated Exit QR. You can use it after
              your Entry QR has been scanned.
            </p>

            <button
              className="find-more-btn"
              onClick={() => window.print()}
            >
              Print Exit QR
            </button>
          </div>
        )}

        {/* Entry approved and Exit QR */}
        {booking.status === "IN_PROGRESS" && (
          <div className="booking-qr-panel exit-qr-panel">
            <h3>
              <CheckCircle2 size={20} /> Parking Entry Approved
            </h3>

            <p>Your vehicle entry has been recorded successfully.</p>

            <h3>
              <QrCode size={19} /> Parking Exit QR Code
            </h3>

            <p>
              Show this QR code to the administrator when leaving
              the parking area.
            </p>

            {!exitQrCodes[bookingId] ? (
              <button
                className="find-more-btn"
                onClick={() => fetchExitQR(bookingId)}
                disabled={exitQrLoading === bookingId}
              >
                {exitQrLoading === bookingId
                  ? "Loading Exit QR..."
                  : "View Exit QR"}
              </button>
            ) : (
              <>
                <div className="booking-qr-image">
                  <QRCodeSVG
                    value={exitQrCodes[bookingId]}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>

                <p>
                  <strong>Booking ID:</strong> {bookingId}
                </p>

                <p className="qr-instruction">
                  Keep this QR code ready when leaving.
                </p>

                <button
                  className="find-more-btn"
                  onClick={() => window.print()}
                >
                  Print Exit QR
                </button>
              </>
            )}

            {exitQrError[bookingId] && (
              <p className="booking-error-message">
                {exitQrError[bookingId]}
              </p>
            )}
          </div>
        )}

        {/* Feedback */}
        {canGiveFeedback && (
          <div className="booking-feedback-panel">
            <h3>
              <Star size={19} /> Rate Your Parking Experience
            </h3>

            {existingFeedback && (
              <p className="feedback-existing">
                You have already submitted feedback. You can update it below.
              </p>
            )}

            <p>Your Rating:</p>

            <div className="feedback-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    updateFeedbackDraft(bookingId, "rating", star)
                  }
                  aria-label={`Rate ${star} out of 5`}
                  style={{
                    color:
                      star <= feedbackDraft.rating
                        ? "#f5bd4f"
                        : "#718096",
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              placeholder="Share your parking experience..."
              value={feedbackDraft.comment}
              onChange={(e) =>
                updateFeedbackDraft(
                  bookingId,
                  "comment",
                  e.target.value
                )
              }
              maxLength={1000}
              rows={3}
            />

            <div className="feedback-actions">
              <button
                className="find-more-btn"
                onClick={() => submitFeedback(bookingId)}
                disabled={feedbackBusy === bookingId}
              >
                {feedbackBusy === bookingId
                  ? "Saving..."
                  : existingFeedback
                    ? "Update Feedback"
                    : "Submit Feedback"}
              </button>

              {existingFeedback && (
                <button
                  className="cancel-booking-btn"
                  onClick={() => deleteFeedback(bookingId)}
                  disabled={feedbackBusy === bookingId}
                >
                  Delete Feedback
                </button>
              )}
            </div>

            {feedbackMessages[bookingId] && (
              <p className="feedback-message">
                {feedbackMessages[bookingId]}
              </p>
            )}
          </div>
        )}

        {/* Indoor navigation */}
        {(booking.status === "BOOKED" ||
          booking.status === "IN_PROGRESS") && (
          <div className="booking-card-bottom">
            <button
              className="find-more-btn"
              onClick={() => navigate(`/navigation/${bookingId}`)}
            >
              <Navigation size={16} />
              Navigate to Slot
            </button>
          </div>
        )}

        {/* Cancel booking */}
        {booking.status !== "CANCELLED" &&
          booking.status !== "IN_PROGRESS" && (
            <div className="booking-card-bottom">
              <button
                className="cancel-booking-btn"
                onClick={() => cancelBooking(bookingId)}
              >
                Cancel Booking
              </button>
            </div>
          )}
      </article>
    );
  }

  return (
    <div className="my-bookings-page">
      {/* Hero */}
      <section className="bookings-hero">
        <span className="bookings-eyebrow">
          YOUR PARKING, ORGANIZED
        </span>

        <h1>My Bookings</h1>

        <p>
          Every reservation, payment and parking detail in one
          convenient place. Manage your SmartPark experience with ease.
        </p>
      </section>

      {/* Main content */}
      <section className="bookings-content">
        {loading ? (
          <p>
            <RefreshCw size={17} /> Loading your bookings...
          </p>
        ) : error ? (
          <p className="booking-error-message">{error}</p>
        ) : (
          <>
            {/* Summary cards */}
            <div className="bookings-summary">
              <div className="summary-card">
                <span>Total Bookings</span>
                <strong>{bookings.length}</strong>
              </div>

              <div className="summary-card">
                <span>Upcoming Bookings</span>
                <strong>{upcomingBookings.length}</strong>
              </div>

              <div className="summary-card">
                <span>Past / Cancelled</span>
                <strong>{pastBookings.length}</strong>
              </div>
            </div>

            {/* Heading */}
            <div className="bookings-section-heading">
              <div>
                <h2>Your Reservations</h2>
                <p>
                  View your booking information and manage your parking plans.
                </p>
              </div>

              <button
                className="find-more-btn"
                onClick={() => navigate("/search")}
              >
                <ParkingSquare size={17} />
                Find Parking
              </button>
            </div>

            {/* BOOKING ID SEARCH */}
            {bookings.length > 0 && (
              <div
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  margin: "25px 0 30px",
                  padding: "22px 24px",
                  background: "linear-gradient(135deg, #102a36, #0b202b)",
                  border: "1px solid #244653",
                  borderRadius: "15px",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.18)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "9px",
                      background: "rgba(32,185,173,0.13)",
                      color: "#36c9ba",
                    }}
                  >
                    <Search size={19} />
                  </div>

                  <div>
                    <h3
                      style={{
                        margin: 0,
                        color: "#f1f7fa",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                    >
                      Find a Reservation
                    </h3>

                    <p
                      style={{
                        margin: "3px 0 0",
                        color: "#91aab7",
                        fontSize: "12px",
                      }}
                    >
                      Quickly locate a booking using its unique ID.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleBookingSearch}
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    gap: "12px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: "49px",
                      display: "flex",
                      alignItems: "center",
                      gap: "11px",
                      padding: "0 15px",
                      boxSizing: "border-box",
                      background: "#091b25",
                      border: "1px solid #31515e",
                      borderRadius: "9px",
                    }}
                  >
                    <Search
                      size={19}
                      color="#35c7b8"
                      style={{ flexShrink: 0 }}
                    />

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter Booking ID (e.g. 18)"
                      value={bookingSearch}
                      onChange={(e) => {
                        setBookingSearch(e.target.value);
                        setSearchMessage("");
                      }}
                      aria-label="Search by Booking ID"
                      style={{
                        width: "100%",
                        minWidth: 0,
                        height: "100%",
                        padding: 0,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        color: "#f1f7fa",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        boxShadow: "none",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      minWidth: "165px",
                      height: "49px",
                      padding: "0 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "9px",
                      background: "linear-gradient(135deg, #20b9ad, #159c9b)",
                      border: "1px solid #28c6b7",
                      borderRadius: "9px",
                      color: "#06252c",
                      fontSize: "14px",
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      boxShadow: "0 5px 14px rgba(22,185,173,0.13)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Search size={17} />
                    Search Booking
                  </button>
                </form>

                {searchMessage && (
                  <p
                    role="status"
                    style={{
                      margin: "12px 0 0",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: searchMessage.includes("found successfully")
                        ? "#42d9ae"
                        : "#ff8585",
                    }}
                  >
                    {searchMessage}
                  </p>
                )}

                <p
                  style={{
                    margin: "12px 0 0",
                    color: "#91aab7",
                    fontSize: "12px",
                  }}
                >
                  Enter your Booking ID and we'll take you directly to that reservation.
                </p>
              </div>
            )}

            {/* Empty state */}
            {bookings.length === 0 ? (
              <div className="empty-bookings">
                <div className="empty-bookings-icon">
                  <ParkingSquare size={35} />
                </div>

                <h3>No Bookings Yet</h3>

                <p>
                  You haven't made any parking reservations yet.
                  Explore available parking spaces and book your
                  preferred slot.
                </p>

                <button
                  className="find-more-btn"
                  onClick={() => navigate("/search")}
                >
                  Explore Parking
                </button>
              </div>
            ) : (
              <>
                {/* Upcoming */}
                {upcomingBookings.length > 0 && (
                  <div className="booking-group">
                    <h3>Upcoming Bookings</h3>

                    {upcomingBookings.map(renderBooking)}
                  </div>
                )}

                {/* Past */}
                {pastBookings.length > 0 && (
                  <div className="booking-group">
                    <h3>Past and Cancelled Bookings</h3>

                    {pastBookings.map(renderBooking)}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default MyBookings;
