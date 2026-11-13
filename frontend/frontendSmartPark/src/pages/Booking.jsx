
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  CarFront,
  Zap,
  ParkingSquare,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  LoaderCircle,
  Timer,
} from "lucide-react";
import "./Booking.css";

const API_URL = "http://127.0.0.1:8000";
const RATE_PER_HOUR = 100;
const EV_SURCHARGE_PER_HOUR = 18;

function formatLocalDateTime(dateValue) {
  return `${dateValue.getFullYear()}-${String(
    dateValue.getMonth() + 1
  ).padStart(2, "0")}-${String(
    dateValue.getDate()
  ).padStart(2, "0")}T${String(
    dateValue.getHours()
  ).padStart(2, "0")}:${String(
    dateValue.getMinutes()
  ).padStart(2, "0")}:00`;
}

function getLocalDate() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Booking() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const parking = routeLocation.state;

  const [date, setDate] = useState(parking?.date || "");
  const [time, setTime] = useState(parking?.time || "");
  const [duration, setDuration] = useState("1");
  const [vehicle, setVehicle] = useState(parking?.vehicle || "Car");

  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedSlot = slots.find(
    (slot) => String(slot.slot_id) === String(slotId)
  );

  const isEVSlot = selectedSlot?.is_ev_charging === true;

  const parkingAmount = RATE_PER_HOUR * Number(duration);

  const evSurcharge = isEVSlot
    ? EV_SURCHARGE_PER_HOUR * Number(duration)
    : 0;

  const totalAmount = parkingAmount + evSurcharge;

  useEffect(() => {
    if (!parking?.parkingId) return;

    setSlotId("");
    setSlots([]);

    if (!date || !time || !duration) {
      setLoadingSlots(false);
      return;
    }

    const startDateTime = new Date(`${date}T${time}:00`);
    const hours = Number(duration);

    if (
      Number.isNaN(startDateTime.getTime()) ||
      !Number.isFinite(hours) ||
      hours < 1
    ) {
      setLoadingSlots(false);
      return;
    }

    const endDateTime = new Date(
      startDateTime.getTime() + hours * 60 * 60 * 1000
    );

    const params = new URLSearchParams({
      start_time: formatLocalDateTime(startDateTime),
      end_time: formatLocalDateTime(endDateTime),
    });

    const controller = new AbortController();

    async function fetchSlots() {
      try {
        setLoadingSlots(true);
        setMessage("");

        const response = await fetch(
          `${API_URL}/parking/areas/${parking.parkingId}/slots?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to fetch available parking slots.");
        }

        const data = await response.json();

        setSlots(
          data.filter((slot) => slot.status === "AVAILABLE")
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setMessage(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSlots(false);
        }
      }
    }

    fetchSlots();

    return () => controller.abort();
  }, [parking?.parkingId, date, time, duration]);

  if (!parking) {
    return (
      <div className="booking-missing">
        <ParkingSquare size={42} />
        <h2>Choose a parking area first</h2>
        <p>Please select a parking area before proceeding.</p>
        <button onClick={() => navigate("/search")}>
          Find Parking
        </button>
      </div>
    );
  }

  async function handleBooking(event) {
    event.preventDefault();
    setMessage("");

    if (!date || !time || !slotId) {
      setMessage("Please select your date, time and parking slot.");
      return;
    }

    const startDateTime = new Date(`${date}T${time}:00`);
    const hours = Number(duration);

    const currentLocalDateTime = formatLocalDateTime(new Date());
    const selectedLocalDateTime = `${date}T${time}:00`;

    if (
      Number.isNaN(startDateTime.getTime()) ||
      selectedLocalDateTime <= currentLocalDateTime
    ) {
      setMessage("Please select a future arrival date and time.");
      return;
    }

    if (!Number.isFinite(hours) || hours < 1) {
      setMessage("Please select a valid parking duration.");
      return;
    }

    const token = localStorage.getItem("user_access_token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      setMessage("Please log in before making a booking.");
      return;
    }

    const endDateTime = new Date(
      startDateTime.getTime() + hours * 60 * 60 * 1000
    );

    try {
      setBookingLoading(true);

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: Number(userId),
          slot_id: Number(slotId),
          start_time: formatLocalDateTime(startDateTime),
          end_time: formatLocalDateTime(endDateTime),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Booking failed. Please try again."
        );
      }

      const newBookingId = data.booking_id ?? data.id;

      if (!newBookingId) {
        setMessage(
          "Booking was created, but the Booking ID was not returned. Please check My Bookings before trying again."
        );
        return;
      }

      navigate("/payment", {
        state: {
          bookingId: newBookingId,
          amount: totalAmount,
          parkingAmount,
          evSurcharge,
          isEVSlot,
          parkingName: parking.parkingName,
          location: parking.location,
          date,
          time,
          duration: hours,
          slotId,
          vehicle,
        },
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div className="booking-page">
      <div className="booking-background"></div>

      <div className="booking-content">
        <button
          className="booking-back"
          type="button"
          onClick={() => navigate("/search")}
        >
          <ArrowLeft size={17} />
          Back to parking
        </button>

        <div className="booking-heading">
          <div className="booking-eyebrow">
            <span></span>
            SMARTPARK RESERVATIONS
          </div>

          <h1>
            Reserve your
            <span> parking space.</span>
          </h1>

          <p>
            A few simple details, and your parking spot is ready when you are.
          </p>
        </div>

        <div className="booking-layout">
          <main className="booking-form-card">
            <div className="booking-card-heading">
              <div>
                <span className="booking-step">STEP 01 / RESERVATION</span>
                <h2>Booking details</h2>
                <p>Choose when and where you want to park.</p>
              </div>
              <div className="booking-heading-icon">
                <ParkingSquare size={25} />
              </div>
            </div>

            <div className="selected-parking">
              <div className="selected-parking-icon">
                <MapPin size={23} />
              </div>

              <div className="selected-parking-info">
                <span>YOUR SELECTED LOCATION</span>
                <h3>{parking.parkingName}</h3>
                <p>{parking.location}</p>
              </div>

              <div className="location-rate">
                <strong>₹{RATE_PER_HOUR}</strong>
                <span>per hour</span>
              </div>
            </div>

            <form onSubmit={handleBooking}>
              <div className="booking-section-title">
                <CalendarDays size={19} />
                <h3>Arrival information</h3>
              </div>

              <div className="booking-input-grid">
                <label className="booking-field">
                  <span>Arrival date</span>
                  <div className="booking-input-wrap">
                    <CalendarDays size={18} />
                    <input
                      type="date"
                      min={getLocalDate()}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      required
                    />
                  </div>
                </label>

                <label className="booking-field">
                  <span>Arrival time</span>
                  <div className="booking-input-wrap">
                    <Clock3 size={18} />
                    <input
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      required
                    />
                  </div>
                </label>
              </div>

              <div className="booking-section-title booking-duration-title">
                <Timer size={19} />
                <h3>Parking duration</h3>
              </div>

              <div className="duration-options">
                {["1", "2", "3", "4", "6", "8"].map((hours) => (
                  <button
                    type="button"
                    key={hours}
                    className={`duration-option ${
                      duration === hours ? "active" : ""
                    }`}
                    onClick={() => setDuration(hours)}
                  >
                    <strong>{hours}</strong>
                    <span>{hours === "1" ? "Hour" : "Hours"}</span>
                  </button>
                ))}
              </div>

              <div className="booking-section-title slot-section-title">
                <ParkingSquare size={19} />
                <h3>Choose your parking slot</h3>
                {slots.length > 0 && !loadingSlots && (
                  <span className="available-count">
                    {slots.length} available
                  </span>
                )}
              </div>

              <div className="slot-selection-area">
                {!date || !time ? (
                  <div className="slot-placeholder">
                    <CalendarDays size={25} />
                    <strong>Select your arrival details</strong>
                    <span>Available parking slots will appear here.</span>
                  </div>
                ) : loadingSlots ? (
                  <div className="slot-placeholder">
                    <LoaderCircle className="booking-spinner" size={27} />
                    <strong>Checking availability</strong>
                    <span>Finding the best available spaces for you.</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="slot-placeholder">
                    <ParkingSquare size={27} />
                    <strong>No slots available</strong>
                    <span>Try another date, time or duration.</span>
                  </div>
                ) : (
                  <div className="parking-slot-grid">
                    {slots.map((slot) => (
                      <button
                        type="button"
                        key={slot.slot_id}
                        className={`parking-slot ${
                          String(slotId) === String(slot.slot_id)
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => setSlotId(String(slot.slot_id))}
                      >
                        <span className="slot-number">{slot.slot_no}</span>

                        {slot.is_ev_charging ? (
                          <span className="slot-ev">
                            <Zap size={12} /> EV
                          </span>
                        ) : (
                          <span className="slot-standard">STANDARD</span>
                        )}

                        {String(slotId) === String(slot.slot_id) && (
                          <CheckCircle2
                            className="slot-selected-icon"
                            size={17}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="booking-section-title vehicle-section-title">
                <CarFront size={19} />
                <h3>Vehicle information</h3>
              </div>

              <div className="vehicle-options">
                {[
                  { name: "Car", description: "Standard vehicle" },
                  { name: "Bike", description: "Two wheeler" },
                  { name: "EV", description: "Electric vehicle" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    className={`vehicle-option ${
                      vehicle === item.name ? "active" : ""
                    }`}
                    onClick={() => setVehicle(item.name)}
                  >
                    <CarFront size={20} />
                    <span>
                      <strong>
                        {item.name === "EV" ? "Electric" : item.name}
                      </strong>
                      <small>{item.description}</small>
                    </span>
                    {vehicle === item.name && (
                      <CheckCircle2 size={17} />
                    )}
                  </button>
                ))}
              </div>

              {message && (
                <div className="booking-error" role="alert">
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="booking-submit"
                disabled={
                  bookingLoading ||
                  loadingSlots ||
                  !slotId ||
                  slots.length === 0
                }
              >
                {bookingLoading ? (
                  <>
                    <LoaderCircle className="booking-spinner" size={19} />
                    Processing reservation...
                  </>
                ) : (
                  <>
                    Continue to payment
                    <ArrowLeft className="booking-submit-arrow" size={19} />
                  </>
                )}
              </button>

              <div className="booking-secure-note">
                <ShieldCheck size={17} />
                Secure reservation process
              </div>
            </form>
          </main>

          <aside className="booking-summary">
            <div className="summary-top">
              <span>YOUR RESERVATION</span>
              <div className="summary-icon">
                <CreditCard size={23} />
              </div>
              <h2>Booking summary</h2>
              <p>Review your details before continuing.</p>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-detail">
              <span>Parking location</span>
              <strong>{parking.parkingName}</strong>
            </div>

            <div className="summary-detail">
              <span>Arrival date</span>
              <strong>{date || "Not selected"}</strong>
            </div>

            <div className="summary-detail">
              <span>Arrival time</span>
              <strong>{time || "Not selected"}</strong>
            </div>

            <div className="summary-detail">
              <span>Duration</span>
              <strong>{duration} hour(s)</strong>
            </div>

            <div className="summary-detail">
              <span>Selected slot</span>
              <strong>{selectedSlot?.slot_no || "Not selected"}</strong>
            </div>

            <div className="summary-detail">
              <span>Vehicle</span>
              <strong>{vehicle === "EV" ? "Electric vehicle" : vehicle}</strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-price-row">
              <span>Parking fee</span>
              <strong>₹{parkingAmount}</strong>
            </div>

            {isEVSlot && (
              <div className="summary-price-row">
                <span>EV charging surcharge</span>
                <strong>₹{evSurcharge}</strong>
              </div>
            )}

            <div className="summary-total">
              <span>Estimated total</span>
              <strong>₹{totalAmount}</strong>
            </div>

            <p className="summary-price-note">
              {isEVSlot
                ? `Includes ₹${EV_SURCHARGE_PER_HOUR} per hour EV charging surcharge.`
                : "Final amount is based on your selected parking duration."}
            </p>

            <div className="summary-benefits">
              <div>
                <CheckCircle2 size={17} />
                Real-time slot availability
              </div>
              <div>
                <CheckCircle2 size={17} />
                Digital booking confirmation
              </div>
              <div>
                <CheckCircle2 size={17} />
                Easy booking management
              </div>
            </div>

            <div className="summary-help">
              <ShieldCheck size={21} />
              <div>
                <strong>Your booking is protected</strong>
                <span>Complete your reservation securely.</span>
              </div>
            </div>
          </aside>
        </div>

        <footer className="booking-footer">
          <span>SMARTPARK</span>
          <span>Smarter parking. Smoother journeys.</span>
        </footer>
      </div>
    </div>
  );
}

export default Booking;
