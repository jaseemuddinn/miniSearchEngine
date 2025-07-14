import { useState } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

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
      </header>

      <main className="main">
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your search query..."
                className="search-input"
                disabled={loading}
              />
              <button
                type="submit"
                className="search-button"
                disabled={loading || !query.trim()}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          <button onClick={indexSampleDocs} className="index-button">
            Index Sample Documents
          </button>
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
                    Score: {(1 - result.score).toFixed(3)}
                  </span>
                </div>
                <div className="result-summary">
                  <strong>Summary:</strong> {result.summary}
                </div>
                <div className="result-content">
                  <strong>Content:</strong> {result.content}
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
