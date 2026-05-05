"""AI 求职助手 — FastAPI 后端 v5 (LLM + Auth + History)."""
from __future__ import annotations

import io
import json
import math
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

# Load .env before anything else
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Add parent dir to path so we can import src
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.batch_analyzer import analyze_job_batch, rows_for_export, summarize_missing_skills
from src.interview_generator import generate_interview_questions
from src.jd_analyzer import analyze_jd
from src.llm_client import LLMClient
from src.report_generator import generate_daily_report
from src.resume_matcher import match_resume
from src.resume_rewriter import rewrite_resume

from api.auth import (
    authenticate_user,
    create_token,
    create_user,
    decode_token,
    get_history,
    get_user,
    init_user_db,
    save_analysis,
    update_resume,
)

from api.features import (
    init_feature_tables,
    create_resume, list_resumes, get_resume, update_resume_version, delete_resume, set_default_resume,
    add_favorite, list_favorites, remove_favorite, update_favorite_notes,
    compare_jobs,
    save_message, get_chat_history, clear_chat_history,
    delete_history_item, get_history_detail,
)

app = FastAPI(title="AI 求职助手 API", version="5.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)


# ── Helpers ─────────────────────────────────────────────────────────────────

def _sanitize(obj):
    """Replace NaN/inf floats with None so JSON serialization works."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj


def get_client() -> LLMClient:
    return LLMClient()


def _get_current_user(cred: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """Extract user from JWT token. Returns None if not authenticated (optional auth)."""
    if cred is None:
        return None
    payload = decode_token(cred.credentials)
    if payload is None:
        return None
    return {"id": payload["sub"], "username": payload["username"]}


def _require_user(cred: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Require authentication. Raises 401 if not valid."""
    if cred is None:
        raise HTTPException(status_code=401, detail="未登录")
    payload = decode_token(cred.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token 无效或已过期")
    return {"id": payload["sub"], "username": payload["username"]}


COLUMN_MAP = {
    "岗位名称": "job_title",
    "岗位描述": "jd",
    "公司": "company",
    "地点": "city",
    "薪资": "salary",
    "链接": "url",
}


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    return df.rename(columns=COLUMN_MAP)


# ── Startup ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    init_user_db()
    init_feature_tables()


# ── Pydantic models ─────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class ResumeRequest(BaseModel):
    resume_text: str


class SingleAnalyzeRequest(BaseModel):
    resume_text: str
    jd_text: str


class BatchJsonRequest(BaseModel):
    jobs: List[Dict[str, Any]]
    resume_text: str


class ExportRowsRequest(BaseModel):
    rows: List[Dict[str, Any]]


class ExportExcelRequest(BaseModel):
    rows: List[Dict[str, Any]]
    missing_skills: Optional[List[Dict[str, Any]]] = None


class ResumeVersionRequest(BaseModel):
    name: str
    content: str
    is_default: bool = False


class FavoriteRequest(BaseModel):
    job_title: str = ""
    company: str = ""
    city: str = ""
    salary: str = ""
    match_score: str = ""
    priority: str = ""
    job_type: str = ""
    jd_text: str = ""
    notes: str = ""


class CompareRequest(BaseModel):
    resume_text: str
    job_a: Dict[str, Any]
    job_b: Dict[str, Any]


class ChatRequest(BaseModel):
    message: str


class FavoriteNotesRequest(BaseModel):
    notes: str


# ── Auth endpoints ──────────────────────────────────────────────────────────

@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    if len(req.username) < 2:
        raise HTTPException(400, "用户名至少 2 个字符")
    if len(req.password) < 4:
        raise HTTPException(400, "密码至少 4 个字符")
    try:
        user = create_user(req.username, req.password)
    except ValueError as e:
        raise HTTPException(400, str(e))
    token = create_token(user["id"], user["username"])
    return {"token": token, "user": user}


@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(401, "用户名或密码错误")
    token = create_token(user["id"], user["username"])
    return {"token": token, "user": user}


@app.get("/api/auth/me")
async def get_me(user: dict = Depends(_require_user)):
    info = get_user(user["id"])
    if not info:
        raise HTTPException(404, "用户不存在")
    return info


# ── Resume management ───────────────────────────────────────────────────────

@app.post("/api/resume/save")
async def save_user_resume(req: ResumeRequest, user: dict = Depends(_require_user)):
    update_resume(user["id"], req.resume_text)
    return {"status": "ok"}


@app.get("/api/resume/load")
async def load_user_resume(user: dict = Depends(_require_user)):
    info = get_user(user["id"])
    return {"resume_text": info.get("resume_text", "") if info else ""}


# ── Analysis history ────────────────────────────────────────────────────────

@app.get("/api/history")
async def list_history(user: dict = Depends(_require_user)):
    return get_history(user["id"])


# ── Health ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    client = get_client()
    return {
        "status": "ok",
        "llm_available": client.available,
        "model": client.model if client.available else None,
    }


# ── Analysis endpoints (auth optional, saves history if logged in) ──────────

@app.post("/api/analyze/single")
async def analyze_single(req: SingleAnalyzeRequest, user: dict = Depends(_get_current_user)):
    client = get_client()
    result: Dict[str, Any] = {}

    try:
        result["jd_analysis"] = analyze_jd(req.jd_text, client)
    except Exception as e:
        result["jd_analysis"] = {"error": str(e)}

    try:
        result["match"] = match_resume(req.resume_text, result.get("jd_analysis", {}), client)
    except Exception as e:
        result["match"] = {"error": str(e)}

    try:
        result["rewrite"] = rewrite_resume(req.resume_text, result.get("jd_analysis", {}), client)
    except Exception as e:
        result["rewrite"] = {"error": str(e)}

    try:
        result["questions"] = generate_interview_questions(result.get("jd_analysis", {}), client)
    except Exception as e:
        result["questions"] = {"error": str(e)}

    result = _sanitize(result)

    if user:
        save_analysis(user["id"], "single", {"jd_text": req.jd_text[:500]}, result)

    return result


@app.post("/api/analyze/batch")
async def analyze_batch(
    file: UploadFile = File(...),
    resume_text: str = Form(""),
    user: dict = Depends(_get_current_user),
):
    client = get_client()

    content = await file.read()
    try:
        try:
            df = pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(content), encoding="gbk")
    except Exception as e:
        return {"error": f"CSV 解析失败: {e}"}

    df = _normalize_columns(df)
    jobs = df.to_dict("records")

    try:
        rows = analyze_job_batch(jobs, resume_text, client)
    except Exception as e:
        return {"error": f"批量分析失败: {e}"}

    missing = summarize_missing_skills(rows)
    report = generate_daily_report(rows, client)

    high = sum(1 for r in rows if r.get("priority") == "高")
    mid = sum(1 for r in rows if r.get("priority") == "中")
    low = sum(1 for r in rows if r.get("priority") == "低")

    result = _sanitize({
        "rows": rows,
        "missing_skills": missing,
        "report": report,
        "stats": {"total": len(rows), "high": high, "mid": mid, "low": low},
    })

    if user:
        save_analysis(user["id"], "batch", {"filename": file.filename, "rows_count": len(jobs)}, result)

    return result


@app.post("/api/analyze/batch/json")
async def analyze_batch_json(req: BatchJsonRequest, user: dict = Depends(_get_current_user)):
    client = get_client()

    try:
        rows = analyze_job_batch(req.jobs, req.resume_text, client)
    except Exception as e:
        return {"error": f"批量分析失败: {e}"}

    missing = summarize_missing_skills(rows)
    report = generate_daily_report(rows, client)

    high = sum(1 for r in rows if r.get("priority") == "高")
    mid = sum(1 for r in rows if r.get("priority") == "中")
    low = sum(1 for r in rows if r.get("priority") == "低")

    result = _sanitize({
        "rows": rows,
        "missing_skills": missing,
        "report": report,
        "stats": {"total": len(rows), "high": high, "mid": mid, "low": low},
    })

    if user:
        save_analysis(user["id"], "batch", {"jobs_count": len(req.jobs)}, result)

    return result


# ── Export endpoints ────────────────────────────────────────────────────────

@app.post("/api/export/csv")
async def export_csv(req: ExportRowsRequest):
    export_data = rows_for_export(req.rows)
    df = pd.DataFrame(export_data)
    csv_bytes = df.to_csv(index=False).encode("utf-8-sig")

    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=job_rankings.csv"},
    )


