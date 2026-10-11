import { useEffect, useRef, useState } from "react";

import type { ServiceRequest } from "../../types/request";
import { formatCustomerName } from "../../utils/format";
import styles from "./Topbar.module.css";

interface TopbarProps {
  notifications: ServiceRequest[];
  onNotificationClick: (request: ServiceRequest) => void;
  onMenuClick: () => void;
  mobileNavigationOpen: boolean;
  onLogout: () => void;
}

export function Topbar({
  notifications,
  onNotificationClick,
  onMenuClick,
  mobileNavigationOpen,
  onLogout,
}: TopbarProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [toastRequest, setToastRequest] = useState<ServiceRequest | null>(null);
  const previousNotificationIds = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentIds = new Set(notifications.map((request) => request.id));
    const newRequest = notifications.find(
      (request) => !previousNotificationIds.current.has(request.id),
    );

    if (newRequest) {
      setToastRequest(newRequest);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastRequest(null), 7000);
    }

    previousNotificationIds.current = currentIds;
  }, [notifications]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!notificationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [notificationOpen]);

  function openRequest(request: ServiceRequest) {
    onNotificationClick(request);
    setNotificationOpen(false);
    setToastRequest(null);
  }

  return (
    <>
      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.menuButton}
          id="admin-navigation-toggle"
          onClick={() => {
            onMenuClick();
            window.setTimeout(() => {
              document.getElementById("admin-mobile-nav-close")?.focus();
            }, 0);
          }}
          aria-label="Open navigation"
          aria-expanded={mobileNavigationOpen}
          aria-controls="admin-mobile-sidebar"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className={styles.heading}>
          <strong>Techy Admin</strong>
          <span>Service operations</span>
        </div>
        <div className={styles.actions}>
          <div className={styles.notificationArea}>
            <button
              type="button"
              className={`${styles.notificationButton} ${
                notificationOpen ? styles.notificationButtonActive : ""
              }`}
              onClick={() => setNotificationOpen((current) => !current)}
              aria-label={
                notifications.length > 0
                  ? `Notifications, ${notifications.length} new requests`
                  : "Notifications"
              }
              aria-expanded={notificationOpen}
              aria-controls="request-notifications"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </svg>
              {notifications.length > 0 && (
                <span className={styles.notificationCount}>
                  {notifications.length > 99 ? "99+" : notifications.length}
                </span>
              )}
            </button>

            {notificationOpen && (
              <section
                id="request-notifications"
                className={styles.notificationPanel}
                aria-label="New request notifications"
              >
                <div className={styles.panelHeader}>
                  <div>
                    <h2>New requests</h2>
                    <p>Requests waiting for your attention</p>
                  </div>
                  <span className={styles.panelCount}>
                    {notifications.length}
                  </span>
                </div>
                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <p className={styles.noNotifications}>
                      You&apos;re all caught up.
                    </p>
                  ) : (
                    notifications.map((request) => (
                      <button
                        type="button"
                        key={request.id}
                        className={styles.notificationItem}
                        onClick={() => openRequest(request)}
                      >
                        <span className={styles.notificationDot} aria-hidden="true" />
                        <span className={styles.notificationContent}>
                          <strong>{formatCustomerName(request.fullName)}</strong>
                          <span>
                            {request.serviceName} · {request.reference}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      {toastRequest && (
        <button
          type="button"
          className={styles.toast}
          onClick={() => openRequest(toastRequest)}
          aria-label={`Open new request from ${toastRequest.fullName}, ${toastRequest.reference}`}
          aria-live="polite"
        >
          <strong>New request received</strong>
          <span>
            {formatCustomerName(toastRequest.fullName)} · {toastRequest.serviceName}
          </span>
          <small>{toastRequest.reference} · View details</small>
        </button>
      )}
    </>
  );
}
