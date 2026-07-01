"use client";

/**
 * LogoutButton — ends the real-login session.
 * Clears the access_token (the only auth credential apiFetch reads in prod)
 * then full-reloads to /login (drops any in-memory state).
 */
export function LogoutButton() {
  function handleLogout() {
    try {
      localStorage.removeItem("access_token");
    } catch {
      // ignore storage access errors
    }
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
    >
      <span>🚪</span>ออกจากระบบ
    </button>
  );
}