@app.post("/api/export/excel")
async def export_excel(req: ExportExcelRequest):
    export_data = rows_for_export(req.rows)
    export_df = pd.DataFrame(export_data)
    missing_df = pd.DataFrame(req.missing_skills) if req.missing_skills else pd.DataFrame()

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        export_df.to_excel(writer, index=False, sheet_name="岗位排名")
        if not missing_df.empty:
            missing_df.to_excel(writer, index=False, sheet_name="缺失技能统计")

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=job_rankings.xlsx"},
    )


# ── Resume Versions ─────────────────────────────────────────────────────────

@app.post("/api/resumes")
async def api_create_resume(req: ResumeVersionRequest, user: dict = Depends(_require_user)):
    resume_id = create_resume(user["id"], req.name, req.content, req.is_default)
    return _sanitize({"id": resume_id, "name": req.name, "is_default": req.is_default})


@app.get("/api/resumes")
async def api_list_resumes(user: dict = Depends(_require_user)):
    resumes = list_resumes(user["id"])
    return _sanitize(resumes)


@app.get("/api/resumes/{resume_id}")
async def api_get_resume(resume_id: int, user: dict = Depends(_require_user)):
    resume = get_resume(resume_id, user["id"])
    if not resume:
        raise HTTPException(404, "简历版本不存在")
    return _sanitize(resume)


