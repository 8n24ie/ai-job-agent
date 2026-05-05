#!/bin/bash
cd /home/n24ie/ai-job-agent
.venv/bin/python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 > /tmp/api_server.log 2>&1 &
echo "Server PID: $!"
sleep 3
curl -s http://localhost:8000/api/health
echo ""
echo "=== Server log ==="
cat /tmp/api_server.log
