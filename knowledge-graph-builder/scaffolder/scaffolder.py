"""Phase 5: Generate the course repo scaffold that students clone and use with Claude Code."""

from __future__ import annotations

import json
import logging
import os
import shutil
from datetime import date
from pathlib import Path
from typing import Optional

from extractor.graph import KnowledgeGraph
from extractor.models import (
    CONCEPT_LEVEL_DEPTH,
    Course,
    LearnerProfile,
    LearnerProgress,
)

from scaffolder.templates import (
    CLAUDE_MD_BLOCKCHAIN_TEMPLATE,
    CLAUDE_MD_TEMPLATE,
    GITIGNORE_BLOCKCHAIN_EXTRA,
    GITIGNORE_TEMPLATE,
    README_BLOCKCHAIN_TEMPLATE,
    README_TEMPLATE,
)

logger = logging.getLogger(__name__)


class Scaffolder:
    """Phase 5: Generates the course repo that students clone and use with Claude Code."""

    def __init__(
        self,
        kg: KnowledgeGraph,
        courses: list[Course],
        enable_blockchain: bool = False,
        ain_js_version: str = "^1.14.0",
    ):
        self.kg = kg
        self.courses = courses
        self.enable_blockchain = enable_blockchain
        self.ain_js_version = ain_js_version

    def scaffold(self, output_dir: str | Path, repo_path: Optional[str | Path] = None) -> Path:
        """Generate the complete course repo.

        Args:
            output_dir: where to create the course repo.
            repo_path: optional path to the source repo for copying code snippets.

        Returns:
            Path to the generated course repo directory.
        """
        output = Path(output_dir)
        output.mkdir(parents=True, exist_ok=True)

        logger.info("Scaffolding course repo at %s", output)

        self._write_claude_md(output)
        self._write_knowledge(output)
        self._write_learner_template(output)
        self._write_gitignore(output)
        self._write_readme(output)

        if self.enable_blockchain:
            self._write_blockchain(output)

        if repo_path:
            self._copy_code_snippets(output, Path(repo_path))

        logger.info("Course repo scaffolded at %s", output)
        return output

    # -----------------------------------------------------------------------
    # File writers
    # -----------------------------------------------------------------------

    def _write_claude_md(self, output: Path) -> None:
        template = CLAUDE_MD_BLOCKCHAIN_TEMPLATE if self.enable_blockchain else CLAUDE_MD_TEMPLATE
        (output / "CLAUDE.md").write_text(template)
        logger.info("Wrote CLAUDE.md")

    def _write_knowledge(self, output: Path) -> None:
        knowledge_dir = output / "knowledge"
        knowledge_dir.mkdir(exist_ok=True)

        self.kg.save(knowledge_dir / "graph.json")
        logger.info("Wrote knowledge/graph.json")

        courses_data = [c.to_dict() for c in self.courses]
        (knowledge_dir / "courses.json").write_text(
            json.dumps(courses_data, indent=2, ensure_ascii=False) + "\n"
        )
        logger.info("Wrote knowledge/courses.json")

    def _write_learner_template(self, output: Path) -> None:
        learner_dir = output / ".learner"
        learner_dir.mkdir(exist_ok=True)

        profile = LearnerProfile(
            name="Your Name",
            avatar="\U0001f9d1\u200d\U0001f4bb",  # 🧑‍💻
            started_at=date.today().isoformat(),
            git_user="auto-detected",
        )
        profile.save(learner_dir / "profile.json")

        if not self.enable_blockchain:
            sorted_concepts = self.kg.topological_sort()
            first_concept = sorted_concepts[0] if sorted_concepts else ""

            progress = LearnerProgress(
                current_concept=first_concept,
                completed=[],
                in_progress=[],
                started_at=date.today().isoformat(),
                last_active=date.today().isoformat(),
            )
            progress.save(learner_dir / "progress.json")

        logger.info("Wrote .learner/ template")

    def _write_gitignore(self, output: Path) -> None:
        content = GITIGNORE_TEMPLATE
        if self.enable_blockchain:
            content += GITIGNORE_BLOCKCHAIN_EXTRA
        (output / ".gitignore").write_text(content)

    def _write_readme(self, output: Path) -> None:
        stats = self.kg.stats()
        course_list = "\n".join(
            f"- **{c.title}** ({len(c.concepts)} concepts): {c.description}"
            for c in self.courses
            if c.concepts
        )

        template = README_BLOCKCHAIN_TEMPLATE if self.enable_blockchain else README_TEMPLATE
        readme = template.format(
            title="Transformer Learning Path",
            dirname=output.name,
            course_list=course_list or "No courses generated yet.",
            num_concepts=stats["num_concepts"],
            num_courses=len([c for c in self.courses if c.concepts]),
            num_foundational=stats["num_foundational"],
            num_intermediate=stats["num_intermediate"],
            num_advanced=stats["num_advanced"],
            num_frontier=stats["num_frontier"],
        )
        (output / "README.md").write_text(readme)
        logger.info("Wrote README.md")

    # -----------------------------------------------------------------------
    # Blockchain scaffold
    # -----------------------------------------------------------------------

    def _write_blockchain(self, output: Path) -> None:
        """Create blockchain/ directory with config.json and package.json."""
        bc_dir = output / "blockchain"
        bc_dir.mkdir(exist_ok=True)

        config = self._build_blockchain_config()
        (bc_dir / "config.json").write_text(
            json.dumps(config, indent=2, ensure_ascii=False) + "\n"
        )
        logger.info("Wrote blockchain/config.json")

        package_json = {
            "name": "blockchain-helper",
            "private": True,
            "dependencies": {
                "@ainblockchain/ain-js": self.ain_js_version,
            },
        }
        (bc_dir / "package.json").write_text(
            json.dumps(package_json, indent=2) + "\n"
        )
        logger.info("Wrote blockchain/package.json (ain-js: %s)", self.ain_js_version)

    def _build_blockchain_config(self) -> dict:
        """Build the blockchain config.json with topic map, depth map, etc."""
        course_id = self.courses[0].id if self.courses else "transformers"
        topic_prefix = f"transformers/{course_id}"

        topic_map: dict[str, str] = {}
        depth_map: dict[str, int] = {}
        topics_to_register: list[dict] = []

        topics_to_register.append({
            "path": "transformers",
            "title": "Transformers",
            "description": "Transformer architecture learning topics",
        })
        topics_to_register.append({
            "path": topic_prefix,
            "title": course_id.replace("_", " ").title(),
            "description": f"Topics for {course_id} course",
        })

        seen_topics: set[str] = set()

        for node in self.kg.get_all_concepts():
            topic_path = f"{topic_prefix}/{node.id}"
            topic_map[node.id] = topic_path
            depth_map[node.id] = CONCEPT_LEVEL_DEPTH.get(node.level, 1)

            if topic_path not in seen_topics:
                seen_topics.add(topic_path)
                topics_to_register.append({
                    "path": topic_path,
                    "title": node.name,
                    "description": node.description[:200] if node.description else "",
                })

        x402_lessons: dict[str, dict] = {}
        for course in self.courses:
            for lesson in course.lessons:
                if lesson.x402_price:
                    x402_lessons[lesson.concept_id] = {
                        "price": lesson.x402_price,
                        "gateway": lesson.x402_gateway,
                    }

        return {
            "provider_url": os.environ.get("AIN_PROVIDER_URL", "http://localhost:8081"),
            "chain_id": 0,
            "topic_prefix": topic_prefix,
            "topic_map": topic_map,
            "depth_map": depth_map,
            "topics_to_register": topics_to_register,
            "x402_lessons": x402_lessons,
        }

    # -----------------------------------------------------------------------
    # Code snippets
    # -----------------------------------------------------------------------

    def _copy_code_snippets(self, output: Path, repo_path: Path) -> None:
        """Copy relevant source files referenced by the knowledge graph."""
        src_dir = output / "src"
        src_dir.mkdir(exist_ok=True)

        code_refs: set[str] = set()
        for node in self.kg.get_all_concepts():
            for ref in node.code_refs:
                # Parse "src/transformers/models/bert/modeling_bert.py:BertSelfAttention"
                file_part = ref.split(":")[0] if ":" in ref else ref
                code_refs.add(file_part)

        copied = 0
        for ref in code_refs:
            source_file = repo_path / ref
            if source_file.exists() and source_file.is_file():
                dest = src_dir / Path(ref).name
                try:
                    shutil.copy2(source_file, dest)
                    copied += 1
                except Exception as e:
                    logger.debug("Could not copy %s: %s", ref, e)

        logger.info("Copied %d code snippets to src/", copied)
