import { useEffect, useRef, useState } from "react";

export function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts or denied permission.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={copy} aria-live="polite">
      {copied ? "Copied" : label}
    </button>
  );
}

export default function ResultCard({ title, copyText, children }) {
  return (
    <section className="card">
      <header className="card-head">
        <h2>{title}</h2>
        <CopyButton text={copyText} />
      </header>
      {children}
    </section>
  );
}
