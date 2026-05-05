from src.batch_analyzer import analyze_job_batch, summarize_missing_skills


def test_analyze_job_batch_adds_priority_and_job_type():
    resume = "熟悉 Python、LLM API、Prompt Engineering、数据分析、平台运维。"
    jobs = [
        {"job_title": "AI产品助理", "jd": "要求大模型API、Prompt Engineering、用户需求分析，接受应届生。", "company": "A公司", "city": "福州", "salary": "6-8K", "url": "https://example.com/a"},
        {"job_title": "Java高级开发", "jd": "要求Java、Spring、5年经验。", "company": "B公司", "city": "厦门", "salary": "20-30K", "url": "https://example.com/b"},
    ]
    rows = analyze_job_batch(jobs, resume, llm_client=None)
    assert len(rows) == 2
    assert rows[0]["job_type"] in {"AI产品/运营", "AI应用开发", "数据分析", "信息系统/运维", "其他"}
    assert rows[0]["priority"] in {"高", "中", "低"}
    assert "apply_suggestion" in rows[0]
    assert rows[0]["company"] == "A公司"
    assert rows[0]["url"] == "https://example.com/a"


def test_summarize_missing_skills_counts_frequency():
    rows = [
        {"missing_skills": ["SQL", "Pandas"]},
        {"missing_skills": ["SQL", "RAG"]},
        {"missing_skills": []},
    ]
    summary = summarize_missing_skills(rows)
    assert summary[0]["skill"] == "SQL"
    assert summary[0]["count"] == 2
