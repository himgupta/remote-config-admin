import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useForm } from "react-hook-form";
import { functions, remoteConfig } from "./firebase";
import { httpsCallable } from "firebase/functions";
import { fetchAndActivate, getValue } from "firebase/remote-config";
import AuditLogs from "./AuditLogs";
import AdminPanel from "./AdminPanel";
import RequestAccess from "./RequestAccess";

export default function Dashboard() {
  const { currentUser, logout, isWhitelisted, role } = useAuth();
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("config"); // "config" or "admin"
  const [liveConfig, setLiveConfig] = useState(null);

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      enabled: false,
      title: "",
      message: "",
      journey: {
        login: { enabled: false },
        dashboard: { enabled: false, title: "", message: "" }
      }
    }
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        await fetchAndActivate(remoteConfig);
        const configStr = getValue(remoteConfig, "maintenance_config").asString();
        if (configStr) {
          const config = JSON.parse(configStr);
          reset(config); // Update form with fetched values
          setLiveConfig(config);
        }
      } catch (error) {
        console.error("Error fetching remote config:", error);
        setMessage({ type: "error", text: "Failed to load current configuration." });
      } finally {
        setLoadingConfig(false);
      }
    }

    // Only load config if whitelisted
    if (isWhitelisted) {
      loadConfig();
    }
  }, [reset, isWhitelisted]);

  const onSubmit = async (data) => {
    setUpdating(true);
    setMessage(null);
    try {
      const updateConfigFn = httpsCallable(functions, 'updateConfig');
      await updateConfigFn({ config: data });
      setMessage({ type: "success", text: "Configuration updated successfully!" });
      setLiveConfig(data); // update live config
    } catch (error) {
      console.error("Error updating config:", error);
      setMessage({ type: "error", text: "Failed to update configuration: " + error.message });
    } finally {
      setUpdating(false);
    }
  };

  if (!isWhitelisted) {
    return <RequestAccess />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-800">Maintenance Admin</h1>

              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab("config")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'config' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Configuration
                </button>
                {role === 'admin' && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'admin' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Admin Panel
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{currentUser?.email} ({role})</span>
              <button onClick={logout} className="text-sm text-blue-600 hover:text-blue-800">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {activeTab === 'config' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Main Config Form */}
            <div className="lg:col-span-2 space-y-6">

              {/* Active Nudges (Live Config) */}
              {!loadingConfig && liveConfig && (
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
                  <h2 className="mb-4 text-lg font-bold text-blue-900">Active Nudges (Live Configuration)</h2>
                  <div className="space-y-3 text-sm text-blue-800">
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="font-medium">Global Maintenance:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${liveConfig.enabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {liveConfig.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {liveConfig.enabled && (
                      <div className="py-2 border-b border-blue-200">
                        <p><span className="font-medium">Title:</span> {liveConfig.title || 'N/A'}</p>
                        <p><span className="font-medium">Message:</span> {liveConfig.message || 'N/A'}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="font-medium">Login Screen Maintenance:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${liveConfig.journey?.login?.enabled ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'}`}>
                        {liveConfig.journey?.login?.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-medium">Dashboard Maintenance:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${liveConfig.journey?.dashboard?.enabled ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'}`}>
                        {liveConfig.journey?.dashboard?.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {liveConfig.journey?.dashboard?.enabled && (
                      <div className="py-2">
                        <p><span className="font-medium">Dashboard Title:</span> {liveConfig.journey?.dashboard?.title || 'N/A'}</p>
                        <p><span className="font-medium">Dashboard Message:</span> {liveConfig.journey?.dashboard?.message || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Update Configuration</h2>

                {message && (
                  <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                  </div>
                )}

                {loadingConfig ? (
                  <p>Loading configuration...</p>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Global Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded bg-gray-50">
                      <div>
                        <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
                        <p className="text-sm text-gray-500">Master switch for the entire application.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" {...register("enabled")} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Global Message */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Global Title</label>
                        <input type="text" {...register("title")} className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Global Message</label>
                        <textarea {...register("message")} rows={3} className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                      </div>
                    </div>

                    <hr />

                    {/* Login Screen Config */}
                    <div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">Login Screen</h3>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" {...register("journey.login.enabled")} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label className="text-sm font-medium text-gray-700">Enable Maintenance on Login</label>
                      </div>
                    </div>

                    <hr />

                    {/* Dashboard Screen Config */}
                    <div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">Dashboard Screen</h3>
                      <div className="mb-4 flex items-center space-x-2">
                        <input type="checkbox" {...register("journey.dashboard.enabled")} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label className="text-sm font-medium text-gray-700">Enable Maintenance on Dashboard</label>
                      </div>

                      <div className={`space-y-4 pl-6 border-l-2 border-gray-200 ${!watch("journey.dashboard.enabled") ? "opacity-50" : ""}`}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Dashboard Title</label>
                          <input type="text" {...register("journey.dashboard.title")} className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Dashboard Message</label>
                          <textarea {...register("journey.dashboard.message")} rows={2} className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={updating}
                        className={`px-6 py-2 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${updating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {updating ? 'Activating...' : 'Activate Configuration'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar / Audit Logs */}
            <div className="lg:col-span-1">
              <AuditLogs />
            </div>
          </div>
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}
