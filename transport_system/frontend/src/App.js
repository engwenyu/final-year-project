/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, createContext, useContext } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";

// ✅ API helper
const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000/api";
const API_BASE_URL = "http://localhost:8000/api";

const api = {
  async get(endpoint) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: token ? `Token ${token}` : "",
        "Content-Type": "application/json",
      },
    });
    return response.json();
  },

  async post(endpoint, data) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: token ? `Token ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
export const apiRequest = async (
  endpoint,
  { method = "GET", token, body } = {}
) => {
  let authHeader = {};

  if (token) {
    // Simple check: JWT usually starts with "eyJ"
    if (token.startsWith("eyJ")) {
      authHeader = { Authorization: `Bearer ${token}` };
    } else {
      authHeader = { Authorization: `Token ${token}` };
    }
  }

  const res = await fetch(
    `${
      process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api"
    }${endpoint}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Request failed");
  }

  if (res.status === 204) {
    return {}; // no content to parse
  }

  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
};

// Auth Context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const login = async (username, password) => {
    const data = await apiRequest("/auth/login/", {
      method: "POST",
      body: { username, password },
    });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- LOGIN PAGE ---
const LoginPage = ({ onSwitch }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Sign In</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={onSwitch}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Don&apos;t have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SIGNUP PAGE ---
const SignupPage = ({ onSwitch }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    password: "",
    password_confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Send only fields backend expects
      await apiRequest("/auth/register/", {
        method: "POST",
        body: {
          username: form.username,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          phone_number: form.phone_number,
          password: form.password,
          user_type: "passenger",
        },
      });

      // Auto-login after signup
      await login(form.username, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-4">Create Account</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="First Name"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Last Name"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="password"
            name="password_confirm"
            value={form.password_confirm}
            onChange={handleChange}
            placeholder="Confirm Password"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={onSwitch}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= RATING MODAL =================
const RatingModal = ({ isOpen, onClose, journeyId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      await apiRequest(`/ratings/`, {
        method: "POST",
        body: { journey: journeyId, rating, comment },
        token: localStorage.getItem("token"),
      });
      alert("✅ Thank you for your rating!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit rating");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Rate Your Journey</h2>
        <label className="block mb-2">Rating (1-5):</label>
        <input
          type="number"
          min="1"
          max="5"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="border px-2 py-1 w-full rounded mb-4"
        />
        <label className="block mb-2">Comment:</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="border px-2 py-1 w-full rounded mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= PASSENGER DASHBOARD =================

export const PassengerDashboard = () => {
  const { user, logout } = useAuth();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [walletBalance, setWalletBalance] = useState(0);
  const [routeType, setRouteType] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDropoff, setSelectedDropoff] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState({});
  const [activeTab, setActiveTab] = useState("book");

  // Fetch wallet and bookings on load
  useEffect(() => {
    fetchWalletAndBookings();
  }, []);

  const fetchWalletAndBookings = async () => {
    try {
      const walletData = await apiRequest("/payments/wallet/", { token });
      setWalletBalance(walletData.balance || 0);

      const bookingsData = await apiRequest("/journeys/bookings/", { token });
      const allBookings = bookingsData.results || bookingsData || [];

      // Filter out cancelled bookings - only show confirmed and pending bookings
      const activeBookings = allBookings.filter(
        (booking) => booking.status !== "cancelled"
      );

      setBookings(activeBookings);
    } catch (err) {
      console.error("Error fetching wallet/bookings:", err);
    }
  };

  // Fetch routes based on type selection
  const fetchRoutes = async (type) => {
    try {
      const data = await apiRequest(`/routes/by-type/?route_type=${type}`, {
        token,
      });
      setRoutes(data.results || data || []);
      setRouteType(type);
      setSelectedRoute(null);
      setStops([]);
      setSelectedPickup(null);
      setSelectedDropoff(null);
      setJourneys([]);
    } catch (err) {
      console.error("Error fetching routes:", err);
    }
  };

  // Create default Kampala stop
  const createKampalaStop = (route) => {
    return {
      id: `kampala_${route.id}`,
      stop_name: "Kampala Central",
      name: "Kampala Central",
      distance_from_start: 0,
      fare: 0,
      is_kampala_default: true,
    };
  };

  // Fetch stops when route is selected
  const handleRouteSelect = async (route) => {
    try {
      setSelectedRoute(route);
      const stopsData = await apiRequest(`/routes/${route.id}/stops/`, {
        token,
      });
      let stopsList = stopsData.results || stopsData || [];

      // Add Kampala as default stop to ALL routes
      const kampalaStop = createKampalaStop(route);

      // Check if Kampala stop already exists to avoid duplicates
      const hasKampalaStop = stopsList.some((stop) =>
        (stop.stop_name || stop.name).toLowerCase().includes("kampala")
      );

      if (!hasKampalaStop) {
        stopsList = [kampalaStop, ...stopsList];
      }

      setStops(stopsList);

      // Auto-select Kampala as pickup and last stop as dropoff
      const kampalaStops = stopsList.filter((stop) =>
        (stop.stop_name || stop.name).toLowerCase().includes("kampala")
      );

      if (kampalaStops.length > 0) {
        setSelectedPickup(kampalaStops[0]);
        if (stopsList.length > 1) {
          setSelectedDropoff(stopsList[stopsList.length - 1]);
        }
      } else {
        setSelectedPickup(stopsList[0]);
        if (stopsList.length > 1) {
          setSelectedDropoff(stopsList[stopsList.length - 1]);
        }
      }

      setJourneys([]);
    } catch (err) {
      console.error("Error fetching route stops:", err);
      alert("Failed to load stops for this route");
    }
  };

  // Fetch journeys for selected route with pickup/dropoff
  const handleSearchJourneys = async () => {
    if (!selectedRoute || !selectedPickup || !selectedDropoff) {
      alert("Please select pickup and dropoff stops");
      return;
    }

    if (selectedPickup.id === selectedDropoff.id) {
      alert("Pickup and dropoff must be different");
      return;
    }

    try {
      const data = await apiRequest(
        `/journeys/available/?route_id=${selectedRoute.id}&pickup=${selectedPickup.id}&dropoff=${selectedDropoff.id}`,
        { token }
      );

      // Filter journeys to only include those matching the selected route name
      const allJourneys = data.results || data || [];
      const filteredJourneys = allJourneys.filter((journey) => {
        // Check if journey route name matches selected route name
        const journeyRouteName = journey.route_name || journey.route || "";
        const selectedRouteName = selectedRoute.name || "";
        return journeyRouteName === selectedRouteName;
      });

      setJourneys(filteredJourneys);

      if (filteredJourneys.length === 0) {
        alert("No available buses found for this route and stops");
      }
    } catch (err) {
      console.error("Error fetching journeys:", err);
      alert("No available journeys found for this route");
    }
  };

  // Book a journey
  const bookJourney = async (journeyId) => {
    try {
      const seats = Number(selectedSeats[journeyId] || 1);
      const actualFare = calculateActualFare();
      const totalCost = actualFare * seats;

      // Check if user has enough balance
      if (walletBalance < totalCost) {
        alert(
          `❌ Insufficient balance! You need UGX ${totalCost.toLocaleString()} but have UGX ${walletBalance.toLocaleString()}`
        );
        return;
      }

      await apiRequest(`/journeys/journeys/${journeyId}/book/`, {
        method: "POST",
        token,
        body: {
          seats,
          pickup_stop: selectedPickup.id,
          dropoff_stop: selectedDropoff.id,
          actual_fare: actualFare,
        },
      });
      alert(`✅ Booking successful!`);
      fetchWalletAndBookings();
      handleSearchJourneys();
    } catch (error) {
      console.error("Booking failed:", error);
      alert(
        "❌ Booking failed. Please check your wallet balance and seat availability."
      );
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;

    try {
      await apiRequest(`/journeys/bookings/${bookingId}/cancel/`, {
        method: "POST",
        token,
      });
      alert("🚫 Booking cancelled!");
      fetchWalletAndBookings();
      if (journeys.length > 0) handleSearchJourneys();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to cancel booking.");
    }
  };

  // Calculate actual fare based on pickup and dropoff stops
  const calculateActualFare = () => {
    if (!selectedPickup || !selectedDropoff) return 0;
    const pickupFare = Number(selectedPickup.fare || 0);
    const dropoffFare = Number(selectedDropoff.fare || 0);
    return Math.abs(dropoffFare - pickupFare);
  };

  // Reset selections
  const resetSearch = () => {
    setRouteType(null);
    setRoutes([]);
    setSelectedRoute(null);
    setStops([]);
    setSelectedPickup(null);
    setSelectedDropoff(null);
    setJourneys([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              🚌 Passenger Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.first_name}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                💰 UGX {walletBalance.toLocaleString()}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("book")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "book"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🎫 Book Journey
            </button>
            <button
              onClick={() => setActiveTab("mybookings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mybookings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📋 My Bookings ({bookings.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* BOOK JOURNEY TAB */}
        {activeTab === "book" && (
          <div className="space-y-6">
            {/* Step 1: Select Route Type */}
            {!routeType && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6 text-center">
                  Where would you like to go?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => fetchRoutes("intercity")}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-xl shadow-lg transition transform hover:scale-105"
                  >
                    <div className="text-4xl mb-3">🏙️</div>
                    <h3 className="text-xl font-bold">Intercity Routes</h3>
                    <p className="text-sm mt-2 opacity-90">
                      Short distance within city areas
                    </p>
                  </button>

                  <button
                    onClick={() => fetchRoutes("outercity")}
                    className="bg-purple-600 hover:bg-green-700 text-white p-8 rounded-xl shadow-lg transition transform hover:scale-105"
                  >
                    <div className="text-4xl mb-3">🌍</div>
                    <h3 className="text-xl font-bold">Outercity Routes</h3>
                    <p className="text-sm mt-2 opacity-90">
                      Long distance to other cities
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Route (as buttons) */}
            {routeType && !selectedRoute && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">
                    Select{" "}
                    {routeType === "intercity" ? "Intercity" : "Outercity"}{" "}
                    Route
                  </h2>
                  <button
                    onClick={resetSearch}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ← Change Route Type
                  </button>
                </div>

                {routes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No routes available for this type
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {routes.map((route) => {
                      console.log("Route object:", route);
                      console.log(
                        "Base fare:",
                        route.base_fare,
                        "Type:",
                        typeof route.base_fare
                      );
                      return (
                        <button
                          key={route.id}
                          onClick={() => handleRouteSelect(route)}
                          className="border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg rounded-lg p-5 text-left transition transform hover:scale-102"
                        >
                          <h3 className="font-bold text-lg mb-2">
                            {route.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            📍 {route.start_location} → {route.end_location}
                          </p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t">
                            <div className="text-xs text-gray-500">
                              <span className="block">
                                📏 {route.distance_km || "N/A"} km
                              </span>
                              <span className="block">
                                ⏱️ {route.estimated_duration_minutes || "N/A"}{" "}
                                min
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Base Fare</p>
                              <p className="font-bold text-green-600 text-lg">
                                UGX{" "}
                                {route.base_fare !== undefined &&
                                route.base_fare !== null
                                  ? Number(route.base_fare).toLocaleString()
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Stops (as buttons) */}
            {selectedRoute && journeys.length === 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Select Your Stops</h2>
                  <button
                    onClick={() => {
                      setSelectedRoute(null);
                      setStops([]);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ← Change Route
                  </button>
                </div>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-lg">{selectedRoute.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedRoute.start_location} →{" "}
                    {selectedRoute.end_location}
                  </p>
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Base Fare: UGX{" "}
                    {Number(selectedRoute.base_fare).toLocaleString()}
                  </p>
                </div>

                {/* Pickup Stop Selection */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                      1
                    </span>
                    📍 Select Pickup Stop
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stops.map((stop) => (
                      <button
                        key={stop.id}
                        onClick={() => {
                          setSelectedPickup(stop);
                          if (selectedDropoff?.id === stop.id)
                            setSelectedDropoff(null);
                        }}
                        className={`border-2 rounded-lg p-4 text-left transition ${
                          selectedPickup?.id === stop.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <h4 className="font-bold text-sm mb-1">
                          {stop.stop_name || stop.name}
                        </h4>
                        <p className="text-xs text-gray-500 mb-2">
                          📏 {stop.distance_from_start || 0} km from start
                        </p>
                        <p className="font-semibold text-green-600 text-sm">
                          UGX {Number(stop.fare || 0).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dropoff Stop Selection */}
                {selectedPickup && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                        2
                      </span>
                      📍 Select Dropoff Stop
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stops
                        .filter((stop) => stop.id !== selectedPickup.id)
                        .map((stop) => (
                          <button
                            key={stop.id}
                            onClick={() => setSelectedDropoff(stop)}
                            className={`border-2 rounded-lg p-4 text-left transition ${
                              selectedDropoff?.id === stop.id
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 hover:border-red-300"
                            }`}
                          >
                            <h4 className="font-bold text-sm mb-1">
                              {stop.stop_name || stop.name}
                            </h4>
                            <p className="text-xs text-gray-500 mb-2">
                              📏 {stop.distance_from_start || 0} km from start
                            </p>
                            <p className="font-semibold text-red-600 text-sm">
                              UGX {Number(stop.fare || 0).toLocaleString()}
                            </p>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {selectedPickup && selectedDropoff && (
                  <div className="mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">Your Journey:</h4>
                      <p className="text-sm">
                        <span className="text-green-600 font-medium">
                          From:
                        </span>{" "}
                        {selectedPickup.stop_name || selectedPickup.name}
                        <span className="mx-2">→</span>
                        <span className="text-red-600 font-medium">
                          To:
                        </span>{" "}
                        {selectedDropoff.stop_name || selectedDropoff.name}
                      </p>
                    </div>
                    <button
                      onClick={handleSearchJourneys}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium transition"
                    >
                      🔍 Search Available Buses
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Available Journeys - UPDATED TO MATCH DRIVER'S SECTION */}
            {journeys.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Available Buses</h2>
                  <button
                    onClick={() => {
                      setSelectedPickup(null);
                      setSelectedDropoff(null);
                      setJourneys([]);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ← Change Stops
                  </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm">
                    <strong>Route:</strong> {selectedRoute.name}
                    <br />
                    <strong>From:</strong>{" "}
                    {selectedPickup.stop_name || selectedPickup.name}
                    <strong> To:</strong>{" "}
                    {selectedDropoff.stop_name || selectedDropoff.name}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {journeys.map((journey) => {
                    const myBooking = bookings.find(
                      (b) =>
                        b.journey === journey.id && b.status === "confirmed"
                    );
                    const actualFare = calculateActualFare();
                    const seatsSelected = Number(
                      selectedSeats[journey.id] || 1
                    );
                    const totalCost = actualFare * seatsSelected;

                    return (
                      <div
                        key={journey.id}
                        className="bg-white rounded-lg shadow-lg p-6"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg">
                              Bus {journey.bus_number}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {journey.bus_license_plate}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              journey.status === "scheduled"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {journey.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <p>
                            <strong>Departure:</strong>{" "}
                            {new Date(
                              journey.scheduled_departure
                            ).toLocaleString()}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            Fare: UGX {totalCost.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            ({seatsSelected} seat{seatsSelected > 1 ? "s" : ""}{" "}
                            × UGX {actualFare.toLocaleString()})
                          </p>
                          <p>
                            <strong>Available Seats:</strong>{" "}
                            {journey.available_seats}
                          </p>
                        </div>

                        {myBooking ? (
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-green-800 font-medium text-sm">
                              ✅ You booked {myBooking.seats_booked} seat(s)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                max={journey.available_seats}
                                value={seatsSelected}
                                onChange={(e) =>
                                  setSelectedSeats({
                                    ...selectedSeats,
                                    [journey.id]: e.target.value,
                                  })
                                }
                                className="border px-2 py-1 rounded w-16"
                              />
                              <button
                                onClick={() => bookJourney(journey.id)}
                                disabled={
                                  journey.available_seats === 0 ||
                                  walletBalance < totalCost
                                }
                                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Book Now
                              </button>
                            </div>
                            {walletBalance < totalCost && (
                              <p className="text-xs text-red-600 text-center font-medium">
                                Insufficient balance (Need: UGX{" "}
                                {totalCost.toLocaleString()})
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MY BOOKINGS TAB */}
        {activeTab === "mybookings" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">My Bookings</h2>

            {bookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">📋 No bookings yet</p>
                <button
                  onClick={() => setActiveTab("book")}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Book Your First Journey
                </button>
              </div>
            ) : (
              bookings.map((booking) => {
                // Extract booking details with fallbacks for different API response formats
                const routeName =
                  booking.route_name ||
                  booking.journey_route ||
                  booking.route ||
                  "N/A";
                const pickupStop =
                  booking.pickup_stop_name || booking.pickup_stop || "N/A";
                const dropoffStop =
                  booking.dropoff_stop_name || booking.dropoff_stop || "N/A";
                const seatsBooked = booking.seats_booked || booking.seats || 1;
                const totalFare = Number(
                  booking.total_fare || booking.fare || 0
                );
                const bookedDate =
                  booking.created_at ||
                  booking.booking_date ||
                  booking.booked_at;

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-lg shadow-lg p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">
                          Booking #{booking.booking_reference || booking.id}
                        </h3>
                        <p className="text-gray-600 mt-1">Route: {routeName}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Pickup:</strong> {pickupStop} <br />
                          <strong>Dropoff:</strong> {dropoffStop}
                        </p>
                        <p className="text-sm text-gray-500">
                          <strong>Seats:</strong> {seatsBooked} •{" "}
                          <strong>Total:</strong> UGX{" "}
                          {totalFare.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          <strong>Booked on:</strong>{" "}
                          {bookedDate
                            ? new Date(bookedDate).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ================= DRIVER DASHBOARD =================

// ================= DRIVER DASHBOARD =================
export const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("journeys");
  const [assignedBuses, setAssignedBuses] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [lastPassengerCounts, setLastPassengerCounts] = useState({});
  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      // ================== Fetch Assigned Buses ==================
      const busesData = await apiRequest("/buses/driver-buses/", { token });
      const busesArray = busesData?.results || [];
      setAssignedBuses(busesArray);

      // ================== Fetch Journeys ==================
      // ✅ Fetch journeys assigned to the driver’s buses
      const journeysData = await apiRequest("/journeys/driver-journeys/", {
        token,
      });

      // Filter only scheduled journeys
      const scheduledJourneys = (journeysData.results || []).filter(
        (j) => j.status === "scheduled"
      );

      setJourneys(scheduledJourneys);

      // ================== Tap-in Alert System ==================
      const newCounts = {};
      scheduledJourneys.forEach((j) => {
        const prevCount = lastPassengerCounts[j.id] || 0;
        if ((j.passengers_tapped_in || 0) > prevCount) {
          alert(
            `👤 A passenger tapped into Bus ${j.bus_number} (now ${j.passengers_tapped_in} total)`
          );
        }
        newCounts[j.id] = j.passengers_tapped_in || 0;
      });
      setLastPassengerCounts(newCounts);

      // ================== Optional: Fetch Earnings ==================
      // const earningsData = await apiRequest("/driver/earnings/", { token });
      // setEarnings(earningsData);
    } catch (err) {
      console.error("❌ Error fetching driver dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // ================== Mark Journey Completed ==================
  const markJourneyCompleted = async (journeyId) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/journeys/complete/${journeyId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      // Refresh dashboard after completion
      fetchData();
    } catch (err) {
      console.error("❌ Error completing journey:", err);
    }
  };

  // ================== Cancel Journey ==================
  const cancelJourney = async (journeyId) => {
    const reason = prompt(
      "Please provide a reason for cancelling this journey:"
    );
    if (!reason) {
      alert("Cancellation reason is required.");
      return;
    }

    try {
      await apiRequest(`/journeys/cancel/${journeyId}/`, {
        method: "POST",
        token: localStorage.getItem("token"),
        body: { reason }, // <-- make sure this is included
      });

      // Remove journey from state so it disappears immediately
      setJourneys((prev) => prev.filter((j) => j.id !== journeyId));

      alert("Journey cancelled successfully.");
    } catch (err) {
      console.error("Error cancelling journey:", err);
      alert(err.message || "Failed to cancel journey");
    }
  };

  // 🔁 Auto-refresh every 10 s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== Header ===== */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              🚍 Driver Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.first_name || "Driver"}
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Tabs ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "journeys", name: "🛣️ Journeys" },
              { id: "buses", name: "🚌 Assigned Buses" },
              { id: "earnings", name: "💰 Earnings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* === Journeys Tab === */}
        {activeTab === "journeys" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(journeys) && journeys.length > 0 ? (
              journeys.map((journey) => (
                <div
                  key={journey.id}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-2">
                    🛣️ {journey.route?.name || journey.route_name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Bus:</strong>{" "}
                    {journey.bus?.bus_number || journey.bus_number}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Departure:</strong>{" "}
                    {new Date(journey.scheduled_departure).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Arrival:</strong>{" "}
                    {new Date(journey.scheduled_arrival).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Fare:</strong> UGX{" "}
                    {Number(journey.fare).toLocaleString()}
                  </p>

                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Seats Available:</strong> {journey.available_seats}
                  </p>
                  <p className="text-sm text-gray-600 mb-2 capitalize">
                    <strong>Status:</strong> {journey.status}
                  </p>
                  <div className="buttons mt-2 flex gap-2">
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      onClick={() => markJourneyCompleted(journey.id)}
                    >
                      Mark as Completed
                    </button>

                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      onClick={() => cancelJourney(journey.id)}
                    >
                      Cancel Journey
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No journeys assigned for today.</p>
            )}
          </div>
        )}

        {/* === Buses Tab === */}
        {activeTab === "buses" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedBuses.length > 0 ? (
              assignedBuses.map((bus) => (
                <div key={bus.id} className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-2">
                    🚌 Bus {bus.bus_number}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>License:</strong> {bus.license_plate}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Capacity:</strong> {bus.capacity}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Status:</strong> {bus.status}
                  </p>
                </div>
              ))
            ) : (
              <p>No bus assigned yet.</p>
            )}
          </div>
        )}

        {/* === Earnings Tab === */}
        {activeTab === "earnings" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["today", "week", "month"].map((period) => (
              <div
                key={period}
                className="bg-white shadow-lg rounded-lg p-6 text-center"
              >
                <h3 className="text-sm font-medium text-gray-500 capitalize">
                  {period === "today"
                    ? "Today"
                    : period === "week"
                    ? "This Week"
                    : "This Month"}
                </h3>
                <p className="mt-2 text-2xl font-semibold text-green-600">
                  UGX {Number(earnings[period]).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ================= ADMIN DASHBOARD =================
export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // State
  const [drivers, setDrivers] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [topupAmounts, setTopupAmounts] = useState({});
  const token = localStorage.getItem("token");
  const [routes, setRoutes] = useState([]);
  const [driverDropdowns, setDriverDropdowns] = useState({});
  const [journeyForm, setJourneyForm] = useState({
    bus_id: "",
    route_id: "",
    scheduled_departure: "",
    scheduled_arrival: "",
    available_seats: "",
    fare: 0, // new field for fare
  });

  const [editingJourney, setEditingJourney] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [overviewCounts, setOverviewCounts] = useState({
    buses_count: 0,
    journeys_count: 0,
    drivers_count: 0,
    passengers_count: 0,
  });

  useEffect(() => {
    const fetchOverviewCounts = async () => {
      try {
        const res = await apiRequest("/admin/overview-counts/", {
          method: "GET",
          token,
        });
        setOverviewCounts(res);
        console.log("📊 Admin overview counts:", res);
      } catch (err) {
        console.error("❌ Failed to fetch overview counts:", err);
      }
    };

    fetchOverviewCounts();
  }, []);

  const openEditModal = (journey) => {
    setEditingJourney(journey);
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingJourney(null);
    setShowModal(false);
  };

  // Fetch data
  const fetchData = async () => {
    try {
      let driversData = drivers;

      // ✅ ALWAYS fetch drivers first if viewing buses or drivers tab
      if (
        activeTab === "drivers" ||
        activeTab === "buses" ||
        drivers.length === 0
      ) {
        const data = await apiRequest("/auth/drivers/", { token });
        driversData = data.results || data;
        setDrivers(driversData);
      }

      if (activeTab === "passengers") {
        const data = await apiRequest("/auth/passengers/", { token });
        setPassengers(data.results || data);
      }

      if (activeTab === "buses") {
        const data = await apiRequest("/buses/admin-buses/", { token });
        console.log("🚌 Raw buses data:", data);

        // ✅ Use driversData (just fetched) instead of drivers (stale state)
        setBuses(
          (data.results || data).map((b) => {
            const driver = driversData.find((d) => d.id === b.driver_id);
            return {
              ...b,
              driver_name: driver
                ? `${driver.first_name} ${driver.last_name}`
                : "Unassigned",
            };
          })
        );
      }

      if (activeTab === "journeys") {
        const [routesRes, journeysRes] = await Promise.all([
          apiRequest("/routes/routes/", { token }),
          apiRequest("/journeys/journeys/", { token }),
        ]);

        setRoutes(routesRes.results || routesRes);
        setJourneys(
          (journeysRes.results || journeysRes).map((j) => ({
            ...j,
            route_name: j.route?.name || j.route__name || "Unknown Route",
            bus_number: j.bus?.bus_number || j.bus__bus_number || "Unknown Bus",
          }))
        );
      }

      if (activeTab === "overview") {
        // ✅ Fetch fresh data for overview instead of using stale state
        const [busesRes, driversRes, passengersRes, journeysRes] =
          await Promise.all([
            apiRequest("/buses/admin-buses/", { token }),
            apiRequest("/auth/drivers/", { token }),
            apiRequest("/auth/passengers/", { token }),
            apiRequest("/journeys/journeys/", { token }),
          ]);

        setAnalytics({
          totalBuses: (busesRes.results || busesRes).length,
          totalDrivers: (driversRes.results || driversRes).length,
          totalPassengers: (passengersRes.results || passengersRes).length,
          totalJourneys: (journeysRes.results || journeysRes).length,
        });
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await apiRequest("/routes/routes/", { method: "GET", token });
      setRoutes(res);
      console.log("🛣 Routes fetched:", res);
    } catch (err) {
      console.error("Failed to fetch routes:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let driversData = drivers;

        // ✅ Fetch drivers first
        if (
          drivers.length === 0 ||
          activeTab === "drivers" ||
          activeTab === "buses"
        ) {
          const driverRes = await apiRequest("/auth/drivers/", { token });
          driversData = driverRes.results || driverRes;
          setDrivers(driversData);
        }

        if (activeTab === "buses") {
          const busRes = await apiRequest("/buses/admin-buses/", { token });
          const busData = busRes.results || busRes;

          // Attach driver names to each bus
          const mapped = busData.map((b) => {
            const foundDriver = driversData.find((d) => d.id === b.driver_id);
            return {
              ...b,
              driver_name: foundDriver
                ? `${foundDriver.first_name} ${foundDriver.last_name}`
                : "Unassigned",
            };
          });

          setBuses(mapped);
          console.log("✅ Buses with driver names:", mapped);
        }

        if (activeTab === "journeys") {
          await fetchRoutes();
          const journeyRes = await apiRequest("/journeys/journeys/", { token });
          setJourneys(journeyRes.results || journeyRes);
        }

        if (activeTab === "passengers") {
          const data = await apiRequest("/auth/passengers/", { token });
          setPassengers(data.results || data);
        }
      } catch (err) {
        console.error("Admin fetch error:", err);
      }
    };

    fetchData();
  }, [activeTab, token]);

  // Wallet top-up
  const topupWallet = async (userId, amount) => {
    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    try {
      const res = await apiRequest(`/payments/wallet/topup/${userId}/`, {
        method: "POST",
        body: { amount: Number(amount) },
        token,
      });

      alert(
        `✅ ${res.user} wallet topped up! New balance: UGX ${res.new_balance}`
      );

      // Update local passengers state
      setPassengers((prev) =>
        prev.map((p) =>
          p.id === userId ? { ...p, wallet_balance: res.new_balance } : p
        )
      );
    } catch (err) {
      console.error("Top-up failed:", err);
      alert("❌ Top-up failed. See console for details.");
    }
  };

  // Assign driver to bus
  const assignDriver = async (busId, driverId = null) => {
    try {
      const body = { bus_id: busId };
      if (driverId !== null)
        body.driver_id = driverId; // only include if assigning
      else body.driver_id = null; // explicitly null for unassign

      const result = await apiRequest("/buses/assign-driver/", {
        method: "POST",
        token,
        body,
      });

      alert(driverId ? "✅ Driver assigned" : "⚪ Bus unassigned");

      // Update local bus list
      const busesData = await apiRequest("/buses/admin-buses/", { token });
      console.log("🚌 Raw buses data:", busesData);
      setBuses(busesData.results || busesData);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update assignment");
    }
  };

  // Delete Journey
  const deleteJourney = async (journeyId) => {
    if (!window.confirm("Are you sure you want to delete this journey?"))
      return;

    try {
      await apiRequest(`/journeys/journeys/${journeyId}/`, {
        method: "DELETE",
        token,
      });

      alert("🗑️ Journey deleted successfully");
      setJourneys((prev) => prev.filter((j) => j.id !== journeyId));
    } catch (err) {
      console.error("Failed to delete journey:", err);
      alert("❌ Failed to delete journey. Check console for details.");
    }
  };

  const updateJourney = async (journey) => {
    try {
      const payload = {
        bus: journey.bus.id,
        route: journey.route.id,
        fare: Number(journey.fare),
        available_seats: Number(journey.available_seats),
        total_seats: Number(journey.total_seats),
        scheduled_departure: journey.scheduled_departure,
        scheduled_arrival: journey.scheduled_arrival,
        status: journey.status,
      };

      const result = await apiRequest(`/journeys/journeys/${journey.id}/`, {
        method: "PUT", // or PATCH for partial updates
        token,
        body: payload,
      });

      alert("✅ Journey updated successfully");

      setJourneys((prev) =>
        prev.map((j) => (j.id === journey.id ? result : j))
      );
      closeModal();
    } catch (err) {
      console.error("Failed to update journey:", err);
      alert("❌ Failed to update journey. Check console for details.");
    }
  };

  // ================= Bus Status Update =================
  const handleStatusChange = async (e, bus) => {
    const newStatus = e.target.value;

    try {
      await apiRequest(`/buses/${bus.id}/`, {
        method: "PATCH",
        token,
        body: { status: newStatus },
      });

      alert(`✅ Status for ${bus.number} updated to ${newStatus}`);

      // Update the UI immediately
      setBuses((prev) =>
        prev.map((b) => (b.id === bus.id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error("Failed to update bus status:", err);
      alert("❌ Failed to update bus status");
    }
  };

  // ================= Assign Bus to Route (Create Journey) =================
  const assignBusToRoute = async () => {
    const busId = Number(journeyForm.bus_id);
    const routeId = Number(journeyForm.route_id);

    if (!busId || !routeId) {
      alert("Please select both a bus and a route");
      return;
    }

    const departure = journeyForm.scheduled_departure
      ? new Date(journeyForm.scheduled_departure).toISOString()
      : new Date().toISOString();

    const arrival = journeyForm.scheduled_arrival
      ? new Date(journeyForm.scheduled_arrival).toISOString()
      : new Date(
          new Date(departure).getTime() + 3 * 60 * 60 * 1000
        ).toISOString(); // +3 hours

    const payload = {
      bus: busId,
      route: routeId,
      scheduled_departure: departure,
      scheduled_arrival: arrival,
      available_seats: Number(journeyForm.available_seats) || 0,
      total_seats: Number(journeyForm.available_seats) || 0,
      status: "scheduled",
      fare: journeyForm.fare, // optional, backend may overwrite
    };

    console.log("🚀 Sending payload:", payload);

    try {
      const result = await apiRequest("/journeys/journeys/", {
        method: "POST",
        token,
        body: payload,
      });
      alert("✅ Journey successfully created");
      setJourneys((prev) => [...prev, result]);
      // ✅ Reset the form to initial state
      setJourneyForm({
        bus_id: "",
        route_id: "",
        scheduled_departure: "",
        scheduled_arrival: "",
        available_seats: "",
        fare: 0,
      });
    } catch (err) {
      console.error("Journey assignment failed:", err.response?.data || err);
      alert("❌ Failed to create journey. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          <h1 className="text-2xl font-bold">🛠 Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span>Welcome, {user?.first_name || "System"}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b flex space-x-6 p-4">
        {["overview", "buses", "drivers", "passengers", "journeys"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-3 border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </nav>

      {/* Content */}
      <div className="p-6">
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <h3 className="text-gray-600">Buses</h3>
              <p className="text-2xl font-bold">{overviewCounts.buses_count}</p>
            </div>

            <div className="bg-white rounded-xl shadow p-6 text-center">
              <h3 className="text-gray-600">Journeys</h3>
              <p className="text-2xl font-bold">
                {overviewCounts.journeys_count}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow p-6 text-center">
              <h3 className="text-gray-600">Drivers</h3>
              <p className="text-2xl font-bold">
                {overviewCounts.drivers_count}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow p-6 text-center">
              <h3 className="text-gray-600">Passengers</h3>
              <p className="text-2xl font-bold">
                {overviewCounts.passengers_count}
              </p>
            </div>
          </div>
        )}

        {/* Drivers */}
        {activeTab === "drivers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((d) => {
              // Find the bus currently assigned to this driver
              const assignedBus = buses.find((b) => b.driver_id === d.id);

              return (
                <div
                  key={d.id}
                  className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg">
                    {d.first_name} {d.last_name}
                  </h3>
                  <p className="text-gray-600">{d.email}</p>
                  <p className="text-gray-600">📞 {d.phone_number}</p>

                  <div className="mt-3">
                    <label className="block text-gray-700 mb-1">
                      Assign Bus:
                    </label>
                    <select
                      className="border px-2 py-1 rounded w-full"
                      value={assignedBus?.id || ""}
                      onChange={(e) => {
                        const busId = e.target.value || null; // null for unassign
                        assignDriver(busId, d.id);
                      }}
                    >
                      <option value="">-- Select Bus --</option>
                      {buses.map((b) => (
                        <option
                          key={b.id}
                          value={b.id}
                          disabled={
                            b.driver_id && b.driver_id !== d.id // disable if assigned to another driver
                          }
                        >
                          {b.bus_number}{" "}
                          {b.driver_id
                            ? b.driver_id === d.id
                              ? "(Currently Assigned)"
                              : "(Assigned to another driver)"
                            : "(Available)"}
                        </option>
                      ))}
                    </select>

                    {assignedBus && (
                      <button
                        className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 w-full"
                        onClick={() => assignDriver(null, d.id)} // Unassign
                      >
                        Unassign Bus
                      </button>
                    )}
                  </div>

                  {assignedBus && (
                    <p className="mt-2 text-green-600 font-medium">
                      Currently: {assignedBus.bus_number}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Passengers */}
        {activeTab === "passengers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {passengers.map((p) => {
              // fallback if wallet object is missing
              const walletBalance = p.wallet?.balance ?? 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-lg">
                      {p.first_name} {p.last_name}
                    </h3>
                    <p className="text-gray-600">{p.email}</p>
                    <p className="text-gray-600">📞 {p.phone_number}</p>
                    <p className="mt-1 text-gray-700">
                      Wallet: UGX {Number(walletBalance).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <input
                      type="number"
                      placeholder="Top-up"
                      className="border px-2 py-1 rounded flex-1"
                      value={topupAmounts[p.id] || ""}
                      onChange={(e) =>
                        setTopupAmounts({
                          ...topupAmounts,
                          [p.id]: e.target.value,
                        })
                      }
                    />
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      onClick={() => topupWallet(p.id, topupAmounts[p.id])} // <-- same as before
                    >
                      Top Up
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Buses */}
        {activeTab === "buses" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buses.map((bus) => {
              const assignedDriver = drivers.find(
                (d) => d.id === bus.driver_id
              );

              const handleStatusChange = async (e) => {
                const newStatus = e.target.value;
                try {
                  await apiRequest(`/buses/${bus.id}/update_status/`, {
                    method: "PATCH",
                    token,
                    body: { status: newStatus },
                  });

                  // Update state
                  setBuses((prevBuses) =>
                    prevBuses.map((b) =>
                      b.id === bus.id ? { ...b, status: newStatus } : b
                    )
                  );

                  alert(
                    `✅ Status for ${bus.bus_number} updated to ${newStatus}`
                  );
                } catch (err) {
                  console.error("❌ Error updating bus status:", err);
                  alert("Failed to update bus status. Try again.");
                }
              };

              return (
                <div
                  key={bus.id}
                  className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg mb-2">
                    Bus {bus.bus_number}
                  </h3>

                  {/* ✅ Status Dropdown */}
                  <div className="mb-3">
                    <label className="block text-gray-600 mb-1">Status:</label>
                    <select
                      value={bus.status}
                      onChange={(e) => handleStatusChange(e, bus)}
                      className="border px-2 py-1 rounded w-full"
                    >
                      <option value="active">Active</option>
                      <option value="under_maintenance">
                        Under Maintenance
                      </option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* ✅ Assigned Driver Display */}
                  <p
                    className={`font-medium mb-2 ${
                      assignedDriver ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {assignedDriver
                      ? `Assigned to ${assignedDriver.first_name} ${assignedDriver.last_name}`
                      : "Unassigned"}
                  </p>

                  {/* ✅ Assign / Unassign Driver */}
                  <div>
                    <label className="block text-gray-700 mb-1">
                      Assign Driver:
                    </label>
                    <select
                      className="border px-2 py-1 rounded w-full"
                      value={assignedDriver?.id || ""}
                      onChange={(e) => {
                        const driverId = e.target.value || null;
                        assignDriver(bus.id, driverId);
                      }}
                    >
                      <option value="">-- Select Driver --</option>
                      {drivers.map((d) => (
                        <option
                          key={d.id}
                          value={d.id}
                          disabled={
                            d.id !== assignedDriver?.id &&
                            buses.some((b) => b.driver_id === d.id)
                          }
                        >
                          {d.first_name} {d.last_name} (
                          {buses.some((b) => b.driver_id === d.id)
                            ? "Assigned"
                            : "Available"}
                          )
                        </option>
                      ))}
                    </select>

                    {assignedDriver && (
                      <button
                        className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 w-full"
                        onClick={() => assignDriver(bus.id, null)}
                      >
                        Unassign Driver
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Journey Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Edit Journey</h3>

              {/* Bus */}
              <label>Bus</label>
              <select
                value={editingJourney.bus?.id || ""}
                onChange={(e) =>
                  setEditingJourney({
                    ...editingJourney,
                    bus: buses.find((b) => b.id === Number(e.target.value)),
                  })
                }
                className="w-full border p-2 mb-2"
              >
                <option value="">Select Bus</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.number}
                  </option>
                ))}
              </select>

              {/* Route selection */}
              <label>Route:</label>
              <select
                value={journeyForm.route_id}
                onChange={(e) => {
                  const selectedRouteId = Number(e.target.value);
                  const selectedRoute = routes.find(
                    (r) => r.id === selectedRouteId
                  );
                  setJourneyForm({
                    ...journeyForm,
                    route_id: selectedRouteId,
                    fare: selectedRoute ? selectedRoute.base_fare : 0,
                  });
                }}
              >
                <option value="">-- Select Route --</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.start_location} → {r.end_location}) - UGX{" "}
                    {r.base_fare}
                  </option>
                ))}
              </select>

              {/* Fare */}
              <label>Fare (UGX):</label>
              <input
                type="number"
                value={journeyForm.fare}
                readOnly
                className="bg-gray-100 border px-2 py-1 rounded w-full"
              />

              {/* Available Seats */}
              <label>Available Seats</label>
              <input
                type="number"
                value={editingJourney.available_seats}
                onChange={(e) =>
                  setEditingJourney({
                    ...editingJourney,
                    available_seats: e.target.value,
                  })
                }
                className="w-full border p-2 mb-2"
              />

              {/* Total Seats */}
              <label>Total Seats</label>
              <input
                type="number"
                value={editingJourney.total_seats}
                onChange={(e) =>
                  setEditingJourney({
                    ...editingJourney,
                    total_seats: e.target.value,
                  })
                }
                className="w-full border p-2 mb-2"
              />

              {/* Departure */}
              <label>Departure</label>
              <input
                type="datetime-local"
                value={new Date(editingJourney.scheduled_departure)
                  .toISOString()
                  .slice(0, 16)}
                onChange={(e) =>
                  setEditingJourney({
                    ...editingJourney,
                    scheduled_departure: e.target.value,
                  })
                }
                className="w-full border p-2 mb-2"
              />

              {/* Arrival */}
              <label>Arrival</label>
              <input
                type="datetime-local"
                value={new Date(editingJourney.scheduled_arrival)
                  .toISOString()
                  .slice(0, 16)}
                onChange={(e) =>
                  setEditingJourney({
                    ...editingJourney,
                    scheduled_arrival: e.target.value,
                  })
                }
                className="w-full border p-2 mb-2"
              />

              {/* Status */}
              <label>Status</label>
              <select
                value={editingJourney.status}
                onChange={(e) =>
                  setEditingJourney({
                    ...editingJourney,
                    status: e.target.value,
                  })
                }
                className="w-full border p-2 mb-2"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateJourney(editingJourney)}
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Journeys */}
        {activeTab === "journeys" && (
          <div className="space-y-6">
            {/* Assign Bus to Route */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-4">
                🛣 Assign Bus to Route
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Bus */}
                <div>
                  <label className="block text-gray-700 mb-1">Bus</label>
                  <select
                    className="border px-3 py-2 rounded w-full"
                    value={journeyForm.bus_id || ""}
                    onChange={(e) => {
                      const busArray = Array.isArray(buses)
                        ? buses
                        : Object.values(buses);
                      const selectedBus = busArray.find(
                        (b) => b.id.toString() === e.target.value
                      );
                      setJourneyForm((prev) => ({
                        ...prev,
                        bus_id: e.target.value,
                        available_seats: selectedBus
                          ? selectedBus.capacity
                          : "",
                      }));
                    }}
                  >
                    <option value="">-- Select Bus --</option>
                    {(Array.isArray(buses) ? buses : Object.values(buses)).map(
                      (b) => (
                        <option key={b.id} value={b.id}>
                          {b.bus_number} ({b.status})
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Route */}
                <div>
                  <label className="block text-gray-700 mb-1">Route</label>
                  <select
                    className="border px-3 py-2 rounded w-full"
                    value={journeyForm.route_id || ""}
                    onChange={(e) => {
                      const routeArray = Array.isArray(routes)
                        ? routes
                        : Object.values(routes);
                      const selectedRoute = routes.find(
                        (r) => r.id === parseInt(e.target.value)
                      );
                      setJourneyForm((p) => ({
                        ...p,
                        route_id: e.target.value,
                        fare: selectedRoute?.base_fare || 0,
                      }));

                      setJourneyForm((prev) => ({
                        ...prev,
                        route_id: e.target.value,
                        fare: selectedRoute?.base_fare
                          ? Number(selectedRoute.base_fare)
                          : 0, // ✅ always default to 0 if missing
                      }));
                    }}
                  >
                    <option value="">-- Select Route --</option>
                    {(Array.isArray(routes)
                      ? routes
                      : Object.values(routes)
                    ).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.route_type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fare */}
                <div>
                  <label className="block text-gray-700 mb-1">Fare (UGX)</label>
                  <input
                    type="number"
                    className="border px-3 py-2 rounded w-full bg-gray-100"
                    value={journeyForm.fare || ""}
                    readOnly
                  />
                </div>

                {/* Available Seats */}
                <div>
                  <label className="block text-gray-700 mb-1">
                    Available Seats
                  </label>
                  <input
                    type="number"
                    className="border px-3 py-2 rounded w-full bg-gray-100"
                    value={journeyForm.available_seats || ""}
                    readOnly
                  />
                </div>

                {/* Departure */}
                <div>
                  <label className="block text-gray-700 mb-1">
                    Departure Time
                  </label>
                  <input
                    type="datetime-local"
                    className="border px-3 py-2 rounded w-full"
                    value={journeyForm.scheduled_departure || ""}
                    onChange={(e) =>
                      setJourneyForm((prev) => ({
                        ...prev,
                        scheduled_departure: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Arrival */}
                <div>
                  <label className="block text-gray-700 mb-1">
                    Arrival Time
                  </label>
                  <input
                    type="datetime-local"
                    className="border px-3 py-2 rounded w-full"
                    value={journeyForm.scheduled_arrival || ""}
                    onChange={(e) =>
                      setJourneyForm((prev) => ({
                        ...prev,
                        scheduled_arrival: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <button
                onClick={assignBusToRoute}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Assign Journey
              </button>
            </div>

            {/* Journey List */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Existing Journeys</h3>
              <table className="w-full text-sm text-left border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Bus</th>
                    <th className="p-2 border">Route</th>
                    <th className="p-2 border">Fare</th>
                    <th className="p-2 border">Seats</th>
                    <th className="p-2 border">Departure</th>
                    <th className="p-2 border">Arrival</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border text-center">Actions</th>
                    <th className="p-2 border">Cancellation Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {journeys.map((j) => (
                    <tr key={j.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{j.bus_number}</td>
                      <td className="p-2">{j.route_name}</td>
                      <td className="p-2">UGX {j.fare}</td>
                      <td className="p-2">{j.available_seats}</td>
                      <td className="p-2">
                        {new Date(j.scheduled_departure).toLocaleString()}
                      </td>
                      <td className="p-2">
                        {new Date(j.scheduled_arrival).toLocaleString()}
                      </td>
                      <td className="p-2 capitalize">{j.status}</td>
                      <td className="p-2 text-center flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(j)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteJourney(j.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </td>
                      <td className="p-2">{j.cancellation_reason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
const TransportApp = () => {
  const [currentView, setCurrentView] = useState("login");
  const { user, loading, login } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && currentView === "login") {
        setCurrentView("dashboard");
      } else if (!user && currentView === "dashboard") {
        setCurrentView("login");
      }
    }
  }, [user, loading, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading Transport System...</p>
        </div>
      </div>
    );
  }

  const handleLogin = () => {
    setCurrentView("dashboard");
  };

  const handleSwitchToSignup = () => setCurrentView("signup");
  const handleSignup = async (username, password) => {
    // Reuse login to auto-login after signup
    await login(username, password);
    setCurrentView("dashboard");
  };

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.user_type) {
      case "passenger":
        return <PassengerDashboard />;
      case "driver":
        return <DriverDashboard />;
      case "admin":
        return <AdminDashboard />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Unknown User Type
              </h2>
              <p className="text-gray-600">Please contact administrator</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {currentView === "login" && (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToSignup={handleSwitchToSignup}
        />
      )}
      {currentView === "signup" && <SignupPage onSignup={handleSignup} />}
      {currentView === "dashboard" && renderDashboard()}
    </div>
  );
};

// Main App with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <TransportApp />
    </AuthProvider>
  );
};

export default App;
