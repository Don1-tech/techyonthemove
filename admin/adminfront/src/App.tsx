import { useEffect, useState } from "react";

import { AdminPage } from "./pages/AdminPage/AdminPage";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "./auth/auth";

export default function App() {
  const [authenticated, setAuthenticated] = useState(
    () => Boolean(getAuthToken()),
  );

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthToken();
      setAuthenticated(false);
    };

    window.addEventListener(
      "admin:unauthorized",
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        "admin:unauthorized",
        handleUnauthorized,
      );
    };
  }, []);

  function handleAuthenticated(token: string) {
    setAuthToken(token);
    setAuthenticated(true);
  }

  function handleLogout() {
    clearAuthToken();
    setAuthenticated(false);
  }

  if (!authenticated) {
    return (
      <LoginPage onAuthenticated={handleAuthenticated} />
    );
  }

  return (
    <>
      <AdminPage />

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Log out of admin dashboard"
        style={{
          position: "fixed",
          top: 20,
          right: 94,
          zIndex: 100,
          padding: "10px 14px",
          border: "1px solid #b8c5d8",
          borderRadius: 10,
          background: "#ffffff",
          color: "#26364e",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 3px 12px rgba(18, 26, 46, 0.08)",
        }}
      >
        Log out
      </button>
    </>
  );
}