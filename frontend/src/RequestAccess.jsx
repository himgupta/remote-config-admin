import React, { useState } from "react";
import { functions } from "./firebase";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "./AuthContext";

export default function RequestAccess() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleRequest = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const requestAccessFn = httpsCallable(functions, 'requestAccess');
      await requestAccessFn();
      setMessage({ type: "success", text: "Access request submitted. An admin will review it shortly." });
    } catch (error) {
      console.error("Error requesting access:", error);
      setMessage({ type: "error", text: "Failed to submit request: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md max-w-md w-full">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Access Required</h2>
        <p className="mb-6 text-gray-600">
          You do not have access to this application. Please request access below.
        </p>

        {message && (
          <div className={`p-4 mb-4 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleRequest}
            disabled={loading || (message && message.type === 'success')}
            className={`w-full px-4 py-2 text-white rounded transition-colors ${
              loading || (message && message.type === 'success')
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Submitting...' : 'Request Access'}
          </button>

          <button
            onClick={logout}
            className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
