"use client";

import { useState } from "react";
import Link from "next/link";
import type { TrustPathNode } from "@/lib/trust";

// Path List is the primary/mobile view per the build plan; the canvas view
// is a secondary, simplified node-link rendering — not a full interactive
// force graph, just enough to see the chain spatially.
export default function TrustPath({ path }: { path: TrustPathNode[] }) {
  const [view, setView] = useState<"list" | "canvas">("list");

  return (
    <div>
      <div className="inline-flex rounded-full border border-[var(--color-neutral-border)] p-0.5 text-sm">
        <button
          onClick={() => setView("list")}
          className={
            view === "list"
              ? "rounded-full bg-[var(--color-primary)] px-3 py-1 text-white"
              : "rounded-full px-3 py-1 text-[var(--color-neutral)]"
          }
        >
          List
        </button>
        <button
          onClick={() => setView("canvas")}
          className={
            view === "canvas"
              ? "rounded-full bg-[var(--color-primary)] px-3 py-1 text-white"
              : "rounded-full px-3 py-1 text-[var(--color-neutral)]"
          }
        >
          Canvas
        </button>
      </div>

      {view === "list" ? (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-ink)]">
          {path.map((node, i) => (
            <span key={node.id} className="flex items-center gap-1.5">
              {i === 0 ? (
                <span className="font-medium">You</span>
              ) : (
                <Link href={`/profile/${node.id}`} className="font-medium text-[var(--color-primary-deep)] hover:underline">
                  {node.name}
                </Link>
              )}
              {i < path.length - 1 && <span className="text-[var(--color-neutral-light)]">→</span>}
            </span>
          ))}
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${Math.max(path.length * 120, 120)} 80`}
          className="mt-3 w-full max-w-md"
        >
          {path.slice(0, -1).map((_, i) => (
            <line
              key={i}
              x1={60 + i * 120}
              y1={40}
              x2={60 + (i + 1) * 120}
              y2={40}
              stroke="var(--color-neutral-border)"
              strokeWidth={2}
            />
          ))}
          {path.map((node, i) => (
            <g key={node.id}>
              <circle cx={60 + i * 120} cy={40} r={22} fill="var(--color-primary)" opacity={i === 0 ? 1 : 0.85} />
              <text
                x={60 + i * 120}
                y={70}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-ink)"
              >
                {i === 0 ? "You" : node.name}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
