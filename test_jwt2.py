import sys
sys.path.insert(0, ".")
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(".env"))

from api.auth import JWT_SECRET, decode_token, create_token
import os

print("ENV JWT_SECRET:", repr(os.getenv("JWT_SECRET")))
print("auth.JWT_SECRET:", repr(JWT_SECRET))
print("Length:", len(JWT_SECRET))

# Create a token
token = create_token(1, "wangpeng")

# Decode it
result = decode_token(token)
print("Decode result:", result)

# Try manual decode
import jwt
try:
    result2 = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    print("Manual decode:", result2)
except Exception as e:
    print("Manual decode error:", e)
