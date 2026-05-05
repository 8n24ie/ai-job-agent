#!/usr/bin/env python3
import subprocess, json

# Test upload endpoint
result = subprocess.run([
    "curl", "-s", "-X", "POST",
    "http://localhost:8000/api/upload/resume",
    "-F", "file=@/home/n24ie/ai-job-agent/data/resume.txt;type=text/plain"
], capture_output=True, text=True)

print("Test TXT upload:")
data = json.loads(result.stdout)
print(f"  chars: {data.get('chars')}")
print(f"  filename: {data.get('filename')}")
print(f"  error: {data.get('error')}")
print(f"  text preview: {data.get('resume_text', '')[:80]}...")
