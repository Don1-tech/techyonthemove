
import {
  getAuthToken,
  notifyUnauthorized,
} from "../auth/auth";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getRequests,
  updateRequestStatus,
} from "../api/requestsApi";

import type { RequestFilter } from "../types/dashboard";
import type {
  RequestStatus,
  ServiceRequest,
} from "../types/request";

interface NotificationRequest {
  request: ServiceRequest;
  createdAt: number;
}

interface UseAdminRequestsResult {
  requests: ServiceRequest[];
  filteredRequests: ServiceRequest[];

  counts: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };

  filter: RequestFilter;
  setFilter: (filter: RequestFilter) => void;

  search: string;
  setSearch: (search: string) => void;

  changeStatus: (
    id: string,
    status: RequestStatus,
  ) => Promise<void>;

  notifications: ServiceRequest[];

  markNotificationRead: (
    requestId: string,
  ) => void;

  loading: boolean;
  error: string | null;

  reload: () => Promise<void>;
}

/* =========================================================
   WEBSOCKET URL
   ========================================================= */

const getWebSocketUrl = (): string => {
  const apiUrl =
    import.meta.env.VITE_ADMIN_API_URL ??
    "http://localhost:4100";

  const url = new URL("/ws/requests", apiUrl);

  url.protocol =
    url.protocol === "https:" ? "wss:" : "ws:";

  return url.toString();
};

/* =========================================================
   TECHY NOTIFICATION ASSETS
   ========================================================= */

const getTechyLogoUrl = (): string => {
  return new URL(
    "/LOGO.png",
    window.location.origin,
  ).href;
};

/* =========================================================
   SERVICE CATEGORY DISPLAY
   ========================================================= */

const getServiceCategory = (
  request: ServiceRequest,
): string => {
  const serviceName =
    typeof request.serviceName === "string"
      ? request.serviceName.trim()
      : "";

  if (serviceName) {
    return serviceName;
  }

  const serviceId =
    typeof request.serviceId === "string"
      ? request.serviceId.trim()
      : "";

  if (!serviceId) {
    return "service";
  }

  const serviceNames: Record<string, string> = {
    "wifi-internet": "Wi-Fi & Internet",
    "network-issues": "Network Issues",
    "pc-laptops": "PC & Laptops",
    "entertainment-other-tv": "Entertainment & TV",
    "tv-entertainment": "TV & Entertainment",
    "smart-home": "Smart Home",
    "smart-devices": "Smart Devices",
    cctv: "CCTV",
    "other-repairs": "Other Repairs",
  };

  if (serviceNames[serviceId]) {
    return serviceNames[serviceId];
  }

  return serviceId
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
};

/* =========================================================
   AUDIO NOTIFICATION SYSTEM
   ========================================================= */

let notificationAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!notificationAudioContext) {
      notificationAudioContext =
        new AudioContextClass();
    }

    return notificationAudioContext;
  } catch {
    return null;
  }
};

const unlockNotificationAudio = async (): Promise<void> => {
  try {
    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  } catch {
    // Audio failures must not break the dashboard.
  }
};

const playNotificationSound = (): void => {
  try {
    const audioContext = getAudioContext();

    if (
      !audioContext ||
      audioContext.state !== "running"
    ) {
      return;
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.setValueAtTime(880, now + 0.1);
    oscillator.frequency.setValueAtTime(660, now + 0.2);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      0.22,
      now + 0.025,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.35,
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.36);

    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
    });
  } catch {
    // Audio failures must not break the dashboard.
  }
};

/* =========================================================
   DESKTOP / BROWSER NOTIFICATIONS
   ========================================================= */

const requestBrowserNotificationPermission =
  async (): Promise<boolean> => {
    try {
      if (!("Notification" in window)) {
        return false;
      }

      if (Notification.permission === "granted") {
        return true;
      }

      if (Notification.permission === "denied") {
        return false;
      }

      const permission =
        await Notification.requestPermission();

      return permission === "granted";
    } catch {
      return false;
    }
  };

const showBrowserNotification = (
  request: ServiceRequest,
): void => {
  try {
    if (
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const serviceCategory =
      getServiceCategory(request);

    const techyLogoUrl = getTechyLogoUrl();

    const notification = new Notification(
      "New Techy On The Move Request",
      {
        body:
          `${request.fullName} submitted ` +
          `a request for ${serviceCategory}. ` +
          `Reference: ${request.reference}`,

        icon: techyLogoUrl,
        badge: techyLogoUrl,
        tag: `techy-request-${request.id}`,
        silent: false,
        requireInteraction: true,
      },
    );

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error(
      "Could not show browser notification:",
      error,
    );
  }
};

/* =========================================================
   REQUEST NORMALIZATION
   ========================================================= */

const normalizeDate = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);

  if (!match) {
    return "";
  }

  const date = match[1];

  const parsed = new Date(`${date}T00:00:00`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    return "";
  }

  return date;
};

