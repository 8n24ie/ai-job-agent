# AI Job Agent Implementation Plan

> **For Hermes:** MVP implemented locally with strict TDD where practical.

**Goal:** Build a Streamlit-based AI job hunting assistant for fresh graduates.

**Architecture:** Core logic is split into small Python modules under `src/`. The UI calls these modules and can run in mock mode without an API key. LLM responses are requested as JSON when possible and fall back to deterministic local outputs.

**Tech Stack:** Python, Streamlit, Pandas, Requests, Pytest.

---

## MVP Tasks

1. Create project structure and tests.
2. Implement deterministic fallback analyzers.
3. Implement OpenAI-compatible LLM client.
4. Implement Streamlit UI.
5. Add sample data and README.
6. Run tests and syntax checks.
