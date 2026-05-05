# AI 求职助手

面向应届生的 AI 求职 Agent，支持岗位 JD 分析、简历匹配评分、简历优化建议、面试题生成和批量求职日报。

## 功能

- 单岗位 JD 结构化分析
- 简历与岗位匹配度评分
- 简历定制优化建议
- HR / 技术 / 项目追问题生成
- CSV 批量岗位分析、岗位排名和日报
- 自动识别岗位类型：AI产品/运营、AI应用开发、数据分析、信息系统/运维、其他
- 自动生成优先级：高 / 中 / 低
- 统计缺失技能，辅助制定补强计划
- 支持导出岗位排名 CSV / Excel
- 无 API Key 时可使用本地规则 fallback
- 有 OpenAI-compatible API Key 时可调用大模型

## 安装

```bash
cd ~/ai-job-agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 可选：配置大模型 API

```bash
export OPENAI_API_KEY="你的key"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_MODEL="gpt-4o-mini"
```

也支持：

```bash
export LLM_API_KEY="你的key"
export LLM_BASE_URL="你的OpenAI兼容地址"
export LLM_MODEL="你的模型名"
```

## 启动

```bash
streamlit run app.py
```

## 批量岗位 CSV 格式

必填字段：

```csv
job_title,jd
AI产品助理,"要求熟悉大模型API、Prompt Engineering，接受应届生。"
```

推荐字段：

```csv
job_title,company,city,salary,url,jd
AI产品助理,A公司,福州,6-8K,https://example.com,"要求熟悉大模型API、Prompt Engineering，接受应届生。"
```

批量分析会输出：

```text
排名、岗位名称、公司、地点、薪资、岗位类型、匹配分、优先级、岗位难度、应届适配、核心技能、已匹配技能、缺失技能、投递建议、岗位链接
```

## 测试

```bash
pytest tests/ -q
```

## 简历项目描述

```text
AI 求职助手系统 | Python / Streamlit / LLM API / Pandas
- 构建面向应届生的智能求职 Agent，支持岗位 JD 解析、简历匹配评分、简历定制改写、面试题生成和求职日报生成。
- 设计结构化 Prompt 模板，实现岗位技能抽取、难度评估、应届生适配判断和匹配度评分。
- 支持批量导入岗位数据，并根据用户简历自动筛选高匹配岗位，提高求职投递效率。
```
