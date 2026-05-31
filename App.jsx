import { useState } from "react";

const TOOLS = {
  review: {
    id: "review",
    label: "Performance Review",
    tag: "TOOL 01",
    title: "Performance Review Writer",
    description: "Turn bullet points into a polished self-review",
    placeholder: `Paste your work highlights here. Be rough — bullet points are fine.

Example:
- Led migration of billing system, cut errors by 40%
- Mentored 2 junior devs
- Shipped 3 features ahead of schedule
- Improved customer response time from 48h to 6h`,
    inputLabel: "Your Work Highlights",
    buttonText: "Write My Review",
    accent: "#C8F04A",
  },
  job: {
    id: "job",
    label: "Job Application",
    tag: "TOOL 02",
    title: "Job Application Tailorer",
    description: "Paste a job description + your background → cover letter & resume summary",
    placeholder: `Paste the job description AND your background below.

--- JOB DESCRIPTION ---
[paste job description here]

--- MY BACKGROUND ---
[paste your resume summary, experience, or bullet points here]`,
    inputLabel: "Job Description + Your Background",
    buttonText: "Tailor My Application",
    accent: "#4AF0C8",
  },
};

function Spinner() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: "16px", padding: "48px 0"
    }}>
      <div style={{
        width: "40px", height: "40px", border: "3px solid #2a2a2a",
        borderTopColor: "#C8F04A", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <span style={{ color: "#666", fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Generating…
      </span>
    </div>
  );
}

function OutputBlock({ text, accent }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{
      marginTop: "24px", background: "#111", border: `1px solid ${accent}33`,
      borderRadius: "12px", overflow: "hidden"
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px", borderBottom: `1px solid ${accent}22`,
        background: "#0a0a0a"
      }}>
        <span style={{ color: accent, fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
          Output
        </span>
        <button onClick={handleCopy} style={{
          background: copied ? accent : "transparent",
          color: copied ? "#000" : "#888",
          border: `1px solid ${copied ? accent : "#333"}`,
          borderRadius: "6px", padding: "4px 12px", fontSize: "11px",
          cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
          letterSpacing: "0.05em"
        }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre style={{
        padding: "20px", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
        color: "#e0e0e0", fontSize: "14px", lineHeight: "1.75",
        fontFamily: "'Courier New', monospace", maxHeight: "460px", overflowY: "auto"
      }}>
        {text}
      </pre>
    </div>
  );
}

function Tool({ tool }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const systemPrompts = {
    review: `You are an expert career coach and professional writer. Your job is to take raw bullet points about someone's work and transform them into a polished, compelling performance self-review.

Guidelines:
- Write in first person
- Use strong action verbs
- Quantify impact wherever possible (infer reasonable metrics if not provided)
- Structure: Opening summary (2-3 sentences), Key Achievements (3-5 bullets with context), Leadership & Collaboration, Growth & Development, Looking Ahead (1 paragraph)
- Tone: Confident but not arrogant. Professional but human.
- Length: 300-450 words
- Do NOT use hollow corporate buzzwords like "synergy", "leverage", "pivot"`,

    job: `You are an expert career coach and professional writer. Your job is to take a job description and someone's background and produce two things:

1. A tailored cover letter (250-300 words) that:
   - Opens with a hook, not "I am applying for..."
   - Connects their specific experience to the role's key needs
   - Ends with a confident call to action

2. A tailored resume summary (3-4 sentences) that:
   - Mirrors language from the job description
   - Leads with their strongest relevant credential
   - Is optimized for ATS keyword matching

Separate the two sections with a clear header. Be specific, not generic.`,
  };

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput("");
    setError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompts[tool.id],
          messages: [{ role: "user", content: input }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "No output returned.";
      setOutput(text);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "32px 0" }}>
      <div style={{ marginBottom: "20px" }}>
        <label style={{
          display: "block", color: "#888", fontSize: "11px",
          letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px"
        }}>
          {tool.inputLabel}
        </label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={tool.placeholder}
          rows={10}
          style={{
            width: "100%", background: "#0d0d0d", border: "1px solid #2a2a2a",
            borderRadius: "10px", color: "#ccc", fontSize: "14px",
            lineHeight: "1.7", padding: "16px", resize: "vertical",
            fontFamily: "'Courier New', monospace", outline: "none",
            transition: "border-color 0.2s", boxSizing: "border-box"
          }}
          onFocus={e => e.target.style.borderColor = tool.accent}
          onBlur={e => e.target.style.borderColor = "#2a2a2a"}
        />
      </div>
      <button
        onClick={run}
        disabled={loading || !input.trim()}
        style={{
          background: input.trim() && !loading ? tool.accent : "#1a1a1a",
          color: input.trim() && !loading ? "#000" : "#444",
          border: "none", borderRadius: "8px",
          padding: "13px 28px", fontSize: "13px", fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          cursor: input.trim() && !loading ? "pointer" : "not-allowed",
          transition: "all 0.2s", fontFamily: "inherit"
        }}
      >
        {loading ? "Working…" : tool.buttonText}
      </button>
      {loading && <Spinner />}
      {error && <p style={{ color: "#ff6b6b", marginTop: "16px", fontSize: "14px" }}>{error}</p>}
      {output && !loading && <OutputBlock text={output} accent={tool.accent} />}
    </div>
  );
}

export default function CareerToolkit() {
  const [active, setActive] = useState("review");
  const tool = TOOLS[active];

  return (
    <div style={{
      minHeight: "100vh", background: "#080808",
      fontFamily: "'Georgia', serif", color: "#e0e0e0"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1a1a1a", padding: "24px 0",
        animation: "fadeIn 0.6s ease both"
      }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: "11px", letterSpacing: "0.2em", color: "#555",
                textTransform: "uppercase", marginBottom: "6px",
                fontFamily: "'DM Mono', monospace"
              }}>
                AI-Powered
              </div>
              <h1 style={{
                margin: 0, fontSize: "clamp(22px, 4vw, 30px)",
                fontFamily: "'DM Serif Display', serif",
                fontWeight: 400, letterSpacing: "-0.02em", color: "#f0f0f0"
              }}>
                Career Toolkit
              </h1>
            </div>
            <div style={{
              background: "#C8F04A", color: "#000", fontSize: "10px",
              fontFamily: "'DM Mono', monospace", fontWeight: 500,
              letterSpacing: "0.1em", padding: "5px 10px", borderRadius: "4px",
              textTransform: "uppercase"
            }}>
              2 Tools
            </div>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{
        borderBottom: "1px solid #1a1a1a",
        animation: "fadeIn 0.6s 0.1s ease both", opacity: 0
      }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px", display: "flex", gap: "0" }}>
          {Object.values(TOOLS).map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "16px 24px 14px", fontFamily: "'DM Mono', monospace",
                fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase",
                color: active === t.id ? t.accent : "#555",
                borderBottom: active === t.id ? `2px solid ${t.accent}` : "2px solid transparent",
                transition: "all 0.2s", marginBottom: "-1px"
              }}
            >
              <span style={{ color: active === t.id ? t.accent + "88" : "#333", marginRight: "8px", fontSize: "10px" }}>
                {t.tag}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{
        maxWidth: "720px", margin: "0 auto", padding: "0 24px 64px",
        animation: "fadeIn 0.5s 0.15s ease both", opacity: 0
      }}>
        {/* Tool Header */}
        <div style={{ padding: "36px 0 0" }}>
          <h2 style={{
            margin: "0 0 8px", fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(20px, 3.5vw, 26px)", fontWeight: 400,
            color: "#f0f0f0", letterSpacing: "-0.02em"
          }}>
            {tool.title}
          </h2>
          <p style={{
            margin: 0, color: "#666", fontSize: "14px", lineHeight: "1.6",
            fontFamily: "'DM Mono', monospace"
          }}>
            {tool.description}
          </p>
        </div>

        {/* Divider */}
        <div style={{
          height: "1px", background: `linear-gradient(to right, ${tool.accent}44, transparent)`,
          margin: "24px 0 0"
        }} />

        <Tool key={active} tool={tool} />

        {/* Footer */}
        <div style={{
          marginTop: "48px", paddingTop: "24px", borderTop: "1px solid #1a1a1a",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ color: "#333", fontSize: "12px", fontFamily: "'DM Mono', monospace" }}>
            Career Toolkit v1.0
          </span>
          <span style={{ color: "#333", fontSize: "12px", fontFamily: "'DM Mono', monospace" }}>
            Powered by Claude AI
          </span>
        </div>
      </div>
    </div>
  );
}
