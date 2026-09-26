"use client";

import { useRef } from "react";
import { MAX_TEXT, type Question } from "@/lib/questions";

export type Status = "saved" | "saving" | "error";

export function QuestionField({
  q,
  value,
  status,
  onChoice,
  onText,
  onCommit,
}: {
  q: Question;
  value: string;
  status?: Status;
  onChoice: (v: string) => void;
  onText: (v: string) => void;
  onCommit: (v: string) => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  return (
    <fieldset className="rounded-2xl border border-line bg-paper p-4 sm:p-5">
      <legend className="flex items-start gap-2 px-1 text-[15px] leading-snug">
        <span>{q.text}</span>
        <StatusDot status={status} />
      </legend>

      {q.type === "choice" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {q.options.map((opt) => {
            const active = value === opt;
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={active}
                onClick={() => onChoice(opt)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  active ? "border-olive bg-olive text-olive-ink" : "border-line hover:border-olive"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          value={value}
          maxLength={MAX_TEXT}
          rows={q.short ? 1 : 3}
          onChange={(e) => {
            const v = e.target.value;
            onText(v);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => onCommit(v), 700);
          }}
          onBlur={(e) => {
            clearTimeout(timer.current);
            onCommit(e.target.value);
          }}
          className="mt-3 w-full resize-y rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-[15px] outline-none focus:border-olive"
        />
      )}
    </fieldset>
  );
}

export function StatusDot({ status }: { status?: Status }) {
  if (!status) return null;
  const map = {
    saving: { c: "bg-muted", t: "Збереження…" },
    saved: { c: "bg-olive", t: "Збережено" },
    error: { c: "bg-danger", t: "Помилка збереження" },
  }[status];
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5 pt-0.5 text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${map.c}`} aria-hidden />
      <span className="sr-only sm:not-sr-only">{map.t}</span>
    </span>
  );
}
