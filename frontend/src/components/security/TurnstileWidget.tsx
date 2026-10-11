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
  ready: (callback: () => void) => void;
  render: (
    container: HTMLElement | string,
    options: TurnstileRenderOptions
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
  getResponse?: (widgetId?: string) => string;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileLoadedCallback?: () => void;
  }
}

interface TurnstileWidgetProps {
  action: "request_create" | "review_submit";
  siteKey: string;
  onTokenChange: (token: string) => void;
  onErrorChange?: (error: string) => void;
}

let turnstileLoadPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window !== "undefined" && window.turnstile?.render) {
    return new Promise((resolve) => {
      if (typeof window.turnstile?.ready === "function") {
        window.turnstile.ready(() => resolve(window.turnstile!));
      } else {
        resolve(window.turnstile!);
      }
    });
  }

  if (turnstileLoadPromise) {
    return turnstileLoadPromise;
  }

  turnstileLoadPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const callbackName = "__turnstileLoadedCallback";

    const cleanup = () => {
      delete window.__turnstileLoadedCallback;
    };

    window.__turnstileLoadedCallback = () => {
      cleanup();
      if (window.turnstile) {
        if (typeof window.turnstile.ready === "function") {
          window.turnstile.ready(() => resolve(window.turnstile!));
        } else {
          resolve(window.turnstile);
        }
      } else {
        reject(new Error("Turnstile did not initialize."));
      }
    };

    let script = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile-script="true"]'
    );

    if (!script) {
      script = document.createElement("script");
      script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=${callbackName}&render=explicit`;
      script.async = true;
      script.defer = true;
      script.dataset.turnstileScript = "true";

      script.onerror = () => {
        cleanup();
        script?.remove();
        turnstileLoadPromise = null;
        reject(new Error("Turnstile failed to load."));
      };

      document.head.appendChild(script);
    } else {
      if (window.turnstile?.render) {
        cleanup();
        if (typeof window.turnstile.ready === "function") {
          window.turnstile.ready(() => resolve(window.turnstile!));
        } else {
          resolve(window.turnstile);
        }
      } else {
        script.addEventListener(
          "error",
          () => {
            cleanup();
            script?.remove();
            turnstileLoadPromise = null;
            reject(new Error("Turnstile failed to load."));
          },
          { once: true }
        );
      }
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

    if (!siteKey) {
      tokenCallbackRef.current("");
      errorCallbackRef.current?.(
        "Security verification is not configured. Please try again later."
      );
      return;
    }

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container) {
          return;
        }

        const render = () => {
          if (cancelled || !container) {
            return;
          }

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
                setHasToken(false);
                const msg = "The security check expired. Complete it again.";
                setWidgetError(msg);
                tokenCallbackRef.current("");
                errorCallbackRef.current?.(msg);
                if (widgetId && window.turnstile?.reset) {
                  window.turnstile.reset(widgetId);
                }
              },
              "error-callback": () => {
                if (cancelled) return;
                setHasToken(false);
                const msg =
                  "The security check could not load. Please retry shortly.";
                setWidgetError(msg);
                tokenCallbackRef.current("");
                errorCallbackRef.current?.(msg);
                if (widgetId && window.turnstile?.reset) {
                  window.turnstile.reset(widgetId);
                }
              },
              "timeout-callback": () => {
                if (cancelled) return;
                setHasToken(false);
                const msg = "The security check timed out. Complete it again.";
                setWidgetError(msg);
                tokenCallbackRef.current("");
                errorCallbackRef.current?.(msg);
                if (widgetId && window.turnstile?.reset) {
                  window.turnstile.reset(widgetId);
                }
              },
            });

            if (cancelled) {
              if (widgetId && window.turnstile?.remove) {
                window.turnstile.remove(widgetId);
              }
              return;
            }

            setWidgetReady(true);
            setWidgetError("");
            errorCallbackRef.current?.("");
          } catch {
            if (!cancelled) {
              setWidgetReady(false);
              const msg =
                "The security check is temporarily unavailable. Please retry shortly.";
              setWidgetError(msg);
              tokenCallbackRef.current("");
              errorCallbackRef.current?.(msg);
            }
          }
        };

        if (typeof turnstile.ready === "function") {
          turnstile.ready(render);
        } else {
          render();
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWidgetReady(false);
          const msg =
            "The security check is temporarily unavailable. Please retry shortly.";
          setWidgetError(msg);
          tokenCallbackRef.current("");
          errorCallbackRef.current?.(msg);
        }
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // ignore
        }
      }
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [action, siteKey]);

  const displayError =
    (!siteKey
      ? "Security verification is not configured. Please try again later."
      : widgetError);
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
        <p className={styles.message} role="status">
          Loading security check...
        </p>
      )}
      {isReady && !displayError && !hasToken && (
        <p className={styles.message} role="status">
          {action === "review_submit"
            ? "Complete the security check to submit your review."
            : "Complete the security check to submit your request."}
        </p>
      )}
    </div>
  );
}
