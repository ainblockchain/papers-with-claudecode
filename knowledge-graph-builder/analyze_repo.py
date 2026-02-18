#!/usr/bin/env python3
"""CLI tool to analyze any git repository and save results."""

import argparse
import json
import logging
import sys
import tempfile
from datetime import datetime
from pathlib import Path

from git import Repo as GitRepo

from analyzer import RepoAnalyzer

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger(__name__)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Analyze a git repository and save results to analyzer_results/"
    )
    parser.add_argument(
        "repo_path",
        help="Path or URL to the git repository to analyze"
    )
    parser.add_argument(
        "--type",
        "-t",
        dest="repo_type",
        default=None,
        help="Explicitly specify repository type (huggingface, python_lib, javascript, generic)"
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        default="analyzer/results",
        help="Output directory for results (default: analyzer/results)"
    )
    parser.add_argument(
        "--max-commits",
        type=int,
        default=None,
        help="Maximum number of commits to scan (overrides --fast-mode)"
    )
    parser.add_argument(
        "--fast-mode",
        action="store_true",
        help="Enable fast mode (limited commit scan: HF=5000, Generic=1000)"
    )
    parser.add_argument(
        "--clone-dir",
        default=None,
        help="Directory to clone repository to (if URL). If exists, will reuse. If not specified, uses temporary directory."
    )

    args = parser.parse_args()

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)

    # Handle GitHub URL - clone if needed
    repo_path = args.repo_path
    logger.info("=" * 70)
    logger.info("Repository Analyzer")
    logger.info("=" * 70)

    if repo_path.startswith("http://") or repo_path.startswith("https://"):
        # Determine clone directory
        if args.clone_dir:
            clone_dir = Path(args.clone_dir)
        else:
            # Extract repo name from URL for temp directory prefix
            repo_name = repo_path.rstrip("/").split("/")[-1].replace(".git", "")
            clone_dir = Path(tempfile.mkdtemp(prefix=f"analyzer_{repo_name}_"))

        logger.info(f"Repository URL: {repo_path}")
        logger.info(f"Clone directory: {clone_dir}")

        # Check if already cloned
        if (clone_dir / ".git").exists():
            logger.info("♻️  Using existing clone at %s", clone_dir)
        else:
            # Clone repository
            logger.info("Cloning repository (depth=1)...")
            try:
                clone_dir.mkdir(parents=True, exist_ok=True)
                GitRepo.clone_from(repo_path, str(clone_dir), depth=1)
                logger.info("✅ Clone completed")

                # Optionally deepen for commit history
                if args.max_commits or args.fast_mode:
                    max_commits = args.max_commits or 100
                    logger.info(f"Fetching commit history (last {max_commits} commits)...")
                    try:
                        git_repo = GitRepo(clone_dir)
                        git_repo.git.fetch("--deepen", str(max_commits))
                        logger.info("✅ Commit history fetched")
                    except Exception as e:
                        logger.warning(f"Could not deepen clone: {e}")
            except Exception as e:
                logger.error(f"❌ Failed to clone repository: {e}")
                sys.exit(1)

        repo_path = str(clone_dir)
    else:
        logger.info(f"Repository: {repo_path}")

    # Prepare config
    config = {}
    if args.max_commits:
        # Explicit max_commits overrides everything
        config["max_commit_scan"] = args.max_commits
    elif args.fast_mode:
        # Fast mode: use analyzer's fast_mode_commits value
        # This will be picked up by the analyzer and set appropriately
        config["use_fast_mode"] = True

    try:
        # Initialize analyzer
        analyzer = RepoAnalyzer(
            repo_path=repo_path,  # Use processed repo_path (cloned if URL)
            repo_type=args.repo_type,
            config=config if config else None
        )

        logger.info(f"Detected type: {analyzer.repo_type}")
        logger.info("")

        # Run analysis
        logger.info("Running analysis...")
        analysis = analyzer.analyze()

        # Generate output filename
        repo_name = Path(args.repo_path).name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"{repo_name}_{timestamp}.json"

        # Save results
        logger.info(f"Saving results to: {output_file}")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(analysis.to_dict(), f, indent=2, ensure_ascii=False)

        # Print summary
        logger.info("")
        logger.info("=" * 70)
        logger.info("Analysis Summary")
        logger.info("=" * 70)
        logger.info(f"Repository type: {analysis.repo_type.value}")
        logger.info(f"Components: {len(analysis.components)}")
        logger.info(f"Commits: {len(analysis.commits)}")
        logger.info(f"Documentation: {len(analysis.documentation)}")
        logger.info(f"Structure keys: {list(analysis.structure.keys())}")
        logger.info(f"Dependencies keys: {list(analysis.dependencies.keys())}")
        logger.info(f"Extensions keys: {list(analysis.extensions.keys())}")

        # Show sample data
        if analysis.components:
            logger.info("")
            logger.info("Sample components (first 5):")
            for comp in analysis.components[:5]:
                logger.info(f"  - {comp.name} ({comp.type}) in {comp.path}")

        if analysis.commits:
            logger.info("")
            logger.info("Sample commits (first 5):")
            for commit in analysis.commits[:5]:
                tags_str = f" [{', '.join(commit.tags)}]" if commit.tags else ""
                logger.info(f"  - [{commit.date}] {commit.message[:60]}...{tags_str}")

        if analysis.extensions.get("models"):
            models = analysis.extensions["models"]
            logger.info("")
            logger.info(f"HuggingFace models found: {len(models)}")
            logger.info("Sample models (first 5):")
            for model in models[:5]:
                logger.info(f"  - {model['name']} (classes: {len(model['classes'])})")

        logger.info("")
        logger.info("=" * 70)
        logger.info(f"✅ Results saved to: {output_file}")
        logger.info("=" * 70)

    except Exception as e:
        logger.error(f"❌ Error analyzing repository: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
