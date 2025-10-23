import React, { useState } from "react";

const AdminCreateUserForm = ({ onUserCreated }) => {
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    user_type: "passenger",
    nfc_card_id: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [defaultPassword, setDefaultPassword] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDefaultPassword("");

    try {
      const response = await fetch("/api/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to create user");
      }

      const data = await response.json();

      // If backend sends default password, show it
      if (data.default_password) {
        setDefaultPassword(data.default_password);
      }

      onUserCreated(data);

      // Reset form
      setFormData({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        user_type: "passenger",
        nfc_card_id: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white shadow rounded mb-4"
    >
      <h2 className="text-lg font-bold mb-4">Create New User</h2>

      <input
        type="text"
        name="username"
        placeholder="Username"
        value={formData.username}
        onChange={handleChange}
        className="border p-2 mb-2 w-full"
        required
      />

      <input
        type="text"
        name="first_name"
        placeholder="First Name"
        value={formData.first_name}
        onChange={handleChange}
        className="border p-2 mb-2 w-full"
      />

      <input
        type="text"
        name="last_name"
        placeholder="Last Name"
        value={formData.last_name}
        onChange={handleChange}
        className="border p-2 mb-2 w-full"
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        className="border p-2 mb-2 w-full"
        required
      />

      <input
        type="text"
        name="phone_number"
        placeholder="Phone Number"
        value={formData.phone_number}
        onChange={handleChange}
        className="border p-2 mb-2 w-full"
      />

      <select
        name="user_type"
        value={formData.user_type}
        onChange={handleChange}
        className="border p-2 mb-2 w-full"
      >
        <option value="passenger">Passenger</option>
        <option value="driver">Driver</option>
        <option value="admin">Admin</option>
      </select>

      {formData.user_type === "passenger" && (
        <input
          type="text"
          name="nfc_card_id"
          placeholder="NFC Card ID"
          value={formData.nfc_card_id}
          onChange={handleChange}
          className="border p-2 mb-2 w-full"
          required
        />
      )}

      {error && <p className="text-red-500 mb-2">{error}</p>}
      {defaultPassword && (
        <p className="text-green-600 mb-2">
          ✅ User created. Default password:{" "}
          <span className="font-mono">{defaultPassword}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white py-2 px-4 rounded"
      >
        {loading ? "Creating..." : "Create User"}
      </button>
    </form>
  );
};

export default AdminCreateUserForm;
