"use client";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { redact } from "@/lib/redact";
export function JsonViewer({
  value,
  label = "Structured data",
}: {
  value: unknown;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(redact(value), null, 2);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard access is unavailable");
    }
  }
  return (
    <div className="json-viewer">
      <div className="json-toolbar">
        <span>
          {label}
          <small>JSON</small>
        </span>
        <button onClick={copy} aria-label={"Copy " + label}>
          {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre tabIndex={0}>{text}</pre>
    </div>
  );
}
