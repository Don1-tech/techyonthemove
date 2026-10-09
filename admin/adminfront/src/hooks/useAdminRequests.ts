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

const getWebSocketUrl = () => {
  const apiUrl =
    import.meta.env.VITE_ADMIN_API_URL ??
    "http://localhost:4100";

  const url = new URL(
    "/ws/requests",
    apiUrl,
  );

  url.protocol =
    url.protocol === "https:"
      ? "wss:"
      : "ws:";

  return url.toString();
};


/* =========================================================
   TECHY NOTIFICATION ASSETS
   ========================================================= */

/*
 * The Techy logo is stored in:
 *
 * adminfront/public/LOGO.png
 *
 * Using window.location.origin creates the
 * complete URL, for example:
 *
 * http://localhost:5174/LOGO.png
 *
 * This is more reliable for browser notifications
 * than using only "/LOGO.png".
 */

const getTechyLogoUrl = (): string => {
  return new URL(
    "/LOGO.png",
    window.location.origin,
  ).href;
};


/* =========================================================
   SERVICE CATEGORY DISPLAY
   ========================================================= */

/*
 * The realtime request may contain serviceName,
 * but the backend can also provide only serviceId.
 *
 * This function makes sure the notification NEVER
 * says "undefined".
 */

const getServiceCategory = (
  request: ServiceRequest,
): string => {
  const serviceName =
    typeof request.serviceName ===
    "string"
      ? request.serviceName.trim()
      : "";

  if (serviceName) {
    return serviceName;
  }

  const serviceId =
    typeof request.serviceId ===
    "string"
      ? request.serviceId.trim()
      : "";

  if (!serviceId) {
    return "service";
  }

  /*
   * Convert backend service IDs into
   * friendly notification text.
   */

  const serviceNames: Record<
    string,
    string
  > = {
    "wifi-internet":
      "Wi-Fi & Internet",

    "network-issues":
      "Network Issues",

    "pc-laptops":
      "PC & Laptops",

    "entertainment-other-tv":
      "Entertainment & TV",

    "smart-home":
      "Smart Home",

    "smart-devices":
      "Smart Devices",

    cctv:
      "CCTV",

    "other-repairs":
      "Other Repairs",
  };

  if (
    serviceNames[serviceId]
  ) {
    return serviceNames[
      serviceId
    ];
  }

  /*
   * Generic fallback for any future
   * service IDs added to the database.
   */

  return serviceId
    .replace(/[-_]+/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
};


/* =========================================================
   AUDIO NOTIFICATION SYSTEM
   ========================================================= */

let notificationAudioContext:
  | AudioContext
  | null = null;


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


/*
 * Unlock the browser audio system after
 * an actual administrator interaction.
 */

const unlockNotificationAudio =
  async () => {
    try {
      const audioContext =
        getAudioContext();

      if (!audioContext) {
        return;
      }

      if (
        audioContext.state ===
        "suspended"
      ) {
        await audioContext.resume();
      }
    } catch {
      /*
       * Audio problems must never
       * break the dashboard.
       */
    }
  };


/*
 * Play the new-request notification sound.
 */

const playNotificationSound = () => {
  try {
    const audioContext =
      getAudioContext();

    if (!audioContext) {
      return;
    }

    if (
      audioContext.state ===
      "suspended"
    ) {
      return;
    }

    const now =
      audioContext.currentTime;

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type = "sine";

    /*
     * Two-tone notification sound.
     */

    oscillator.frequency.setValueAtTime(
      660,
      now,
    );

    oscillator.frequency.setValueAtTime(
      880,
      now + 0.10,
    );

    oscillator.frequency.setValueAtTime(
      660,
      now + 0.20,
    );

    /*
     * Start almost silent.
     */

    gain.gain.setValueAtTime(
      0.0001,
      now,
    );

    /*
     * Increase volume.
     */

    gain.gain.exponentialRampToValueAtTime(
      0.22,
      now + 0.025,
    );

    /*
     * Fade out.
     */

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.35,
    );

    oscillator.connect(gain);

    gain.connect(
      audioContext.destination,
    );

    oscillator.start(now);

    oscillator.stop(
      now + 0.36,
    );

    oscillator.addEventListener(
      "ended",
      () => {
        oscillator.disconnect();
        gain.disconnect();
      },
    );
  } catch {
    /*
     * Never allow sound errors
     * to break the application.
     */
  }
};


