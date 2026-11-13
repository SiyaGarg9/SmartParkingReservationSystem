
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";

import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Navigation from "./pages/Navigation";
import Home from "./pages/Home";
import Search from "./pages/Search";
import MyBookings from "./pages/MyBookings";
import Login from "./pages/Login";
import Register from "./pages/Register";


import AdminLayout from "./admin/AdminLayout";

function UserLayout() {
  const location = useLocation();

  return (
    <div className="app">
      <Navbar />
      <main className="page-transition" key={location.pathname}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin pages: no user Navbar or Footer */}
        <Route path="/admin/*" element={<AdminLayout />} />

        {/* User pages: Navbar and Footer */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/navigation/:bookingId" element={<Navigation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
