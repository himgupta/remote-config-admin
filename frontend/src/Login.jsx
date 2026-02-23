import React from "react";
import { useAuth } from "./AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [error, setError] = React.useState("");

  async function handleLogin() {
    try {
      await login();
    } catch (err) {
      setError("Failed to log in: " + err.message);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg">
        <h3 className="text-2xl font-bold text-center text-gray-800">Login to Dashboard</h3>
        {error && <div className="p-3 my-2 text-red-500 bg-red-100 border border-red-300 rounded">{error}</div>}
        <div className="mt-4 text-center">
          <button
            onClick={handleLogin}
            className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
