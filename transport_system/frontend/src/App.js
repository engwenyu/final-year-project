/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, {
  useState,
  useEffect,
  createContext,
  useRef,
  useContext,
} from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import EnhancedPassengersSection from "./EnhancedPassengersSection"; // adjust path
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Award,
  ArrowUp,
  ArrowDown,
  TrendingDown,
  Users,
  Bus,
  MapPin,
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import "./LoginPage.css";

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
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">Sign In</h1>
        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <button onClick={onSwitch}>
            Don’t have an account? <span>Sign up</span>
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
const RatingModal = ({ isOpen, onClose, onSubmit, booking }) => {
  const [driverRating, setDriverRating] = useState(0);
  const [busRating, setBusRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (driverRating === 0 || busRating === 0 || serviceRating === 0) {
      alert("Please provide all ratings");
      return;
    }

    onSubmit({
      driver_rating: driverRating,
      bus_rating: busRating,
      service_rating: serviceRating,
      comment: comment,
    });
  };

  const StarRating = ({ rating, setRating, label }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="text-3xl focus:outline-none"
          >
            {star <= rating ? "⭐" : "☆"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Rate Your Journey</h2>

        <form onSubmit={handleSubmit}>
          <StarRating
            rating={driverRating}
            setRating={setDriverRating}
            label="Driver Rating"
          />

          <StarRating
            rating={busRating}
            setRating={setBusRating}
            label="Bus Condition Rating"
          />

          <StarRating
            rating={serviceRating}
            setRating={setServiceRating}
            label="Service Rating"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
              placeholder="Share your experience..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Submit Rating
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Leaflet Map Component for Bus Tracking

const BusTrackingMap = ({ booking }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const busMarkerRef = useRef(null);
  const animationRef = useRef(null);

  const [routeStops, setRouteStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState("");
  const [eta, setEta] = useState("");
  const [distance, setDistance] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const didFetchStopsRef = useRef(false);
  const didLoadLeafletRef = useRef(false);

  // Generate coordinates for stops that don't have them
  const addCoordinatesToStops = (stops) => {
    // Check if stops already have coordinates
    const hasCoordinates = stops.every((s) => s.latitude && s.longitude);
    if (hasCoordinates) {
      console.log("✅ All stops have coordinates");
      return stops;
    }

    console.log(
      "⚠️ Some stops missing coordinates, generating demo coordinates"
    );

    // Base coordinates (Kampala area)
    const startLat = 0.3476;
    const startLng = 32.5825;

    // Generate coordinates along a line
    return stops.map((stop, index) => {
      // If stop already has coordinates, use them
      if (stop.latitude && stop.longitude) {
        return stop;
      }

      // Generate coordinates based on stop order
      const latOffset = index * 0.02; // ~2km per stop
      const lngOffset = index * 0.015;

      return {
        ...stop,
        latitude: startLat + latOffset,
        longitude: startLng + lngOffset,
      };
    });
  };

  // Load Leaflet library first
  useEffect(() => {
    if (didLoadLeafletRef.current || window.L) {
      setLeafletLoaded(true);
      return;
    }

    didLoadLeafletRef.current = true;

    try {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }

      if (!document.querySelector('script[src*="leaflet.js"]')) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.crossOrigin = "anonymous";
        script.onload = () => {
          console.log("✅ Leaflet loaded successfully");
          setLeafletLoaded(true);
        };
        script.onerror = (err) => {
          console.error("❌ Failed to load Leaflet:", err);
          setError("Failed to load map library");
        };
        document.body.appendChild(script);
      } else {
        setLeafletLoaded(true);
      }
    } catch (err) {
      console.error("❌ Error loading Leaflet:", err);
      setError("Failed to initialize map");
    }
  }, []);

  // Fetch stops
  useEffect(() => {
    if (didFetchStopsRef.current) return;
    didFetchStopsRef.current = true;

    const fetchStopsForJourney = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      console.log("🔍 Full booking object:", booking);

      const journeyId = booking?.journey?.id;

      if (!journeyId) {
        setError("No journey ID found");
        setLoading(false);
        return;
      }

      try {
        console.log(`📡 Fetching journey ${journeyId} details...`);
        const journeyData = await apiRequest(
          `/journeys/journeys/${journeyId}/`,
          { token }
        );

        console.log("✅ Journey data:", journeyData);

        const routeId = journeyData.route_id || journeyData.route;

        if (!routeId) {
          setError("No route ID found in journey");
          setLoading(false);
          return;
        }

        console.log(`📡 Found route ID: ${routeId}, fetching stops...`);

        const stopsData = await apiRequest(`/routes/${routeId}/stops/`, {
          token,
        });

        let stopsList = stopsData.results || stopsData || [];

        console.log(`✅ Fetched ${stopsList.length} stops:`, stopsList);

        if (!stopsList.length) {
          setError("No stops found for this route");
          setLoading(false);
          return;
        }

        // Sort by stop_order
        stopsList.sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));

        // Check if Kampala stop exists
        const hasKampalaStop = stopsList.some((stop) =>
          (stop.stop_name || stop.name)?.toLowerCase().includes("kampala")
        );

        if (!hasKampalaStop) {
          const kampalaStop = {
            id: `kampala_${routeId}`,
            stop_name: "Kampala Central",
            name: "Kampala Central",
            distance_from_start: 0,
            fare: 0,
            latitude: 0.3476,
            longitude: 32.5825,
            stop_order: 0,
          };
          stopsList = [kampalaStop, ...stopsList];
        }

        // Add coordinates to stops that don't have them
        const stopsWithCoordinates = addCoordinatesToStops(stopsList);

        console.log("✅ Final stops with coordinates:", stopsWithCoordinates);
        setRouteStops(stopsWithCoordinates);
      } catch (err) {
        console.error("❌ Error fetching route data:", err);
        setError(`Failed to load route: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStopsForJourney();
  }, [booking]);

  // Initialize map
  useEffect(() => {
    if (
      !routeStops.length ||
      loading ||
      !leafletLoaded ||
      !window.L ||
      !mapRef.current
    ) {
      return;
    }

    console.log("🗺️ Initializing map with stops:", routeStops);

    try {
      const L = window.L;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Validate first stop has coordinates
      if (!routeStops[0]?.latitude || !routeStops[0]?.longitude) {
        throw new Error("First stop missing coordinates");
      }

      const map = L.map(mapRef.current).setView(
        [routeStops[0].latitude, routeStops[0].longitude],
        10
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Filter out stops without valid coordinates
      const validStops = routeStops.filter(
        (s) =>
          s.latitude !== undefined &&
          s.latitude !== null &&
          s.longitude !== undefined &&
          s.longitude !== null &&
          !isNaN(s.latitude) &&
          !isNaN(s.longitude)
      );

      console.log(
        `✅ Valid stops with coordinates: ${validStops.length}/${routeStops.length}`
      );

      if (validStops.length < 2) {
        throw new Error("Not enough stops with valid coordinates");
      }

      const latLngs = validStops.map((s) => [s.latitude, s.longitude]);

      L.polyline(latLngs, { color: "#3b82f6", weight: 4, opacity: 0.7 }).addTo(
        map
      );

      if (latLngs.length > 1) {
        map.fitBounds(latLngs, { padding: [50, 50] });
      }

      // Add stop markers
      validStops.forEach((stop, i) => {
        const isStart = i === 0;
        const isEnd = i === validStops.length - 1;
        const color = isStart ? "#10b981" : isEnd ? "#ef4444" : "#6b7280";

        L.circleMarker([stop.latitude, stop.longitude], {
          radius: 8,
          fillColor: color,
          color: "#fff",
          weight: 2,
          fillOpacity: 0.8,
        })
          .bindPopup(
            `<b>${stop.stop_name || stop.name}</b><br>` +
              `${isStart ? "Start" : isEnd ? "End" : `Stop ${i + 1}`}<br>` +
              `Fare: UGX ${Number(stop.fare || 0).toLocaleString()}`
          )
          .addTo(map);
      });

      // Bus marker
      const busMarker = L.marker(
        [validStops[0].latitude, validStops[0].longitude],
        {
          icon: L.divIcon({
            html: '<div style="font-size: 30px;">🚌</div>',
            className: "bus-marker",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
          zIndexOffset: 1000,
        }
      ).addTo(map);

      busMarker.bindPopup(
        `<b>Bus ${booking?.journey?.bus_number || "N/A"}</b><br>` +
          `Route: ${booking?.journey?.route_name || "N/A"}<br>` +
          `Status: En Route`
      );

      mapInstanceRef.current = map;
      busMarkerRef.current = busMarker;

      console.log("✅ Map initialized successfully");

      // Animate bus
      const animateBus = () => {
        const duration = 60000;
        const startTime = Date.now();

        const animate = () => {
          try {
            const elapsed = Date.now() - startTime;
            const prog = Math.min(elapsed / duration, 1);
            const segmentCount = validStops.length - 1;
            const currentSegmentFloat = prog * segmentCount;
            const currentSegment = Math.floor(currentSegmentFloat);
            const segmentProg = currentSegmentFloat - currentSegment;

            if (currentSegment < segmentCount) {
              const start = validStops[currentSegment];
              const end = validStops[currentSegment + 1];
              const lat =
                start.latitude + (end.latitude - start.latitude) * segmentProg;
              const lng =
                start.longitude +
                (end.longitude - start.longitude) * segmentProg;

              if (busMarkerRef.current) {
                busMarkerRef.current.setLatLng([lat, lng]);
              }

              setCurrentLocation(
                segmentProg < 0.5
                  ? `Near ${start.stop_name || start.name}`
                  : `Approaching ${end.stop_name || end.name}`
              );

              const destination = validStops[validStops.length - 1];
              const R = 6371;
              const dLat = ((destination.latitude - lat) * Math.PI) / 180;
              const dLon = ((destination.longitude - lng) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((lat * Math.PI) / 180) *
                  Math.cos((destination.latitude * Math.PI) / 180) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distKm = R * c;

              setDistance(Math.round(distKm));

              const remainingMin = Math.round((1 - prog) * (duration / 60000));
              setEta(
                remainingMin > 0 ? `${remainingMin} min` : "Arriving soon"
              );
              setProgress(Math.round(prog * 100));
            }

            if (prog < 1) {
              animationRef.current = requestAnimationFrame(animate);
            } else {
              setCurrentLocation(
                `Arrived at ${validStops[validStops.length - 1].stop_name}`
              );
              setEta("Arrived");
              setDistance(0);
            }
          } catch (err) {
            console.error("❌ Animation error:", err);
          }
        };

        animate();
      };

      animateBus();
    } catch (err) {
      console.error("❌ Error initializing map:", err);
      setError(`Map initialization failed: ${err.message}`);
    }

    return () => {
      try {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (err) {
        console.error("❌ Cleanup error:", err);
      }
    };
  }, [routeStops, loading, leafletLoaded, booking]);

  if (!leafletLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map library...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading route map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg border-2 border-red-200">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-800 font-semibold mb-2">Unable to Load Map</p>
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-xs text-gray-500 mt-2">
            Check console for details
          </p>
        </div>
      </div>
    );
  }

  if (!routeStops.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-600">No stops found for this route</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route Info */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-2">
          {booking?.journey?.route_name || "Route"}
        </h3>
        <p className="text-sm text-gray-600">
          Bus Number:{" "}
          <span className="font-semibold">
            {booking?.journey?.bus_number || "N/A"}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          From:{" "}
          <span className="font-semibold text-green-600">
            {booking?.pickup_stop}
          </span>{" "}
          → To:{" "}
          <span className="font-semibold text-red-600">
            {booking?.dropoff_stop}
          </span>
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Current Location</p>
          <p className="text-lg font-semibold text-gray-900">
            {currentLocation || "Starting..."}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">ETA</p>
          <p className="text-lg font-semibold text-blue-600">
            {eta || "Calculating..."}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Distance Remaining</p>
          <p className="text-lg font-semibold text-gray-900">{distance} km</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Journey Progress
          </span>
          <span className="text-sm font-medium text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-96 rounded-lg shadow-lg border-2 border-gray-200"
        style={{ minHeight: "500px" }}
      />

      {/* Stop List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="font-semibold mb-3">
          Route Stops ({routeStops.length})
        </h4>
        <div className="space-y-2">
          {routeStops.map((stop, index) => (
            <div
              key={stop.id}
              className="flex items-center justify-between py-2 border-b last:border-b-0"
            >
              <div className="flex items-center">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${
                    index === 0
                      ? "bg-green-500"
                      : index === routeStops.length - 1
                      ? "bg-red-500"
                      : "bg-gray-400"
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{stop.stop_name || stop.name}</p>
                  <p className="text-xs text-gray-500">
                    {stop.distance_from_start || 0} km from start
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-green-600">
                UGX {Number(stop.fare || 0).toLocaleString()}
              </p>
            </div>
          ))}
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
  const [trackingBooking, setTrackingBooking] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBooking, setRatingBooking] = useState(null);
  const handleShowRatingModal = () => setShowRatingModal(true);
  const handleCloseRatingModal = () => setShowRatingModal(false);

  const handleRateBooking = (booking) => {
    setRatingBooking(booking);
    setShowRatingModal(true);
  };

  // Fetch wallet and bookings on load
  useEffect(() => {
    fetchWalletAndBookings();
  }, []);

  const fetchWalletAndBookings = async () => {
    try {
      // 1️⃣ Fetch wallet balance
      const walletData = await apiRequest("/payments/wallet/", { token });
      setWalletBalance(walletData.balance || 0);

      // 2️⃣ Fetch all bookings for this user
      const bookingsData = await apiRequest("/journeys/bookings/", { token });
      const allBookings = bookingsData.results || bookingsData || [];

      // 3️⃣ Normalize the data for consistent use in UI
      const normalizedBookings = allBookings.map((b) => ({
        id: b.id,
        booking_reference: b.booking_reference,
        status: b.status,
        seats_booked: b.seats_booked,
        total_fare: b.total_fare,
        base_fare: b.base_fare, // ✅ added
        pickup_stop: b.pickup_stop,
        dropoff_stop: b.dropoff_stop,
        created_at: b.created_at,
        journey: {
          id: b.journey?.id,
          route_name: b.journey?.route_name || b.route_name,
          bus_number: b.journey?.bus?.bus_number || b.bus_number,
          scheduled_departure: b.journey?.scheduled_departure,
          scheduled_arrival: b.journey?.scheduled_arrival,
        },
      }));

      // 4️⃣ Filter out cancelled bookings if you want only active ones
      const activeBookings = normalizedBookings.filter(
        (b) => b.status !== "cancelled"
      );

      setBookings(activeBookings);
    } catch (err) {
      console.error("❌ Error fetching wallet/bookings:", err);
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

  // Create stops from route endpoints (for outer city routes)
  const createStopsFromRoute = (route) => {
    const startStop = {
      id: `start_${route.id}`,
      stop_name: route.start_location || "Kampala",
      name: route.start_location || "Kampala",
      distance_from_start: 0,
      fare: 0,
      is_route_endpoint: true,
    };

    const endStop = {
      id: `end_${route.id}`,
      stop_name: route.end_location,
      name: route.end_location,
      distance_from_start: route.distance_km || 0,
      fare: route.base_fare || 0,
      is_route_endpoint: true,
    };

    return [startStop, endStop];
  };

  // Fetch stops when route is selected
  const handleRouteSelect = async (route) => {
    try {
      setSelectedRoute(route);

      // Check if it's an outer city route
      const isOuterCity =
        route.route_type?.toLowerCase() === "outer city" ||
        routeType === "outercity";

      if (isOuterCity) {
        // For outer city routes, create stops from start and end locations
        const routeStops = createStopsFromRoute(route);
        setStops(routeStops);

        // Auto-select Kampala as pickup and destination as dropoff
        setSelectedPickup(routeStops[0]); // Kampala
        setSelectedDropoff(routeStops[1]); // Final destination

        console.log("✅ Outer city route - Auto-selected stops:", {
          pickup: routeStops[0].stop_name,
          dropoff: routeStops[1].stop_name,
        });
      } else {
        // For intercity routes, fetch stops from API
        const stopsData = await apiRequest(`/routes/${route.id}/stops/`, {
          token,
        });
        let stopsList = stopsData.results || stopsData || [];

        // Check if Kampala stop exists
        const hasKampalaStop = stopsList.some((stop) =>
          (stop.stop_name || stop.name).toLowerCase().includes("kampala")
        );

        // Add Kampala if not present
        if (!hasKampalaStop) {
          const kampalaStop = {
            id: `kampala_${route.id}`,
            stop_name: "Kampala Central",
            name: "Kampala Central",
            distance_from_start: 0,
            fare: 0,
            is_kampala_default: true,
          };
          stopsList = [kampalaStop, ...stopsList];
        }

        setStops(stopsList);

        // Auto-select first and last stop
        if (stopsList.length > 0) {
          setSelectedPickup(stopsList[0]);
          if (stopsList.length > 1) {
            setSelectedDropoff(stopsList[stopsList.length - 1]);
          }
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
  const bookBus = async (journeyId) => {
    // ensure pickup/dropoff selected and seats
    const seats = Math.min(selectedSeats[journeyId] || 1, 2);
    if (!selectedPickup || !selectedDropoff) {
      alert("Select pickup and dropoff stops first.");
      return;
    }

    // compute actual fare per seat client-side (recommended)
    // If stops objects have 'fare' property which is cumulative fare from origin:
    const actualFarePerSeat = Math.abs(
      Number(selectedDropoff.fare || 0) - Number(selectedPickup.fare || 0)
    );
    // fallback if 0 or not available:
    const finalFarePerSeat =
      actualFarePerSeat || Number(selectedJourneyFareMap?.[journeyId] || 0);

    const totalFare = finalFarePerSeat * seats;

    const payload = {
      seats: seats,
      pickup_stop:
        selectedPickup.id || selectedPickup.stop_name || selectedPickup,
      dropoff_stop:
        selectedDropoff.id || selectedDropoff.stop_name || selectedDropoff,
      actual_fare_per_seat: finalFarePerSeat,
      // optionally include booking_reference if you generate on frontend
    };

    try {
      const res = await apiRequest(`/journeys/journeys/${journeyId}/book/`, {
        method: "POST",
        token,
        body: payload,
      });

      // res now contains BookingSerializer output (with pickup_stop, dropoff_stop, base_fare, total_fare, journey_details)
      alert("✅ Booking successful");
      // add to bookings state so UI updates immediately
      setBookings((prev) => [res, ...prev]);
      // optionally refresh journeys/available to update seat counts
      fetchJourneysForRoute(selectedRoute);
    } catch (err) {
      console.error("Booking failed:", err);
      alert("Booking failed. See console for details.");
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

  const handleTapIn = async (journeyId) => {
    try {
      await apiRequest(`/journeys/journeys/${journeyId}/tap_in/`, {
        token,
        method: "POST",
      });

      // ✅ Immediately update UI
      updateBookingTappedIn(journeyId, true);
    } catch (err) {
      console.error("Tap In Error:", err);
    }
  };

  // Example React onClick
  // Update the function signature to accept booking
  const handleTapOut = async (journeyId, e, booking) => {
    e?.stopPropagation();

    console.log("🔍 Tap Out - Journey ID:", journeyId);
    console.log("🔍 Tap Out - Booking:", booking);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/journeys/journeys/${journeyId}/tap_out/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert(
          `✅ Tap Out Successful!\n\n` +
            `Fare Charged: UGX ${data.fare_charged}\n` +
            `New Balance: UGX ${data.new_balance}`
        );

        // ✅ Refresh wallet AND bookings immediately
        await fetchWalletAndBookings();

        // Show rating modal after successful tap out
        console.log("🔍 Setting rating booking:", booking);
        setRatingBooking(booking);
        setShowRatingModal(true);
      } else {
        // Handle specific error cases
        if (data.detail?.includes("Insufficient balance")) {
          alert(
            "❌ Insufficient Balance\n\nPlease top up your wallet to complete this journey."
          );
        } else {
          alert(`❌ Error: ${data.detail || "Tap out failed"}`);
        }
      }
    } catch (err) {
      console.error("Tap out error:", err);
      alert("❌ Network error. Please check your connection and try again.");
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async ({
    driver_rating,
    bus_rating,
    service_rating,
    comment,
  }) => {
    const journeyId = ratingBooking?.journey?.id || ratingBooking?.journey;

    console.log("🔍 Rating - Journey ID:", journeyId);
    console.log("🔍 Rating - Data:", {
      driver_rating,
      bus_rating,
      service_rating,
      comment,
    });

    if (!journeyId) {
      alert("Error: Journey ID not found");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/ratings/ratings/submit/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            journey_id: journeyId,
            driver_rating: driver_rating,
            bus_rating: bus_rating,
            service_rating: service_rating,
            comment: comment,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert("✅ Thank you for your feedback!");
        setShowRatingModal(false);
        setRatingBooking(null);
        console.log("Rating submitted:", data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Rating submission error:", error);
      alert(`❌ Failed to submit rating: ${error.message}`);
    }
  };

  // Update a single booking in state after tapping
  const updateBookingTappedIn = (journeyId, tappedInStatus) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.journey.id === journeyId || b.journey === journeyId
          ? { ...b, tapped_in: tappedInStatus }
          : b
      )
    );
  };

  const fetchJourneysForRoute = async (routeId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/journeys/?route=${routeId}`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch journeys");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching journeys for route:", error);
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050221] to-[#0f0332] text-[#eaeaea]">
      {/* Header */}
      <header className="bg-[#0f0332]/90 border-b border-[#3a3a3a] shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          <h1 className="text-2xl font-semibold text-[#f3f3f3]">
            🚌 Passenger Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-[#b0b0b0]">
              Welcome,{" "}
              <span className="text-[#f0f0f0]">
                {user?.first_name || "Passenger"}
              </span>
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              💰 UGX {walletBalance.toLocaleString()}
            </span>
            <button
              onClick={logout}
              className="bg-[#5b3838] hover:bg-[#f28b82] text-white px-4 py-2 rounded-md transition"
            >
              Logout
            </button>
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
            <button
              onClick={() => setActiveTab("tracking")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tracking"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📍 Track Bus
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
              <div className="bg-[#0f0332]/80 rounded-2xl shadow-xl p-8 backdrop-blur-md border border-[#3a3a3a]">
                <h2 className="text-2xl font-bold mb-6 text-center text-[#f3f3f3]">
                  Where would you like to go?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => fetchRoutes("intercity")}
                    className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 rounded-2xl shadow-lg transition transform hover:scale-105 hover:shadow-blue-500/40 flex flex-col items-center justify-center"
                  >
                    <div className="text-5xl mb-3 animate-bounce-slow">🏙️</div>
                    <h3 className="text-xl font-bold">Intercity Routes</h3>
                    <p className="text-sm mt-2 opacity-90 text-gray-100 text-center">
                      Short distance within city areas
                    </p>
                  </button>

                  <button
                    onClick={() => fetchRoutes("outercity")}
                    className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-8 rounded-2xl shadow-lg transition transform hover:scale-105 hover:shadow-pink-500/40 flex flex-col items-center justify-center"
                  >
                    <div className="text-5xl mb-3 animate-bounce-slow">🌍</div>
                    <h3 className="text-xl font-bold">Outercity Routes</h3>
                    <p className="text-sm mt-2 opacity-90 text-gray-100 text-center">
                      Long distance to other cities
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Route (as buttons) */}
            {routeType && !selectedRoute && (
              <div className="bg-[#0f0332]/70 rounded-2xl shadow-xl p-6 backdrop-blur-md border border-[#3a3a3a]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#f3f3f3]">
                    Select{" "}
                    {routeType === "intercity" ? "Intercity" : "Outercity"}{" "}
                    Route
                  </h2>
                  <button
                    onClick={resetSearch}
                    className="text-blue-400 hover:text-blue-500 text-sm font-medium transition"
                  >
                    ← Change Route Type
                  </button>
                </div>

                {routes.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No routes available for this type
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {routes.map((route) => (
                      <button
                        key={route.id}
                        onClick={() => handleRouteSelect(route)}
                        className="bg-[#1a1442]/70 border border-[#3a3a3a] hover:border-blue-500 hover:shadow-lg rounded-xl p-5 text-left transition transform hover:scale-[1.02]"
                      >
                        <h3 className="font-bold text-lg mb-2 text-[#f0f0f0]">
                          {route.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3">
                          📍 {route.start_location} → {route.end_location}
                        </p>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#3a3a3a]">
                          <div className="text-xs text-gray-500">
                            <span className="block">
                              📏 {route.distance_km || "N/A"} km
                            </span>
                            <span className="block">
                              ⏱️ {route.estimated_duration_minutes || "N/A"} min
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Base Fare</p>
                            <p className="font-bold text-green-400 text-lg">
                              UGX{" "}
                              {route.base_fare !== undefined &&
                              route.base_fare !== null
                                ? Number(route.base_fare).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Stops (as buttons) */}
            {selectedRoute && journeys.length === 0 && (
              <div className="bg-[#0f0332]/70 rounded-2xl shadow-xl p-6 backdrop-blur-md border border-[#3a3a3a]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#f3f3f3]">
                    Select Your Stops
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedRoute(null);
                      setStops([]);
                    }}
                    className="text-blue-400 hover:text-blue-500 text-sm font-medium transition"
                  >
                    ← Change Route
                  </button>
                </div>

                <div className="mb-6 p-4 bg-[#1a1442]/60 rounded-xl border border-[#3a3a3a]">
                  <h3 className="font-bold text-lg text-[#f3f3f3]">
                    {selectedRoute.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {selectedRoute.start_location} →{" "}
                    {selectedRoute.end_location}
                  </p>
                  <p className="text-sm text-green-400 font-medium mt-1">
                    Base Fare: UGX{" "}
                    {Number(selectedRoute.base_fare).toLocaleString()}
                  </p>
                </div>

                {/* Pickup Stop */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[#f3f3f3] mb-3 flex items-center">
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
                        className={`border-2 rounded-lg p-4 text-left transition transform hover:scale-105 ${
                          selectedPickup?.id === stop.id
                            ? "border-green-500 bg-green-900/30"
                            : "border-[#3a3a3a] hover:border-green-400"
                        }`}
                      >
                        <h4 className="font-bold text-sm mb-1 text-[#f0f0f0]">
                          {stop.stop_name || stop.name}
                        </h4>
                        <p className="text-xs text-gray-400 mb-2">
                          📏 {stop.distance_from_start || 0} km from start
                        </p>
                        <p className="font-semibold text-green-400 text-sm">
                          UGX {Number(stop.fare || 0).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dropoff Stop Selection */}
                {selectedPickup && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-[#f3f3f3] mb-3 flex items-center">
                      <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                        2
                      </span>
                      📍 Select Dropoff Stop
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stops.map((stop) => (
                        <button
                          key={stop.id}
                          onClick={() => setSelectedDropoff(stop)}
                          className={`border-2 rounded-lg p-4 text-left transition transform hover:scale-105 ${
                            selectedDropoff?.id === stop.id
                              ? "border-red-500 bg-red-900/30"
                              : "border-[#3a3a3a] hover:border-red-400"
                          }`}
                        >
                          <h4 className="font-bold text-sm mb-1 text-[#f0f0f0]">
                            {stop.stop_name || stop.name}
                          </h4>
                          <p className="text-xs text-gray-400 mb-2">
                            📏 {stop.distance_from_start || 0} km from start
                          </p>
                          <p className="font-semibold text-red-400 text-sm">
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
                                onClick={() => bookBus(journey.id)}
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
                const routeName =
                  booking.route ||
                  booking.route_name ||
                  booking.journey?.route_name ||
                  booking.journey?.route?.name ||
                  "N/A";

                const busNumber =
                  booking.bus_number ||
                  booking.journey?.bus_number ||
                  booking.journey?.bus?.bus_number ||
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
                        <p className="text-gray-600 mt-1">Bus: {busNumber}</p>

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
                          <>
                            <button
                              onClick={(e) =>
                                booking.tapped_in
                                  ? handleTapOut(
                                      booking.journey?.id || booking.journey_id,
                                      e,
                                      booking // ✅ Make sure this is the full booking object
                                    )
                                  : handleTapIn(
                                      booking.journey?.id || booking.journey_id,
                                      e
                                    )
                              }
                              className={`px-4 py-2 rounded text-white ${
                                booking.tapped_in
                                  ? "bg-orange-600 hover:bg-orange-700"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              {booking.tapped_in ? "Tap Out" : "Tap In"}
                            </button>
                            <button
                              onClick={() => {
                                setTrackingBooking(booking);
                                setActiveTab("tracking");
                              }}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              📍 Track Bus
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TRACK BUS TAB */}
        {activeTab === "tracking" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Track Your Bus</h2>
              <button
                onClick={() => setActiveTab("mybookings")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Bookings
              </button>
            </div>

            {!trackingBooking ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">📍</div>
                <h3 className="text-xl font-bold mb-2">
                  Select a Booking to Track
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose a confirmed booking from "My Bookings" to see real-time
                  bus location
                </p>
                {bookings.filter((b) => b.status === "confirmed").length ===
                0 ? (
                  <p className="text-gray-500">
                    No confirmed bookings available to track
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {bookings
                      .filter((b) => b.status === "confirmed")
                      .map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => setTrackingBooking(booking)}
                          className="border-2 border-gray-200 hover:border-blue-500 rounded-lg p-4 text-left transition"
                        >
                          <h4 className="font-bold">
                            Bus {booking.journey?.bus_number}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {booking.journey?.route_name}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            {booking.pickup_stop} → {booking.dropoff_stop}
                          </p>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <BusTrackingMap booking={trackingBooking} />

                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="font-bold text-lg mb-4">Booking Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Booking Reference</p>
                      <p className="font-semibold">
                        {trackingBooking.booking_reference}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Seats Booked</p>
                      <p className="font-semibold">
                        {trackingBooking.seats_booked}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Scheduled Departure</p>
                      <p className="font-semibold">
                        {trackingBooking.journey?.scheduled_departure
                          ? new Date(
                              trackingBooking.journey.scheduled_departure
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Scheduled Arrival</p>
                      <p className="font-semibold">
                        {trackingBooking.journey?.scheduled_arrival
                          ? new Date(
                              trackingBooking.journey.scheduled_arrival
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setTrackingBooking(null)}
                    className="mt-4 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                  >
                    Track Different Bus
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Add the Rating Modal at the very end, just before the closing div */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          console.log("🔍 Closing rating modal");
          setShowRatingModal(false);
          setRatingBooking(null);
        }}
        onSubmit={handleRatingSubmit}
        booking={ratingBooking}
      />
    </div>
  );
};

// ================= DRIVER DASHBOARD =================

// ================= DRIVER DASHBOARD =================

const DriverEarningsSection = () => {
  // Sample data - replace with your actual data from API
  const [earnings] = useState({
    today: 125000,
    week: 850000,
    month: 3200000,
    total: 12500000,
  });

  const [journeyStats] = useState({
    today: 8,
    week: 45,
    month: 180,
    avgPerJourney: 17777,
  });

  const [performance] = useState({
    completionRate: 98.5,
    rating: 4.8,
    onTimeRate: 95.2,
    trend: "+12.5",
  });

  const [weeklyData] = useState([
    { day: "Mon", amount: 120000, journeys: 6 },
    { day: "Tue", amount: 145000, journeys: 8 },
    { day: "Wed", amount: 98000, journeys: 5 },
    { day: "Thu", amount: 165000, journeys: 9 },
    { day: "Fri", amount: 178000, journeys: 10 },
    { day: "Sat", amount: 95000, journeys: 5 },
    { day: "Sun", amount: 49000, journeys: 2 },
  ]);

  const maxAmount = Math.max(...weeklyData.map((d) => d.amount));

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Earnings */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span>{performance.trend}%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90">Today</h3>
          <p className="text-3xl font-bold mt-1">
            UGX {earnings.today.toLocaleString()}
          </p>
          <p className="text-sm opacity-80 mt-2">
            {journeyStats.today} journeys completed
          </p>
        </div>

        {/* Week's Earnings */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="flex items-center text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Active</span>
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90">This Week</h3>
          <p className="text-3xl font-bold mt-1">
            UGX {earnings.week.toLocaleString()}
          </p>
          <p className="text-sm opacity-80 mt-2">
            {journeyStats.week} journeys completed
          </p>
        </div>

        {/* Month's Earnings */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
              30 days
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90">This Month</h3>
          <p className="text-3xl font-bold mt-1">
            UGX {earnings.month.toLocaleString()}
          </p>
          <p className="text-sm opacity-80 mt-2">
            {journeyStats.month} journeys completed
          </p>
        </div>

        {/* Average Per Journey */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex items-center text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
              ⭐ {performance.rating}
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90">Avg Per Journey</h3>
          <p className="text-3xl font-bold mt-1">
            UGX {journeyStats.avgPerJourney.toLocaleString()}
          </p>
          <p className="text-sm opacity-80 mt-2">Based on completed trips</p>
        </div>
      </div>

      {/* Weekly Performance Chart & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Earnings Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Weekly Performance
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Peak:</span>
              <span className="font-semibold text-green-600">
                UGX {maxAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="space-y-4">
            {weeklyData.map((data, idx) => {
              const percentage = (data.amount / maxAmount) * 100;
              const isToday = idx === new Date().getDay() - 1;

              return (
                <div key={data.day} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`font-medium ${
                        isToday ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {data.day}
                    </span>
                    <span className="text-gray-600">{data.journeys} trips</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div
                        className={`h-8 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-3 ${
                          isToday
                            ? "bg-gradient-to-r from-blue-400 to-blue-600"
                            : "bg-gradient-to-r from-green-400 to-green-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-white text-xs font-semibold">
                          {percentage > 20 &&
                            `UGX ${data.amount.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                    {percentage <= 20 && (
                      <span className="absolute right-2 top-1 text-xs font-semibold text-gray-700">
                        UGX {data.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-6">
          {/* Completion Rate */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Performance Metrics
            </h3>

            <div className="space-y-4">
              {/* Completion Rate Circle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {performance.completionRate}%
                  </p>
                </div>
                <div className="relative w-20 h-20">
                  <svg className="transform -rotate-90 w-20 h-20">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#10b981"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${
                        2 *
                        Math.PI *
                        32 *
                        (1 - performance.completionRate / 100)
                      }`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">
                      {performance.completionRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* On-Time Rate */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">On-Time Rate</p>
                  <p className="text-lg font-bold text-blue-600">
                    {performance.onTimeRate}%
                  </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${performance.onTimeRate}%` }}
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= Math.floor(performance.rating)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-lg font-bold text-gray-800">
                      {performance.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Lifetime Earnings</h3>
            <p className="text-4xl font-bold mb-2">
              UGX {earnings.total.toLocaleString()}
            </p>
            <p className="text-sm opacity-90">Keep up the great work! 🎉</p>
            <div className="mt-4 pt-4 border-t border-white border-opacity-20">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-90">Growth this month</span>
                <span className="font-bold">{performance.trend}% ↑</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          Earnings Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Base Fare</p>
            <p className="text-2xl font-bold text-gray-800">UGX 2,850,000</p>
            <p className="text-xs text-gray-500 mt-1">89% of total earnings</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Bonuses</p>
            <p className="text-2xl font-bold text-gray-800">UGX 250,000</p>
            <p className="text-xs text-gray-500 mt-1">8% of total earnings</p>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Tips</p>
            <p className="text-2xl font-bold text-gray-800">UGX 100,000</p>
            <p className="text-xs text-gray-500 mt-1">3% of total earnings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("journeys");
  const [assignedBuses, setAssignedBuses] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [lastPassengerCounts, setLastPassengerCounts] = useState({});
  const [busSummary, setBusSummary] = useState([]);
  const token = localStorage.getItem("token");
  const [walletBalance, setWalletBalance] = useState(0);
  const [journeyRatings, setJourneyRatings] = useState({});
  const [trackingBooking, setTrackingBooking] = useState(null);
  const [completedJourneys, setCompletedJourneys] = useState([]);
  // Fetch wallet and bookings on load
  useEffect(() => {
    fetchWalletAndBookings();
  }, []);

  const fetchWalletAndBookings = async () => {
    try {
      // 1️⃣ Fetch wallet balance
      const walletData = await apiRequest("/payments/wallet/", { token });
      setWalletBalance(walletData.balance || 0);

      // 2️⃣ Fetch all bookings for this user
      const bookingsData = await apiRequest("/journeys/bookings/", { token });
      const allBookings = bookingsData.results || bookingsData || [];

      // 3️⃣ Normalize the data for consistent use in UI
      const normalizedBookings = allBookings.map((b) => ({
        id: b.id,
        booking_reference: b.booking_reference,
        status: b.status,
        seats_booked: b.seats_booked,
        total_fare: b.total_fare,
        base_fare: b.base_fare, // ✅ added
        pickup_stop: b.pickup_stop,
        dropoff_stop: b.dropoff_stop,
        created_at: b.created_at,
        journey: {
          id: b.journey?.id,
          route_name: b.journey?.route_name || b.route_name,
          bus_number: b.journey?.bus?.bus_number || b.bus_number,
          scheduled_departure: b.journey?.scheduled_departure,
          scheduled_arrival: b.journey?.scheduled_arrival,
        },
      }));

      // 4️⃣ Filter out cancelled bookings if you want only active ones
      const activeBookings = normalizedBookings.filter(
        (b) => b.status !== "cancelled"
      );

      setBookings(activeBookings);
    } catch (err) {
      console.error("❌ Error fetching wallet/bookings:", err);
    }
  };

  // ================== Fetch Bus Summary ==================
  useEffect(() => {
    const fetchBusSummary = async () => {
      const authToken = localStorage.getItem("token");

      if (!authToken) {
        console.warn("No authentication token found");
        return;
      }

      try {
        const res = await fetch(
          "http://127.0.0.1:8000/api/journeys/journeys/driver-bus-summary/",
          {
            headers: {
              Authorization: `Token ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.status === 401) {
          console.error("Authentication failed - token may be invalid");
          return;
        }

        if (!res.ok) {
          console.warn(`Bus summary endpoint returned ${res.status}`);
          return;
        }

        const data = await res.json();
        console.log("Bus summary data:", data);
        setBusSummary(data);
      } catch (error) {
        console.error("Error fetching bus summary:", error);
      }
    };

    fetchBusSummary();
  }, []);

  // ================== Fetch Dashboard Data ==================
  const fetchData = async () => {
    try {
      // --- Assigned Buses ---
      const busesData = await apiRequest("/buses/driver-buses/", { token });
      setAssignedBuses(busesData?.results || []);

      // --- Journeys ---
      const journeysData = await apiRequest("/journeys/driver-journeys/", {
        token,
      });
      const scheduledJourneys = (journeysData.results || []).filter(
        (j) => j.status === "scheduled"
      );
      setJourneys(scheduledJourneys);

      // --- Tap-in Alert System ---
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
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
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
      fetchData();
    } catch (err) {
      console.error("Error completing journey:", err);
    }
  };

  // ================== Cancel Journey ==================
  const cancelJourney = async (journeyId) => {
    const reason = prompt(
      "Please provide a reason for cancelling this journey:"
    );
    if (!reason) return alert("Cancellation reason is required.");

    try {
      await apiRequest(`/journeys/cancel/${journeyId}/`, {
        method: "POST",
        token,
        body: { reason },
      });
      setJourneys((prev) => prev.filter((j) => j.id !== journeyId));
      alert("Journey cancelled successfully.");
    } catch (err) {
      console.error("Error cancelling journey:", err);
      alert(err.message || "Failed to cancel journey");
    }
  };

  const [status, setStatus] = useState({
    tapped_in_count: 0,
    total_booked: 0,
    occupancy_percent: 0,
  });

  // ================== Fetch status for each active journey ==================
  const fetchStatuses = async () => {
    try {
      const updates = {};
      for (const j of journeys) {
        const data = await apiRequest(
          `/journeys/journeys/${j.id}/driver_status/`,
          { token }
        );
        updates[j.id] = data;
      }
      setStatus(updates);
    } catch (err) {
      console.error("Error fetching driver statuses:", err);
    }
  };

  useEffect(() => {
    if (journeys.length === 0) return;
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, [journeys]);

  // Add this function to fetch ratings for journeys
  const fetchJourneyRatings = async () => {
    try {
      const token = localStorage.getItem("token");

      console.log("🔍 Fetching ratings for journeys:", journeys.length);

      // Fetch ratings for all journeys
      const ratingsPromises = journeys.map(async (journey) => {
        try {
          console.log(`📡 Fetching ratings for journey ${journey.id}`);
          const response = await fetch(
            `http://127.0.0.1:8000/api/journeys/journeys/${journey.id}/ratings/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );

          console.log(
            `📡 Response status for journey ${journey.id}:`,
            response.status
          );

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Ratings for journey ${journey.id}:`, data);
            return { journeyId: journey.id, ratings: data };
          }
          return { journeyId: journey.id, ratings: [] };
        } catch (err) {
          console.error(
            `Error fetching ratings for journey ${journey.id}:`,
            err
          );
          return { journeyId: journey.id, ratings: [] };
        }
      });

      const ratingsResults = await Promise.all(ratingsPromises);

      // Convert to object for easy lookup
      const ratingsMap = {};
      ratingsResults.forEach(({ journeyId, ratings }) => {
        ratingsMap[journeyId] = ratings;
      });

      console.log("✅ All ratings fetched:", ratingsMap);
      setJourneyRatings(ratingsMap);
    } catch (err) {
      console.error("Error fetching journey ratings:", err);
    }
  };

  // Update your useEffect to fetch ratings when journeys are loaded
  useEffect(() => {
    if (journeys.length > 0) {
      fetchJourneyRatings();
    }
  }, [journeys]);

  // Calculate average rating for each category
  const calculateAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0)
      return {
        driver: 0,
        bus: 0,
        service: 0,
        overall: 0,
      };

    const sum = ratings.reduce(
      (acc, r) => ({
        driver: acc.driver + r.driver_rating,
        bus: acc.bus + r.bus_rating,
        service: acc.service + r.service_rating,
        overall: acc.overall + parseFloat(r.overall_rating),
      }),
      { driver: 0, bus: 0, service: 0, overall: 0 }
    );

    return {
      driver: (sum.driver / ratings.length).toFixed(1),
      bus: (sum.bus / ratings.length).toFixed(1),
      service: (sum.service / ratings.length).toFixed(1),
      overall: (sum.overall / ratings.length).toFixed(1),
    };
  };

  // Keep your existing StarRating component as is
  const StarRating = ({ rating, size = "small" }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    const starSize =
      size === "small" ? "w-4 h-4" : size === "medium" ? "w-5 h-5" : "w-6 h-6";

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <svg
            key={i}
            className={`${starSize} text-yellow-400 fill-current`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <svg
              className={`${starSize} text-gray-300`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <svg
              className={`${starSize} text-yellow-400 fill-current absolute top-0 left-0`}
              style={{ clipPath: "inset(0 50% 0 0)" }}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      } else {
        stars.push(
          <svg
            key={i}
            className={`${starSize} text-gray-300`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      }
    }

    return <div className="flex items-center gap-1">{stars}</div>;
  };

  // ================== Render ==================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050221] to-[#0f0332] text-[#eaeaea]">
      {/* Header */}
      <header className="bg-[#0f0332]/90 border-b border-[#3a3a3a] shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          <h1 className="text-2xl font-semibold text-[#f3f3f3]">
            🚍 Driver Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-[#b0b0b0]">
              Welcome,{" "}
              <span className="text-[#f0f0f0]">
                {user?.first_name || "Driver"}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium ml-2">
                💰 UGX {walletBalance.toLocaleString()}
              </span>
            </span>
            <button
              onClick={logout}
              className="bg-[#5b3838] hover:bg-[#f28b82] text-white px-4 py-2 rounded-md transition"
            >
              Logout
            </button>
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
              journeys.map((journey) => {
                const routeName =
                  journey.route?.name || journey.route_name || "N/A";
                const busNumber =
                  journey.bus?.bus_number || journey.bus_number || "N/A";
                const fare = journey.fare
                  ? Number(journey.fare).toLocaleString()
                  : "—";

                const seatInfo = busSummary.find(
                  (b) => b.journey_id === journey.id
                );
                // Get ratings for this journey
                const ratings = journeyRatings[journey.id] || [];
                const averageRating = calculateAverageRating(ratings);
                const hasRatings = ratings.length > 0;

                return (
                  <div
                    key={journey.id}
                    className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      🛣️ {routeName}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Bus:</strong> {busNumber}
                      </p>
                      <p>
                        <strong>Departure:</strong>{" "}
                        {new Date(journey.scheduled_departure).toLocaleString()}
                      </p>
                      <p>
                        <strong>Arrival:</strong>{" "}
                        {new Date(journey.scheduled_arrival).toLocaleString()}
                      </p>
                      <p>
                        <strong>Fare:</strong> UGX {fare}
                      </p>

                      {seatInfo ? (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p>
                            <strong>Total Capacity:</strong>{" "}
                            {seatInfo.total_capacity}
                          </p>
                          <p>
                            <strong>Booked Seats:</strong>{" "}
                            {seatInfo.booked_seats}
                          </p>
                          <p>
                            <strong>Available Seats:</strong>{" "}
                            {seatInfo.available_seats}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-gray-500">
                          Seat info not available
                        </p>
                      )}

                      <p className="capitalize mt-2">
                        <strong>Status:</strong> {journey.status}
                      </p>

                      {/* ================= Progress Bar ================= */}
                      {status[journey.id] && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Occupancy:{" "}
                            {status[journey.id].occupancy_percent.toFixed(1)}%
                          </p>

                          {/* Progress bar container */}
                          <div className="w-full bg-gray-300 rounded-full h-4 shadow-inner overflow-hidden">
                            <div
                              className={`h-4 rounded-full transition-all duration-700 ease-in-out ${
                                status[journey.id].occupancy_percent >= 90
                                  ? "bg-red-600"
                                  : status[journey.id].occupancy_percent >= 70
                                  ? "bg-yellow-500"
                                  : "bg-green-600"
                              }`}
                              style={{
                                width: `${Math.min(
                                  status[journey.id].occupancy_percent,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>

                          {/* Tap-in count */}
                          <p className="text-xs text-gray-600 mt-2 text-right">
                            {status[journey.id].tapped_in_count} /{" "}
                            {status[journey.id].total_booked} passengers tapped
                            in
                          </p>
                        </div>
                      )}
                      {/* ================= Ratings Section ================= */}
                      {ratings && ratings.length > 0 ? (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {/* Overall Rating Summary */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-3xl font-bold text-gray-800">
                                  {calculateAverageRating(ratings).overall}
                                </span>
                                <StarRating
                                  rating={parseFloat(
                                    calculateAverageRating(ratings).overall
                                  )}
                                  size="medium"
                                />
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Based on {ratings.length} rating
                                {ratings.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>

                          {/* Category Ratings */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                              <p className="text-xs text-gray-600 mb-1">
                                Driver
                              </p>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-lg font-bold text-blue-700">
                                  {calculateAverageRating(ratings).driver}
                                </span>
                                <span className="text-yellow-400">⭐</span>
                              </div>
                            </div>

                            <div className="bg-green-50 p-3 rounded-lg text-center">
                              <p className="text-xs text-gray-600 mb-1">Bus</p>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-lg font-bold text-green-700">
                                  {calculateAverageRating(ratings).bus}
                                </span>
                                <span className="text-yellow-400">⭐</span>
                              </div>
                            </div>

                            <div className="bg-purple-50 p-3 rounded-lg text-center">
                              <p className="text-xs text-gray-600 mb-1">
                                Service
                              </p>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-lg font-bold text-purple-700">
                                  {calculateAverageRating(ratings).service}
                                </span>
                                <span className="text-yellow-400">⭐</span>
                              </div>
                            </div>
                          </div>

                          {/* Rating Distribution by Overall Rating */}
                          <div className="space-y-1 mb-4">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Rating Distribution:
                            </p>
                            {[5, 4, 3, 2, 1].map((star) => {
                              // Count ratings where overall is in the range
                              const count = ratings.filter(
                                (r) =>
                                  Math.round(parseFloat(r.overall_rating)) ===
                                  star
                              ).length;
                              const percentage =
                                ratings.length > 0
                                  ? ((count / ratings.length) * 100).toFixed(0)
                                  : 0;

                              return (
                                <div
                                  key={star}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span className="w-12 text-gray-600">
                                    {star} ⭐
                                  </span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-yellow-400 h-2 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="w-12 text-right text-gray-600">
                                    {count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Recent Comments */}
                          {ratings.some((r) => r.comment) && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                Recent Comments:
                              </p>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {ratings
                                  .filter((r) => r.comment)
                                  .slice(0, 5)
                                  .map((rating, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-gray-50 p-3 rounded text-xs border border-gray-200"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <span className="font-medium text-gray-700">
                                          {rating.user_name || "Anonymous"}
                                        </span>
                                        <span className="text-gray-500 text-xs">
                                          {new Date(
                                            rating.created_at
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-3 gap-2 mb-2">
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs text-gray-600">
                                            Driver:
                                          </span>
                                          <StarRating
                                            rating={rating.driver_rating}
                                            size="small"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs text-gray-600">
                                            Bus:
                                          </span>
                                          <StarRating
                                            rating={rating.bus_rating}
                                            size="small"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs text-gray-600">
                                            Service:
                                          </span>
                                          <StarRating
                                            rating={rating.service_rating}
                                            size="small"
                                          />
                                        </div>
                                      </div>

                                      <p className="text-gray-700 italic">
                                        "{rating.comment}"
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-center py-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">
                              ⭐ No ratings yet
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Ratings will appear after passengers complete
                              their journey
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ================================================= */}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => markJourneyCompleted(journey.id)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700"
                      >
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => cancelJourney(journey.id)}
                        className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700"
                      >
                        Cancel Journey
                      </button>
                    </div>
                  </div>
                );
              })
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
        {activeTab === "earnings" && <DriverEarningsSection />}
      </div>
    </div>
  );
};

// ================= ADMIN DASHBOARD =================

const AdminAnalyticsDashboard = ({ token }) => {
  const [stats, setStats] = useState({
    overview: {
      totalRevenue: 45780000,
      totalJourneys: 1247,
      totalPassengers: 8934,
      totalDrivers: 45,
      activeBuses: 38,
      averageRating: 4.6,
      revenueGrowth: 15.3,
      journeysGrowth: 12.8,
    },
    drivers: [
      {
        id: 1,
        name: "John Kamau",
        earnings: 2850000,
        trips: 156,
        rating: 4.8,
        onTimeRate: 96,
        status: "active",
      },
      {
        id: 2,
        name: "Sarah Nabukalu",
        earnings: 2650000,
        trips: 142,
        rating: 4.9,
        onTimeRate: 98,
        status: "active",
      },
      {
        id: 3,
        name: "David Okello",
        earnings: 2420000,
        trips: 138,
        rating: 4.7,
        onTimeRate: 94,
        status: "active",
      },
      {
        id: 4,
        name: "Grace Auma",
        earnings: 2380000,
        trips: 135,
        rating: 4.6,
        onTimeRate: 92,
        status: "active",
      },
      {
        id: 5,
        name: "Peter Mugisha",
        earnings: 2150000,
        trips: 128,
        rating: 4.8,
        onTimeRate: 95,
        status: "active",
      },
    ],
    journeyStats: {
      scheduled: 45,
      inProgress: 12,
      completed: 1190,
      cancelled: 23,
      completionRate: 98.1,
    },
    passengerStats: {
      activeToday: 234,
      totalWalletBalance: 12500000,
      averageWalletBalance: 1400,
      newThisMonth: 156,
      frequentTravelers: 892,
    },
    revenueByRoute: [
      {
        route: "Kampala - Entebbe",
        revenue: 8500000,
        trips: 342,
        passengers: 4560,
      },
      {
        route: "Kampala - Jinja",
        revenue: 7200000,
        trips: 298,
        passengers: 3980,
      },
      {
        route: "Kampala - Mbarara",
        revenue: 6800000,
        trips: 186,
        passengers: 2890,
      },
      {
        route: "Kampala - Mbale",
        revenue: 5900000,
        trips: 167,
        passengers: 2340,
      },
      {
        route: "Entebbe - Jinja",
        revenue: 4200000,
        trips: 154,
        passengers: 1980,
      },
    ],
    dailyStats: [
      { day: "Mon", revenue: 6500000, journeys: 178, passengers: 1240 },
      { day: "Tue", revenue: 7200000, journeys: 195, passengers: 1360 },
      { day: "Wed", revenue: 6800000, journeys: 185, passengers: 1290 },
      { day: "Thu", revenue: 7500000, journeys: 201, passengers: 1420 },
      { day: "Fri", revenue: 8200000, journeys: 215, passengers: 1580 },
      { day: "Sat", revenue: 5800000, journeys: 142, passengers: 980 },
      { day: "Sun", revenue: 3800000, journeys: 131, passengers: 1064 },
    ],
  });

  const maxDailyRevenue = Math.max(...stats.dailyStats.map((d) => d.revenue));
  const maxRouteRevenue = Math.max(
    ...stats.revenueByRoute.map((r) => r.revenue)
  );

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color = "blue",
  }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
      pink: "from-pink-500 to-pink-600",
      indigo: "from-indigo-500 to-indigo-600",
    };

    return (
      <div
        className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-200`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div className="flex items-center text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-sm font-medium opacity-90">{title}</h3>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-sm opacity-80 mt-2">{subtitle}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          📊 System Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            value={`UGX ${(stats.overview.totalRevenue / 1000000).toFixed(1)}M`}
            subtitle="This month"
            trend={stats.overview.revenueGrowth}
            color="green"
          />
          <StatCard
            icon={MapPin}
            title="Total Journeys"
            value={stats.overview.totalJourneys.toLocaleString()}
            subtitle="Completed this month"
            trend={stats.overview.journeysGrowth}
            color="blue"
          />
          <StatCard
            icon={Users}
            title="Total Passengers"
            value={stats.overview.totalPassengers.toLocaleString()}
            subtitle={`${stats.passengerStats.newThisMonth} new this month`}
            color="purple"
          />
          <StatCard
            icon={Bus}
            title="Active Buses"
            value={`${stats.overview.activeBuses}/${stats.overview.totalDrivers}`}
            subtitle={`${(
              (stats.overview.activeBuses / stats.overview.totalDrivers) *
              100
            ).toFixed(1)}% utilization`}
            color="orange"
          />
        </div>
      </div>

      {/* Journey Status & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journey Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🚍 Journey Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Scheduled</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {stats.journeyStats.scheduled}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">In Progress</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {stats.journeyStats.inProgress}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">Completed</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {stats.journeyStats.completed}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-gray-700">Cancelled</span>
              </div>
              <span className="text-2xl font-bold text-red-600">
                {stats.journeyStats.cancelled}
              </span>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.journeyStats.completionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${stats.journeyStats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Statistics */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            👥 Passenger Insights
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Active Today</p>
              <p className="text-3xl font-bold text-blue-700">
                {stats.passengerStats.activeToday}
              </p>
              <p className="text-xs text-gray-500 mt-1">Currently traveling</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Wallet Balance</p>
              <p className="text-3xl font-bold text-green-700">
                UGX{" "}
                {(stats.passengerStats.totalWalletBalance / 1000000).toFixed(1)}
                M
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: UGX{" "}
                {stats.passengerStats.averageWalletBalance.toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Frequent Travelers</p>
              <p className="text-3xl font-bold text-purple-700">
                {stats.passengerStats.frequentTravelers}
              </p>
              <p className="text-xs text-gray-500 mt-1">10+ trips this month</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">New This Month</p>
              <p className="text-3xl font-bold text-orange-700">
                {stats.passengerStats.newThisMonth}
              </p>
              <p className="text-xs text-gray-500 mt-1">Growing steadily</p>
            </div>
          </div>
        </div>

        {/* System Performance */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            ⚡ Performance
          </h3>
          <div className="space-y-6">
            {/* Average Rating */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">System Rating</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= Math.floor(stats.overview.averageRating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-lg font-bold text-gray-800">
                    {stats.overview.averageRating}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Growth */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Revenue Growth</p>
              <div className="flex items-end gap-1 h-32">
                {[12.5, 14.2, 13.8, 15.3, 14.7, 16.2, 15.3].map(
                  (value, idx) => (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all duration-500 hover:from-green-600 hover:to-green-500"
                        style={{ height: `${(value / 16.2) * 100}%` }}
                      />
                      <span className="text-xs text-gray-500 mt-1">
                        {["M", "T", "W", "T", "F", "S", "S"][idx]}
                      </span>
                    </div>
                  )
                )}
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                Weekly growth trend: +{stats.overview.revenueGrowth}%
              </p>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-200">
              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium">
                📄 Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            📈 Daily Performance
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Journeys</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {stats.dailyStats.map((data, idx) => {
            const revenuePercent = (data.revenue / maxDailyRevenue) * 100;
            const isToday = idx === new Date().getDay() - 1;

            return (
              <div key={data.day} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span
                    className={`font-medium w-12 ${
                      isToday ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {data.day}
                  </span>
                  <div className="flex gap-4 text-gray-600">
                    <span>{data.journeys} trips</span>
                    <span>{data.passengers} passengers</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    UGX {(data.revenue / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-6 rounded-full transition-all duration-700 ease-out ${
                        isToday
                          ? "bg-gradient-to-r from-blue-400 to-blue-600"
                          : "bg-gradient-to-r from-green-400 to-green-600"
                      }`}
                      style={{ width: `${revenuePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Drivers & Revenue by Route */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drivers */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🏆 Top Performing Drivers
          </h3>
          <div className="space-y-3">
            {stats.drivers.map((driver, idx) => (
              <div
                key={driver.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      idx === 0
                        ? "bg-yellow-500"
                        : idx === 1
                        ? "bg-gray-400"
                        : idx === 2
                        ? "bg-orange-600"
                        : "bg-blue-500"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{driver.name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{driver.trips} trips</span>
                      <span>⭐ {driver.rating}</span>
                      <span>⏰ {driver.onTimeRate}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    UGX {(driver.earnings / 1000000).toFixed(2)}M
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Route */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🛣️ Top Routes by Revenue
          </h3>
          <div className="space-y-4">
            {stats.revenueByRoute.map((route, idx) => {
              const percent = (route.revenue / maxRouteRevenue) * 100;

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {route.route}
                    </span>
                    <span className="text-gray-600">{route.trips} trips</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div
                        className="h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-end pr-3 transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      >
                        {percent > 30 && (
                          <span className="text-white text-xs font-semibold">
                            UGX {(route.revenue / 1000000).toFixed(1)}M
                          </span>
                        )}
                      </div>
                    </div>
                    {percent <= 30 && (
                      <span className="absolute right-2 top-1.5 text-xs font-semibold text-gray-700">
                        UGX {(route.revenue / 1000000).toFixed(1)}M
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {route.passengers.toLocaleString()} passengers
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Alerts & Notifications */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 mb-2">⚠️ System Alerts</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• 3 buses require maintenance within the next 7 days</p>
              <p>• Peak hours: 7-9 AM and 5-7 PM show highest demand</p>
              <p>
                • Consider adding more routes to Entebbe-Jinja (high demand)
              </p>
              <p>• Average passenger wait time: 12 minutes (optimal)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
        console.log("🔍 RAW PASSENGER DATA:", data);
        console.log("🔍 FIRST PASSENGER:", data.results?.[0] || data[0]);
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
    <div className="min-h-screen bg-gradient-to-br from-[#050221] to-[#0f0332] text-[#eaeaea]">
      {/* Header */}
      <header className="bg-[#0f0332]/90 border-b border-[#3a3a3a] shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          <h1 className="text-2xl font-semibold text-[#f3f3f3]">
            🛠 Admin Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-[#b0b0b0]">
              Welcome,{" "}
              <span className="text-[#f0f0f0]">
                {user?.first_name || "System"}
              </span>
            </span>
            <button
              onClick={logout}
              className="bg-[#5b3838] hover:bg-[#f28b82] text-white px-4 py-2 rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="relative flex space-x-3 p-4 bg-[#0f0332]/50 rounded-xl">
        {[
          "overview",
          "buses",
          "drivers",
          "passengers",
          "journeys",
          "analytics",
        ].map((tab, index) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative z-10 py-2 px-4 transition-all duration-300 rounded-full font-medium ${
              activeTab === tab
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}

        {/* Sliding pill indicator */}
        <span
          className="absolute top-0 left-0 h-full bg-blue-600 rounded-full shadow-lg transition-all duration-300 z-0"
          style={{
            width: `${100 / 6}%`, // 6 tabs
            transform: `translateX(${
              [
                "overview",
                "buses",
                "drivers",
                "passengers",
                "journeys",
                "analytics",
              ].indexOf(activeTab) * 100
            }%)`,
          }}
        />
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
          <EnhancedPassengersSection
            passengers={passengers}
            topupAmounts={topupAmounts}
            setTopupAmounts={setTopupAmounts}
            topupWallet={topupWallet}
            token={token}
          />
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
                className="border px-3 py-2 rounded w-full"
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
        {/* Analytics - Comprehensive analytics dashboard */}
        {activeTab === "analytics" && <AdminAnalyticsDashboard token={token} />}
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
