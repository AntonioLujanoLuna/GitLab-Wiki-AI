import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

/**
 * Hace polling de un batch de indexado de grupo hasta que termina (done o failed).
 * Igual que useJobPolling pero contra GET /api/groups/{batchId}, que devuelve
 * progreso agregado más el detalle de cada proyecto individual.
 */
export function useGroupBatchPolling(batchId) {
  const [batch, setBatch] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!batchId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await api.getGroupBatchStatus(batchId);
        if (cancelled) return;
        setBatch(data);
        if (data.status === "done" || data.status === "failed") {
          clearInterval(intervalRef.current);
        }
      } catch (err) {
        if (!cancelled) {
          setBatch((prev) => ({ ...(prev || {}), status: "failed", error_message: err.message }));
          clearInterval(intervalRef.current);
        }
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 1500);

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [batchId]);

  return batch;
}
