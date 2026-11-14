
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  CheckCircle2,
  CircleCheck,
  LockKeyhole,
  ParkingSquare,
  CalendarDays,
  Clock3,
  Receipt,
  LoaderCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import "./Payment.css";

const API_URL = "https://smartparkingreservationsystem.onrender.com";

const paymentMethods = [
  {
    id: "UPI",
    name: "UPI",
    description: "Pay using UPI",
    icon: Smartphone,
  },
  {
    id: "CARD",
    name: "Credit / Debit Card",
    description: "Visa, Mastercard and more",
    icon: CreditCard,
  },
  {
    id: "NET_BANKING",
    name: "Net Banking",
    description: "Pay through your bank",
    icon: Landmark,
  },
  {
    id: "WALLET",
    name: "Wallet",
    description: "Digital wallet payment",
    icon: Wallet,
  },
];

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    bookingId,
    amount,
    parkingAmount,
    evSurcharge,
    isEVSlot,
    parkingName,
    location: parkingLocation,
    date,
    time,
    duration,
    slotId,
    vehicle,
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  const selectedMethod = paymentMethods.find(
    (method) => method.id === paymentMethod
  );

  const handlePayment = async () => {
    if (!bookingId || amount == null) {
      setError("Booking details are missing. Please create a booking first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("user_access_token")}`,
        },
        body: JSON.stringify({
          booking_id: Number(bookingId),
          amount: Number(amount),
          payment_method: paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Payment failed");
      }

      setPayment(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (payment) {
    return (
      <div className="payment-page payment-success-page">
        <div className="payment-background"></div>

        <div className="payment-success-card">
          <div className="success-animation">
            <div className="success-circle">
              <CheckCircle2 size={54} />
            </div>
          </div>

          <span className="payment-eyebrow">SMARTPARK TRANSACTION</span>
          <h1>Payment successful!</h1>
          <p className="success-subtitle">
            Your payment has been processed successfully.
          </p>

          <div className="success-amount">
            <span>Amount paid</span>
            <strong>₹{payment.amount}</strong>
          </div>

          <div className="success-status">
            <CircleCheck size={17} />
            {payment.payment_status}
          </div>

          <div className="transaction-details">
            <div>
              <span>Payment ID</span>
              <strong>{payment.payment_id}</strong>
            </div>
            <div>
              <span>Booking ID</span>
              <strong>{payment.booking_id}</strong>
            </div>
            <div>
              <span>Payment method</span>
              <strong>{payment.payment_method}</strong>
            </div>
            <div>
              <span>Transaction ID</span>
              <strong className="transaction-id">
                {payment.transaction_id}
              </strong>
            </div>
          </div>

          <div className="success-note">
            <ShieldCheck size={20} />
            <span>Your payment record has been saved successfully.</span>
          </div>

          <button
            className="payment-primary-button"
            onClick={() => navigate("/bookings")}
          >
            View My Bookings
            <ArrowRight size={19} />
          </button>

          <button
            className="payment-secondary-button"
            onClick={() => navigate("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-background"></div>

      <div className="payment-content">
        <button
          className="payment-back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="payment-heading">
          <div className="payment-eyebrow">
            <span></span>
            SECURE CHECKOUT
          </div>

          <h1>
            Complete your
            <span> payment.</span>
          </h1>

          <p>
            You're one step away from securing your SmartPark reservation.
          </p>
        </div>

        <div className="payment-layout">
          <main className="payment-main-card">
            <div className="payment-card-heading">
              <div>
                <span className="payment-step">STEP 02 / CHECKOUT</span>
                <h2>Choose payment method</h2>
                <p>Select your preferred payment option below.</p>
              </div>

              <div className="payment-heading-icon">
                <CreditCard size={25} />
              </div>
            </div>

            <div className="payment-method-list">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;

                return (
                  <button
                    type="button"
                    key={method.id}
                    className={`payment-method ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <div className="payment-method-icon">
                      <Icon size={22} />
                    </div>

                    <div className="payment-method-info">
                      <strong>{method.name}</strong>
                      <span>{method.description}</span>
                    </div>

                    <div className="payment-radio">
                      {isSelected && <span></span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="payment-selected-info">
              <div className="selected-method-icon">
                {selectedMethod && <selectedMethod.icon size={20} />}
              </div>
              <div>
                <strong>{selectedMethod?.name} selected</strong>
                <span>
                  Your payment will be recorded using this method.
                </span>
              </div>
            </div>

            {error && (
              <div className="payment-error" role="alert">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button
              className="payment-primary-button"
              onClick={handlePayment}
              disabled={loading || !bookingId || amount == null}
            >
              {loading ? (
                <>
                  <LoaderCircle className="payment-spinner" size={19} />
                  Processing payment...
                </>
              ) : (
                <>
                  Pay ₹{amount ?? "—"} securely
                  <ArrowRight size={19} />
                </>
              )}
            </button>

            <div className="payment-security-note">
              <LockKeyhole size={15} />
              Secure checkout · Simulated payment
            </div>
          </main>

          <aside className="payment-summary-card">
            <div className="payment-summary-heading">
              <span>YOUR ORDER</span>
              <div className="payment-receipt-icon">
                <Receipt size={22} />
              </div>
              <h2>Booking summary</h2>
              <p>Review your reservation details.</p>
            </div>

            <div className="payment-summary-divider"></div>

            <div className="payment-location-box">
              <div className="payment-location-icon">
                <ParkingSquare size={22} />
              </div>
              <div>
                <span>PARKING LOCATION</span>
                <strong>{parkingName || "SmartPark Reservation"}</strong>
                {parkingLocation && <small>{parkingLocation}</small>}
              </div>
            </div>

            <div className="payment-summary-detail">
              <span>Booking ID</span>
              <strong>{bookingId || "Not available"}</strong>
            </div>

            {date && (
              <div className="payment-summary-detail">
                <span>
                  <CalendarDays size={14} /> Date
                </span>
                <strong>{date}</strong>
              </div>
            )}

            {time && (
              <div className="payment-summary-detail">
                <span>
                  <Clock3 size={14} /> Arrival
                </span>
                <strong>{time}</strong>
              </div>
            )}

            {duration != null && (
              <div className="payment-summary-detail">
                <span>Duration</span>
                <strong>{duration} hour(s)</strong>
              </div>
            )}

            {slotId && (
              <div className="payment-summary-detail">
                <span>Slot ID</span>
                <strong>{slotId}</strong>
              </div>
            )}

            {vehicle && (
              <div className="payment-summary-detail">
                <span>Vehicle</span>
                <strong>
                  {vehicle === "EV" ? "Electric vehicle" : vehicle}
                </strong>
              </div>
            )}

            <div className="payment-summary-divider"></div>

            <div className="payment-total-row">
              <span>Parking fee</span>
              <strong>₹{parkingAmount ?? amount}</strong>
            </div>

            {isEVSlot && (
              <div className="payment-total-row">
                <span>
                  <Zap size={14} /> EV charging surcharge
                </span>
                <strong>₹{evSurcharge ?? 0}</strong>
              </div>
            )}

            <div className="payment-summary-divider"></div>

            <div className="payment-total-row">
              <span>Total payable</span>
              <strong>₹{amount ?? "—"}</strong>
            </div>

            <div className="payment-summary-benefits">
              <div>
                <CheckCircle2 size={16} />
                Booking payment record
              </div>
              <div>
                <CheckCircle2 size={16} />
                Digital transaction details
              </div>
              <div>
                <CheckCircle2 size={16} />
                Booking history access
              </div>
            </div>

            <div className="payment-protected">
              <ShieldCheck size={21} />
              <div>
                <strong>Checkout information</strong>
                <span>Your payment is recorded in SmartPark.</span>
              </div>
            </div>
          </aside>
        </div>

        <footer className="payment-footer">
          <span>SMARTPARK</span>
          <span>Smarter parking. Smoother journeys.</span>
        </footer>
      </div>
    </div>
  );
}

export default Payment;
