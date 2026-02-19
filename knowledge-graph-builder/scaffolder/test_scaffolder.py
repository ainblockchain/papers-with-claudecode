#!/usr/bin/env python3
"""Test script for Phase 5: Scaffolder.

Three usage modes:

  1. Pass Phase 3 graph + Phase 4 courses JSON directly:
       python scaffolder/test_scaffolder.py \
         --graph extractor/results/graph.json \
         --courses courseBuilder/results/courses.json \
         --output /tmp/course_repo

  2. Pass a Phase 3 graph only (skips lesson generation):
       python scaffolder/test_scaffolder.py \
         --graph extractor/results/graph.json \
         --skip-lessons \
         --output /tmp/course_repo

  3. Run the full Phase 1→5 pipeline from a repo path or URL:
       python scaffolder/test_scaffolder.py /path/to/repo --output /tmp/course_repo
       python scaffolder/test_scaffolder.py https://github.com/org/repo --output /tmp/course_repo
"""

import argparse
import json
import logging
import shutil
import sys
import tempfile
from datetime import datetime
from pathlib import Path

# Ensure project root (knowledge-graph-builder/) is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from git import Repo as GitRepo

from analyzer import RepoAnalyzer
from courseBuilder import CourseBuilder
from extractor import ConceptExtractor
from extractor.graph import KnowledgeGraph
from extractor.models import Course
from expander import GraphExpander
from scaffolder import Scaffolder

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger(__name__)

RESULTS_DIR = Path("scaffolder/results")


def load_graph(path: str | Path) -> KnowledgeGraph:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Graph file not found: {path}")
    return KnowledgeGraph.load(path)


def load_courses(path: str | Path) -> list[Course]:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Courses file not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    return [Course.from_dict(c) for c in data]


def run_full_pipeline(
    repo_path: str,
    model: str,
    expansion_rounds: int,
    skip_lessons: bool,
) -> tuple[KnowledgeGraph, list[Course], bool, Path | None]:
    """Run Phase 1→4 to produce kg and courses.

    Returns:
        (kg, courses, is_temp_clone, clone_dir)
    """
    is_temp_clone = False
    clone_dir = None

    if repo_path.startswith("http://") or repo_path.startswith("https://"):
        repo_name = repo_path.rstrip("/").split("/")[-1].replace(".git", "")
        clone_dir = Path(tempfile.mkdtemp(prefix=f"test_scaffolder_{repo_name}_"))
        is_temp_clone = True
        logger.info("Cloning %s → %s ...", repo_path, clone_dir)
        GitRepo.clone_from(repo_path, str(clone_dir), depth=1)
        try:
            GitRepo(clone_dir).git.fetch("--deepen", "2000")
        except Exception as e:
            logger.warning("Could not deepen clone: %s", e)
        repo_path = str(clone_dir)

    logger.info("=" * 60)
    logger.info("Phase 1: Repository Analysis")
    logger.info("=" * 60)
    analyzer = RepoAnalyzer(repo_path)
    analysis = analyzer.analyze()
    logger.info("✅ type=%s, components=%d, commits=%d",
                analysis.repo_type.value, len(analysis.components), len(analysis.commits))

    logger.info("=" * 60)
    logger.info("Phase 2: Concept Extraction")
    logger.info("=" * 60)
    extractor = ConceptExtractor(model=model)
    kg = extractor.extract(analysis)
    logger.info("✅ %d concepts, %d edges", len(kg.get_all_concepts()), len(kg.get_all_edges()))

    logger.info("=" * 60)
    logger.info("Phase 3: Graph Expansion (%d rounds)", expansion_rounds)
    logger.info("=" * 60)
    expander = GraphExpander(model=model)
    kg = expander.expand(kg, rounds=expansion_rounds)
    logger.info("✅ %d concepts after expansion", len(kg.get_all_concepts()))

    logger.info("=" * 60)
    logger.info("Phase 4: Course Building")
    logger.info("=" * 60)
    builder = CourseBuilder(model=model)
    courses = builder.build_courses(kg, generate_lessons=not skip_lessons)
    logger.info("✅ %d courses", len(courses))

    return kg, courses, is_temp_clone, clone_dir


def verify_output(output_dir: Path, enable_blockchain: bool) -> bool:
    """Check that all expected files are present. Returns True if all OK."""
    required = [
        output_dir / "CLAUDE.md",
        output_dir / "README.md",
        output_dir / ".gitignore",
        output_dir / "knowledge" / "graph.json",
        output_dir / "knowledge" / "courses.json",
        output_dir / ".learner" / "profile.json",
    ]
    if not enable_blockchain:
        required.append(output_dir / ".learner" / "progress.json")
    else:
        required += [
            output_dir / "blockchain" / "config.json",
            output_dir / "blockchain" / "package.json",
        ]

    missing = [f for f in required if not f.exists()]
    for f in required:
        status = "✅" if f.exists() else "❌"
        logger.info("%s %s", status, f.relative_to(output_dir))

    if missing:
        logger.warning("Missing %d required files", len(missing))
        return False
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Test Phase 5: Scaffolder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  # From saved graph + courses:
  python scaffolder/test_scaffolder.py \\
    --graph extractor/results/graph.json \\
    --courses courseBuilder/results/courses.json

  # From saved graph only (skips lesson generation):
  python scaffolder/test_scaffolder.py --graph extractor/results/graph.json --skip-lessons

  # Full pipeline from a local repo:
  python scaffolder/test_scaffolder.py /path/to/repo

  # With blockchain mode:
  python scaffolder/test_scaffolder.py --graph graph.json --enable-blockchain
