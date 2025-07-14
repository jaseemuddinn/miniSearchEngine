from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import httpx
import chromadb
from chromadb.config import Settings

# Set up DeepSeek API key
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"

# Set up ChromaDB client
chroma_client = chromadb.Client(Settings(persist_directory="./chroma_db"))
collection = chroma_client.get_or_create_collection("documents")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Document(BaseModel):
    id: str
    content: str

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

class SearchResult(BaseModel):
    id: str
    content: str
    score: float
    summary: str

async def get_embedding(text: str):
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="DEEPSEEK_API_KEY not set")
    
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "input": text,
        "model": "deepseek-embed"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DEEPSEEK_BASE_URL}/embeddings",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            return result["data"][0]["embedding"]
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=500, detail=f"DeepSeek API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding error: {str(e)}")

@app.post("/index")
async def index_documents(docs: List[Document]):
    for doc in docs:
        embedding = await get_embedding(doc.content)
        collection.add(
            ids=[doc.id],
            embeddings=[embedding],
            documents=[doc.content]
        )
    return {"status": "indexed", "count": len(docs)}

@app.post("/search", response_model=List[SearchResult])
async def search(request: SearchRequest):
    query_embedding = await get_embedding(request.query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=request.top_k
    )
    search_results = []
    for i, doc_id in enumerate(results["ids"][0]):
        content = results["documents"][0][i]
        score = results["distances"][0][i]
        # Generate summary
        summary = await generate_summary(content, request.query)
        search_results.append(SearchResult(id=doc_id, content=content, score=score, summary=summary))
    return search_results

async def generate_summary(content: str, query: str) -> str:
    if not DEEPSEEK_API_KEY:
        return "Summary unavailable (API key not set)"
    
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "user", 
                "content": f"Summarize the following content in the context of the query: '{query}'.\nContent: {content}"
            }
        ],
        "max_tokens": 60,
        "temperature": 0.3
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DEEPSEEK_BASE_URL}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"Summary unavailable: {str(e)}"
