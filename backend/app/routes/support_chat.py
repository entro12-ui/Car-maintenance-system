"""AI customer-support chat with grounded citations and optional YouTube search."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Literal

import httpx

AssistantMode = Literal["support", "maintenance", "reports"]
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.env import load_backend_env

router = APIRouter()

KNOWLEDGE_PATH = Path(__file__).resolve().parent.parent / "data" / "support_knowledge_base.md"

YOUTUBE_LINK_RE = re.compile(
    r"https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})",
    re.IGNORECASE,
)

MD_LINK_RE = re.compile(r"\[([^\]]*)\]\((https?://[^)]+)\)")
IN_APP_BACKTICK_RE = re.compile(r"`(/[a-zA-Z0-9_./\-]*)`")


def _primary_url_for_section(_title: str, body: str) -> str | None:
    """Best link for citations: markdown URL, YouTube, or first in-app path from **In-app:**."""
    if not body:
        return None
    for m in MD_LINK_RE.finditer(body):
        return m.group(2).strip()
    ym = YOUTUBE_LINK_RE.search(body)
    if ym:
        return f"https://www.youtube.com/watch?v={ym.group(1)}"
    for m in IN_APP_BACKTICK_RE.finditer(body):
        p = m.group(1).strip()
        if p.startswith("/") and len(p) > 1:
            return p
    for ln in body.splitlines():
        if "**in-app:**" in ln.lower():
            m = re.search(r"`(/[a-zA-Z0-9_./\-]+)`", ln)
            if m:
                return m.group(1)
            m2 = re.search(
                r"\*\*In-app:\*\*\s*([^\n]+)", ln, re.IGNORECASE
            )
            if m2:
                seg = m2.group(1)
                m3 = re.search(r"(/[a-zA-Z][a-zA-Z0-9_./\-]*)", seg)
                if m3:
                    return m3.group(1).split(",")[0].strip().rstrip(").,;")
            break
    return None


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=8000)


class SupportChatRequest(BaseModel):
    messages: list[ChatMessageIn] = Field(..., min_length=1, max_length=40)
    assistant_mode: AssistantMode = "support"


class CitationOut(BaseModel):
    id: int
    title: str
    url: str | None = None
    source_type: Literal["documentation", "video"]


class SupportChatResponse(BaseModel):
    answer: str
    citations: list[CitationOut]


def _load_knowledge_base() -> str:
    if not KNOWLEDGE_PATH.is_file():
        return ""
    return KNOWLEDGE_PATH.read_text(encoding="utf-8")


def _split_sections(markdown: str) -> list[tuple[str, str]]:
    """Return (title, body) for each ## section."""
    text = markdown.strip()
    if not text:
        return []
    parts = re.split(r"\n(?=## )", text)
    out: list[tuple[str, str]] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        lines = part.split("\n", 1)
        head = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ""
        title = head.lstrip("#").strip() if head.startswith("#") else head
        out.append((title, body))
    return out


def _score_section(query: str, title: str, body: str) -> int:
    terms = {t for t in re.findall(r"[a-z0-9]+", query.lower()) if len(t) > 2}
    if not terms:
        return 0
    blob = f"{title}\n{body}".lower()
    return sum(1 for t in terms if t in blob)


def _select_sections(
    markdown: str, query: str, top_k: int = 5
) -> list[tuple[str, str]]:
    sections = _split_sections(markdown)
    if not sections:
        return []
    scored = [( _score_section(query, t, b), t, b) for t, b in sections]
    scored.sort(key=lambda x: -x[0])
    best = [(t, b) for s, t, b in scored if s > 0][:top_k]
    if best:
        return best
    return [(t, b) for _, t, b in scored[:3]]


def _videos_from_text(text: str) -> list[dict]:
    """YouTube URLs not already captured as markdown links (bare URLs)."""
    seen: set[str] = set()
    out: list[dict] = []
    for m in MD_LINK_RE.finditer(text):
        u = m.group(2).strip()
        ym = YOUTUBE_LINK_RE.search(u)
        if ym:
            vid = ym.group(1)
            if vid not in seen:
                seen.add(vid)
                title = (m.group(1) or "").strip() or "Related video"
                out.append(
                    {
                        "title": title,
                        "url": f"https://www.youtube.com/watch?v={vid}",
                        "channel": "",
                    }
                )
    for m in YOUTUBE_LINK_RE.finditer(text):
        vid = m.group(1)
        if vid in seen:
            continue
        seen.add(vid)
        out.append(
            {
                "title": "Related video (from help library)",
                "url": f"https://www.youtube.com/watch?v={vid}",
                "channel": "",
            }
        )
    return out


