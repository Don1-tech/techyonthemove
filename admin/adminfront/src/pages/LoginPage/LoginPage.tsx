import { useState, type FormEvent } from "react";
import { API_BASE_URL } from "../../api/requestsApi";
import styles from "./LoginPage.module.css";

interface LoginPageProps {
  onAuthenticated: (token: string) => void;
}

export function LoginPage({
  onAuthenticated,
}: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        token?: string;
        message?: string;
      };

      if (!response.ok || !data.token) {
        setError(data.message ?? "Login failed. Check your credentials.");
        return;
      }

      onAuthenticated(data.token);
    } catch {
      setError(
        "Unable to reach the admin server. Check that the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <section className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>T</div>
          <div>
            <strong>TECHY</strong>
            <span>ON THE MOVE</span>
          </div>
        </div>

        <div className={styles.eyebrow}>
          <span className={styles.statusDot} />
          SECURE ADMIN ACCESS
        </div>

        <h1>Welcome back.</h1>
        <p className={styles.description}>
          Sign in to manage customer requests and monitor service activity.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="admin-username">Username</label>
          <input
            id="admin-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your admin username"
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in securely"}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>
        </form>

        <div className={styles.securityNote}>
          <span aria-hidden="true">◈</span>
          Protected admin access · Session expires after 8 hours
        </div>
      </section>

      <p className={styles.footer}>
        TECHY ON THE MOVE <span>·</span> TECHNOLOGY. WHEREVER YOU ARE.
      </p>
    </main>
  );
}