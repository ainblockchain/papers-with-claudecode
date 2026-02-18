"""Generic fallback analyzer for unknown repository types."""

from __future__ import annotations

import logging
from pathlib import Path

from analyzer.base import BaseRepoAnalyzer
from analyzer.models import (
    CommitInfo,
    RepoType,
    UniversalRepoAnalysis,
)
from analyzer.registry import register_analyzer

logger = logging.getLogger(__name__)


@register_analyzer
class GenericAnalyzer(BaseRepoAnalyzer):
    """Fallback analyzer for unknown repository types."""

    @classmethod
    def get_repo_type(cls) -> RepoType:
        return RepoType.GENERIC

    @classmethod
    def can_handle(cls, repo_path: Path) -> tuple[bool, float]:
        """Always returns True with low confidence (fallback)."""
        return (True, 0.1)

    @classmethod
    def get_default_config(cls) -> dict:
        return {
            "max_commit_scan": None,  # None = unlimited (use --fast-mode for limited scan)
            "fast_mode_commits": 1000,  # Used when --fast-mode is enabled
        }

    def analyze(self) -> UniversalRepoAnalysis:
        """Run generic analysis - basic commit and structure info."""
        logger.info("Starting generic analysis of %s", self.repo_path)

        commits = self.scan_commits()
        logger.info("Found %d commits", len(commits))

        structure = self.scan_structure()
        logger.info("Analyzed repository structure")

        return UniversalRepoAnalysis(
            repo_type=self.get_repo_type(),
            repo_path=str(self.repo_path),
            components=[],
            commits=commits,
            documentation=[],
            structure=structure,
            dependencies={},
            extensions={},
            metadata={},
        )

    def scan_commits(self) -> list[CommitInfo]:
        """Scan commits with generic keywords."""
        commits = []

        # Generic keywords that work for most repositories
        keywords = [
            "release",
            "version",
            "feature",
            "fix",
            "breaking",
            "deprecate",
            "add",
            "feat",
            "refactor",
            "optimize",
            "performance",
            "security",
        ]

        try:
            max_scan = self.config.get("max_commit_scan")  # None = unlimited
            # If max_scan is None, don't pass max_count (scan all commits)
            iter_args = {"max_count": max_scan} if max_scan else {}
            for commit in self.repo.iter_commits(**iter_args):
                msg = commit.message.strip()
                msg_lower = msg.lower()

                matched_tags = [kw for kw in keywords if kw in msg_lower]

                # Also match version-like commit messages (v1.0.0, Release 2.0, etc.)
                if matched_tags or commit.summary.startswith(("v", "V", "Release")):
                    commits.append(
                        CommitInfo(
                            sha=commit.hexsha[:8],
                            date=commit.committed_datetime.strftime("%Y-%m-%d"),
                            message=msg.split("\n")[0][:200],
                            author=str(commit.author),
                            tags=matched_tags,
                            metadata={},
                        )
                    )
        except Exception as e:
            logger.warning(f"Error scanning commits: {e}")

        return commits

    def scan_structure(self) -> dict:
        """Basic directory structure."""
        structure = {
            "root_files": [],
            "root_dirs": [],
        }

        try:
            # List root-level files (excluding hidden files)
            structure["root_files"] = [
                f.name for f in self.repo_path.iterdir() if f.is_file() and not f.name.startswith(".")
            ]

            # List root-level directories (excluding hidden dirs)
            structure["root_dirs"] = [
                d.name
                for d in self.repo_path.iterdir()
                if d.is_dir() and not d.name.startswith(".")
            ]
        except Exception as e:
            logger.warning(f"Error scanning structure: {e}")

        return structure
