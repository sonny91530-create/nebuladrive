"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";

export default function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="code-block terminal group">
      {title && (
        <div className="terminal-header">
          <div className="terminal-dot bg-[#ff5f57]" />
          <div className="terminal-dot bg-[#febc2e]" />
          <div className="terminal-dot bg-[#28c840]" />
          <span className="ml-2 text-xs text-gray-400 font-mono">{title}</span>
          <button
            onClick={handleCopy}
            className="copy-btn ml-auto p-1.5 rounded-md hover:bg-white/10 transition-all"
            title="Copier"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      )}
      {!title && (
        <div className="flex items-center px-4 pt-2">
          <div className="terminal-dot bg-[#ff5f57]" />
          <div className="terminal-dot bg-[#febc2e]" />
          <div className="terminal-dot bg-[#28c840]" />
          <button
            onClick={handleCopy}
            className="copy-btn ml-auto p-1.5 rounded-md hover:bg-white/10 transition-all"
            title="Copier"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      )}
      <div className="terminal-body">
        <pre className="text-gray-300 whitespace-pre-wrap break-all">
          {code.split("\n").map((line, i) => {
            if (line.startsWith("#") || line.startsWith("//")) {
              return (
                <div key={i}>
                  <span className="text-gray-500">{line}</span>
                </div>
              );
            }
            if (line.startsWith("$") || line.startsWith("sudo")) {
              return (
                <div key={i}>
                  <span className="text-green-400">$</span>{" "}
                  <span className="text-white">{line.replace(/^\$\s*/, "")}</span>
                </div>
              );
            }
            return <div key={i}>{line || "\u00A0"}</div>;
          })}
        </pre>
      </div>
    </div>
  );
}
