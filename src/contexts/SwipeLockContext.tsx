import React, { createContext, useContext, useRef, useCallback } from "react";

interface SwipeLockContextValue {
  lockRef: React.MutableRefObject<number>;
  lock: () => void;
  unlock: () => void;
}

const SwipeLockContext = createContext<SwipeLockContextValue | null>(null);

export function SwipeLockProvider({ children }: { children: React.ReactNode }) {
  const lockRef = useRef(0);
  const lock = useCallback(() => { lockRef.current += 1; }, []);
  const unlock = useCallback(() => { lockRef.current = Math.max(0, lockRef.current - 1); }, []);
  return (
    <SwipeLockContext.Provider value={{ lockRef, lock, unlock }}>
      {children}
    </SwipeLockContext.Provider>
  );
}

const FALLBACK_REF = { current: 0 };
const noop = () => {};

export function useSwipeLock() {
  const ctx = useContext(SwipeLockContext);
  if (!ctx) return { lockRef: FALLBACK_REF, lock: noop, unlock: noop };
  return ctx;
}
