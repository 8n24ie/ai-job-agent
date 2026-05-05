from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")
import os
print("JWT_SECRET:", os.getenv("JWT_SECRET", "NOT SET"))
