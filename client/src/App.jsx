import { useRef, useState } from "react";
import { processText } from "./api.js";
import ResultCard, { CopyButton } from "./ResultCard.jsx";
import "./App.css";

const MAX_CHARS = 12000;

const MODES = [
  { value: "both", label: "Summary + points" },
  { value: "summarize", label: "Summary only" },
  { value: "explain", label: "Points only" },
];

const STYLES = [
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
  { value: "simple", label: "Simple" },
  { value: "professional", label: "Professional" },
];

const SAMPLE = `HTTP caching lets browsers and CDNs keep a copy of 
a response so the next request can skip the trip to the origin server. 
The server controls this with headers such as Cache-Control, ETag and 
Last-Modified. A cached copy is "fresh" until its max-age runs out; after 
that the client revalidates by sending the ETag back, and the server answers 
304 Not Modified if nothing changed. Done well, caching cuts latency and server
load dramatically. Done badly, users see stale pages, which is why many teams
fingerprint asset filenames and cache them for a year while keeping HTML 
short-lived.`;

function viewToText(view) {
  return [
    `Opinion: ${view.opinion}`,
    `Prediction: ${view.prediction}`,
    `Confidence: ${view.confidence}`,
    view.basis && `Basis: ${view.basis}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function Select({ label, value, onChange, options, disabled }) {
  return (
    <label className="select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Skeleton() {
  return (
    <div className="card skeleton" aria-busy="true" aria-label="Generating">
      <div className="sk-line w40" />
      <div className="sk-line" />
      <div className="sk-line" />
      <div className="sk-line w70" />
      <div className="sk-line w40 gap" />
      <div className="sk-line" />
      <div className="sk-line w70" />
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("both");
  const [style, setStyle] = useState("concise");
  const [includeView, setIncludeView] = useState(false);
  const [result, setResult] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  async function run(params, regenerate = false) {
    abortRef.current?.abort(); // cancel any request still in flight
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const data = await processText({ ...params, regenerate }, controller.signal);
      setResult(data);
      setLastRun(params);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  function handleSubmit(e) {
    e?.preventDefault();
    if (!text.trim() || loading) return;
    run({ text: text.trim(), mode, style, includeView });
  }

  function handleRegenerate() {
    if (lastRun && !loading) run(lastRun, true);
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e);
  }

  function clearAll() {
    abortRef.current?.abort();
    setText("");
    setResult(null);
    setLastRun(null);
    setError("");
    setLoading(false);
  }

  const copyAll = result
    ? [
        result.summary && `Summary\n${result.summary}`,
        result.points && `Key points\n${result.points.map((p) => `- ${p}`).join("\n")}`,
        result.view && `AI's view\n${viewToText(result.view)}`,
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";

  const overLimit = text.length > MAX_CHARS;
  const showEmpty = !loading && !result && !error;

  return (
    <div className="page">
      <nav className="nav">
        <span className="icon" aria-hidden="true" />
        <span className="brand">Insights:</span>
      </nav>

      <header className="hero">
        <h1>Paste text. Get the point.</h1>
        <p>A summary, a point-by-point explanation, and an honest second opinion.</p>
      </header>

      <form className="composer" onSubmit={handleSubmit}>
        <label htmlFor="source" className="sr-only">
          Your text
        </label>
        <textarea
          id="source"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste an article, email, notes or documentation…"
          rows={7}
        />

        <div className="composer-bar">
          <div className="controls">
            <Select label="Task" value={mode} onChange={setMode} options={MODES} disabled={loading} />
            <Select label="Style" value={style} onChange={setStyle} options={STYLES} disabled={loading} />
            <label className="toggle">
              <input
                type="checkbox"
                checked={includeView}
                onChange={(e) => setIncludeView(e.target.checked)}
                disabled={loading}
              />
              <span>AI's view</span>
            </label>
          </div>

          <div className="send">
            <span className={`counter ${overLimit ? "bad" : ""}`}>
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
            {(text || result) && (
              <button type="button" className="btn btn-ghost" onClick={clearAll}>
                Clear
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading || !text.trim() || overLimit}>
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Working…
                </>
              ) : (
                "Generate"
              )}
            </button>
          </div>
        </div>
      </form>

      <section className="results" aria-live="polite">
        {showEmpty && (
          <div className="empty">
            <p>
              Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to generate, or{" "}
              <button type="button" className="link" onClick={() => setText(SAMPLE)}>
                try an example
              </button>
              .
            </p>
          </div>
        )}

        {error && (
          <div className="error" role="alert">
            <strong>Something went wrong.</strong>
            <span>{error}</span>
            {lastRun && (
              <button type="button" className="btn btn-ghost" onClick={handleRegenerate}>
                Try again
              </button>
            )}
          </div>
        )}

        {loading && <Skeleton />}

        {!loading && result && (
          <>
            <div className="out-bar">
              <span className="meta">
                {result.meta.mode} · {result.meta.style}
              </span>
              <div className="out-actions">
                <CopyButton text={copyAll} label="Copy all" />
                <button type="button" className="btn btn-secondary" onClick={handleRegenerate}>
                  Regenerate
                </button>
              </div>
            </div>

            {result.summary && (
              <ResultCard title="Summary" copyText={result.summary}>
                <p className="summary">{result.summary}</p>
              </ResultCard>
            )}

            {result.points && (
              <ResultCard title="Key points" copyText={result.points.map((p) => `- ${p}`).join("\n")}>
                <ul className="points">
                  {result.points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </ResultCard>
            )}

            {result.view && (
              <ResultCard title="AI's view" copyText={viewToText(result.view)}>
                <div className="view">
                  <p className="view-label">Opinion</p>
                  <p className="summary">{result.view.opinion}</p>

                  <p className="view-label">
                    Prediction
                    <span className={`badge ${result.view.confidence}`}>{result.view.confidence} confidence</span>
                  </p>
                  <p className="summary">{result.view.prediction}</p>

                  {result.view.basis && <p className="basis">Based on: {result.view.basis}</p>}
                  <p className="disclaimer">
                    An AI opinion drawn only from your text. It is a guess, not a fact or a guarantee.
                  </p>
                </div>
              </ResultCard>
            )}
          </>
        )}
      </section>
    </div>
  );
}
