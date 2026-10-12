
import { useEffect, useRef, useState } from "react";
import styles from "./TurnstileWidget.module.css";

interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: "light" | "dark" | "auto";
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: (errorCode?: string) => void;
  "timeout-callback"?: () => void;
}

interface TurnstileApi {
  render: (
    container: HTMLElement | string,
    options: TurnstileRenderOptions
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  action: "request_create" | "review_submit";
  siteKey: string;
  onTokenChange: (token: string) => void;
  onErrorChange?: (error: string) => void;
}

const TURNSTILE_SCRIPT_SELECTOR =
  'script[data-turnstile-script="true"]';

let turnstileLoadPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser."));
  }

  if (window.turnstile?.render) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileLoadPromise) {
    return turnstileLoadPromise;
  }

  turnstileLoadPromise = new Promise<TurnstileApi>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      TURNSTILE_SCRIPT_SELECTOR
    );

    const isNewScript = !script;

    if (!script) {
      script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.turnstileScript = "true";
    }

    let settled = false;

    const cleanup = () => {
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };

    const handleLoad = () => {
      if (settled) return;

      if (!window.turnstile?.render) {
        handleError();
        return;
      }

      settled = true;
      cleanup();
      resolve(window.turnstile);
    };

    const handleError = () => {
      if (settled) return;

      settled = true;
      cleanup();

      if (isNewScript) {
        script?.remove();
      }

      turnstileLoadPromise = null;
      reject(new Error("Turnstile failed to load."));
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    if (isNewScript) {
      document.head.appendChild(script);
    } else if (window.turnstile?.render) {
      handleLoad();
    }
  }).catch((error: unknown) => {
    turnstileLoadPromise = null;
    throw error;
  });

  return turnstileLoadPromise;
}

export default function TurnstileWidget({
  action,
  siteKey,
  onTokenChange,
  onErrorChange,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tokenCallbackRef = useRef(onTokenChange);
  const errorCallbackRef = useRef(onErrorChange);

  const [widgetError, setWidgetError] = useState("");
  const [widgetReady, setWidgetReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    tokenCallbackRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    errorCallbackRef.current = onErrorChange;
  }, [onErrorChange]);

  useEffect(() => {
    let cancelled = false;
    let widgetId: string | null = null;

    const container = containerRef.current;

    setWidgetReady(false);
    setHasToken(false);
    setWidgetError("");
    tokenCallbackRef.current("");

    const showError = (message: string) => {
      if (cancelled) return;

      setWidgetReady(false);
      setHasToken(false);
      setWidgetError(message);
      tokenCallbackRef.current("");
      errorCallbackRef.current?.(message);
    };

    if (!siteKey) {
      showError(
        "Security verification is not configured. Please try again later."
      );

      return () => {
        cancelled = true;
      };
    }

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container) return;

        container.innerHTML = "";

        try {
          widgetId = turnstile.render(container, {
            sitekey: siteKey,
            action,
            theme: "light",

            callback: (token) => {
              if (cancelled) return;

              setHasToken(true);
              setWidgetError("");
              tokenCallbackRef.current(token);
              errorCallbackRef.current?.("");
            },

            "expired-callback": () => {
              if (cancelled) return;

              showError(
                "The security check expired. Please complete it again."
              );

              if (widgetId) {
                try {
                  turnstile.reset(widgetId);
                } catch {
                  // The widget may already have been removed.
                }
              }
            },

            "error-callback": () => {
              showError(
                "The security check could not load. Please retry shortly."
              );
            },

            "timeout-callback": () => {
              if (cancelled) return;

              showError(
                "The security check timed out. Please try again."
              );

              if (widgetId) {
                try {
                  turnstile.reset(widgetId);
                } catch {
                  // The widget may already have been removed.
                }
              }
            },
          });

          setWidgetReady(true);
          setWidgetError("");
          errorCallbackRef.current?.("");
        } catch {
          showError(
            "The security check is temporarily unavailable. Please retry shortly."
          );
        }
      })
      .catch(() => {
        showError(
          "The security check is temporarily unavailable. Please retry shortly."
        );
      });

    return () => {
      cancelled = true;

      if (widgetId) {
        try {
          window.turnstile?.remove(widgetId);
        } catch {
          // Ignore cleanup errors.
        }
      }

      if (container) {
        container.innerHTML = "";
      }
    };
  }, [action, siteKey]);

  const displayError = !siteKey
    ? "Security verification is not configured. Please try again later."
    : widgetError;

  const isReady = Boolean(siteKey) && widgetReady;

  return (
    <div className={styles.container}>
      <div ref={containerRef} />

      {displayError && (
        <p className={styles.error} role="status" aria-live="polite">
          {displayError}
        </p>
      )}

      {!isReady && !displayError && (
        <p className={styles.message} role="status" aria-live="polite">
          Loading security check...
        </p>
      )}

      {isReady && !displayError && !hasToken && (
        <p className={styles.message} role="status" aria-live="polite">
          {action === "review_submit"
            ? "Complete the security check to submit your review."
            : "Complete the security check to submit your request."}
        </p>
      )}
    </div>
  );
}
