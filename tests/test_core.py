import json

from src.jd_analyzer import analyze_jd
from src.resume_matcher import match_resume
from src.interview_generator import generate_interview_questions
from src.report_generator import generate_daily_report


def test_analyze_jd_fallback_extracts_ai_skills():
    jd = "AI产品助理，要求熟悉大模型API、Prompt Engineering、Python，接受应届生。"
    result = analyze_jd(jd, llm_client=None)
    assert result["job_title"]
    assert "Python" in result["required_skills"]
    assert result["suitable_for_fresh_graduate"] is True
    assert 0 <= result["difficulty"] <= 100


def test_match_resume_scores_overlap():
    resume = "本人熟悉 Python、LLM API、Prompt、Streamlit，做过Twitter舆情分析项目。"
    jd_analysis = {
        "required_skills": ["Python", "LLM API", "SQL"],
        "preferred_skills": ["Streamlit"],
        "job_title": "AI应用开发助理",
    }
    result = match_resume(resume, jd_analysis, llm_client=None)
    assert result["match_score"] >= 50
    assert "SQL" in result["missing_skills"]
    assert result["recommendation"]


def test_generate_interview_questions_returns_categories():
    jd_analysis = {"job_title": "AI产品助理", "required_skills": ["Prompt Engineering", "LLM API"]}
    result = generate_interview_questions(jd_analysis, llm_client=None)
    assert "hr_questions" in result
    assert "technical_questions" in result
    assert len(result["technical_questions"]) >= 2


def test_generate_daily_report_ranks_jobs():
    jobs = [
        {"job_title": "A", "match_score": 88, "required_skills": ["Python", "SQL"]},
        {"job_title": "B", "match_score": 65, "required_skills": ["Prompt", "Python"]},
    ]
    report = generate_daily_report(jobs, llm_client=None)
    assert report["recommended_jobs"][0]["job_title"] == "A"
    assert "Python" in report["high_frequency_skills"]
