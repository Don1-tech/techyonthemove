
import { useEffect, useLayoutEffect, useRef } from "react";
import type { RequestFilter } from "../../types/dashboard";
import logo from "./logo.png";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  activeView: RequestFilter;
  onNavigate: (view: RequestFilter) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  activeView,
  onNavigate,
  mobileOpen,
  onClose,
}: SidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    if (mobileOpen) {
      wasOpenRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(frame);
    } else if (wasOpenRef.current) {
      document.getElementById("admin-navigation-toggle")?.focus();
      wasOpenRef.current = false;
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function trapDrawerFocus(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const drawer = document.getElementById("admin-mobile-sidebar");
      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>(
          "#admin-mobile-sidebar a[href], #admin-mobile-sidebar button:not([disabled])",
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (drawer && !drawer.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", trapDrawerFocus);
    return () => document.removeEventListener("keydown", trapDrawerFocus);
  }, [mobileOpen]);

  const dashboardActive =
    activeView === "all" ||
    activeView === "pending" ||
    activeView === "confirmed" ||
    activeView === "completed" ||
    activeView === "cancelled";

  return (
    <>
      <button
        type="button"
        className={`${styles.backdrop} ${mobileOpen ? styles.backdropVisible : ""}`}
        onClick={onClose}
        aria-label="Close navigation"
        tabIndex={mobileOpen ? 0 : -1}
      />
      <aside
        id="admin-mobile-sidebar"
        className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ""}`}
        aria-label="Admin sidebar"
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-labelledby="admin-sidebar-title"
      >
      <div className={styles.brand}>
        <img
          src={logo}
          alt="Techy On The Move logo"
          className={styles.logo}
        />

        <span className={styles.brandText}>
          <span id="admin-sidebar-title">TECHY ADMIN</span>
        </span>
        <button
          ref={closeButtonRef}
          id="admin-mobile-nav-close"
          type="button"
          className={styles.closeNavigation}
          onClick={onClose}
          aria-label="Close navigation"
        >
          ×
        </button>
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

      </nav>
      </aside>
    </>
  );
}
