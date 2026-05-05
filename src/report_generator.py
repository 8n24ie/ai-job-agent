from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List, Optional


def generate_daily_report(job_matches: List[Dict[str, Any]], llm_client: Optional[Any] = None) -> Dict[str, Any]:
    if llm_client is not None and getattr(llm_client, "available", False):
        try:
            return llm_client.chat_json(
                "你是求职策略顾问。只输出 JSON。",
                "根据岗位匹配列表生成求职日报：recommended_jobs, high_frequency_skills, best_job_types, skills_to_improve, tomorrow_strategy。\n\n" + str(job_matches),
            )
        except Exception:
            pass

    ranked = sorted(job_matches, key=lambda item: item.get("match_score", 0), reverse=True)
    counter = Counter()
    for job in job_matches:
        counter.update(job.get("required_skills", []))
    return {
        "recommended_jobs": ranked[:5],
        "high_frequency_skills": [skill for skill, _ in counter.most_common(10)],
        "best_job_types": [job.get("job_title", "未知岗位") for job in ranked[:3]],
        "skills_to_improve": [skill for skill, _ in counter.most_common(5)],
        "tomorrow_strategy": [
            "优先投递匹配度 70 分以上岗位",
            "针对高频技能补充简历关键词和项目证据",
            "每天复盘 3 个 JD，总结重复出现的能力要求",
        ],
    }
