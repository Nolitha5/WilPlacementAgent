/**
 * src/hooks/useToast.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight toast notification hook.
 * Usage: const { toast, showToast } = useToast();
 *        <Toast {...toast} />
 */
import { useState } from "react";

export function useToast(duration = 3500) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  return { toast, showToast };
}
