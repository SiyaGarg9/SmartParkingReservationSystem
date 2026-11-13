
import { NavLink, Routes, Route, Navigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  MapPinned,
  ParkingSquare,
  CalendarCheck,
  Users,
  ChartNoAxesCombined,
  Zap,
  Settings,
  ArrowUpRight,
  ArrowLeft,
  ShieldCheck,
  CircleParking,
  Activity,
} from "lucide-react";
import "./AdminLayout.css";

import AdminDashboard from "./AdminDashboard";
import ManageParking from "./ManageParking";
import ManageSlots from "./ManageSlots";
import ManageBookings from "./ManageBookings";
import ManageUsers from "./ManageUsers";
import AdminReports from "./AdminReports";
import ManageEVCharging from "./ManageEVCharging";
import AdminSettings from "./AdminSettings";

function AdminLayout() {
  const navigationItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/parking", label: "Parking Areas", icon: MapPinned },
    { to: "/admin/slots", label: "Parking Slots", icon: ParkingSquare },
    { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/reports", label: "Reports", icon: ChartNoAxesCombined },
    { to: "/admin/ev-charging", label: "EV Charging", icon: Zap },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand">
          <div className="admin-brand-icon">
            <CircleParking size={29} strokeWidth={2.2} />
          </div>

          <div className="admin-brand-copy">
            <h2>Smart<span>Park</span></h2>
            <p>ADMIN CONTROL CENTER</p>
          </div>
        </Link>

        <div className="admin-sidebar-label">WORKSPACE</div>

        <nav className="admin-navigation">
          <p className="admin-nav-heading">MAIN MENU</p>

          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="admin-nav-icon">
                  <Icon size={19} strokeWidth={1.9} />
                </span>
                <span className="admin-nav-label">{item.label}</span>
                <span className="admin-nav-indicator"></span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-spacer"></div>

        <div className="admin-sidebar-portal">
          <div className="admin-portal-icon">
            <ArrowUpRight size={18} />
          </div>
          <div className="admin-portal-copy">
            <strong>User Portal</strong>
            <span>Switch to customer view</span>
          </div>
          <Link
            to="/login"
            className="admin-portal-link"
            aria-label="Login to User Portal"
            title="Login to User Portal"
          >
            <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="admin-sidebar-bottom">
          <Link to="/" className="admin-back-link">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          <div className="admin-profile">
            <div className="admin-profile-avatar">
              <ShieldCheck size={20} />
            </div>

            <div className="admin-profile-info">
              <strong>Administrator</strong>
              <span>
                <i></i>
                Admin Account
              </span>
            </div>

            <div className="admin-profile-status">
              <Activity size={16} />
            </div>
          </div>

          <div className="admin-sidebar-footer">
            SMARTPARK MANAGEMENT SYSTEM
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-heading">
            <span className="admin-topbar-kicker">SMARTPARK / ADMINISTRATION</span>
            <h2>Management Workspace</h2>
            <p>Manage your parking operations from one place.</p>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-online-status">
              <span></span>
              <div>
                <strong>System Online</strong>
                <small>Admin access</small>
              </div>
            </div>

            <div className="admin-topbar-avatar">
              <ShieldCheck size={19} />
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="parking" element={<ManageParking />} />
            <Route path="slots" element={<ManageSlots />} />
            <Route path="bookings" element={<ManageBookings />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="ev-charging" element={<ManageEVCharging />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
