import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("Available models on your API key:")
print("-" * 40)
for model in client.models.list():
    if "generateContent" in str(model.supported_actions):
        print(f"  {model.name}")