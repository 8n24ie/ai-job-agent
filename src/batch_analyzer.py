from __future__ import annotations

from collections import Counter
from typing import Any, Dict, Iterable, List, Optional

from .jd_analyzer import analyze_jd
from .resume_matcher import match_resume


def classify_job_type(title: str, jd_text: str) -> str:
    text = f"{title} {jd_text}".lower()
    if any(k.lower() in text for k in ["ai产品", "产品助理", "aigc运营", "prompt", "大模型产品"]):
        return "AI产品/运营"
    if any(k.lower() in text for k in ["llm api", "大模型api", "rag", "streamlit", "ai应用", "agent", "python开发"]):
        return "AI应用开发"
    if any(k.lower() in text for k in ["数据分析", "sql", "pandas", "tableau", "powerbi", "bi"]):
        return "数据分析"
    if any(k.lower() in text for k in ["运维", "信息系统", "平台", "实施", "巡检", "工单"]):
        return "信息系统/运维"
    return "其他"


def decide_priority(match_score: int, suitable_for_fresh_graduate: bool, difficulty: int) -> str:
    if match_score >= 75 and suitable_for_fresh_graduate and difficulty <= 75:
        return "高"
    if match_score >= 55 and difficulty <= 85:
        return "中"
    return "低"


def build_apply_suggestion(priority: str, match_score: int, missing_skills: List[str]) -> str:
    if priority == "高":
        return "优先投递；投递前把简历项目经历改写得更贴近 JD 关键词。"
    if priority == "中":
        missing = "、".join(missing_skills[:3]) if missing_skills else "岗位细节"
        return f"可以投递；建议先补充或包装 {missing} 的项目证据。"
    return "暂不优先；除非岗位特别喜欢，否则先投更匹配的岗位。"


def analyze_job_batch(jobs: Iterable[Dict[str, Any]], resume_text: str, llm_client: Optional[Any] = None) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for idx, job in enumerate(jobs, start=1):
        jd_text = str(job.get("jd") or job.get("岗位描述") or job.get("description") or "")
        original_title = str(job.get("job_title") or job.get("岗位名称") or job.get("title") or "")
        jd_analysis = analyze_jd(jd_text, llm_client=llm_client)
        if original_title:
            jd_analysis["job_title"] = original_title
        match = match_resume(resume_text, jd_analysis, llm_client=llm_client)
        match_score = int(match.get("match_score", 0))
        missing_skills = match.get("missing_skills", []) or []
        priority = decide_priority(
            match_score,
            bool(jd_analysis.get("suitable_for_fresh_graduate", False)),
            int(jd_analysis.get("difficulty", 100)),
        )
        row = {
            "rank": idx,
            "job_title": jd_analysis.get("job_title", original_title or "未知岗位"),
            "company": job.get("company") or job.get("公司") or "",
            "city": job.get("city") or job.get("地点") or "",
            "salary": job.get("salary") or job.get("薪资") or "",
            "url": job.get("url") or job.get("链接") or "",
            "job_type": classify_job_type(original_title or jd_analysis.get("job_title", ""), jd_text),
            "match_score": match_score,
            "priority": priority,
            "difficulty": jd_analysis.get("difficulty", 0),
            "suitable_for_fresh_graduate": jd_analysis.get("suitable_for_fresh_graduate", False),
            "required_skills": jd_analysis.get("required_skills", []),
            "matched_skills": match.get("matched_skills", []),
            "missing_skills": missing_skills,
            "recommendation": match.get("recommendation", ""),
            "apply_suggestion": build_apply_suggestion(priority, match_score, missing_skills),
        }
        rows.append(row)
    rows.sort(key=lambda r: (r["priority"] != "高", r["priority"] != "中", -r["match_score"]))
    for i, row in enumerate(rows, start=1):
        row["rank"] = i
    return rows


def summarize_missing_skills(rows: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    counter: Counter[str] = Counter()
    for row in rows:
        counter.update(row.get("missing_skills", []) or [])
    return [{"skill": skill, "count": count} for skill, count in counter.most_common()]


def rows_for_export(rows: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    export_rows = []
    for row in rows:
        export_rows.append({
            "排名": row.get("rank"),
            "岗位名称": row.get("job_title"),
            "公司": row.get("company"),
            "地点": row.get("city"),
            "薪资": row.get("salary"),
            "岗位类型": row.get("job_type"),
            "匹配分": row.get("match_score"),
            "优先级": row.get("priority"),
            "岗位难度": row.get("difficulty"),
            "应届适配": "是" if row.get("suitable_for_fresh_graduate") else "否",
            "核心技能": "、".join(row.get("required_skills", []) or []),
            "已匹配技能": "、".join(row.get("matched_skills", []) or []),
            "缺失技能": "、".join(row.get("missing_skills", []) or []),
            "投递建议": row.get("apply_suggestion"),
            "岗位链接": row.get("url"),
        })
    return export_rows