@app.put("/api/resumes/{resume_id}")
async def api_update_resume(resume_id: int, req: ResumeVersionRequest, user: dict = Depends(_require_user)):
    ok = update_resume_version(resume_id, user["id"], req.name, req.content)
    if not ok:
        raise HTTPException(404, "简历版本不存在")
    return {"status": "ok"}


@app.delete("/api/resumes/{resume_id}")
async def api_delete_resume(resume_id: int, user: dict = Depends(_require_user)):
    ok = delete_resume(resume_id, user["id"])
    if not ok:
        raise HTTPException(404, "简历版本不存在")
    return {"status": "ok"}


@app.post("/api/resumes/{resume_id}/default")
async def api_set_default_resume(resume_id: int, user: dict = Depends(_require_user)):
    ok = set_default_resume(resume_id, user["id"])
    if not ok:
        raise HTTPException(404, "简历版本不存在")
    return {"status": "ok"}


# ── Favorites ───────────────────────────────────────────────────────────────

@app.post("/api/favorites")
async def api_add_favorite(req: FavoriteRequest, user: dict = Depends(_require_user)):
    fav_id = add_favorite(user["id"], **req.dict())
    return _sanitize({"id": fav_id})


@app.get("/api/favorites")
async def api_list_favorites(user: dict = Depends(_require_user)):
    favs = list_favorites(user["id"])
    return _sanitize(favs)


@app.delete("/api/favorites/{fav_id}")
async def api_remove_favorite(fav_id: int, user: dict = Depends(_require_user)):
    ok = remove_favorite(fav_id, user["id"])
    if not ok:
        raise HTTPException(404, "收藏不存在")
    return {"status": "ok"}


@app.patch("/api/favorites/{fav_id}/notes")
async def api_update_favorite_notes(fav_id: int, req: FavoriteNotesRequest, user: dict = Depends(_require_user)):
    ok = update_favorite_notes(fav_id, user["id"], req.notes)
    if not ok:
        raise HTTPException(404, "收藏不存在")
    return {"status": "ok"}


# ── Job Comparison ──────────────────────────────────────────────────────────

@app.post("/api/compare")
async def api_compare_jobs(req: CompareRequest, user: dict = Depends(_require_user)):
    client = get_client()
    result = compare_jobs(req.resume_text, req.job_a, req.job_b, client)
    return _sanitize(result)


# ── Chat ────────────────────────────────────────────────────────────────────

CHAT_SYSTEM_PROMPT = (
    "你是一个专业的求职顾问助手。你帮助用户分析岗位、优化简历、准备面试、规划职业发展。\n"
    "回答要简洁实用，用中文。如果用户问的问题和求职无关，礼貌地引导回求职话题。"
)


@app.post("/api/chat")
async def api_chat(req: ChatRequest, user: dict = Depends(_require_user)):
    client = get_client()

    # Save user message
    save_message(user["id"], "user", req.message)

    # Build messages for LLM
    history = get_chat_history(user["id"])
    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Generate response
    try:
        response_text = client.chat(messages)
    except Exception as e:
        raise HTTPException(500, f"AI 回复失败: {e}")

    # Save assistant response
    save_message(user["id"], "assistant", response_text)

    return _sanitize({"response": response_text})


@app.get("/api/chat/history")
async def api_chat_history(user: dict = Depends(_require_user)):
    history = get_chat_history(user["id"])
    return _sanitize(history)


@app.delete("/api/chat/history")
async def api_clear_chat_history(user: dict = Depends(_require_user)):
    clear_chat_history(user["id"])
    return {"status": "ok"}


# ── Enhanced History ────────────────────────────────────────────────────────

@app.get("/api/history/{item_id}")
async def api_get_history_detail(item_id: int, user: dict = Depends(_require_user)):
    detail = get_history_detail(item_id, user["id"])
    if not detail:
        raise HTTPException(404, "历史记录不存在")
    return _sanitize(detail)


@app.delete("/api/history/{item_id}")
async def api_delete_history_item(item_id: int, user: dict = Depends(_require_user)):
    ok = delete_history_item(item_id, user["id"])
    if not ok:
        raise HTTPException(404, "历史记录不存在")
    return {"status": "ok"}
