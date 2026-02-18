#!/usr/bin/env python3
"""Test script for the new Universal Repository Analyzer."""

import json
import logging

from analyzer import RepoAnalyzer

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger(__name__)


def main():
    """Test the analyzer on the current repository."""
    # Use the parent directory which contains the .git folder
    repo_path = "/Users/comcom/Desktop/papers-with-claudecode"

    logger.info("Testing Universal Repository Analyzer")
    logger.info("=" * 60)

    # Test 1: Auto-detection
    logger.info("\nTest 1: Auto-detection")
    analyzer = RepoAnalyzer(repo_path)
    logger.info(f"Detected type: {analyzer.repo_type}")

    # Run analysis
    analysis = analyzer.analyze()

    # Print results
    logger.info(f"\nAnalysis Results:")
    logger.info(f"  Repository type: {analysis.repo_type.value}")
    logger.info(f"  Components: {len(analysis.components)}")
    logger.info(f"  Commits: {len(analysis.commits)}")
    logger.info(f"  Documentation: {len(analysis.documentation)}")
    logger.info(f"  Structure keys: {list(analysis.structure.keys())}")
    logger.info(f"  Dependencies keys: {list(analysis.dependencies.keys())}")
    logger.info(f"  Extensions keys: {list(analysis.extensions.keys())}")

    # Show some components
    if analysis.components:
        logger.info(f"\nFirst 5 components:")
        for comp in analysis.components[:5]:
            logger.info(f"  - {comp.name} ({comp.type}) in {comp.path}")

    # Show some commits
    if analysis.commits:
        logger.info(f"\nFirst 5 commits:")
        for commit in analysis.commits[:5]:
            logger.info(f"  - [{commit.date}] {commit.message[:50]}... (tags: {commit.tags})")

    # Test serialization
    logger.info("\nTest 2: Serialization")
    data_dict = analysis.to_dict()
    logger.info(f"Serialized to dict: {len(json.dumps(data_dict))} bytes")

    # Test deserialization
    analysis_from_dict = type(analysis).from_dict(data_dict)
    logger.info(
        f"Deserialized successfully: {len(analysis_from_dict.components)} components"
    )

    # Test backward compatibility
    logger.info("\nTest 3: Backward compatibility")
    logger.info(f"  analysis.models: {type(analysis.models)} (length: {len(analysis.models)})")
    logger.info(
        f"  analysis.key_commits: {type(analysis.key_commits)} (length: {len(analysis.key_commits)})"
    )
    logger.info(
        f"  analysis.doc_summaries: {type(analysis.doc_summaries)} (length: {len(analysis.doc_summaries)})"
    )

    logger.info("\n" + "=" * 60)
    logger.info("All tests completed successfully!")


if __name__ == "__main__":
    main()
