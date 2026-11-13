
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  CalendarDays,
  ShieldCheck,
  Zap,
  Clock3,
  Navigation,
  CheckCircle2,
  ParkingCircle,
  ChevronRight,
  CarFront,
} from "lucide-react";
import "./Home.css";

function Home() {
  return (
    <main className="smart-home">

      {/* FULL IMAGE HERO */}
      <section className="garage-hero">
        <div className="garage-hero-overlay" />

        <div className="garage-hero-content">
          <div className="garage-eyebrow">
            <span />
            A NEW STANDARD IN SMART PARKING
          </div>

          <h1>
            Parking made
            <br />
            <span>effortless.</span>
          </h1>

          <p className="garage-hero-text">
            Your space. Your schedule. Your destination.
            Discover convenient parking, reserve in advance,
            and make every arrival a smoother experience.
          </p>

          <div className="garage-hero-actions">
            <Link to="/search" className="garage-primary-btn">
              Find a Parking Space
              <ArrowRight size={18} />
            </Link>

            <Link to="/bookings" className="garage-outline-btn">
              Manage My Bookings
              <ArrowUpRight size={17} />
            </Link>
          </div>

          <div className="garage-trust-row">
            <span><ShieldCheck size={16} /> Secure reservations</span>
            <i />
            <span><Clock3 size={16} /> Convenient scheduling</span>
          </div>
        </div>

        <div className="garage-hero-bottom">
          <div className="garage-scroll-label">
            <span className="garage-scroll-line" />
            DISCOVER SMARTER PARKING
          </div>
          <span className="garage-hero-index">01 / SMARTPARK</span>
        </div>
      </section>

      {/* SEARCH STRIP */}
      <section className="garage-search-section">
        <div className="garage-search-panel">
          <div className="garage-search-heading">
            <span className="garage-small-label">PLAN YOUR ARRIVAL</span>
            <h2>Where would you like to park?</h2>
            <p>Start with a location and find a space that fits your plans.</p>
          </div>

          <div className="garage-search-info">
            <div className="garage-search-icon">
              <MapPin size={21} />
            </div>
            <div>
              <small>DESTINATION</small>
              <strong>Explore parking locations</strong>
            </div>
          </div>

          <div className="garage-search-info">
            <div className="garage-search-icon">
              <CalendarDays size={21} />
            </div>
            <div>
              <small>BOOKING SCHEDULE</small>
              <strong>Select your date and time</strong>
            </div>
          </div>

          <Link to="/search" className="garage-search-submit">
            Search Spaces <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="garage-overview">
        <div className="garage-section-heading">
          <div>
            <span className="garage-small-label">SMARTPARK OVERVIEW</span>
            <h2>Space for every journey.</h2>
          </div>
          <p>
            A connected parking system designed to make
            finding and managing your space easier.
          </p>
        </div>

        <div className="garage-stats">
          <div className="garage-stat">
            <span className="garage-stat-icon"><ParkingCircle size={22} /></span>
            <strong>150<span>+</span></strong>
            <p>Parking spaces</p>
            <small>Configured across the system</small>
          </div>

          <div className="garage-stat">
            <span className="garage-stat-icon"><MapPin size={22} /></span>
            <strong>10</strong>
            <p>Parking locations</p>
            <small>Multiple areas to explore</small>
          </div>

          <div className="garage-stat">
            <span className="garage-stat-icon"><Zap size={22} /></span>
            <strong>15</strong>
            <p>EV charging points</p>
            <small>Dedicated charging facilities</small>
          </div>

          <div className="garage-stat">
            <span className="garage-stat-icon"><ShieldCheck size={22} /></span>
            <strong>One</strong>
            <p>Connected platform</p>
            <small>Manage your parking in one place</small>
          </div>
        </div>
      </section>

      {/* IMAGE FEATURE SECTION */}
      <section className="garage-experience">
        <div className="garage-experience-image">
          <div className="garage-image-overlay" />
          <div className="garage-image-caption">
            <span>01 — DISCOVER</span>
            <h2>Find the right space.</h2>
            <p>
              Explore configured parking areas and check
              availability for your planned visit.
            </p>
            <Link to="/search">
              Explore locations <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>

        <div className="garage-experience-content">
          <span className="garage-small-label">BUILT AROUND YOUR JOURNEY</span>
          <h2>
            A better way
            <br />
            to get there.
          </h2>
          <p>
            Skip the uncertainty of searching for parking.
            SmartPark brings location discovery, reservations,
            and booking management together in one place.
          </p>

          <div className="garage-benefit-list">
            <div>
              <CheckCircle2 size={19} />
              <span>Explore parking locations</span>
            </div>
            <div>
              <CheckCircle2 size={19} />
              <span>Check slot availability for your schedule</span>
            </div>
            <div>
              <CheckCircle2 size={19} />
              <span>Keep your reservations organised</span>
            </div>
          </div>

          <Link to="/search" className="garage-text-link">
            Start exploring <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="garage-process">
        <div className="garage-process-heading">
          <span className="garage-small-label">SIMPLE BY DESIGN</span>
          <h2>Three steps. One smoother arrival.</h2>
          <p>
            From finding a space to managing your reservation,
            your parking journey stays straightforward.
          </p>
        </div>

        <div className="garage-process-grid">
          <article className="garage-process-card">
            <span className="garage-process-number">01</span>
            <div className="garage-process-icon"><Navigation size={23} /></div>
            <h3>Discover</h3>
            <p>
              Browse parking locations and check spaces
              that match your intended time.
            </p>
            <Link to="/search">Find parking <ChevronRight size={16} /></Link>
          </article>

          <article className="garage-process-card">
            <span className="garage-process-number">02</span>
            <div className="garage-process-icon"><CalendarDays size={23} /></div>
            <h3>Reserve</h3>
            <p>
              Choose an available slot, set your schedule,
              and complete your reservation.
            </p>
            <Link to="/search">Make a reservation <ChevronRight size={16} /></Link>
          </article>

          <article className="garage-process-card">
            <span className="garage-process-number">03</span>
            <div className="garage-process-icon"><CarFront size={23} /></div>
            <h3>Arrive</h3>
            <p>
              Access your booking details and keep track
              of your parking information.
            </p>
            <Link to="/bookings">View bookings <ChevronRight size={16} /></Link>
          </article>
        </div>
      </section>

      {/* EV IMAGE BANNER */}
      <section className="garage-ev-banner">
        <div className="garage-ev-background" />
        <div className="garage-ev-overlay" />

        <div className="garage-ev-content">
          <span className="garage-small-label">PARKING FOR THE NEXT GENERATION</span>
          <h2>
            Move forward.
            <br />
            <span>Charge smarter.</span>
          </h2>
          <p>
            SmartPark includes dedicated EV charging points
            within its configured parking system, bringing
            parking and charging facilities together.
          </p>

          <div className="garage-ev-points">
            <span><Zap size={17} /> 15 EV charging points</span>
            <span><CheckCircle2 size={17} /> Integrated parking experience</span>
          </div>

          <Link to="/search" className="garage-primary-btn">
            Explore Parking
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="garage-final">
        <div className="garage-final-inner">
          <div>
            <span className="garage-small-label">YOUR SPACE IS CLOSER THAN YOU THINK</span>
            <h2>Make your next arrival effortless.</h2>
            <p>
              Find a location, choose your space, and plan your
              parking before you set off.
            </p>
          </div>

          <Link to="/search" className="garage-final-button">
            Find Parking <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>

    </main>
  );
}

export default Home;
