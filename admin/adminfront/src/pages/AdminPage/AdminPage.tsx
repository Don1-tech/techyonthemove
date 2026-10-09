
import { useState } from "react";

import { RequestDetailsModal } from "../../components/RequestDetailsModal/RequestDetailsModal";
import { RequestCard } from "../../components/RequestCard/RequestCard";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { StatCards } from "../../components/StatCards/StatCards";
import { Topbar } from "../../components/Topbar/Topbar";
import { useAdminRequests } from "../../hooks/useAdminRequests";
import type { RequestFilter } from "../../types/dashboard";
import type { ServiceRequest } from "../../types/request";
import styles from "./AdminPage.module.css";

export function AdminPage() {
  const {
    filteredRequests,
    counts,
    filter,
    setFilter,
    search,
    setSearch,
    changeStatus,
    notifications,
    markNotificationRead,
  } = useAdminRequests();

  const [selectedRequest, setSelectedRequest] =
    useState<ServiceRequest | null>(null);

  const [historyMode, setHistoryMode] =
    useState(false);

  const handleOpenRequest = (
    request: ServiceRequest,
  ) => {
    markNotificationRead(request.id);
    setSelectedRequest(request);
  };

  const handleViewChange = (
    view: RequestFilter | "history",
  ) => {
    if (view === "history") {
      setHistoryMode(true);
      setFilter("all");
      return;
    }

    setHistoryMode(false);
    setFilter(view);
  };

  const handleFilterChange = (
    nextFilter: RequestFilter,
  ) => {
    setHistoryMode(false);
    setFilter(nextFilter);
  };

  return (
    <div className={styles.shell}>
      <Sidebar
        activeView={
          historyMode
            ? "history"
            : filter
        }
        onNavigate={handleViewChange}
      />

      <div className={styles.main}>
        <Topbar
          search={search}
          onSearchChange={setSearch}
          notifications={notifications}
          onNotificationClick={
            handleOpenRequest
          }
        />

        <main className={styles.content}>
          <div className={styles.stats}>
            <StatCards counts={counts} />
          </div>

          <section className={styles.toolbar}>
            <div>
              <h2>
                {historyMode
                  ? "All customer requests"
                  : "Requests"}
              </h2>

              <p>
                {historyMode
                  ? "Search by phone number, name, email or request reference."
                  : "Monitor incoming requests and job progress."}
              </p>
            </div>

            {!historyMode && (
              <div
                className={
                  styles.filterGroup
                }
              >
                <button
                  type="button"
                  className={`${styles.filterPill} ${
                    filter === "all"
                      ? styles.active
                      : ""
                  }`}
                  onClick={() =>
                    handleFilterChange("all")
                  }
                >
                  All
                </button>

                <button
                  type="button"
                  className={`${styles.filterPill} ${
                    filter === "pending"
                      ? styles.active
                      : ""
                  }`}
                  onClick={() =>
                    handleFilterChange("pending")
                  }
                >
                  Pending
                </button>

                <button
                  type="button"
                  className={`${styles.filterPill} ${
                    filter === "confirmed"
                      ? styles.active
                      : ""
                  }`}
                  onClick={() =>
                    handleFilterChange("confirmed")
                  }
                >
                  Confirmed
                </button>

                <button
                  type="button"
                  className={`${styles.filterPill} ${
                    filter === "completed"
                      ? styles.active
                      : ""
                  }`}
                  onClick={() =>
                    handleFilterChange("completed")
                  }
                >
                  Completed
                </button>
              </div>
            )}
          </section>

          <div className={styles.resultsBar}>
            <span>
              {filteredRequests.length}{" "}
              {filteredRequests.length === 1
                ? "request"
                : "requests"}
            </span>

            {historyMode && (
              <span
                className={
                  styles.historyHint
                }
              >
                History search is ready for
                phone-number lookup.
              </span>
            )}
          </div>

          <section className={styles.list}>
            {filteredRequests.map(
              (request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onOpen={handleOpenRequest}
                  onStatusChange={changeStatus}
                />
              ),
            )}

            {filteredRequests.length === 0 && (
              <div className={styles.empty}>
                <div aria-hidden="true">
                  ∅
                </div>

                <h3>
                  No requests found
                </h3>

                <p>
                  Try another search or
                  choose a different
                  request status.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() =>
            setSelectedRequest(null)
          }
          onStatusChange={changeStatus}
        />
      )}
    </div>
  );
}
