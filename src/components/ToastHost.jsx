import { useEffect, useState } from "preact/hooks";

/**
 * @param {{ controller: {
 *   subscribe: (listener: (notifications: ToastNotification[]) => void) => () => void,
 *   undo: (id: number) => void,
 *   destroy: () => void
 * } }} props
 */
export function ToastHost({ controller }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = controller.subscribe(setNotifications);
    return () => {
      unsubscribe();
      controller.destroy();
    };
  }, [controller]);

  return (
    <>
      {notifications.map((notification) => (
        <div
          className={`toast toast--${notification.kind}`}
          data-toast={notification.kind}
          key={notification.id}
          role={notification.kind === "error" ? "alert" : "status"}
          aria-live={notification.kind === "error" ? "assertive" : "polite"}
        >
          <div className="toast__text">{notification.message}</div>
          {notification.kind === "undo" && (
            <div className="toast__actions">
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => controller.undo(notification.id)}
              >
                {notification.remainingSeconds > 0
                  ? `${notification.undoText} (${notification.remainingSeconds}s)`
                  : notification.undoText}
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
