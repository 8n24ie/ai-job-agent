import os
from dotenv import load_dotenv
load_dotenv(".env")
print("JWT_SECRET:", os.getenv("JWT_SECRET"))
print("LLM_API_KEY:", os.getenv("LLM_API_KEY", "")[:10] + "...")
