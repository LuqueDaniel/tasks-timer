/**
 * Installs global error handlers so unexpected exceptions are visible in the console.
 *
 * @returns {() => void} Cleanup function.
 */
export function setupErrorReporting() {
  const onError = (event) => {
    // `event.error` may be undefined for script errors.
    const err = event?.error;
    const message = event?.message;
    if (err) console.error("[Task Timer] Unhandled error", err);
    else console.error("[Task Timer] Unhandled error", message || event);
  };

  const onUnhandledRejection = (event) => {
    console.error("[Task Timer] Unhandled promise rejection", event?.reason);
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
