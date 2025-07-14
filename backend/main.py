from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
import chromadb
from chromadb.config import Settings
import uuid
from datetime import datetime

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

class DocumentUpload(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = "general"

class SearchSuggestion(BaseModel):
    query: str
    count: int

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

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...), metadata: str = "{}"):
    """Upload and process a document file"""
    try:
        # Read file content
        content = await file.read()
        text_content = content.decode('utf-8')
        
        # Generate unique document ID
        doc_id = str(uuid.uuid4())
        
        # Create document metadata
        doc_metadata = {
            "filename": file.filename,
            "upload_time": datetime.now().isoformat(),
            "content_length": len(text_content)
        }
        
        # Get embedding and store
        embedding = await get_embedding(text_content)
        collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[text_content],
            metadatas=[doc_metadata]
        )
        
        return {
            "status": "uploaded",
            "document_id": doc_id,
            "filename": file.filename,
            "content_length": len(text_content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/search-suggestions")
async def get_search_suggestions(q: str = ""):
    """Get intelligent search suggestions based on indexed content"""
    if len(q) < 2:
        return []
    
    try:
        # Get similar documents
        query_embedding = await get_embedding(q)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=3
        )
        
        # Generate suggestions based on content
        suggestions = []
        for doc in results["documents"][0]:
            # Extract key phrases (simple implementation)
            words = doc.split()[:10]
            suggestion = " ".join(words)
            if suggestion not in [s["query"] for s in suggestions]:
                suggestions.append({
                    "query": suggestion,
                    "type": "content-based"
                })
        
        return suggestions[:5]
    except Exception as e:
        return []

@app.get("/document-stats")
async def get_document_stats():
    """Get statistics about indexed documents"""
    try:
        count = collection.count()
        return {
            "total_documents": count,
            "collection_name": collection.name,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        return {"total_documents": 0, "error": str(e)}
