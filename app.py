import json
from io import BytesIO

import pandas as pd
import streamlit as st

from src.batch_analyzer import analyze_job_batch, rows_for_export, summarize_missing_skills
from src.interview_generator import generate_interview_questions
from src.jd_analyzer import analyze_jd
from src.llm_client import LLMClient
from src.report_generator import generate_daily_report
from src.resume_matcher import match_resume
from src.resume_rewriter import rewrite_resume

st.set_page_config(page_title="AI 求职助手", page_icon="💼", layout="wide")
st.title("💼 AI 求职助手")
st.caption("岗位 JD 分析 · 简历匹配 · 简历优化 · 面试题生成 · 求职日报")

client = LLMClient()
if client.available:
    st.success(f"已检测到 LLM API Key，当前模型：{client.model}")
else:
    st.warning("未检测到 API Key，当前使用本地规则 fallback 模式。设置 OPENAI_API_KEY / LLM_API_KEY 后可启用大模型。")


def show_json(title, data):
    st.subheader(title)
    st.json(data, expanded=True)


with st.sidebar:
    st.header("使用说明")
    st.markdown(
        """
1. 粘贴你的简历和目标岗位 JD  
2. 点击分析按钮  
3. 查看匹配度、简历优化和面试题  
4. 批量模式可上传岗位 CSV 生成日报  

CSV 至少包含：`job_title`, `jd`
        """
    )

sample_resume = ""
try:
    with open("data/resume.txt", "r", encoding="utf-8") as f:
        sample_resume = f.read()
except FileNotFoundError:
    pass

single_tab, batch_tab = st.tabs(["单岗位分析", "批量岗位日报"])

with single_tab:
    col1, col2 = st.columns(2)
    with col1:
        resume_text = st.text_area("你的简历", value=sample_resume, height=360)
    with col2:
        jd_text = st.text_area(
            "目标岗位 JD",
            value="岗位：AI产品助理。要求熟悉大模型API、Prompt Engineering、用户需求分析，接受应届生，有AIGC工具使用经验优先。",
            height=360,
        )

    if st.button("开始分析", type="primary"):
        jd_analysis = analyze_jd(jd_text, client)
        match = match_resume(resume_text, jd_analysis, client)
        rewrite = rewrite_resume(resume_text, jd_analysis, client)
        questions = generate_interview_questions(jd_analysis, client)

        st.metric("匹配度", f"{match.get('match_score', 0)} 分")
        show_json("岗位 JD 分析", jd_analysis)
        show_json("简历匹配结果", match)
        show_json("简历优化建议", rewrite)
        show_json("面试题", questions)

        st.download_button(
            "下载分析结果 JSON",
            data=json.dumps({"jd_analysis": jd_analysis, "match": match, "rewrite": rewrite, "questions": questions}, ensure_ascii=False, indent=2),
            file_name="job_analysis_result.json",
            mime="application/json",
        )

with batch_tab:
    uploaded = st.file_uploader("上传岗位 CSV", type=["csv"])
    if uploaded is None:
        try:
            df = pd.read_csv("data/jobs.csv")
            st.info("当前展示示例岗位数据。")
        except FileNotFoundError:
            df = pd.DataFrame(columns=["job_title", "company", "city", "salary", "url", "jd"])
    else:
        df = pd.read_csv(uploaded)

    st.markdown("""
    **CSV 推荐字段：** `job_title`, `company`, `city`, `salary`, `url`, `jd`  
    必填字段只有 `jd`；其他字段没有也能分析，但导出结果会少一些信息。
    """)
    st.dataframe(df, use_container_width=True)
    batch_resume = st.text_area("用于批量匹配的简历", value=sample_resume, height=240, key="batch_resume")

    if st.button("生成增强版岗位排名 / 求职日报", type="primary"):
        rows = analyze_job_batch(df.to_dict("records"), batch_resume, client)
        report = generate_daily_report(rows, client)
        export_df = pd.DataFrame(rows_for_export(rows))
        missing_df = pd.DataFrame(summarize_missing_skills(rows))

        st.subheader("岗位排名")
        st.dataframe(export_df, use_container_width=True)

        high_count = sum(1 for row in rows if row.get("priority") == "高")
        mid_count = sum(1 for row in rows if row.get("priority") == "中")
        low_count = sum(1 for row in rows if row.get("priority") == "低")
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("岗位总数", len(rows))
        c2.metric("高优先级", high_count)
        c3.metric("中优先级", mid_count)
        c4.metric("低优先级", low_count)

        if not missing_df.empty:
            st.subheader("缺失技能统计")
            st.dataframe(missing_df, use_container_width=True)
            st.bar_chart(missing_df.set_index("skill"))

        show_json("今日求职日报", report)

        csv_data = export_df.to_csv(index=False).encode("utf-8-sig")
        st.download_button(
            "下载岗位排名 CSV",
            data=csv_data,
            file_name="job_rankings.csv",
            mime="text/csv",
        )

        excel_buffer = BytesIO()
        with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
            export_df.to_excel(writer, index=False, sheet_name="岗位排名")
            if not missing_df.empty:
                missing_df.to_excel(writer, index=False, sheet_name="缺失技能统计")
        st.download_button(
            "下载岗位排名 Excel",
            data=excel_buffer.getvalue(),
            file_name="job_rankings.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