const normalizeTime = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeRequest = (
  request: ServiceRequest,
): ServiceRequest => ({
  ...request,
  requestedDate: normalizeDate(request.requestedDate),
  requestedTime: normalizeTime(request.requestedTime),
});

/* =========================================================
   HOOK
   ========================================================= */

export function useAdminRequests(): UseAdminRequestsResult {
  const [requests, setRequests] =
    useState<ServiceRequest[]>([]);

  const [filter, setFilter] =
    useState<RequestFilter>("pending");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [notificationMap, setNotificationMap] =
    useState<Map<string, NotificationRequest>>(
      new Map(),
    );

  const knownRequestIds = useRef<Set<string>>(
    new Set(),
  );

  const mountedRef = useRef(false);

  const websocketRef = useRef<WebSocket | null>(
    null,
  );

  const reconnectTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  /* =======================================================
     LOAD REQUESTS
     ======================================================= */

  const reload = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await getRequests();

      if (!mountedRef.current) {
        return;
      }

      const normalized = data.map(normalizeRequest);

      setRequests(normalized);

      normalized.forEach((request) => {
        knownRequestIds.current.add(request.id);
      });
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load requests.",
      );
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /* =======================================================
     ENABLE AUDIO + DESKTOP NOTIFICATIONS
     ======================================================= */

  useEffect(() => {
    let handled = false;

    const handleFirstUserGesture = () => {
      if (handled) {
        return;
      }

      handled = true;

      void unlockNotificationAudio();
      void requestBrowserNotificationPermission();

      document.removeEventListener(
        "pointerdown",
        handleFirstUserGesture,
        true,
      );
    };

    document.addEventListener(
      "pointerdown",
      handleFirstUserGesture,
      true,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleFirstUserGesture,
        true,
      );
    };
  }, []);

  useEffect(() => {
    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      void unlockNotificationAudio();
    }
  }, []);

  /* =======================================================
     MARK NOTIFICATION AS READ
     ======================================================= */

  const markNotificationRead = useCallback(
    (requestId: string) => {
      setNotificationMap((current) => {
        if (!current.has(requestId)) {
          return current;
        }

        const next = new Map(current);
        next.delete(requestId);

        return next;
      });
    },
    [],
  );

  /* =======================================================
     HANDLE NEW REQUEST
     ======================================================= */

  const handleNewRequest = useCallback(
    (incomingRequest: ServiceRequest) => {
      const request = normalizeRequest(incomingRequest);

      if (!request.id) {
        console.error(
          "Realtime request has no ID:",
          request,
        );

        return;
      }

      // Prevent duplicate notifications for the same request.
      if (knownRequestIds.current.has(request.id)) {
        return;
      }

      knownRequestIds.current.add(request.id);

      setRequests((current) => {
        if (
          current.some(
            (item) => item.id === request.id,
          )
        ) {
          return current;
        }

        return [request, ...current];
      });

      setNotificationMap((current) => {
        const next = new Map(current);

        next.set(request.id, {
          request,
          createdAt: Date.now(),
        });

        return next;
      });

      playNotificationSound();
      showBrowserNotification(request);
    },
    [],
  );

  /* =======================================================
     WEBSOCKET CONNECTION
     ======================================================= */

  useEffect(() => {
    mountedRef.current = true;

    void reload();

    let reconnectAttempts = 0;
    let disposed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (
        disposed ||
        !mountedRef.current ||
        !getAuthToken()
      ) {
        return;
      }

      clearReconnectTimer();

      reconnectAttempts += 1;

      const delay = Math.min(
        1000 * 2 ** Math.min(reconnectAttempts, 5),
        10000,
      );

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (
        disposed ||
        !mountedRef.current
      ) {
        return;
      }

      // Never open or reconnect a socket without a token.
      const token = getAuthToken();

      if (!token) {
        notifyUnauthorized();
        return;
      }

      try {
        const socket = new WebSocket(getWebSocketUrl());

        websocketRef.current = socket;

        socket.onopen = () => {
          if (
            disposed ||
            websocketRef.current !== socket
          ) {
            socket.close();
            return;
          }

          const currentToken = getAuthToken();

          if (!currentToken) {
            socket.close(1008, "Login required");
            notifyUnauthorized();
            return;
          }

          /*
           * The backend expects this authentication
           * message before registering the socket for
           * realtime notifications.
           */
          socket.send(
            JSON.stringify({
              type: "authenticate",
              token: currentToken,
            }),
          );

          console.log(
            "Admin WebSocket connected; authentication sent.",
          );
        };

        socket.onmessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data);

            /*
             * The backend sends "connected" after
             * successful authentication. No further
             * action is needed for that message.
             */
            if (message.type === "connected") {
              reconnectAttempts = 0;

              console.log(
                "Admin realtime authentication successful.",
              );

              return;
            }

            if (
              message.type === "request.created" &&
              message.request
            ) {
              handleNewRequest(message.request);
              return;
            }

            if (
              message.type === "request.updated" &&
              message.request
            ) {
              const updatedRequest =
                normalizeRequest(message.request);

              if (!updatedRequest.id) {
                return;
              }

              knownRequestIds.current.add(
                updatedRequest.id,
              );

              setRequests((current) =>
                current.map((request) =>
                  request.id === updatedRequest.id
                    ? updatedRequest
                    : request,
                ),
              );

              // Update an existing unread notification,
              // without creating another notification.
              setNotificationMap((current) => {
                const existing = current.get(
                  updatedRequest.id,
                );

                if (!existing) {
                  return current;
                }

                const next = new Map(current);

                next.set(updatedRequest.id, {
                  ...existing,
                  request: updatedRequest,
                });

                return next;
              });
            }
          } catch (messageError) {
            console.error(
              "Invalid realtime message:",
              messageError,
            );
          }
        };

        socket.onerror = (socketError) => {
          console.error(
            "Admin WebSocket error:",
            socketError,
          );

          // onclose handles reconnection and cleanup.
          if (
            socket.readyState === WebSocket.CONNECTING ||
            socket.readyState === WebSocket.OPEN
          ) {
            socket.close();
          }
        };

        socket.onclose = (event: CloseEvent) => {
          if (websocketRef.current === socket) {
            websocketRef.current = null;
          }

          if (
            disposed ||
            !mountedRef.current
          ) {
            return;
          }

          /*
           * Close code 1008 is used by the backend
           * when authentication is missing, invalid,
           * or expired. Do not retry with a bad token.
           */
          if (event.code === 1008) {
            clearReconnectTimer();
            notifyUnauthorized();
            return;
          }

          scheduleReconnect();
        };
      } catch (socketError) {
        console.error(
          "Could not create admin WebSocket:",
          socketError,
        );

        scheduleReconnect();
      }
    };

    connect();

    return () => {
      disposed = true;
      mountedRef.current = false;

      clearReconnectTimer();

      const socket = websocketRef.current;
      websocketRef.current = null;

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (
          socket.readyState === WebSocket.CONNECTING ||
          socket.readyState === WebSocket.OPEN
        ) {
          socket.close();
        }
      }
    };
  }, [handleNewRequest, reload]);

  /* =======================================================
     REQUEST STATUS UPDATE
     ======================================================= */

  const changeStatus = useCallback(
    async (
      id: string,
      status: RequestStatus,
    ): Promise<void> => {
      try {
        setError(null);

        const updated = await updateRequestStatus(
          id,
          status,
        );

        const normalized = normalizeRequest(updated);

        setRequests((current) =>
          current.map((request) =>
            request.id === id
              ? normalized
              : request,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update request status.";

        setError(message);
        throw err;
      }
    },
    [],
  );

  /* =======================================================
     FILTER + SEARCH
     ======================================================= */

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return requests
      .filter((request) => {
        if (
          filter !== "all" &&
          request.status !== filter
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          request.phone,
          request.fullName,
          request.email,
          request.reference,
          request.serviceId,
          request.location,
        ]
          .filter(
            (value): value is string =>
              typeof value === "string" &&
              value.length > 0,
          )
          .some((value) =>
            value.toLowerCase().includes(normalizedSearch),
          );
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();

        if (Number.isNaN(aTime)) {
          return 1;
        }

        if (Number.isNaN(bTime)) {
          return -1;
        }

        return bTime - aTime;
      });
  }, [requests, filter, search]);

  /* =======================================================
     STATUS COUNTS
     ======================================================= */

  const counts = useMemo(
    () => ({
      pending: requests.filter(
        (request) => request.status === "pending",
      ).length,

      confirmed: requests.filter(
        (request) => request.status === "confirmed",
      ).length,

      completed: requests.filter(
        (request) => request.status === "completed",
      ).length,

      cancelled: requests.filter(
        (request) => request.status === "cancelled",
      ).length,
    }),
    [requests],
  );

  /* =======================================================
     UNREAD NOTIFICATIONS
     ======================================================= */

  const notifications = useMemo(
    () =>
      Array.from(notificationMap.values())
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((item) => item.request),
    [notificationMap],
  );

  /* =======================================================
     RETURN
     ======================================================= */

  return {
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
    error,

    reload,
  };
}
