"""Base class for all repository analyzers."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Optional

from git import InvalidGitRepositoryError, Repo

from analyzer.models import (
    CommitInfo,
    ComponentInfo,
    DocumentationInfo,
    RepoType,
    UniversalRepoAnalysis,
)

logger = logging.getLogger(__name__)


class BaseRepoAnalyzer(ABC):
    """Abstract base class for all repository analyzers."""

    def __init__(self, repo_path: str | Path, config: Optional[dict] = None):
        """
        Initialize the analyzer.

        Args:
            repo_path: Path to the repository
            config: Optional configuration dict
        """
        self.repo_path = Path(repo_path)

        # Start with default config
        self.config = self.get_default_config()

        # Apply user config
        if config:
            # Handle fast mode
            if config.get("use_fast_mode") and "fast_mode_commits" in self.config:
                self.config["max_commit_scan"] = self.config["fast_mode_commits"]

            # Merge user config (excluding use_fast_mode flag)
            for key, value in config.items():
                if key != "use_fast_mode":
                    self.config[key] = value

        # Validate git repository
        try:
            self.repo = Repo(self.repo_path)
        except InvalidGitRepositoryError:
            raise ValueError(f"{repo_path} is not a valid git repository")

    @classmethod
    @abstractmethod
    def get_repo_type(cls) -> RepoType:
        """
        Return the repository type this analyzer handles.

        Returns:
            RepoType enum value
        """
        pass

    @classmethod
    @abstractmethod
    def can_handle(cls, repo_path: Path) -> tuple[bool, float]:
        """
        Check if this analyzer can handle the given repo.

        This method uses heuristics to detect if the repository matches
        the type this analyzer is designed for.

        Args:
            repo_path: Path to the repository

        Returns:
            Tuple of (can_handle, confidence_score)
            - can_handle: Boolean indicating if this analyzer can handle the repo
            - confidence_score: Float between 0.0-1.0 indicating confidence level
        """
        pass

    @classmethod
    def get_default_config(cls) -> dict:
        """
        Return default configuration for this analyzer.

        Subclasses can override this to provide analyzer-specific defaults.

        Returns:
            Dict of configuration options
        """
        return {}

    @abstractmethod
    def analyze(self) -> UniversalRepoAnalysis:
        """
        Run full analysis pipeline.

        This is the main entry point for analysis. Subclasses must implement
        this method to perform their specific analysis logic.

        Returns:
            UniversalRepoAnalysis object containing all analysis results
        """
        pass

    # Optional hooks with default implementations

    def scan_components(self) -> list[ComponentInfo]:
        """
        Scan repository for components (classes, functions, modules).

        Subclasses can override this to implement component detection.

        Returns:
            List of ComponentInfo objects
        """
        return []

    def scan_commits(self) -> list[CommitInfo]:
        """
        Scan commit history for important changes.

        Subclasses can override this to implement commit analysis.

        Returns:
            List of CommitInfo objects
        """
        return []

    def scan_documentation(self) -> list[DocumentationInfo]:
        """
        Scan documentation files.

        Subclasses can override this to implement documentation extraction.

        Returns:
            List of DocumentationInfo objects
        """
        return []

    def scan_structure(self) -> dict:
        """
        Analyze repository structure.

        Subclasses can override this to implement structure analysis.

        Returns:
            Dict containing structure information
        """
        return {}

    def scan_dependencies(self) -> dict:
        """
        Extract dependency information.

        Subclasses can override this to implement dependency extraction.

        Returns:
            Dict containing dependency information
        """
        return {}

    def get_extensions(self) -> dict[str, Any]:
        """
        Return type-specific extension data.

        Subclasses can override this to provide analyzer-specific data
        that doesn't fit in the common fields.

        Returns:
            Dict of extension data
        """
        return {}
