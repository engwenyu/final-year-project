/* eslint-disable no-undef */
import React, { useState } from "react";
import {
  User,
  Wallet,
  Mail,
  Phone,
  Search,
  Plus,
  Eye,
  Calendar,
  TrendingUp,
  AlertCircle,
  DollarSign,
  History,
  CreditCard,
} from "lucide-react";

const EnhancedPassengersSection = ({
  passengers,
  topupAmounts,
  setTopupAmounts,
  token,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("overview");
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  const [passengerBookings, setPassengerBookings] = useState([]);
  const [passengerTransactions, setPassengerTransactions] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Wallet top-up
  const topupWallet = async (userId, amount) => {
    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/payments/wallet/topup/${userId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ amount: Number(amount) }),
        }
      );

      if (!response.ok) {
        throw new Error("Top-up failed");
      }

      const res = await response.json();

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

  const viewPassengerDetails = async (passenger) => {
    setSelectedPassenger(passenger);
    setShowDetailsModal(true);
    setActiveModalTab("overview");
    setLoadingDetails(true);

    try {
      // 1️⃣ Fetch wallet info
      const walletRes = await fetch(
        `http://127.0.0.1:8000/api/payments/wallet/${passenger.id}/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      const walletData = walletRes.ok ? await walletRes.json() : {};

      // 2️⃣ Fetch passenger bookings
      const bookingsRes = await fetch(
        `http://127.0.0.1:8000/api/admin/passengers/${passenger.id}/bookings/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      const bookingsData = bookingsRes.ok ? await bookingsRes.json() : [];

      // 3️⃣ Fetch passenger transactions (payments)
      const transactionsRes = await fetch(
        `http://127.0.0.1:8000/api/admin/passengers/${passenger.id}/transactions/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      const transactionsData = transactionsRes.ok
        ? await transactionsRes.json()
        : [];

      // 4️⃣ Compute stats
      const totalBookings = bookingsData.length;
      const totalSpent = transactionsData.reduce(
        (sum, t) => sum + (t.amount || 0),
        0
      );
      const lastBooking =
        bookingsData.length > 0
          ? bookingsData
              .map((b) => new Date(b.created_at || b.date))
              .sort((a, b) => b - a)[0]
              .toISOString()
          : null;

      // 5️⃣ Merge everything into selectedPassenger
      setSelectedPassenger({
        ...passenger,
        wallet: walletData,
        total_bookings: totalBookings,
        total_spent: totalSpent,
        last_booking: lastBooking,
      });

      // For details tabs
      setPassengerBookings(bookingsData);
      setPassengerTransactions(transactionsData);
    } catch (error) {
      console.error("Error fetching passenger details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter passengers
  const filteredPassengers = passengers.filter((p) => {
    const matchesSearch =
      p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone_number?.includes(searchTerm);

    const walletBalance = p.wallet?.balance ?? 0;
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "high-balance" && walletBalance >= 50000) ||
      (filterStatus === "low-balance" && walletBalance < 50000);

    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const totalPassengers = passengers.length;
  const totalWalletBalance = passengers.reduce(
    (sum, p) => sum + (p.wallet?.balance ?? 0),
    0
  );
  const lowBalanceCount = passengers.filter(
    (p) => (p.wallet?.balance ?? 0) < 20000
  ).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <User className="w-8 h-8 opacity-80" />
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-semibold">
              Total
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{totalPassengers}</p>
          <p className="text-blue-100 text-sm">Total Passengers</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-8 h-8 opacity-80" />
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-semibold">
              Balance
            </div>
          </div>
          <p className="text-2xl font-bold mb-1">
            {formatCurrency(totalWalletBalance)}
          </p>
          <p className="text-green-100 text-sm">Total Wallet Balance</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 opacity-80" />
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-semibold">
              Alert
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{lowBalanceCount}</p>
          <p className="text-orange-100 text-sm">Low Balance (&lt; 20K)</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-semibold">
              Avg
            </div>
          </div>
          <p className="text-2xl font-bold mb-1">
            {formatCurrency(
              totalPassengers > 0 ? totalWalletBalance / totalPassengers : 0
            )}
          </p>
          <p className="text-purple-100 text-sm">Average Balance</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Passengers</option>
              <option value="high-balance">High Balance (≥50K)</option>
              <option value="low-balance">Low Balance (&lt;50K)</option>
            </select>

            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-md transition ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-md transition ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPassengers.map((p) => {
            const walletBalance = p.wallet?.balance ?? 0;
            const isLowBalance = walletBalance < 20000;

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <User className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">
                        {p.first_name} {p.last_name}
                      </h3>
                      <p className="text-blue-100 text-xs">ID: {p.id}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm truncate">{p.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{p.phone_number}</span>
                  </div>

                  {/* Wallet Balance */}
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      isLowBalance
                        ? "bg-orange-50 border border-orange-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet
                          className={`w-5 h-5 ${
                            isLowBalance ? "text-orange-600" : "text-green-600"
                          }`}
                        />
                        <span className="text-xs text-gray-600 font-medium">
                          Wallet Balance
                        </span>
                      </div>
                      {isLowBalance && (
                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                          Low
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-2xl font-bold mt-1 ${
                        isLowBalance ? "text-orange-700" : "text-green-700"
                      }`}
                    >
                      {formatCurrency(walletBalance)}
                    </p>
                  </div>

                  {/* Top-up Section */}
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Enter amount..."
                        className="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={topupAmounts[p.id] || ""}
                        onChange={(e) =>
                          setTopupAmounts({
                            ...topupAmounts,
                            [p.id]: e.target.value,
                          })
                        }
                      />
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
                        onClick={() => topupWallet(p.id, topupAmounts[p.id])}
                      >
                        <Plus className="w-4 h-4" />
                        Top Up
                      </button>
                    </div>

                    <button
                      onClick={() => viewPassengerDetails(p)}
                      className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Full Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Passenger
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Wallet Balance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Top-up
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPassengers.map((p) => {
                  const walletBalance = p.wallet?.balance ?? 0;
                  const isLowBalance = walletBalance < 20000;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {p.first_name} {p.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {p.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{p.email}</div>
                        <div className="text-sm text-gray-500">
                          {p.phone_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Wallet
                            className={`w-5 h-5 ${
                              isLowBalance
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          />
                          <span
                            className={`text-sm font-semibold ${
                              isLowBalance
                                ? "text-orange-700"
                                : "text-green-700"
                            }`}
                          >
                            {formatCurrency(
                              selectedPassenger.wallet?.balance ?? 0
                            )}
                          </span>
                          {isLowBalance && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2 max-w-xs">
                          <input
                            type="number"
                            placeholder="Amount"
                            className="w-32 border border-gray-300 px-3 py-1.5 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={topupAmounts[p.id] || ""}
                            onChange={(e) =>
                              setTopupAmounts({
                                ...topupAmounts,
                                [p.id]: e.target.value,
                              })
                            }
                          />
                          <button
                            className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition text-sm font-medium"
                            onClick={() =>
                              topupWallet(p.id, topupAmounts[p.id])
                            }
                          >
                            Top Up
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => viewPassengerDetails(p)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPassengers.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No passengers found
          </h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Passenger Details Modal */}
      {showDetailsModal && selectedPassenger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedPassenger.first_name} {selectedPassenger.last_name}
                  </h2>
                  <p className="text-blue-100">{selectedPassenger.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 w-10 h-10 rounded-full flex items-center justify-center transition text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 sticky top-[88px] z-10">
              <div className="flex gap-1">
                {["overview", "bookings", "transactions"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveModalTab(tab)}
                    className={`px-6 py-3 font-medium text-sm transition ${
                      activeModalTab === tab
                        ? "text-blue-600 bg-white border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeModalTab === "overview" && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <Wallet className="w-6 h-6 text-blue-600 mb-2" />
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        Wallet Balance
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(selectedPassenger.wallet?.balance ?? 0)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <Calendar className="w-6 h-6 text-green-600 mb-2" />
                      <p className="text-xs text-green-600 font-medium mb-1">
                        Total Bookings
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedPassenger.total_bookings || 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
                      <p className="text-xs text-purple-600 font-medium mb-1">
                        Total Spent
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(selectedPassenger.total_spent || 0)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                      <History className="w-6 h-6 text-orange-600 mb-2" />
                      <p className="text-xs text-orange-600 font-medium mb-1">
                        Last Booking
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedPassenger.last_booking
                          ? new Date(
                              selectedPassenger.last_booking
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-gray-600" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Email Address
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedPassenger.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Phone Number
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedPassenger.phone_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Member Since
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedPassenger.created_at
                            ? new Date(
                                selectedPassenger.created_at
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Account Status
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {selectedPassenger.status || "active"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === "bookings" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    Booking History
                  </h3>
                  {loadingDetails ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-gray-500 mt-4">Loading bookings...</p>
                    </div>
                  ) : passengerBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No bookings found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {passengerBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {booking.route}
                              </p>
                              <p className="text-sm text-gray-500">
                                {booking.date} • {booking.seats_booked} seat(s)
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Ref: {booking.booking_reference}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(booking.fare)}
                              </p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  booking.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : booking.status === "confirmed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeModalTab === "transactions" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    Transaction History
                  </h3>
                  {loadingDetails ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-gray-500 mt-4">
                        Loading transactions...
                      </p>
                    </div>
                  ) : passengerTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No transactions found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {passengerTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  transaction.amount > 0
                                    ? "bg-green-100"
                                    : "bg-red-100"
                                }`}
                              >
                                <CreditCard
                                  className={`w-5 h-5 ${
                                    transaction.amount > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 capitalize">
                                  {transaction.type.replace("_", " ")}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {transaction.date} • Ref:{" "}
                                  {transaction.reference_id}
                                </p>
                                {transaction.description && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {transaction.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-semibold text-lg ${
                                  transaction.amount > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.amount > 0 ? "+" : ""}
                                {formatCurrency(transaction.amount)}
                              </p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  transaction.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {transaction.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPassengersSection;