""",
    )
    parser.add_argument(
        "repo",
        nargs="?",
        default=None,
        help="Path or URL to a git repository (runs full Phase 1→5 pipeline)",
    )
    parser.add_argument(
        "--graph", "-g",
        default=None,
        metavar="PATH",
        help="Phase 2/3 graph JSON file (skips Phase 1-3)",
    )
    parser.add_argument(
        "--courses", "-c",
        default=None,
        metavar="PATH",
        help="Phase 4 courses JSON file (skips Phase 4)",
    )
    parser.add_argument(
        "--output", "-o",
        default=None,
        metavar="PATH",
        help="Output directory for the course repo (default: scaffolder/results/<label>_<timestamp>)",
    )
    parser.add_argument(
        "--model",
        default="google/gemma-3-27b-it",
        help="LLM model name (default: google/gemma-3-27b-it)",
    )
    parser.add_argument(
        "--expansion-rounds",
        type=int,
        default=2,
        help="Number of graph expansion rounds when running full pipeline (default: 2)",
    )
    parser.add_argument(
        "--skip-lessons",
        action="store_true",
        help="Skip lesson generation in Phase 4",
    )
    parser.add_argument(
        "--enable-blockchain",
        action="store_true",
        help="Generate blockchain/ directory with AIN helper",
    )
    parser.add_argument(
        "--ain-js-version",
        default="^1.14.0",
        help="ain-js npm version (default: ^1.14.0)",
    )
    parser.add_argument(
        "--repo-path",
        default=None,
        metavar="PATH",
        help="Source repo path for copying code snippets (used with --graph)",
    )
    parser.add_argument(
        "--keep-clone",
        action="store_true",
        help="Keep cloned repository after test",
    )

    args = parser.parse_args()

    if not args.graph and not args.repo:
        parser.error("Provide either a repo path/URL or --graph PATH")

    is_temp_clone = False
    clone_dir: Path | None = None

    try:
        # ── Build/load KG and courses ─────────────────────────────────────
        if args.graph:
            logger.info("Loading graph from: %s", args.graph)
            kg = load_graph(args.graph)
            repo_label = Path(args.graph).stem

            if args.courses:
                logger.info("Loading courses from: %s", args.courses)
                courses = load_courses(args.courses)
            else:
                logger.info("=" * 60)
                logger.info("Phase 4: Course Building")
                logger.info("=" * 60)
                builder = CourseBuilder(model=args.model)
                courses = builder.build_courses(kg, generate_lessons=not args.skip_lessons)
                logger.info("✅ %d courses", len(courses))

            repo_path_for_snippets = Path(args.repo_path) if args.repo_path else None

        else:
            kg, courses, is_temp_clone, clone_dir = run_full_pipeline(
                args.repo, args.model, args.expansion_rounds, args.skip_lessons
            )
            repo_label = args.repo.rstrip("/").split("/")[-1].replace(".git", "")
            repo_path_for_snippets = clone_dir

        logger.info(
            "Ready to scaffold: %d concepts, %d courses",
            len(kg.get_all_concepts()),
            len(courses),
        )

        # ── Phase 5: Scaffold ─────────────────────────────────────────────
        logger.info("")
        logger.info("=" * 60)
        logger.info("Phase 5: Scaffolding Course Repo")
        logger.info("=" * 60)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if args.output:
            output_dir = Path(args.output)
        else:
            RESULTS_DIR.mkdir(parents=True, exist_ok=True)
            output_dir = RESULTS_DIR / f"{repo_label}_{timestamp}"

        scaffolder = Scaffolder(
            kg,
            courses,
            enable_blockchain=args.enable_blockchain,
            ain_js_version=args.ain_js_version,
        )
        course_repo = scaffolder.scaffold(output_dir, repo_path=repo_path_for_snippets)

        # ── Verification ──────────────────────────────────────────────────
        logger.info("")
        logger.info("=" * 60)
        logger.info("Verification")
        logger.info("=" * 60)
        ok = verify_output(course_repo, args.enable_blockchain)

        # ── Summary ───────────────────────────────────────────────────────
        stats = kg.stats()
        logger.info("")
        logger.info("=" * 60)
        logger.info("Summary")
        logger.info("=" * 60)
        logger.info("Concepts  : %d", stats["num_concepts"])
        logger.info("Courses   : %d", len([c for c in courses if c.concepts]))
        logger.info("Blockchain: %s", args.enable_blockchain)
        logger.info("Output    : %s", course_repo)
        logger.info("")
        if ok:
            logger.info("✅ Scaffold test passed")
            logger.info("To start learning: cd %s && claude", course_repo)
        else:
            logger.warning("⚠️  Some files are missing — check above")

    except Exception as e:
        logger.error("❌ Test failed: %s", e)
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        if is_temp_clone and not args.keep_clone and clone_dir and clone_dir.exists():
            logger.info("Cleaning up temporary clone...")
            shutil.rmtree(clone_dir)
            logger.info("✅ Cleanup done")


if __name__ == "__main__":
    main()
