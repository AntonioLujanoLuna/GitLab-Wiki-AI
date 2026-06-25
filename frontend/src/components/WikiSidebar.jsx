import { api } from "../api/client";

/**
 * Agrupa las páginas en secciones: páginas raíz primero, luego un grupo
 * "Módulos" con todas las páginas cuyo parent_slug === "modules".
 */
function groupPages(pages) {
  const root = pages.filter((p) => !p.parent_slug);
  const modules = pages.filter((p) => p.parent_slug === "modules");
  return { root, modules };
}

export function WikiSidebar({ repository, pages, activeSlug, onSelectPage, onReset, onOpenSearch, onOpenGraph }) {
  const { root, modules } = groupPages(pages);
  const exportUrl = api.getExportUrl(repository.id);

  return (
    <aside style={styles.sidebar}>
      <div style={styles.repoHeader}>
        <button onClick={onReset} style={styles.backBtn} title="Ver todos los repositorios indexados">
          ← mis repos
        </button>
        <div style={styles.repoName}>{repository.name}</div>
        <div style={styles.repoPath}>{repository.project_path}</div>
        <div style={styles.repoMeta}>
          <span style={styles.branchTag}>{repository.default_branch}</span>
          <span style={styles.shaTag}>{repository.last_commit_sha?.slice(0, 8)}</span>
        </div>
        <div
          style={{
            ...styles.ragTag,
            color: repository.indexed_in_qdrant ? "var(--accent-sage)" : "var(--text-tertiary)",
          }}
          title={
            repository.indexed_in_qdrant
              ? "El código está indexado en Qdrant: las preguntas buscan en el código real"
              : "El código no se pudo indexar en Qdrant: las preguntas usan solo el wiki generado"
          }
        >
          <span style={styles.ragDot}>●</span>
          {repository.indexed_in_qdrant ? "búsqueda semántica activa" : "búsqueda semántica no disponible"}
        </div>
        <button onClick={onOpenSearch} style={styles.searchBtn}>
          ⌕ buscar en el código
        </button>
        <button onClick={onOpenGraph} style={styles.searchBtn}>
          ⊞ grafo de dependencias
        </button>
        <a href={exportUrl} download style={styles.exportBtn}>
          ↓ descargar wiki (.md)
        </a>
      </div>

      <nav style={styles.nav}>
        <div style={styles.navGroup}>
          {root.map((page) => (
            <NavItem key={page.slug} page={page} active={page.slug === activeSlug} onClick={() => onSelectPage(page.slug)} />
          ))}
        </div>

        {modules.length > 0 && (
          <div style={styles.navSection}>
            <div style={styles.navSectionLabel}>módulos</div>
            <div style={styles.navGroup}>
              {modules.map((page) => (
                <NavItem key={page.slug} page={page} active={page.slug === activeSlug} onClick={() => onSelectPage(page.slug)} indent />
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}

function NavItem({ page, active, onClick, indent }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navItem,
        paddingLeft: indent ? 28 : 14,
        background: active ? "var(--bg-elevated-2)" : "transparent",
        color: active ? "var(--accent-rust)" : "var(--text-secondary)",
        borderLeft: active ? "2px solid var(--accent-rust)" : "2px solid transparent",
      }}
    >
      {page.title}
    </button>
  );
}

const styles = {
  sidebar: {
    width: 260,
    minWidth: 260,
    height: "100vh",
    borderRight: "1px solid var(--border-subtle)",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg-elevated)",
  },
  repoHeader: {
    padding: "18px 14px",
    borderBottom: "1px solid var(--border-subtle)",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "var(--text-tertiary)",
    fontSize: 11,
    padding: 0,
    marginBottom: 14,
    display: "block",
    cursor: "pointer",
  },
  repoName: {
    fontFamily: "var(--font-serif)",
    fontSize: 17,
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: 3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  repoPath: {
    fontSize: 11,
    color: "var(--text-tertiary)",
    marginBottom: 10,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  repoMeta: {
    display: "flex",
    gap: 6,
  },
  branchTag: {
    fontSize: 10.5,
    background: "var(--accent-sage-dim)",
    color: "#D7E5DC",
    padding: "2px 7px",
    borderRadius: 4,
  },
  shaTag: {
    fontSize: 10.5,
    background: "var(--bg-elevated-2)",
    color: "var(--text-tertiary)",
    padding: "2px 7px",
    borderRadius: 4,
  },
  ragTag: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 10,
    marginTop: 8,
  },
  ragDot: {
    fontSize: 8,
  },
  searchBtn: {
    marginTop: 12,
    width: "100%",
    background: "var(--bg-elevated-2)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 11.5,
    color: "var(--text-secondary)",
    textAlign: "left",
    cursor: "pointer",
  },
  exportBtn: {
    marginTop: 6,
    width: "100%",
    boxSizing: "border-box",
    background: "var(--bg-elevated-2)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 11.5,
    color: "var(--text-secondary)",
    textAlign: "left",
    display: "block",
    textDecoration: "none",
  },
  nav: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 0",
  },
  navGroup: {
    display: "flex",
    flexDirection: "column",
  },
  navSection: {
    marginTop: 18,
  },
  navSectionLabel: {
    fontSize: 10.5,
    letterSpacing: "0.06em",
    color: "var(--text-tertiary)",
    padding: "0 14px",
    marginBottom: 6,
  },
  navItem: {
    textAlign: "left",
    border: "none",
    padding: "8px 14px",
    fontSize: 12.5,
    fontFamily: "var(--font-mono)",
    lineHeight: 1.4,
    cursor: "pointer",
  },
};
