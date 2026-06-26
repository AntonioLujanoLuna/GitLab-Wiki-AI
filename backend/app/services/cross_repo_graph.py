"""
Cross-repository dependency graph builder.

Creates a graph where:
  nodes = repositories in the group
  edges = repo A → repo B when A's wiki content mentions B's name/path

This relies on data already stored in the DB (wiki pages + repo metadata)
so it doesn't require additional API calls.
"""
from __future__ import annotations

import logging

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.db_models import Repository, WikiPage

logger = logging.getLogger(__name__)


async def build_cross_repo_graph(repo_ids: list[int]) -> dict:
    """Build a cross-repo dependency graph from wiki content.

    Returns {"nodes": [...], "edges": [...]} compatible with DependencyGraphResponse.
    """
    if not repo_ids:
        return {"nodes": [], "edges": []}

    async with AsyncSessionLocal() as session:
        repos = (
            await session.execute(
                select(Repository).where(Repository.id.in_(repo_ids))
            )
        ).scalars().all()

        # Build lookup: id → repo
        repo_map = {r.id: r for r in repos}

        nodes: list[str] = [r.name for r in repos]

        # For each repo, collect all wiki text and check for other repos' names.
        edges: list[dict] = []
        seen_edges: set[tuple[str, str]] = set()

        for repo in repos:
            pages = (
                await session.execute(
                    select(WikiPage.content_markdown).where(WikiPage.repository_id == repo.id)
                )
            ).scalars().all()
            combined_text = " ".join(pages).lower()

            for other in repos:
                if other.id == repo.id:
                    continue
                # Match on repo name and on the last path segment.
                other_name = other.name.lower()
                other_path_base = other.project_path.lower().split("/")[-1]

                if other_name in combined_text or (
                    len(other_path_base) > 3 and other_path_base in combined_text
                ):
                    key = (repo.name, other.name)
                    if key not in seen_edges:
                        seen_edges.add(key)
                        edges.append({"source": repo.name, "target": other.name, "weight": 1})

    return {"nodes": nodes, "edges": edges}
