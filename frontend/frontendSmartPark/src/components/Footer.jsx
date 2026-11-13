
import { Link } from "react-router-dom";
import {
  CircleParking,
  MapPin,
  Mail,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-glow footer-glow-one"></div>
      <div className="footer-glow footer-glow-two"></div>

      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-icon">
              <CircleParking size={30} strokeWidth={2.2} />
            </span>
            <span>
              Smart<span className="footer-logo-accent">Park</span>
            </span>
          </Link>

          <p className="footer-description">
            A smarter way to park. Discover convenient parking spaces,
            reserve your spot in advance, and enjoy a seamless parking
            experience.
          </p>

          <div className="footer-trust">
            <ShieldCheck size={17} />
            <span>Smart. Secure. Convenient.</span>
          </div>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>

          <Link to="/">
            Home <ArrowUpRight size={14} />
          </Link>

          <Link to="/search">
            Find Parking <ArrowUpRight size={14} />
          </Link>

          <Link to="/bookings">
            My Bookings <ArrowUpRight size={14} />
          </Link>

          <Link to="/login">
            Sign In <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="footer-column footer-contact">
          <h3>Get in Touch</h3>

          <div className="footer-contact-item">
            <span className="footer-contact-icon">
              <Mail size={17} />
            </span>
            <div>
              <small>Email Support</small>
              <a href="mailto:support@smartpark.com">
                support@smartpark.com
              </a>
            </div>
          </div>

          <div className="footer-contact-item">
            <span className="footer-contact-icon">
              <MapPin size={17} />
            </span>
            <div>
              <small>Our Service</small>
              <p>Smart Parking Reservation System</p>
            </div>
          </div>

          <div className="footer-contact-item">
            <span className="footer-contact-icon">
              <Zap size={17} />
            </span>
            <div>
              <small>Our Promise</small>
              <p>Easy and efficient parking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} SmartPark. All rights reserved.
        </p>

        <span className="footer-bottom-tag">
          Designed for smarter parking
        </span>
      </div>
    </footer>
  );
}

export default Footer;
