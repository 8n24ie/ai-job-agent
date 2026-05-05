from __future__ import annotations

from typing import Any, Dict, Optional


def generate_interview_questions(jd_analysis: Dict[str, Any], llm_client: Optional[Any] = None) -> Dict[str, Any]:
    if llm_client is not None and getattr(llm_client, "available", False):
        try:
            return llm_client.chat_json(
                "你是面试教练。只输出 JSON。",
                "根据岗位分析生成 HR 问题、技术问题、项目追问、情景题和回答建议。岗位分析：\n" + str(jd_analysis),
            )
        except Exception:
            pass

    title = jd_analysis.get("job_title", "目标岗位")
    skills = jd_analysis.get("required_skills", []) or ["岗位核心技能"]
    technical = [f"你在项目中如何使用 {skill}？请讲一个具体例子。" for skill in skills[:5]]
    return {
        "hr_questions": [
            f"你为什么想投递{title}？",
            "请用 1 分钟做自我介绍。",
            "你作为应届生，最大的优势和短板是什么？",
        ],
        "technical_questions": technical + ["如果让你从 0 到 1 做一个 AI 小工具，你会怎么设计？"],
        "project_followups": [
            "你的项目中最难的问题是什么？你怎么解决？",
            "项目有没有可量化结果？数据规模是多少？",
            "如果重新做一次，你会如何改进？",
        ],
        "situational_questions": [
            "如果业务方需求很模糊，你如何推进？",
            "如果模型输出不稳定，你会怎么评估和优化？",
        ],
        "answer_tips": ["用 STAR 结构回答", "每个回答绑定一个真实项目", "优先讲结果和反思，不要只堆技术名词"],
    }
