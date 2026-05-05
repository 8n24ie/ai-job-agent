from __future__ import annotations

from typing import Any, Dict, Optional

from .jd_analyzer import extract_skills


def match_resume(resume_text: str, jd_analysis: Dict[str, Any], llm_client: Optional[Any] = None) -> Dict[str, Any]:
    if llm_client is not None and getattr(llm_client, "available", False):
        try:
            return llm_client.chat_json(
                "你是应届生求职顾问。只输出 JSON。",
                "根据简历和岗位分析输出：match_score(0-100), matched_skills, missing_skills, strengths, weaknesses, resume_improvements, recommendation。\n\n简历：\n"
                + resume_text
                + "\n\n岗位分析：\n"
                + str(jd_analysis),
            )
        except Exception:
            pass

    resume_skills = set(extract_skills(resume_text))
    required = set(jd_analysis.get("required_skills", []))
    preferred = set(jd_analysis.get("preferred_skills", []))
    target = required | preferred
    matched = sorted(target & resume_skills)
    missing = sorted(required - resume_skills)
    if target:
        score = int((len(matched) / len(target)) * 75 + (15 if jd_analysis.get("suitable_for_fresh_graduate") else 0) + 10)
    else:
        score = 50
    score = max(0, min(100, score))
    return {
        "match_score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "strengths": [f"简历中体现了 {skill} 相关能力" for skill in matched[:5]] or ["简历具备一定项目基础，但需要强化岗位关键词"],
        "weaknesses": [f"缺少 {skill} 的明确证明" for skill in missing[:5]],
        "resume_improvements": [
            "把项目经历改写为：背景-任务-行动-结果 STAR 结构",
            "在技能栏补充与 JD 一致的关键词，但不要虚构经历",
            "每个项目至少加入 1 个可量化结果，如效率提升、数据规模、准确率等",
        ],
        "recommendation": "建议投递" if score >= 70 else ("可以投递，但需要先定制简历" if score >= 50 else "暂不优先，先补齐核心技能证明"),
    }
