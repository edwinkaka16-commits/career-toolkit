import { useState, useEffect } from "react";

// ── ROUTING (hash-based, no extra packages needed) ──────────────────────────
function useRoute() {
  const [route, setRoute] = useState(window.location.hash || "#/");
  useEffect(() => {
    const handler = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return route;
}

function navigate(path) {
  window.location.hash = path;
  window.scrollTo(0, 0);
}

// ── TOOL DATA ────────────────────────────────────────────────────────────────
const TOOLS = {
  review: {
    id: "review",
    label: "Performance Review",
    tag: "TOOL 01",
    title: "Performance Review Writer",
    description: "Turn bullet points into a polished self-review",
    placeholder: `Paste your work highlights here. Be rough — bullet points are fine.\n\nExample:\n- Led migration of billing system, cut errors by 40%\n- Mentored 2 junior devs\n- Shipped 3 features ahead of schedule\n- Improved customer response time from 48h to 6h`,
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
    placeholder: `Paste the job description AND your background below.\n\n--- JOB DESCRIPTION ---\n[paste job description here]\n\n--- MY BACKGROUND ---\n[paste your resume summary, experience, or bullet points here]`,
    inputLabel: "Job Description + Your Background",
    buttonText: "Tailor My Application",
    accent: "#4AF0C8",
  },
};

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

// ── SHARED STYLES ────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  html { scroll-behavior: smooth; }
  body { background: #080808; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
`;

// ── TOOL COMPONENTS ──────────────────────────────────────────────────────────
function Spinner({ accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 0" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #2a2a2a", borderTopColor: accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#666", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Generating…</span>
    </div>
  );
}

function OutputBlock({ text, accent }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ marginTop: 24, background: "#111", border: `1px solid ${accent}33`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${accent}22`, background: "#0a0a0a" }}>
        <span style={{ color: accent, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>Output</span>
        <button onClick={handleCopy} style={{ background: copied ? accent : "transparent", color: copied ? "#000" : "#888", border: `1px solid ${copied ? accent : "#333"}`, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre style={{ padding: 20, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#e0e0e0", fontSize: 14, lineHeight: 1.75, fontFamily: "'DM Mono', monospace", maxHeight: 460, overflowY: "auto" }}>{text}</pre>
    </div>
  );
}

function Tool({ tool }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setOutput(""); setError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompts[tool.id], messages: [{ role: "user", content: input }] }),
      });
      const data = await res.json();
      setOutput(data.content?.map(b => b.text || "").join("\n") || "No output returned.");
    } catch { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ padding: "32px 0" }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", color: "#888", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>{tool.inputLabel}</label>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={tool.placeholder} rows={10}
          style={{ width: "100%", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ccc", fontSize: 14, lineHeight: 1.7, padding: 16, resize: "vertical", fontFamily: "'DM Mono', monospace", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = tool.accent}
          onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
      </div>
      <button onClick={run} disabled={loading || !input.trim()}
        style={{ background: input.trim() && !loading ? tool.accent : "#1a1a1a", color: input.trim() && !loading ? "#000" : "#444", border: "none", borderRadius: 8, padding: "13px 28px", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: input.trim() && !loading ? "pointer" : "not-allowed", transition: "all 0.2s", fontFamily: "'DM Mono', monospace" }}>
        {loading ? "Working…" : tool.buttonText}
      </button>
      {loading && <Spinner accent={tool.accent} />}
      {error && <p style={{ color: "#ff6b6b", marginTop: 16, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}
      {output && !loading && <OutputBlock text={output} accent={tool.accent} />}
    </div>
  );
}

// ── APP PAGE ─────────────────────────────────────────────────────────────────
function AppPage() {
  const [active, setActive] = useState("review");
  const tool = TOOLS[active];

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif", color: "#e0e0e0" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "20px 0", animation: "fadeIn 0.6s ease both" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => navigate("#/")}
              style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: 6, color: "#555", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", padding: "5px 12px", cursor: "pointer", transition: "all 0.2s", textTransform: "uppercase" }}
              onMouseEnter={e => { e.target.style.borderColor = "#C8F04A"; e.target.style.color = "#C8F04A"; }}
              onMouseLeave={e => { e.target.style.borderColor = "#2a2a2a"; e.target.style.color = "#555"; }}>
              ← Home
            </button>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#444", textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>AI-Powered</div>
              <h1 style={{ margin: 0, fontSize: "clamp(18px,3.5vw,26px)", fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.02em" }}>Career Toolkit</h1>
            </div>
          </div>
          <div style={{ background: "#C8F04A", color: "#000", fontSize: 10, fontFamily: "'DM Mono', monospace", fontWeight: 500, letterSpacing: "0.1em", padding: "5px 10px", borderRadius: 4, textTransform: "uppercase" }}>2 Tools</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", display: "flex" }}>
          {Object.values(TOOLS).map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "16px 24px 14px", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: active === t.id ? t.accent : "#555", borderBottom: active === t.id ? `2px solid ${t.accent}` : "2px solid transparent", transition: "all 0.2s", marginBottom: -1 }}>
              <span style={{ color: active === t.id ? t.accent + "88" : "#333", marginRight: 8, fontSize: 10 }}>{t.tag}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 64px", animation: "fadeIn 0.5s 0.1s ease both" }}>
        <div style={{ padding: "36px 0 0" }}>
          <h2 style={{ margin: "0 0 8px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px,3.5vw,26px)", fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.02em" }}>{tool.title}</h2>
          <p style={{ margin: 0, color: "#666", fontSize: 14, lineHeight: 1.6, fontFamily: "'DM Mono', monospace" }}>{tool.description}</p>
        </div>
        <div style={{ height: 1, background: `linear-gradient(to right, ${tool.accent}44, transparent)`, margin: "24px 0 0" }} />
        <Tool key={active} tool={tool} />
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#333", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>Career Toolkit v1.0</span>
          <span style={{ color: "#333", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>Powered by Claude AI</span>
        </div>
      </div>
    </div>
  );
}

// ── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => { e.target.style.opacity = 1; e.target.style.transform = "translateY(0)"; }, i * 80);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const revealStyle = { opacity: 0, transform: "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease" };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif", color: "#e0e0e0", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.1rem 3rem", background: "rgba(8,8,8,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1a1a1a" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#f0f0f0" }}>
          Career<span style={{ color: "#C8F04A" }}>Toolkit</span>
        </span>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {[["#tools", "Tools"], ["#how", "How It Works"], ["#pricing", "Pricing"]].map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize: "0.8rem", color: "#555", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#e0e0e0"} onMouseLeave={e => e.target.style.color = "#555"}>{label}</a>
          ))}
          <button onClick={() => navigate("#/app")}
            style={{ background: "#C8F04A", color: "#000", border: "none", padding: "0.55rem 1.3rem", borderRadius: 4, fontSize: "0.78rem", fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.target.style.background = "#d4f76a"; e.target.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.target.style.background = "#C8F04A"; e.target.style.transform = "none"; }}>
            Get Access →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "8rem 3rem 5rem", position: "relative", overflow: "hidden" }}>
        {/* BG text */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontFamily: "'Playfair Display', serif", fontSize: "clamp(6rem,18vw,18rem)", fontWeight: 900, color: "transparent", WebkitTextStroke: "1px rgba(200,240,74,0.06)", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none" }}>CAREER</div>

        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center", position: "relative", zIndex: 1 }}>
          {/* Left */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#111", border: "1px solid #2a2a2a", padding: "0.3rem 0.8rem", borderRadius: 2, fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "1.5rem", animation: "fadeUp 0.6s ease both" }}>
              <span style={{ width: 6, height: 6, background: "#C8F04A", borderRadius: "50%", display: "inline-block" }} />
              Powered by Claude AI
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem,4.5vw,3.8rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: "1.25rem", animation: "fadeUp 0.7s ease 0.1s both", color: "#f0f0f0" }}>
              Write career docs that <em style={{ fontStyle: "italic", color: "#C8F04A" }}>actually</em> land the job
            </h1>
            <p style={{ fontSize: "1rem", color: "#555", lineHeight: 1.75, maxWidth: 440, marginBottom: "2.5rem", fontWeight: 300, animation: "fadeUp 0.7s ease 0.2s both" }}>
              Stop staring at a blank page. Career Toolkit uses advanced AI to craft polished performance reviews and tailored job applications — in under 60 seconds.
            </p>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", animation: "fadeUp 0.7s ease 0.3s both" }}>
              <button onClick={() => navigate("#/app")}
                style={{ background: "#C8F04A", color: "#000", padding: "0.9rem 2rem", fontSize: "0.88rem", fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", border: "none", borderRadius: 4, cursor: "pointer", transition: "all 0.25s" }}
                onMouseEnter={e => { e.target.style.background = "#d4f76a"; e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 24px rgba(200,240,74,0.25)"; }}
                onMouseLeave={e => { e.target.style.background = "#C8F04A"; e.target.style.transform = "none"; e.target.style.boxShadow = "none"; }}>
                Try Free — No Signup →
              </button>
              <a href="#pricing" style={{ color: "#555", fontSize: "0.85rem", fontFamily: "'DM Mono', monospace", textDecoration: "none", letterSpacing: "0.04em", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "#e0e0e0"} onMouseLeave={e => e.target.style.color = "#555"}>
                See pricing ↓
              </a>
            </div>
            <div style={{ marginTop: "2.5rem", display: "flex", alignItems: "center", gap: "1.5rem", fontSize: "0.78rem", color: "#444", fontFamily: "'DM Mono', monospace", animation: "fadeUp 0.7s ease 0.4s both" }}>
              <span><span style={{ color: "#C8F04A" }}>2</span> tools in one</span>
              <span style={{ width: 1, height: 20, background: "#2a2a2a", display: "inline-block" }} />
              <span><span style={{ color: "#C8F04A" }}>Claude AI</span> quality</span>
              <span style={{ width: 1, height: 20, background: "#2a2a2a", display: "inline-block" }} />
              <span><span style={{ color: "#C8F04A" }}>$19</span> one-time</span>
            </div>
          </div>

          {/* Right — preview card */}
          <div style={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 8, padding: "1.75rem", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", animation: "fadeUp 0.8s ease 0.2s both", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: "2rem", right: "2rem", height: 2, background: "linear-gradient(90deg, #C8F04A, #4AF0C8, #C8F04A)", borderRadius: "0 0 2px 2px" }} />
            <div style={{ fontSize: "0.65rem", fontFamily: "'DM Mono', monospace", color: "#C8F04A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.6rem" }}>Performance Review Writer</div>
            <div style={{ fontSize: "0.75rem", fontFamily: "'DM Mono', monospace", color: "#444", marginBottom: "0.75rem" }}>Your input</div>
            <div style={{ background: "#080808", border: "1px solid #1a1a1a", borderRadius: 4, padding: "0.75rem", fontSize: "0.75rem", color: "#555", marginBottom: "0.75
