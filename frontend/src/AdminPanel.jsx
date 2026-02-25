import React, { useEffect, useState } from "react";
import { db, functions } from "./firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useForm } from "react-hook-form";

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processing, setProcessing] = useState(null); // email or "manual"
  const [message, setMessage] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    // Fetch pending requests
    const q = query(
      collection(db, "access_requests"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(data);
      setLoadingRequests(false);
    }, (error) => {
      console.error("Error fetching requests:", error);
      setLoadingRequests(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (email, role, action) => {
    setProcessing(email);
    setMessage(null);
    try {
      const manageWhitelistFn = httpsCallable(functions, 'manageWhitelist');
      await manageWhitelistFn({ email, role, action });
      setMessage({ type: "success", text: `Successfully ${action}ed ${email}.` });
    } catch (error) {
      console.error("Error managing whitelist:", error);
      setMessage({ type: "error", text: `Failed to ${action} ${email}: ` + error.message });
    } finally {
      setProcessing(null);
    }
  };

  const onAddUser = async (data) => {
    setProcessing("manual");
    setMessage(null);
    try {
      const manageWhitelistFn = httpsCallable(functions, 'manageWhitelist');
      await manageWhitelistFn({ email: data.email, role: data.role, action: 'add' });
      setMessage({ type: "success", text: `Successfully added ${data.email}.` });
      reset();
    } catch (error) {
      console.error("Error adding user:", error);
      setMessage({ type: "error", text: `Failed to add user: ` + error.message });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Access Requests */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-lg font-medium text-gray-900">Access Requests</h2>
        {message && (
          <div className={`p-4 mb-4 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {loadingRequests ? (
          <p className="text-gray-500">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {requests.map((req) => (
              <li key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{req.email}</p>
                  <p className="text-xs text-gray-500">{req.timestamp?.toDate().toLocaleString()}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAction(req.email, 'viewer', 'add')}
                    disabled={!!processing}
                    className="px-3 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200 disabled:opacity-50"
                  >
                    Approve (Viewer)
                  </button>
                  <button
                    onClick={() => handleAction(req.email, 'admin', 'add')}
                    disabled={!!processing}
                    className="px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    Approve (Admin)
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add User Manually */}
      <div className="p-6 bg-white rounded-lg shadow h-fit">
        <h2 className="mb-4 text-lg font-medium text-gray-900">Add User Manually</h2>
        <form onSubmit={handleSubmit(onAddUser)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register("email", { required: true })}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              {...register("role")}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={!!processing}
            className={`w-full px-4 py-2 text-white rounded transition-colors ${
              processing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {processing === 'manual' ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>
    </div>
  );
}