async def _youtube_search(
    client: httpx.AsyncClient, query: str, api_key: str, max_results: int = 3
) -> list[dict]:
    if not api_key or not query.strip():
        return []
    try:
        r = await client.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part": "snippet",
                "type": "video",
                "maxResults": max_results,
                "q": query[:200],
                "key": api_key,
            },
            timeout=20.0,
        )
        r.raise_for_status()
        data = r.json()
    except httpx.HTTPError:
        return []
    out: list[dict] = []
    for item in data.get("items", []):
        vid = item.get("id", {}).get("videoId")
        if not vid:
            continue
        sn = item.get("snippet", {})
        out.append(
            {
                "title": sn.get("title", "YouTube video"),
                "url": f"https://www.youtube.com/watch?v={vid}",
                "channel": sn.get("channelTitle", ""),
            }
        )
    return out


def _parse_openai_json(content: str) -> dict:
    raw = content.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


@router.post("/chat", response_model=SupportChatResponse)
async def support_chat(
    body: SupportChatRequest,
    _user=Depends(get_current_user),
):
    # Ensure `.env` files are loaded (e.g. `backend/.env` after a shallow `app/.env`).
    load_backend_env()
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI support is not configured. Set OPENAI_API_KEY on the server.",
        )

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
    yt_key = os.getenv("YOUTUBE_API_KEY", "").strip()

    last_user = ""
    for m in reversed(body.messages):
        if m.role == "user":
            last_user = m.content
            break

    mode_boost = ""
    if body.assistant_mode == "maintenance":
        mode_boost = (
            " workshop maintenance setup parameters job order labour labor charges "
            "vehicle plate sublet fuel lubricant consumable customer "
        )
    elif body.assistant_mode == "reports":
        mode_boost = (
            " reports hub listing sales productivity garage export filters "
            "date range invoice job custom user defined "
        )
    retrieval_query = (last_user + mode_boost).strip() or last_user

    kb = _load_knowledge_base()
    picked = _select_sections(kb, retrieval_query, top_k=6)

    async with httpx.AsyncClient() as client:
        yt_results: list[dict] = []
        if yt_key:
            q = last_user or (
                "automotive workshop preventive maintenance"
                if body.assistant_mode == "maintenance"
                else "garage management reporting dashboard"
                if body.assistant_mode == "reports"
                else "car maintenance service scheduling"
            )
            yt_results = await _youtube_search(client, q, yt_key, max_results=3)

        ref_rows: list[dict] = []
        rid = 1
        combined_for_embedded_videos = ""

        for title, section_body in picked:
            excerpt = section_body[:1500] if section_body else ""
            combined_for_embedded_videos += f"\n{section_body}"
            doc_url = _primary_url_for_section(title, section_body)
            ref_rows.append(
                {
                    "id": rid,
                    "title": title,
                    "url": doc_url,
                    "source_type": "documentation",
                    "excerpt": excerpt,
                }
            )
            rid += 1

        existing_urls = {r["url"] for r in ref_rows if r.get("url")}
        for v in _videos_from_text(combined_for_embedded_videos):
            if v["url"] in existing_urls:
                continue
            existing_urls.add(v["url"])
            ref_rows.append(
                {
                    "id": rid,
                    "title": v["title"],
                    "url": v["url"],
                    "source_type": "video",
                    "excerpt": v.get("channel", ""),
                }
            )
            rid += 1

        for v in yt_results:
            if v["url"] in existing_urls:
                continue
            existing_urls.add(v["url"])
            ref_rows.append(
                {
                    "id": rid,
                    "title": v["title"],
                    "url": v["url"],
                    "source_type": "video",
                    "excerpt": v.get("channel", ""),
                }
            )
            rid += 1

        if not ref_rows:
            ref_rows.append(
                {
                    "id": 1,
                    "title": "General",
                    "url": None,
                    "source_type": "documentation",
                    "excerpt": "No help articles loaded. Contact your garage for assistance.",
                }
            )

        sources_block = "\n".join(
            f'{r["id"]} [{r["source_type"]}] {r["title"]}\n'
            f'   URL: {r["url"] or "(product documentation)"}\n'
            f'   Excerpt: {r["excerpt"]}'
            for r in ref_rows
        )

        if body.assistant_mode == "maintenance":
            system = (
                "You are an expert assistant for **automotive workshop maintenance** — both "
                "(A) **vehicle and fleet care** (intervals, fluids, tires, brakes, warnings, safety) and "
                "(B) **using this software’s Maintenance hub** (parameters, job setup, charges, plates, sublets). "
                "For vehicle advice: be practical and conservative; state that the owner’s manual and a qualified "
                "technician beat generic guidance; never claim to diagnose a specific vehicle from text alone. "
                "For software: ground answers in SOURCES when relevant; suggest the right in-app paths from SOURCES. "
                "Use inline citations like [1] matching ONLY numeric ids from SOURCES. "
                "You cannot see live jobs, inventory, or customer data. "
                "Do not invent URLs. "
                'Respond with a single JSON object: {"answer": string, "cited_reference_ids": number[]}. '
                "cited_reference_ids must list every source id you relied on."
            )
        elif body.assistant_mode == "reports":
            system = (
                "You help garage staff with **report generation and interpretation** in the "
                "Car Service Management System. "
                "Explain which report area fits a business question (e.g. revenue trends → sales reports; "
                "technician output → productivity). Mention typical inputs: date ranges, outlets, statuses. "
                "Outline steps to run or export when SOURCES describe them; otherwise give sensible generic guidance "
                "without pretending you executed a report. "
                "Ground answers in SOURCES; cite [id] only for ids from SOURCES. "
                "You cannot access live numbers or databases. Do not invent URLs. "
                'Respond with a single JSON object: {"answer": string, "cited_reference_ids": number[]}. '
                "cited_reference_ids must list every source id you relied on."
            )
        else:
            system = (
                "You are a professional support assistant for the Car Service Management System "
                "(garage / workshop software). "
                "Answer clearly and helpfully for customers and staff. "
                "Ground your answer in the SOURCES below when they are relevant. "
                "When you give steps or how-to instructions, start with one short friendly sentence "
                "that acknowledges the question. "
                "Use inline citations like [1] or [2] that match ONLY the numeric ids from SOURCES. "
                "Prefer citing a source that has a real URL when the user needs further reading or a video. "
                "If SOURCES do not cover the question, say what is unknown, avoid guessing account-specific "
                "facts, and suggest contacting the garage or system administrator. "
                "Do not invent URLs. "
                'Respond with a single JSON object: {"answer": string, "cited_reference_ids": number[]}. '
                "cited_reference_ids must list every source id you relied on (order does not matter)."
            )

        oa_messages = [
            {"role": "system", "content": f"{system}\n\nSOURCES:\n{sources_block}"},
            *[{"role": m.role, "content": m.content} for m in body.messages[-14:]],
        ]

        try:
            oa_resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": oa_messages,
                    "temperature": 0.35,
                    "response_format": {"type": "json_object"},
                },
                timeout=90.0,
            )
            oa_resp.raise_for_status()
            oa_data = oa_resp.json()
            raw_content = oa_data["choices"][0]["message"]["content"]
            parsed = _parse_openai_json(raw_content)
        except (httpx.HTTPError, KeyError, json.JSONDecodeError, IndexError) as e:
            raise HTTPException(
                status_code=502,
                detail=f"AI provider error: {e!s}",
            ) from e

    answer = str(parsed.get("answer", "")).strip() or "I could not generate a reply."
    cited = parsed.get("cited_reference_ids")
    if not isinstance(cited, list):
        cited = []
    try:
        cited_ids = {int(x) for x in cited}
    except (TypeError, ValueError):
        cited_ids = set()
    if not cited_ids:
        cited_ids = {
            int(m.group(1))
            for m in re.finditer(r"\[(\d+)\]", answer)
            if m.group(1).isdigit()
        }

    id_set = {r["id"] for r in ref_rows}
    cited_ids = {i for i in cited_ids if i in id_set}

    citations_out = [
        CitationOut(
            id=r["id"],
            title=r["title"],
            url=r["url"],
            source_type=r["source_type"],
        )
        for r in ref_rows
        if r["id"] in cited_ids
    ]
    if not citations_out and ref_rows:
        citations_out = [
            CitationOut(
                id=ref_rows[0]["id"],
                title=ref_rows[0]["title"],
                url=ref_rows[0]["url"],
                source_type=ref_rows[0]["source_type"],
            )
        ]

    return SupportChatResponse(answer=answer, citations=citations_out)
