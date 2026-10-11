import { useEffect, useMemo, useState } from "react";

import { RequestDetailsModal } from "../../components/RequestDetailsModal/RequestDetailsModal";
import { RequestCard } from "../../components/RequestCard/RequestCard";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { StatCards } from "../../components/StatCards/StatCards";
import { Topbar } from "../../components/Topbar/Topbar";
import { useAdminRequests } from "../../hooks/useAdminRequests";
import type { RequestFilter } from "../../types/dashboard";
import type { RequestStatus, ServiceRequest } from "../../types/request";
import { getNairobiDateKey } from "../../utils/format";
import styles from "./AdminPage.module.css";

type SortOption = "newest" | "oldest" | "appointment" | "status";
const sortOptions: SortOption[] = [
  "newest",
  "oldest",
  "appointment",
  "status",
];

// The API returns a request collection without pagination; this only pages the UI results.
const PAGE_SIZE = 20;

const statusOrder: Record<RequestStatus, number> = {
  pending: 0,
  confirmed: 1,
  completed: 2,
  cancelled: 3,
};

interface AdminPageProps {
  onLogout: () => void;
}

export function AdminPage({ onLogout }: AdminPageProps) {
  const {
    requests,
    filteredRequests,
    counts,
    filter,
    setFilter,
    search,
    setSearch,
    changeStatus,
    notifications,
    markNotificationRead,
    loading,
    hasLoaded,
    searchLoading,
    error,
    reload,
  } = useAdminRequests();

  const [selectedRequest, setSelectedRequest] =
    useState<ServiceRequest | null>(null);
  const [mobileNavigationOpen, setMobileNavigationOpen] =
    useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const handleOpenRequest = (request: ServiceRequest) => {
    markNotificationRead(request.id);
    setSelectedRequest(request);
  };

  const handleViewChange = (view: RequestFilter) => {
    setMobileNavigationOpen(false);
    setPage(1);
    setFilter(view);
  };

  const handleFilterChange = (nextFilter: RequestFilter) => {
    setPage(1);
    setFilter(nextFilter);
  };

  const visibleRequests = useMemo(() => {
    const filtered = filteredRequests.filter((request) => {
      const createdDate = getNairobiDateKey(request.createdAt);
      return (
        (!fromDate || (createdDate && createdDate >= fromDate)) &&
        (!toDate || (createdDate && createdDate <= toDate))
      );
    });

    return filtered.sort((a, b) => {
      if (sort === "status") {
        return (
          statusOrder[a.status] - statusOrder[b.status] ||
          compareCreatedAt(a, b, "newest")
        );
      }

      if (sort === "appointment") {
        const aAppointment = appointmentKey(a);
        const bAppointment = appointmentKey(b);
        if (!aAppointment && !bAppointment) {
          return compareCreatedAt(a, b, "newest");
        }
        if (!aAppointment) return 1;
        if (!bAppointment) return -1;
        return (
          aAppointment.localeCompare(bAppointment) ||
          compareCreatedAt(a, b, "newest")
        );
      }

      return compareCreatedAt(a, b, sort);
    });
  }, [filteredRequests, fromDate, toDate, sort]);

  const totalPages = Math.ceil(visibleRequests.length / PAGE_SIZE);
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const pageRequests = visibleRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [search, filter, fromDate, toDate, sort]);

  const openedRequest =
    selectedRequest &&
    (requests.find((request) => request.id === selectedRequest.id) ??
      selectedRequest);

  const hasActiveFilters =
    filter !== "all" || search.trim() !== "" || Boolean(fromDate || toDate);

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setFilter("all");
    setPage(1);
  }

  return (
    <div className={styles.shell}>
      <Sidebar
        activeView={filter}
        onNavigate={handleViewChange}
        mobileOpen={mobileNavigationOpen}
        onClose={() => setMobileNavigationOpen(false)}
      />

      <div className={styles.main}>
        <Topbar
          notifications={notifications}
          onNotificationClick={handleOpenRequest}
          onMenuClick={() => setMobileNavigationOpen(true)}
          mobileNavigationOpen={mobileNavigationOpen}
          onLogout={onLogout}
        />

        <main className={styles.content}>
          <section className={styles.overview} aria-label="Request statistics">
            <div className={styles.pageIntro}>
              <p className={styles.eyebrow}>WORKSPACE</p>
              <h1>Service requests</h1>
              <p>Review customer requests and track service progress.</p>
            </div>
            <StatCards
              counts={counts}
              state={
                hasLoaded
                  ? "ready"
                  : loading
                    ? "loading"
                    : "unavailable"
              }
            />
          </section>

          <section className={styles.requestSection} aria-labelledby="request-list-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="request-list-title">
                  Request queue
                </h2>
                <p aria-live="polite">
                  {error
                    ? "Results unavailable"
                    : loading || searchLoading
                    ? "Loading requests…"
                    : `${visibleRequests.length} ${
                        visibleRequests.length === 1 ? "request" : "requests"
                      } shown`}
                </p>
              </div>
              <div
                className={styles.searchWrapper}
                role="search"
                aria-label="Customer request search"
              >
                <span className={styles.searchIcon} aria-hidden="true">
                  <svg viewBox="0 0 20 20" focusable="false">
                    <circle cx="8.5" cy="8.5" r="5.5" />
                    <path d="m13 13 4 4" />
                  </svg>
                </span>
                <label className={styles.visuallyHidden} htmlFor="request-search">
                  Search requests by phone, customer name, email, or reference
                </label>
                <input
                  id="request-search"
                  type="search"
                  value={search}
                  aria-label="Search service requests"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search requests…"
                />
                {search && (
                  <button
                    type="button"
                    className={styles.clearSearch}
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    aria-label="Clear request search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className={styles.controls}>
              <div className={styles.filterGroup} role="group" aria-label="Filter requests by status">
                {(
                  [
                    ["all", "All requests"],
                    ["pending", "Pending"],
                    ["confirmed", "Confirmed"],
                    ["completed", "Completed"],
                    ["cancelled", "Cancelled"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={`${styles.filterButton} ${
                      filter === value ? styles.filterActive : ""
                    }`}
                    onClick={() => handleFilterChange(value)}
                    aria-pressed={filter === value}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className={styles.secondaryControls}>
                <label htmlFor="submitted-from">
                  <span>Submitted from</span>
                  <input
                    id="submitted-from"
                    type="date"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(event) => setFromDate(event.target.value)}
                  />
                </label>
                <label htmlFor="submitted-to">
                  <span>Submitted to</span>
                  <input
                    id="submitted-to"
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(event) => setToDate(event.target.value)}
                  />
                </label>
                <label className={styles.sortControl}>
                  <span>Sort by</span>
                  <select
                    value={sort}
                    onChange={(event) => {
                      const nextSort = event.target.value;
                      const validSort = sortOptions.find(
                        (option) => option === nextSort,
                      );
                      if (validSort) {
                        setSort(validSort);
                      }
                    }}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="appointment">Appointment date</option>
                    <option value="status">Status</option>
                  </select>
                </label>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className={styles.clearFilters}
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className={styles.error} role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => void reload()}>
                  Retry
                </button>
              </div>
            )}

            <div
              className={styles.list}
              role="list"
              aria-label="Customer requests"
              aria-busy={loading || searchLoading}
            >
              {(loading || searchLoading) &&
                Array.from({ length: 4 }, (_, index) => (
                  <div
                    className={styles.skeleton}
                    key={`skeleton-${index}`}
                    aria-hidden="true"
                    role="listitem"
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                ))}

              {!loading &&
                !searchLoading &&
                !error &&
                pageRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onOpen={handleOpenRequest}
                  />
                ))}

              {!loading &&
                !searchLoading &&
                !error &&
                visibleRequests.length === 0 && (
                  <div className={styles.empty} role="listitem">
                    <span className={styles.emptyMark} aria-hidden="true">
                      ✓
                    </span>
                    <h3>
                      {requests.length === 0
                        ? "No customer requests yet"
                        : search.trim()
                          ? "No requests match your search"
                          : fromDate || toDate
                            ? "No requests found for this date range"
                            : filter === "all"
                              ? "No requests found"
                              : `No ${filter} requests`}
                    </h3>
                    <p>
                      {requests.length === 0
                        ? "New requests will appear here when customers submit them."
                        : search.trim()
                          ? "Try a different name, reference, email, or phone number."
                          : fromDate || toDate
                            ? "Adjust the submitted date range or clear the filters."
                            : "Try another status filter to see more requests."}
                    </p>
                    {hasActiveFilters && (
                      <button type="button" onClick={clearFilters}>
                        Clear search and filters
                      </button>
                    )}
                  </div>
                )}
            </div>

            {visibleRequests.length > 0 && (
              <nav className={styles.pagination} aria-label="Request list pages">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, visibleRequests.length)} of{" "}
                  {visibleRequests.length}
                </span>
                <div>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </section>
        </main>
      </div>

      {openedRequest && (
        <RequestDetailsModal
          request={openedRequest}
          onClose={() => setSelectedRequest(null)}
          onStatusChange={changeStatus}
        />
      )}
    </div>
  );
}

function appointmentKey(request: ServiceRequest): string {
  if (!request.requestedDate) return "";
  return `${request.requestedDate}T${request.requestedTime || "00:00"}`;
}

function compareCreatedAt(
  a: ServiceRequest,
  b: ServiceRequest,
  direction: "newest" | "oldest",
): number {
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();

  if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
    return a.id.localeCompare(b.id);
  }
  if (Number.isNaN(aTime)) return 1;
  if (Number.isNaN(bTime)) return -1;

  const difference = direction === "newest" ? bTime - aTime : aTime - bTime;
  return difference || a.id.localeCompare(b.id);
}
