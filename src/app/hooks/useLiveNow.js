import { useEffect, useState } from "preact/hooks";
import { nowMs } from "../../time.js";

/**
 * Provides a live timestamp only while the consuming view needs one.
 *
 * @param {boolean} enabled
 * @returns {number}
 */
export function useLiveNow(enabled) {
  const [now, setNow] = useState(nowMs);

  useEffect(() => {
    const update = () => setNow(nowMs());
    update();
    if (!enabled) return undefined;

    const intervalId = window.setInterval(update, 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled]);

  return now;
}
