from __future__ import annotations

import os
from pathlib import Path

from dotenv import dotenv_values, load_dotenv


def load_backend_env() -> Path | None:
    """Load and merge `.env` files from this package directory upward.

    Older behavior stopped at the **first** `.env` found (often `backend/app/.env`),
    so secrets defined only in `backend/.env` were never loaded.

    All `.env` files along the parent chain are merged. The path **closest** to this
    package wins on duplicate keys. Values are applied only when the process env var
    is missing or blank, so a non-empty ``OPENAI_API_KEY`` from the host/Docker still
    wins over files.
    """
    chain = list(Path(__file__).resolve().parents)
    candidates = [p / ".env" for p in chain if (p / ".env").is_file()]
    if not candidates:
        load_dotenv(override=False)
        return None
    merged: dict[str, str] = {}
    for path in reversed(candidates):
        for key, val in dotenv_values(path).items():
            if val is None:
                continue
            s = str(val).strip().strip('"').strip("'")
            if s:
                merged[key] = s
    for key, val in merged.items():
        cur = os.environ.get(key)
        if cur is None or (isinstance(cur, str) and not cur.strip()):
            os.environ[key] = val
    return candidates[0]
