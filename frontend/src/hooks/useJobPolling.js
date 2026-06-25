import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

/**
 * Hace polling de un job de indexado hasta que termina (done o failed).
 * Se detiene automáticamente al llegar a un estado terminal o al desmontar.
 */
export function useJobPolling(jobId) {
  const [job, setJob] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await api.getJobStatus(jobId);
        if (cancelled) return;
        setJob(data);
        if (data.status === "done" || data.status === "failed") {
          clearInterval(intervalRef.current);
        }
      } catch (err) {
        if (!cancelled) {
          setJob((prev) => ({ ...(prev || {}), status: "failed", error_message: err.message }));
          clearInterval(intervalRef.current);
        }
      }
    };

    poll(); // primera consulta inmediata
    intervalRef.current = setInterval(poll, 1500);

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [jobId]);

  return job;
}
