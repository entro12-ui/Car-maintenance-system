from __future__ import annotations

from pathlib import Path
from dotenv import load_dotenv


def load_backend_env() -> Path | None:
    """Load `.env` from the backend folder regardless of current working directory.

    Searches upwards from this file's directory for the first `.env` and loads it.
    Does not override already-set environment variables.
    """
    for parent in Path(__file__).resolve().parents:
        candidate = parent / ".env"
        if candidate.exists():
            load_dotenv(dotenv_path=candidate, override=False)
            return candidate

    load_dotenv(override=False)
    return None
