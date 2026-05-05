from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

SKILL_KEYWORDS = [
    "Python", "SQL", "Excel", "Tableau", "PowerBI", "Pandas", "Numpy", "Streamlit",
    "FastAPI", "Flask", "Django", "LLM API", "大模型API", "Prompt Engineering", "Prompt",
    "RAG", "Agent", "HuggingFace", "机器学习", "深度学习", "NLP", "数据分析", "爬虫",
    "AIGC", "产品设计", "用户研究", "Axure", "Figma", "Git", "Linux",
]


def _normalize_skill(skill: str) -> str:
    mapping = {"大模型API": "LLM API", "Prompt": "Prompt Engineering"}
    return mapping.get(skill, skill)


def extract_skills(text: str) -> List[str]:
    found = []
    lower_text = text.lower()
    for skill in SKILL_KEYWORDS:
        if skill.lower() in lower_text:
            normalized = _normalize_skill(skill)
            if normalized not in found:
                found.append(normalized)
    return found


def _guess_job_title(jd_text: str) -> str:
    patterns = [r"岗位[:：]\s*([^\n，,。]{2,30})", r"招聘([^\n，,。]{2,30})", r"([^\n，,。]{2,30}(?:助理|实习生|工程师|分析师|运营|产品经理))"]
    for pattern in patterns:
        match = re.search(pattern, jd_text)
        if match:
            return match.group(1).strip()
    return "待分析岗位"


def analyze_jd(jd_text: str, llm_client: Optional[Any] = None) -> Dict[str, Any]:
    if llm_client is not None and getattr(llm_client, "available", False):
        try:
            return llm_client.chat_json(
                "你是招聘岗位分析专家。只输出 JSON。",
                "分析以下岗位JD，输出字段：job_title, company_type, required_skills, preferred_skills, soft_skills, education_requirement, difficulty(0-100), suitable_for_fresh_graduate(boolean), summary。\n\n" + jd_text,
            )
        except Exception:
            pass

    skills = extract_skills(jd_text)
    text = jd_text.lower()
    fresh_markers = ["应届", "实习", "无经验", "经验不限", "校招", "毕业生"]
    senior_markers = ["3年", "5年", "专家", "高级", "架构", "负责人"]
    suitable = any(marker in jd_text for marker in fresh_markers) and not any(marker in jd_text for marker in senior_markers)
    difficulty = min(100, 35 + len(skills) * 7 + (25 if any(marker in jd_text for marker in senior_markers) else 0))
    return {
        "job_title": _guess_job_title(jd_text),
        "company_type": "未识别",
        "required_skills": skills[:6],
        "preferred_skills": skills[6:10],
        "soft_skills": [s for s in ["沟通能力", "学习能力", "执行力"] if s in jd_text] or ["沟通能力", "学习能力"],
        "education_requirement": "本科及以上" if "本科" in jd_text else "未明确",
        "difficulty": difficulty,
        "suitable_for_fresh_graduate": suitable or difficulty <= 55,
        "summary": "该岗位主要关注：" + ("、".join(skills[:5]) if skills else "岗位描述中的通用能力"),
    }
