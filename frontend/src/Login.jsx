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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20">

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ring-4 ring-blue-100/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Nudge Admin
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please sign in to access the dashboard.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 border-l-4 border-red-500 rounded animate-pulse" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Login Button */}
        <div className="mt-6">
          <button
            onClick={handleLogin}
            className="w-full group flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {/* Google G Logo SVG */}
            <div className="bg-white p-1 rounded-full mr-3 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
            </div>
            Sign in with Google
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-400 font-medium">
            &copy; {new Date().getFullYear()} Nudge App. Secure Admin Portal.
          </p>
        </div>
      </div>
    </div>
  );
}
