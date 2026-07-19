import { useCallback, useEffect, useState } from "react";
import { readJSON, storageKey, writeJSON } from "../storage/safeStorage";

/** Reactive localStorage binding that stays in sync across tabs. */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readJSON<T>(key, initial));

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeJSON(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== storageKey(key)) return;
      setValue(readJSON<T>(key, initial));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // `initial` is intentionally not a dependency — it is only a first-run seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, set];
}
