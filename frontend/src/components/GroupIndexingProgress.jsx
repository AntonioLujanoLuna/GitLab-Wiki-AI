const PROJECT_STATUS_ICON = {
  pending: { icon: "○", color: "var(--border-strong)" },
  cloning: { icon: "●", color: "var(--accent-rust)" },
  analyzing: { icon: "●", color: "var(--accent-rust)" },
  generating: { icon: "●", color: "var(--accent-rust)" },
  embedding: { icon: "●", color: "var(--accent-rust)" },
  done: { icon: "✓", color: "var(--accent-sage)" },
  failed: { icon: "✕", color: "var(--accent-red)" },
};

/**
 * Progreso del indexado de un GRUPO completo: muestra el descubrimiento de proyectos
 * (incluyendo subgrupos) y luego una lista con el estado individual de cada uno,
 * a medida que se indexan secuencialmente.
 */
export function GroupIndexingProgress({ batch, groupPath, onViewRepository }) {
  const status = batch?.status || "pending";
  const isFailed = status === "failed";
  const isDiscovering = status === "pending" || status === "discovering";
  const projects = batch?.projects || [];

  const pct = batch?.total_projects
    ? Math.round(((batch.completed_projects + batch.failed_projects) / batch.total_projects) * 100)
    : 0;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.eyebrow}>
          <span style={{ ...styles.dot, background: isFailed ? "var(--accent-red)" : "var(--accent-rust)" }} />
          {groupPath} (grupo completo)
        </div>

        <h1 style={styles.title}>
          {isFailed ? "El indexado del grupo falló" : isDiscovering ? "Descubriendo proyectos del grupo" : "Indexando proyectos del grupo"}
        </h1>

        {batch?.group_name && (
          <p style={styles.groupName}>
            {batch.group_name} · {batch.total_projects} proyecto{batch.total_projects !== 1 ? "s" : ""} encontrado
            {batch.total_projects !== 1 ? "s" : ""} (incluyendo subgrupos)
          </p>
        )}

        {isDiscovering && (
          <p style={styles.discoveringHint}>{batch?.current_step || "Listando proyectos…"}</p>
        )}

        {!isDiscovering && !isFailed && (
          <>
            <div style={styles.progressBarTrack}>
              <div style={{ ...styles.progressBarFill, width: `${pct}%` }} />
            </div>
            <div style={styles.progressPct}>
              {batch.completed_projects + batch.failed_projects} de {batch.total_projects} proyectos procesados
            </div>
          </>
        )}

        {projects.length > 0 && (
          <div style={styles.projectList}>
            {projects.map((p) => {
              const iconInfo = PROJECT_STATUS_ICON[p.status] || PROJECT_STATUS_ICON.pending;
              const isClickable = p.status === "done";
              return (
                <div
                  key={p.job_id}
                  style={{ ...styles.projectRow, cursor: isClickable ? "pointer" : "default" }}
                  onClick={() => isClickable && onViewRepository?.(p.repository_id)}
                >
                  <span style={{ ...styles.projectIcon, color: iconInfo.color }}>{iconInfo.icon}</span>
                  <span style={styles.projectPath}>{p.project_path}</span>
                  <span style={styles.projectStep}>
                    {p.status === "failed" ? p.error_message || "falló" : p.current_step}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {status === "done" && (
          <div style={styles.doneBox}>{batch.current_step}</div>
        )}

        {isFailed && batch?.error_message && (
          <div style={styles.errorBox}>
            <div style={styles.errorTitle}>detalle del error</div>
            {batch.error_message}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
  },
  card: {
    width: "100%",
    maxWidth: 560,
  },
  eyebrow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    letterSpacing: "0.02em",
    color: "var(--text-tertiary)",
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    display: "inline-block",
  },
  title: {
    fontFamily: "var(--font-serif)",
    fontSize: 26,
    fontWeight: 600,
    margin: "0 0 8px",
    color: "var(--text-primary)",
  },
  groupName: {
    fontSize: 12.5,
    color: "var(--text-secondary)",
    margin: "0 0 24px",
  },
  discoveringHint: {
    fontSize: 13,
    color: "var(--text-tertiary)",
    margin: "0 0 24px",
  },
  progressBarTrack: {
    height: 4,
    background: "var(--bg-elevated-2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    transition: "width 0.4s ease",
    borderRadius: 2,
    background: "var(--accent-rust)",
  },
  progressPct: {
    fontSize: 11,
    color: "var(--text-tertiary)",
    marginTop: 8,
    marginBottom: 24,
  },
  projectList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginTop: 8,
  },
  projectRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 6,
    fontSize: 12.5,
  },
  projectIcon: {
    fontSize: 12,
    width: 14,
    flexShrink: 0,
    textAlign: "center",
  },
  projectPath: {
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    flexShrink: 0,
    maxWidth: "45%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  projectStep: {
    color: "var(--text-tertiary)",
    fontSize: 11.5,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  doneBox: {
    marginTop: 20,
    background: "rgba(122,154,133,0.1)",
    border: "1px solid var(--accent-sage-dim)",
    borderRadius: 6,
    padding: "12px 14px",
    fontSize: 13,
    color: "var(--accent-sage)",
  },
  errorBox: {
    marginTop: 24,
    background: "rgba(192,89,74,0.1)",
    border: "1px solid var(--accent-red)",
    borderRadius: 6,
    padding: "12px 14px",
    fontSize: 12.5,
    color: "#E5A99A",
    lineHeight: 1.6,
  },
  errorTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    marginBottom: 6,
    color: "var(--accent-red)",
  },
};
