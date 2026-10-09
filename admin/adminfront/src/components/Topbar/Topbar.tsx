
import {
  useEffect,
  useRef,
  useState,
} from "react";

import type { ServiceRequest } from "../../types/request";
import styles from "./Topbar.module.css";

interface TopbarProps {
  search: string;
  onSearchChange: (
    value: string,
  ) => void;

  notifications: ServiceRequest[];

  onNotificationClick: (
    request: ServiceRequest,
  ) => void;
}

export function Topbar({
  search,
  onSearchChange,
  notifications,
  onNotificationClick,
}: TopbarProps) {
  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState(false);

  const [
    toastRequest,
    setToastRequest,
  ] = useState<ServiceRequest | null>(
    null,
  );

  const previousNotificationIds =
    useRef<Set<string>>(
      new Set(),
    );

  const toastTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);


  /* =======================================================
     DETECT NEW NOTIFICATION FOR TOAST
     ======================================================= */

  useEffect(() => {
    const currentIds =
      new Set(
        notifications.map(
          (request) =>
            request.id,
        ),
      );

    const newRequest =
      notifications.find(
        (request) =>
          !previousNotificationIds.current.has(
            request.id,
          ),
      );

    if (newRequest) {
      setToastRequest(
        newRequest,
      );

      if (
        toastTimerRef.current
      ) {
        clearTimeout(
          toastTimerRef.current,
        );
      }

      toastTimerRef.current =
        setTimeout(() => {
          setToastRequest(
            null,
          );
        }, 7000);
    }

    previousNotificationIds.current =
      currentIds;
  }, [notifications]);


  /* =======================================================
     CLEANUP
     ======================================================= */

  useEffect(() => {
    return () => {
      if (
        toastTimerRef.current
      ) {
        clearTimeout(
          toastTimerRef.current,
        );
      }
    };
  }, []);


  /* =======================================================
     OPEN REQUEST FROM TOAST
     ======================================================= */

  const handleToastClick = () => {
    if (!toastRequest) {
      return;
    }

    onNotificationClick(
      toastRequest,
    );

    setToastRequest(null);
  };


  /* =======================================================
     OPEN REQUEST FROM PANEL
     ======================================================= */

  const handleNotificationClick = (
    request: ServiceRequest,
  ) => {
    onNotificationClick(
      request,
    );

    setNotificationOpen(
      false,
    );
  };


  /* =======================================================
     SEARCH
     ======================================================= */

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onSearchChange(
      event.target.value,
    );
  };


  /* =======================================================
     CLEAR SEARCH
     ======================================================= */

  const clearSearch = () => {
    onSearchChange("");
  };


  return (
    <>
      <header
        className={
          styles.topbar
        }
      >
        {/* SEARCH */}
        <div
          className={
            styles.searchWrapper
          }
        >
          <span
            className={
              styles.searchIcon
            }
            aria-hidden="true"
          >
            <span />
          </span>

          <input
            type="text"
            value={search}
            onChange={
              handleSearchChange
            }
            placeholder="Search requests..."
            aria-label="Search requests"
            className={
              styles.searchInput
            }
          />

          {search && (
            <button
              type="button"
              className={
                styles.clearButton
              }
              onClick={
                clearSearch
              }
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>


        {/* NOTIFICATION */}
        <div
          className={
            styles.notificationArea
          }
        >
          <button
            type="button"
            className={`${styles.notificationButton} ${
              notificationOpen
                ? styles.notificationButtonActive
                : ""
            }`}
            onClick={() =>
              setNotificationOpen(
                (current) =>
                  !current,
              )
            }
            aria-label={
              notifications.length > 0
                ? `${notifications.length} new requests`
                : "Notifications"
            }
            aria-expanded={
              notificationOpen
            }
          >
            <span
              className={
                styles.bellIcon
              }
              aria-hidden="true"
            >
              <span />
            </span>

            {notifications.length >
              0 && (
              <span
                className={
                  styles.notificationCount
                }
              >
                {notifications.length >
                99
                  ? "99+"
                  : notifications.length}
              </span>
            )}
          </button>


          {/* NOTIFICATION PANEL */}
          {notificationOpen && (
            <div
              className={
                styles.notificationPanel
              }
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <h3>
                    New requests
                  </h3>

                  <p>
                    Requests waiting
                    for your attention
                  </p>
                </div>

                <span
                  className={
                    styles.panelCount
                  }
                >
                  {
                    notifications.length
                  }
                </span>
              </div>

              <div
                className={
                  styles.notificationList
                }
              >
                {notifications.length ===
                  0 && (
                  <div
                    className={
                      styles.noNotifications
                    }
                  >
                    <span
                      className={
                        styles.noNotificationIcon
                      }
                    >
                      ✓
                    </span>

                    <p>
                      You're all
                      caught up.
                    </p>
                  </div>
                )}

                {notifications.map(
                  (request) => (
                    <button
                      type="button"
                      key={
                        request.id
                      }
                      className={
                        styles.notificationItem
                      }
                      onClick={() =>
                        handleNotificationClick(
                          request,
                        )
                      }
                    >
                      <span
                        className={
                          styles.notificationDot
                        }
                      />

                      <span
                        className={
                          styles.notificationContent
                        }
                      >
                        <strong>
                          New request
                        </strong>

                        <span>
                          {
                            request.fullName
                          }
                        </span>

                        <small>
                          {
                            request.serviceName
                          }
                          {" · "}
                          {
                            request.reference
                          }
                        </small>
                      </span>

                      <span
                        className={
                          styles.notificationArrow
                        }
                      >
                        →
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </header>


      {/* ===================================================
          NEW REQUEST TOAST
          =================================================== */}

      {toastRequest && (
        <button
          type="button"
          className={
            styles.toast
          }
          onClick={
            handleToastClick
          }
          aria-label="Open new request"
        >
          <span
            className={
              styles.toastIcon
            }
            aria-hidden="true"
          >
            <span />
          </span>

          <span
            className={
              styles.toastContent
            }
          >
            <strong>
              New request received
            </strong>

            <span>
              {
                toastRequest.fullName
              }
              {" · "}
              {
                toastRequest.serviceName
              }
            </span>

            <small>
              {
                toastRequest.reference
              }
              {" · "}
              Click to view
            </small>
          </span>

          <span
            className={
              styles.toastClose
            }
            aria-hidden="true"
          >
            ×
          </span>
        </button>
      )}
    </>
  );
}