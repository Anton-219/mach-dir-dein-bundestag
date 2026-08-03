"""Run the Python validation suite without additional test dependencies."""

from __future__ import annotations

from pathlib import Path
import sys
import unittest


def main() -> int:
    repository_root = Path(__file__).resolve().parents[1]
    if str(repository_root) not in sys.path:
        sys.path.insert(0, str(repository_root))

    suite = unittest.defaultTestLoader.discover(
        start_dir=str(repository_root / "scripts" / "tests"),
        top_level_dir=str(repository_root),
    )
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
