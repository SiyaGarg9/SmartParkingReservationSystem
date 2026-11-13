
import { useEffect, useState } from "react";
import {
  Users,
  UserRound,
  UserCheck,
  CalendarDays,
  Search,
  Eye,
  ShieldCheck,
  Mail,
  Phone,
  BookmarkCheck,
  X,
  ArrowUpRight,
  Activity,
  RefreshCw,
  LoaderCircle,
} from "lucide-react";
import "./ManageUsers.css";

const API_URL = "http://127.0.0.1:8000";

function formatDate(dateValue) {
  if (!dateValue) return "Not available";
  return new Date(dateValue).toLocaleDateString("en-CA");
}

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Fetch real users and their booking counts
  async function fetchUsers(showLoading = true) {
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

      const [userResponse, bookingResponse] = await Promise.all([
        fetch(`${API_URL}/admin/users`, { headers }),
        fetch(`${API_URL}/admin/bookings`, { headers }),
      ]);

      const userData = await userResponse.json();
      const bookingData = await bookingResponse.json();

      if (!userResponse.ok) {
        throw new Error(
          userData.detail || "Unable to fetch registered users."
        );
      }

      if (!bookingResponse.ok) {
        throw new Error(
          bookingData.detail || "Unable to fetch booking information."
        );
      }

      const userList = Array.isArray(userData) ? userData : [];
      const bookingList = Array.isArray(bookingData) ? bookingData : [];

      // Count bookings belonging to each user
      const bookingCounts = {};

      bookingList.forEach((booking) => {
        bookingCounts[booking.user_id] =
          (bookingCounts[booking.user_id] || 0) + 1;
      });

      // Prepare users for the React interface
      const formattedUsers = userList.map((user) => ({
        id: user.user_id,
        name: user.name || "Unknown User",
        email: user.email || "Not available",
        phone: user.phone || "Not provided",
        joined: formatDate(user.created_at),
        bookings: bookingCounts[user.user_id] || 0,
        role: user.role || "USER",
      }));

      setUsers(formattedUsers);

      setSelectedUser((previous) => {
        if (!previous) return null;

        return (
          formattedUsers.find((user) => user.id === previous.id) || null
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
    fetchUsers();
  }, []);

  // Search and role filter
  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query);

    const matchesRole =
      statusFilter === "All" || user.role === statusFilter;

    return matchesSearch && matchesRole;
  });

  // Summary statistics
  const customerCount = users.filter(
    (user) => user.role === "USER"
  ).length;

  const adminCount = users.filter(
    (user) => user.role === "ADMIN"
  ).length;

  const totalBookings = users.reduce(
    (total, user) => total + user.bookings,
    0
  );

  const customerPercentage = users.length
    ? Math.round((customerCount / users.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="manage-users">
        <div className="bookings-loading">
          <LoaderCircle size={30} className="bookings-spin" />
          <h2>Loading registered users</h2>
          <p>Retrieving customer information from SmartPark...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-users">
      <section className="users-hero">
        <div className="users-hero-grid" />
        <div className="users-hero-orb users-orb-one" />
        <div className="users-hero-orb users-orb-two" />

        <div className="users-hero-content">
          <div className="users-eyebrow">
            <Users size={15} />
            CUSTOMER MANAGEMENT
          </div>

          <h1>
            Manage your
            <span> community.</span>
          </h1>

          <p>
            Keep track of registered customers, monitor account activity,
            and manage your SmartPark user community.
          </p>

          <div className="users-hero-meta">
            <span>
              <ShieldCheck size={15} />
              Account administration
            </span>
            <span>
              <Activity size={15} />
              Live database information
            </span>
          </div>
        </div>

        <div className="users-hero-visual">
          <div className="users-visual-ring users-ring-outer" />
          <div className="users-visual-ring users-ring-inner" />

          <div className="users-visual-icon">
            <Users size={58} strokeWidth={1.3} />
          </div>

          <div className="users-floating-card users-floating-top">
            <UserCheck size={17} />
            <div>
              <strong>{customerCount} Customers</strong>
              <span>Registered accounts</span>
            </div>
          </div>

          <div className="users-floating-card users-floating-bottom">
            <BookmarkCheck size={17} />
            <div>
              <strong>{totalBookings} Bookings</strong>
              <span>Across all users</span>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="bookings-error">
          <div>
            <strong>Unable to load user information</strong>
            <p>{error}</p>
          </div>
          <button onClick={() => fetchUsers(false)}>
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      <section className="users-section-heading">
        <div>
          <span className="users-section-kicker">OVERVIEW</span>
          <h2>Community insights</h2>
          <p>A live snapshot of your registered user accounts.</p>
        </div>

        <button
          className="users-live-indicator"
          onClick={() => fetchUsers(false)}
          disabled={refreshing}
          style={{ cursor: "pointer", border: "none" }}
        >
          <RefreshCw
            size={14}
            className={refreshing ? "bookings-spin" : ""}
          />
          {refreshing ? "REFRESHING" : "LIVE DATABASE"}
        </button>
      </section>

      <section className="users-summary">
        <div className="users-summary-card users-card-total">
          <div className="users-card-top">
            <div className="users-summary-icon">
              <Users size={21} />
            </div>
            <span className="users-card-tag">ALL ACCOUNTS</span>
          </div>
          <strong>{users.length.toString().padStart(2, "0")}</strong>
          <span className="users-summary-label">Total users</span>
          <div className="users-card-bottom">
            <span>Registered community</span>
            <ArrowUpRight size={17} />
          </div>
        </div>

        <div className="users-summary-card users-card-active">
          <div className="users-card-top">
            <div className="users-summary-icon">
              <UserCheck size={21} />
            </div>
            <span className="users-card-tag">CUSTOMERS</span>
          </div>
          <strong>{customerCount.toString().padStart(2, "0")}</strong>
          <span className="users-summary-label">Registered customers</span>
          <div className="users-card-bottom">
            <span>{customerPercentage}% of all accounts</span>
            <ArrowUpRight size={17} />
          </div>
        </div>

        <div className="users-summary-card users-card-inactive">
          <div className="users-card-top">
            <div className="users-summary-icon">
              <ShieldCheck size={21} />
            </div>
            <span className="users-card-tag">ADMINISTRATORS</span>
          </div>
          <strong>{adminCount.toString().padStart(2, "0")}</strong>
          <span className="users-summary-label">Admin accounts</span>
          <div className="users-card-bottom">
            <span>System administrators</span>
            <ArrowUpRight size={17} />
          </div>
        </div>

        <div className="users-summary-card users-card-bookings">
          <div className="users-card-top">
            <div className="users-summary-icon">
              <BookmarkCheck size={21} />
            </div>
            <span className="users-card-tag">ENGAGEMENT</span>
          </div>
          <strong>{totalBookings.toString().padStart(2, "0")}</strong>
          <span className="users-summary-label">Total bookings</span>
          <div className="users-card-bottom">
            <span>Combined reservations</span>
            <ArrowUpRight size={17} />
          </div>
        </div>
      </section>

      <section className="users-directory">
        <div className="users-directory-heading">
          <div>
            <span className="users-section-kicker">USER DIRECTORY</span>
            <h2>Registered customers</h2>
            <p>Search and review actual registered accounts.</p>
          </div>

          <div className="users-directory-count">
            <Users size={16} />
            {filteredUsers.length} users shown
          </div>
        </div>

        <div className="users-controls">
          <div className="users-search-box">
            <Search size={19} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users"
            />
            {search && (
              <button
                className="users-clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="users-filter-box">
            <span>Account type</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter users by account type"
            >
              <option value="All">All accounts</option>
              <option value="USER">Customers</option>
              <option value="ADMIN">Administrators</option>
            </select>
          </div>
        </div>

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>PHONE</th>
                <th>JOINED DATE</th>
                <th>BOOKINGS</th>
                <th>ACCOUNT TYPE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="users-phone">
                      <Phone size={14} />
                      {user.phone}
                    </span>
                  </td>

                  <td>
                    <span className="users-joined">
                      <CalendarDays size={14} />
                      {user.joined}
                    </span>
                  </td>

                  <td>
                    <span className="users-booking-count">
                      {user.bookings}
                    </span>
                  </td>

                  <td>
                    <span className="user-status active">
                      <span />
                      {user.role === "ADMIN" ? "Administrator" : "Customer"}
                    </span>
                  </td>

                  <td>
                    <div className="user-actions">
                      <button
                        className="user-view-btn"
                        onClick={() => setSelectedUser(user)}
                        title="View user details"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="users-empty">
              <div>
                <Search size={25} />
              </div>
              <strong>No users found</strong>
              <p>Try changing your search or account type filter.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        <div className="users-table-footer">
          <span>
            Showing <strong>{filteredUsers.length}</strong> of{" "}
            <strong>{users.length}</strong> registered users
          </span>
          <span>SmartPark user directory</span>
        </div>
      </section>

      {selectedUser && (
        <div
          className="user-modal-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-modal-header">
              <div>
                <span className="users-section-kicker">CUSTOMER PROFILE</span>
                <h2 id="user-modal-title">User details</h2>
              </div>

              <button
                className="user-modal-close"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="user-modal-profile">
              <div className="user-modal-avatar">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3>{selectedUser.name}</h3>
                <span>Customer ID #{selectedUser.id}</span>
              </div>
              <span className="user-status active">
                <span />
                {selectedUser.role}
              </span>
            </div>

            <div className="user-modal-information">
              <div className="user-detail-item">
                <Mail size={17} />
                <div>
                  <span>Email address</span>
                  <strong>{selectedUser.email}</strong>
                </div>
              </div>

              <div className="user-detail-item">
                <Phone size={17} />
                <div>
                  <span>Phone number</span>
                  <strong>{selectedUser.phone}</strong>
                </div>
              </div>

              <div className="user-detail-item">
                <CalendarDays size={17} />
                <div>
                  <span>Registration date</span>
                  <strong>{selectedUser.joined}</strong>
                </div>
              </div>

              <div className="user-detail-item">
                <BookmarkCheck size={17} />
                <div>
                  <span>Total bookings</span>
                  <strong>{selectedUser.bookings} reservations</strong>
                </div>
              </div>
            </div>

            <div className="user-modal-footer">
              <button
                className="user-modal-done"
                onClick={() => setSelectedUser(null)}
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