/* =========================================================
   DESKTOP / BROWSER NOTIFICATIONS
   ========================================================= */

const requestBrowserNotificationPermission =
  async (): Promise<boolean> => {
    try {
      if (
        !("Notification" in window)
      ) {
        return false;
      }

      if (
        Notification.permission ===
        "granted"
      ) {
        return true;
      }

      if (
        Notification.permission ===
        "denied"
      ) {
        return false;
      }

      const permission =
        await Notification.requestPermission();

      return (
        permission ===
        "granted"
      );
    } catch {
      return false;
    }
  };


const showBrowserNotification = (
  request: ServiceRequest,
) => {
  try {
    if (
      !("Notification" in window)
    ) {
      return;
    }

    if (
      Notification.permission !==
      "granted"
    ) {
      return;
    }

    /*
     * Resolve the service category safely.
     */

    const serviceCategory =
      getServiceCategory(
        request,
      );

    /*
     * Full Techy logo URL.
     */

    const techyLogoUrl =
      getTechyLogoUrl();

    console.log(
      "Techy notification icon:",
      techyLogoUrl,
    );

    const notification =
      new Notification(
        "New Techy On The Move Request",
        {
          /*
           * Example:
           *
           * Edward Doe submitted a request
           * for Network Issues.
           */

          body:
            `${request.fullName} submitted ` +
            `a request for ${serviceCategory}. ` +
            `Reference: ${request.reference}`,

          /*
           * Use the Techy logo instead of
           * the Chrome favicon.
           */

          icon: techyLogoUrl,

          /*
           * Badge used by supported systems.
           */

          badge: techyLogoUrl,

          /*
           * Unique notification tag for
           * each Techy request.
           */

          tag:
            `techy-request-${request.id}`,

          /*
           * Do not make the notification silent.
           */

          silent: false,

          /*
           * Keep the notification visible
           * until the administrator interacts.
           */

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

    /*
     * Desktop notifications are optional.
     * The in-app notification bell continues
     * working if desktop notifications fail.
     */
  }
};


/* =========================================================
   REQUEST NORMALIZATION
   ========================================================= */

const normalizeDate = (
  value: unknown,
): string => {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  const trimmed =
    value.trim();

  if (!trimmed) {
    return "";
  }

  /*
   * Accept:
   *
   * 2026-10-08
   *
   * or:
   *
   * 2026-10-08T00:00:00.000Z
   */

  const match =
    /^(\d{4}-\d{2}-\d{2})/.exec(
      trimmed,
    );

  if (!match) {
    return "";
  }

  const date =
    match[1];

  const parsed =
    new Date(
      `${date}T00:00:00`,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return "";
  }

  return date;
};


const normalizeTime = (
  value: unknown,
): string => {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
};


const normalizeRequest = (
  request: ServiceRequest,
): ServiceRequest => ({
  ...request,

  requestedDate:
    normalizeDate(
      request.requestedDate,
    ),

  requestedTime:
    normalizeTime(
      request.requestedTime,
    ),
});


/* =========================================================
   HOOK
   ========================================================= */

export function useAdminRequests(): UseAdminRequestsResult {
  const [
    requests,
    setRequests,
  ] = useState<ServiceRequest[]>([]);

  const [
    filter,
    setFilter,
  ] = useState<RequestFilter>(
    "pending",
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    notificationMap,
    setNotificationMap,
  ] = useState<
    Map<string, NotificationRequest>
  >(new Map());

  const knownRequestIds =
    useRef<Set<string>>(
      new Set(),
    );

  const mountedRef =
    useRef(true);

  const websocketRef =
    useRef<WebSocket | null>(
      null,
    );

  const reconnectTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);


  /* =======================================================
     LOAD REQUESTS
     ======================================================= */

  const reload = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getRequests();

        if (
          !mountedRef.current
        ) {
          return;
        }

        const normalized =
          data.map(
            normalizeRequest,
          );

        setRequests(
          normalized,
        );

        normalized.forEach(
          (request) => {
            knownRequestIds.current.add(
              request.id,
            );
          },
        );
      } catch (err) {
        if (
          !mountedRef.current
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load requests.",
        );
      } finally {
        if (
          mountedRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [],
  );


  /* =======================================================
     ENABLE AUDIO + DESKTOP NOTIFICATIONS
     ======================================================= */

  useEffect(() => {
    let handled =
      false;

    /*
     * Chrome requires a user gesture before
     * audio can be played automatically.
     *
     * The first click/touch on the admin page:
     *
     * 1. Unlocks AudioContext.
     * 2. Requests desktop notification permission.
     */

    const handleFirstUserGesture =
      () => {
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


  /*
   * If desktop notifications were already
   * allowed from a previous visit, initialize
   * the audio context.
   */

  useEffect(() => {
    if (
      "Notification" in window &&
      Notification.permission ===
        "granted"
    ) {
      void unlockNotificationAudio();
    }
  }, []);


  /* =======================================================
     MARK NOTIFICATION AS READ
     ======================================================= */

  const markNotificationRead =
    useCallback(
      (
        requestId: string,
      ) => {
        setNotificationMap(
          (current) => {
            if (
              !current.has(
                requestId,
              )
            ) {
              return current;
            }

            const next =
              new Map(
                current,
              );

            next.delete(
              requestId,
            );

            return next;
          },
        );
      },
      [],
    );


  /* =======================================================
     HANDLE NEW REQUEST
     ======================================================= */

  const handleNewRequest =
    useCallback(
      (
        incomingRequest: ServiceRequest,
      ) => {
        const request =
          normalizeRequest(
            incomingRequest,
          );

        /*
         * Every realtime request must have
         * an ID so duplicate messages can
         * be prevented.
         */

        if (!request.id) {
          console.error(
            "Realtime request has no ID:",
            request,
          );

          return;
        }

        /*
         * Prevent duplicate notifications
         * for the same request.
         */

        if (
          knownRequestIds.current.has(
            request.id,
          )
        ) {
          return;
        }

        knownRequestIds.current.add(
          request.id,
        );


        /* -----------------------------------------------
           ADD REQUEST TO DASHBOARD
           ----------------------------------------------- */

        setRequests(
          (current) => {
            const exists =
              current.some(
                (item) =>
                  item.id ===
                  request.id,
              );

            if (exists) {
              return current;
            }

            return [
              request,
              ...current,
            ];
          },
        );


        /* -----------------------------------------------
           ADD TO BELL NOTIFICATIONS
           ----------------------------------------------- */

        setNotificationMap(
          (current) => {
            const next =
              new Map(
                current,
              );

            next.set(
              request.id,
              {
                request,
                createdAt:
                  Date.now(),
              },
            );

            return next;
          },
        );


        /* -----------------------------------------------
           PLAY SOUND
           ----------------------------------------------- */

        playNotificationSound();


        /* -----------------------------------------------
           SHOW DESKTOP NOTIFICATION
           ----------------------------------------------- */

        showBrowserNotification(
          request,
        );
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

    const connect = () => {
      if (
        !mountedRef.current
      ) {
        return;
      }

      try {
        const socket =
          new WebSocket(
            getWebSocketUrl(),
          );

        websocketRef.current =
          socket;


        socket.onopen = () => {
          reconnectAttempts = 0;

          console.log(
            "Admin realtime connection established.",
          );
        };


        socket.onmessage = (
          event,
        ) => {
          try {
            const message =
              JSON.parse(
                event.data,
              );


            /*
             * NEW REQUEST
             */

            if (
              message.type ===
                "request.created" &&
              message.request
            ) {
              handleNewRequest(
                message.request,
              );

              return;
            }


            /*
             * UPDATED REQUEST
             */

            if (
              message.type ===
                "request.updated" &&
              message.request
            ) {
              const updatedRequest =
                normalizeRequest(
                  message.request,
                );

              if (
                !updatedRequest.id
              ) {
                return;
              }

              knownRequestIds.current.add(
                updatedRequest.id,
              );

              setRequests(
                (current) =>
                  current.map(
                    (request) =>
                      request.id ===
                      updatedRequest.id
                        ? updatedRequest
                        : request,
                  ),
              );


              /*
               * If the request is already
               * unread, update its notification
               * data without creating a new
               * notification.
               */

              setNotificationMap(
                (current) => {
                  const existing =
                    current.get(
                      updatedRequest.id,
                    );

                  if (!existing) {
                    return current;
                  }

                  const next =
                    new Map(
                      current,
                    );

                  next.set(
                    updatedRequest.id,
                    {
                      ...existing,
                      request:
                        updatedRequest,
                    },
                  );

                  return next;
                },
              );
            }
          } catch (messageError) {
            console.error(
              "Invalid realtime message:",
              messageError,
            );
          }
        };


        socket.onerror = (
          socketError,
        ) => {
          console.error(
            "Admin WebSocket error:",
            socketError,
          );

          if (
            socket.readyState ===
            WebSocket.OPEN
          ) {
            return;
          }

          socket.close();
        };


        socket.onclose = () => {
          if (
            !mountedRef.current
          ) {
            return;
          }

          reconnectAttempts += 1;

          const delay =
            Math.min(
              1000 *
                2 **
                  Math.min(
                    reconnectAttempts,
                    5,
                  ),
              10000,
            );

          reconnectTimerRef.current =
            setTimeout(
              connect,
              delay,
            );
        };
      } catch (socketError) {
        console.error(
          "Could not create admin WebSocket:",
          socketError,
        );

        reconnectAttempts += 1;

        reconnectTimerRef.current =
          setTimeout(
            connect,
            3000,
          );
      }
    };


    connect();


    return () => {
      mountedRef.current = false;

      if (
        reconnectTimerRef.current
      ) {
        clearTimeout(
          reconnectTimerRef.current,
        );

        reconnectTimerRef.current =
          null;
      }

      if (
        websocketRef.current
      ) {
        websocketRef.current.close();

        websocketRef.current =
          null;
      }
    };
  }, [
    handleNewRequest,
    reload,
  ]);


  /* =======================================================
     REQUEST STATUS UPDATE
     ======================================================= */

  const changeStatus =
    useCallback(
      async (
        id: string,
        status: RequestStatus,
      ) => {
        try {
          setError(null);

          const updated =
            await updateRequestStatus(
              id,
              status,
            );

          const normalized =
            normalizeRequest(
              updated,
            );

          setRequests(
            (current) =>
              current.map(
                (request) =>
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

  const filteredRequests =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return requests
        .filter((request) => {
          if (
            filter !== "all" &&
            request.status !==
              filter
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
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
            .filter(Boolean)
            .some(
              (value) =>
                value
                  ?.toLowerCase()
                  .includes(
                    normalizedSearch,
                  ),
            );
        })
        .sort(
          (a, b) => {
            const aTime =
              new Date(
                a.createdAt,
              ).getTime();

            const bTime =
              new Date(
                b.createdAt,
              ).getTime();

            if (
              Number.isNaN(
                aTime,
              )
            ) {
              return 1;
            }

            if (
              Number.isNaN(
                bTime,
              )
            ) {
              return -1;
            }

            return (
              bTime - aTime
            );
          },
        );
    }, [
      requests,
      filter,
      search,
    ]);


  /* =======================================================
     COUNTS
     ======================================================= */

  const counts =
    useMemo(
      () => ({
        pending:
          requests.filter(
            (request) =>
              request.status ===
              "pending",
          ).length,

        confirmed:
          requests.filter(
            (request) =>
              request.status ===
              "confirmed",
          ).length,

        completed:
          requests.filter(
            (request) =>
              request.status ===
              "completed",
          ).length,

        cancelled:
          requests.filter(
            (request) =>
              request.status ===
              "cancelled",
          ).length,
      }),
      [requests],
    );


  /* =======================================================
     NOTIFICATIONS
     ======================================================= */

  const notifications =
    useMemo(
      () =>
        Array.from(
          notificationMap.values(),
        )
          .sort(
            (a, b) =>
              b.createdAt -
              a.createdAt,
          )
          .map(
            (item) =>
              item.request,
          ),
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