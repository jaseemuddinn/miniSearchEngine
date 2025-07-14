# Mini AI-Powered Search Engine Backend

This backend uses FastAPI, DeepSeek API, and ChromaDB for semantic search.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate
   ```
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set your DeepSeek API key as an environment variable:
   ```
   $env:DEEPSEEK_API_KEY = "your-key-here"
   ```
4. Run the server:
   ```
   uvicorn main:app --reload
   ```

## Endpoints

- `/index` (POST): Add documents to the search index
- `/search` (POST): Search documents using semantic similarity

See `main.py` for implementation details.
