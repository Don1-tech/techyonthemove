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
    <AdminPage onLogout={handleLogout} />
  );
}