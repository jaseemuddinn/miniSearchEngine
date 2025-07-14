# Mini AI-Powered Search Engine

> ⚠️ **UNDER DEVELOPMENT** - This project is currently in early development stage and may contain bugs, incomplete features, and various errors. Use at your own risk.

This project is a minimal, full-stack AI-powered search engine. It features:

- **Semantic Search** using DeepSeek embeddings and ChromaDB
- **Smart Query Processing** and AI-generated summaries
- **Modern Frontend** with React (Vite)
- **FastAPI Backend** for indexing and searching documents

## ⚠️ Current Status

This project is still under active development and may experience:

- Embedding model compatibility problems
- CORS and networking errors
- ChromaDB persistence issues
- DeepSeek API rate limiting
- Incomplete error handling
- UI/UX inconsistencies

## Project Structure

- `backend/` — FastAPI server, semantic search logic, and ChromaDB integration
- Frontend (root) — React app (Vite)

## Getting Started

### Backend

1. `cd backend`
2. Create and activate a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Set your DeepSeek API key:
   ```
   $env:DEEPSEEK_API_KEY = "your-key-here"
   ```
5. Start the server:
   ```
   uvicorn main:app --reload
   ```

### Frontend

1. In the project root:
   ```
   npm install
   npm run dev
   ```
2. Open the app in your browser (default: http://localhost:5173)

## Usage

- Use the UI to enter queries and view AI-powered search results and summaries.
- Index new documents via the backend `/index` endpoint.

## Known Issues & Troubleshooting

Common problems you might encounter:

- **"DEEPSEEK_API_KEY not set"** - Make sure to set your DeepSeek API key as an environment variable
- **CORS errors** - Ensure backend is running on port 8000 and frontend on port 5173
- **ChromaDB errors** - Delete the `chroma_db` folder and restart if persistence issues occur
- **Embedding API failures** - Check your DeepSeek API key validity and rate limits
- **Frontend connection errors** - Verify backend server is running before starting frontend

## Contributing

This project is in early development. If you encounter bugs or have suggestions, please feel free to contribute.
