from __future__ import annotations

from typing import Any, Dict, Optional


def rewrite_resume(resume_text: str, jd_analysis: Dict[str, Any], llm_client: Optional[Any] = None) -> Dict[str, Any]:
    if llm_client is not None and getattr(llm_client, "available", False):
        try:
            return llm_client.chat_json(
                "你是中文简历优化专家。只输出 JSON。不得虚构经历。",
                "根据岗位分析优化简历，输出：target_title, optimized_summary, optimized_skills, project_rewrite_suggestions, warnings。\n\n简历：\n"
                + resume_text
                + "\n\n岗位分析：\n"
                + str(jd_analysis),
            )
        except Exception:
            pass

    skills = jd_analysis.get("required_skills", []) + jd_analysis.get("preferred_skills", [])
    title = jd_analysis.get("job_title", "目标岗位")
    return {
        "target_title": title,
        "optimized_summary": f"面向{title}方向，突出 AI 工具使用、数据分析、项目落地和快速学习能力。",
        "optimized_skills": skills[:8],
        "project_rewrite_suggestions": [
            "将 Twitter 舆情分析项目突出为：数据采集、文本处理、情感分类、可视化报告。",
            "将 Hermes/Agent 经历突出为：大模型 API 调用、Prompt 设计、自动化工作流。",
            "每段项目经历加入业务目标和量化结果，避免只罗列工具。",
        ],
        "warnings": ["不要编造未做过的技术细节", "投递不同岗位时只调整表达重点，不改变事实"],
    }
