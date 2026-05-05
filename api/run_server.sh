#!/bin/bash
# Start FastAPI backend with .env loaded
cd /home/n24ie/ai-job-agent
exec .venv/bin/python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000
