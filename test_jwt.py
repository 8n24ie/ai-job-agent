import sys
sys.path.insert(0, ".")
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(".env"))

from api.auth import JWT_SECRET, decode_token, create_token
import os

print("ENV JWT_SECRET:", os.getenv("JWT_SECRET"))
print("auth.JWT_SECRET:", JWT_SECRET)

# Create a token
token = create_token(1, "wangpeng")
print("Token:", token[:50] + "...")

# Decode it
result = decode_token(token)
print("Decode result:", result)
