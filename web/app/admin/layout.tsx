"use client";

import { ReactNode, useState } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("settings");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="p-4">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${
              activeTab === "settings"
                ? "bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Site Settings
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Profile
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <button
                  onClick={() => {
                    setActiveTab("profile");
                    setShowProfileDropdown(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    fetch("/api/admin/logout", { method: "POST" }).then(() => {
                      window.location.href = "/admin";
                    });
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {activeTab === "settings" ? (
            <div key="settings">{children}</div>
          ) : (
            <div key="profile"><ProfileContent /></div>
          )}
        </div>
      </main>
    </div>
  );
}

function ProfileContent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Profile update not implemented yet. This would require updating environment variables.");
  };

  return (
    <div className="max-w-md">
      <h3 className="mb-4 text-lg font-semibold">Profile Settings</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Current username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Enter new password"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Save Changes
        </button>
      </form>
      {message && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      )}
    </div>
  );
}
