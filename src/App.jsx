import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [documentStats, setDocumentStats] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const history = localStorage.getItem("searchHistory");
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
    fetchDocumentStats();
  }, []);

  // Fetch document statistics
  const fetchDocumentStats = async () => {
    try {
      const response = await fetch("http://localhost:8000/document-stats");
      if (response.ok) {
        const stats = await response.json();
        setDocumentStats(stats);
      }
    } catch (err) {
      console.error("Failed to fetch document stats:", err);
    }
  };

  // Fetch search suggestions
  const fetchSuggestions = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/search-suggestions?q=${encodeURIComponent(
          searchQuery
        )}`
      );
      if (response.ok) {
        const suggestionsData = await response.json();
        setSuggestions(suggestionsData);
      }
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    }
  };

  // Handle query input change with suggestions
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
    setShowSuggestions(value.length > 1);
  };

  // Save search to history
  const saveToHistory = (searchQuery) => {
    if (!searchQuery.trim()) return;

    const newHistory = [
      searchQuery,
      ...searchHistory.filter((h) => h !== searchQuery),
    ].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setShowSuggestions(false);
    saveToHistory(query);

    try {
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          top_k: 5,
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError("Search failed. Make sure the backend is running.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const response = await fetch("http://localhost:8000/upload-document", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Document uploaded successfully! ID: ${result.document_id}`);
        setUploadFile(null);
        fetchDocumentStats(); // Refresh stats
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      alert("Upload failed. Make sure the backend is running.");
    }
  };

  const indexSampleDocs = async () => {
    const sampleDocs = [
      {
        id: "1",
        content:
          "Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that work and react like humans. AI systems can perform tasks such as learning, reasoning, problem-solving, perception, and language understanding.",
      },
      {
        id: "2",
        content:
          "Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. It uses algorithms to analyze data, identify patterns, and make predictions or decisions.",
      },
      {
        id: "3",
        content:
          "Natural Language Processing (NLP) is a field of AI that focuses on the interaction between computers and human language. It enables machines to read, understand, and derive meaning from human language in a valuable way.",
      },
      {
        id: "4",
        content:
          "Deep Learning is a machine learning technique inspired by the human brain's neural networks. It uses artificial neural networks with multiple layers to model and understand complex patterns in data.",
      },
      {
        id: "5",
        content:
          "Computer Vision is an AI field that trains computers to interpret and understand visual information from the world. It enables machines to identify objects, faces, text, and scenes in images and videos.",
      },
    ];

    try {
      const response = await fetch("http://localhost:8000/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sampleDocs),
      });

      if (response.ok) {
        alert("Sample documents indexed successfully!");
        fetchDocumentStats();
      }
    } catch (err) {
      alert("Failed to index documents. Make sure the backend is running.");
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🔍 AI-Powered Search Engine</h1>
        <p>Search with semantic understanding powered by DeepSeek AI</p>
        {documentStats && (
          <div className="stats">
            📊 {documentStats.total_documents} documents indexed
          </div>
        )}
      </header>

      <main className="main">
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <div className="input-container">
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => setShowSuggestions(query.length > 1)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                  placeholder="Enter your search query..."
                  className="search-input"
                  disabled={loading}
                />

                {/* Search Suggestions */}
                {showSuggestions &&
                  (suggestions.length > 0 || searchHistory.length > 0) && (
                    <div className="suggestions-dropdown">
                      {suggestions.length > 0 && (
                        <div className="suggestions-section">
                          <div className="suggestions-header">
                            💡 Suggestions
                          </div>
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="suggestion-item"
                              onClick={() => {
                                setQuery(suggestion.query);
                                setShowSuggestions(false);
                              }}
                            >
                              {suggestion.query}
                            </div>
                          ))}
                        </div>
                      )}

                      {searchHistory.length > 0 && (
                        <div className="suggestions-section">
                          <div className="suggestions-header">
                            🕒 Recent Searches
                          </div>
                          {searchHistory
                            .slice(0, 5)
                            .map((historyItem, index) => (
                              <div
                                key={index}
                                className="suggestion-item history-item"
                                onClick={() => {
                                  setQuery(historyItem);
                                  setShowSuggestions(false);
                                }}
                              >
                                {historyItem}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
              </div>

              <button
                type="submit"
                className="search-button"
                disabled={loading || !query.trim()}
              >
                {loading ? "Searching..." : "🔍 Search"}
              </button>
            </div>
          </form>

          <div className="action-buttons">
            <button onClick={indexSampleDocs} className="index-button">
              📝 Index Sample Documents
            </button>

            <div className="upload-section">
              <input
                type="file"
                accept=".txt,.md"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="file-input"
              />
              <button
                onClick={handleFileUpload}
                disabled={!uploadFile}
                className="upload-button"
              >
                📤 Upload Document
              </button>
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {results.length > 0 && (
          <div className="results">
            <h2>Search Results ({results.length})</h2>
            {results.map((result, index) => (
              <div key={result.id} className="result-item">
                <div className="result-header">
                  <span className="result-rank">#{index + 1}</span>
                  <span className="result-score">
                    Relevance: {(1 - result.score).toFixed(3)}
                  </span>
                </div>
                <div className="result-summary">
                  <strong>🤖 AI Summary:</strong> {result.summary}
                </div>
                <div className="result-content">
                  <strong>📄 Content:</strong> {result.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
