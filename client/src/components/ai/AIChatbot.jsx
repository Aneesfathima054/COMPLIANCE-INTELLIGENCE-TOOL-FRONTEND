import React, { useState } from "react";
import { sendAIChatRequest } from "../../services/aiApi";

function AIChatbot() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me about compliance risk, pending tasks, status, or violations."
    }
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = question.trim();

    if (!trimmed || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setMessages((previous) => [...previous, { role: "user", text: trimmed }]);
    setQuestion("");

    try {
      const response = await sendAIChatRequest(trimmed);
      const answer = response?.data?.answer || "No answer generated.";

      setMessages((previous) => [...previous, { role: "assistant", text: answer }]);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to chat with AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">AI Compliance Chatbot</h5>
          <span className="badge text-bg-primary">Assistant</span>
        </div>

        <div
          className="border rounded p-3 bg-light mb-3"
          style={{ minHeight: 260, maxHeight: 320, overflowY: "auto" }}
        >
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`mb-2 d-flex ${
                message.role === "user" ? "justify-content-end" : "justify-content-start"
              }`}
            >
              <span
                className={`px-3 py-2 rounded-pill ${
                  message.role === "user"
                    ? "bg-primary text-white"
                    : "bg-white border text-dark"
                }`}
              >
                {message.text}
              </span>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-auto">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Which department has highest compliance risk?"
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AIChatbot;
