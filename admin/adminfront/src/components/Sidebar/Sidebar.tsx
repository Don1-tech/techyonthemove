
import type { RequestFilter } from "../../types/dashboard";
import logo from "./logo.png";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  activeView: RequestFilter | "history";
  onNavigate: (
    view: RequestFilter | "history",
  ) => void;
}

export function Sidebar({
  activeView,
  onNavigate,
}: SidebarProps) {
  const dashboardActive =
    activeView === "all" ||
    activeView === "pending" ||
    activeView === "confirmed" ||
    activeView === "completed";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img
          src={logo}
          alt="Techy On The Move logo"
          className={styles.logo}
        />

        <span className={styles.brandText}>
          TECHY ADMIN
        </span>
      </div>

      <nav
        className={styles.nav}
        aria-label="Admin navigation"
      >
        <button
          type="button"
          className={`${styles.navItem} ${
            dashboardActive ? styles.active : ""
          }`}
          onClick={() => onNavigate("all")}
          aria-current={
            dashboardActive ? "page" : undefined
          }
        >
          <span className={styles.icon} aria-hidden="true">
            ◈
          </span>

          <span className={styles.navLabel}>
            Dashboard
          </span>
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${
            activeView === "history" ? styles.active : ""
          }`}
          onClick={() => onNavigate("history")}
          aria-current={
            activeView === "history" ? "page" : undefined
          }
        >
          <span className={styles.icon} aria-hidden="true">
            ▤
          </span>

          <span className={styles.navLabel}>
            Request History
          </span>
        </button>
      </nav>
    </aside>
  );
}
