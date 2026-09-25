"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_TEXT, SECTIONS, TOTAL, type Question } from "@/lib/questions";
import { saveAnswer, saveClientInfo, submitSurvey } from "./actions";

type Status = "saved" | "saving" | "error";

export function SurveyForm({
  initialAnswers,
  submitted,
}: {
  initialAnswers: Record<string, string>;
  submitted: boolean;
}) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [done, setDone] = useState(submitted);

  useEffect(() => {
    saveClientInfo({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      languages: navigator.languages?.join(","),
      screen: `${window.screen.width}x${window.screen.height}`,
      platform: (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform,
      touch: navigator.maxTouchPoints > 0,
    }).catch(() => {});
  }, []);

  async function persist(id: string, value: string) {
    setStatus((s) => ({ ...s, [id]: "saving" }));
    try {
      const res = await saveAnswer(id, value);
      setStatus((s) => ({ ...s, [id]: res.ok ? "saved" : "error" }));
    } catch {
      setStatus((s) => ({ ...s, [id]: "error" }));
    }
  }

  function setChoice(id: string, value: string) {
    const next = answers[id] === value ? "" : value;
    setAnswers((a) => ({ ...a, [id]: next }));
    persist(id, next);
  }

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v && v.trim()).length,
    [answers],
  );

  async function onSubmit() {
    const res = await submitSurvey();
    if (res.ok) {
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-6">
      {done && (
        <div className="mt-2 rounded-2xl border border-olive/40 bg-olive/10 px-5 py-4">
          <p className="font-medium text-olive">Анкету надіслано. Дякуємо!</p>
          <p className="mt-1 text-sm text-muted">Ви можете й далі змінювати відповіді — вони зберігаються автоматично.</p>
        </div>
      )}

      <div className="sticky top-14 z-10 -mx-4 mb-8 mt-6 bg-canvas/90 px-4 py-3 backdrop-blur">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Заповнено</span>
          <span className="tabular-nums text-muted">
            {answeredCount} / {TOTAL}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-olive transition-[width] duration-300"
            style={{ width: `${(answeredCount / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {SECTIONS.map((section) => (
          <section key={section.id}>
            <div className="mb-5 flex items-baseline gap-3">
              <span className="font-display text-sm text-muted tabular-nums">{section.id.padStart(2, "0")}</span>
              <h2 className="font-display text-lg font-semibold leading-tight">{section.title}</h2>
            </div>
            <div className="flex flex-col gap-6">
              {section.questions.map((q) => (
                <QuestionField
                  key={q.id}
                  q={q}
                  value={answers[q.id] ?? ""}
                  status={status[q.id]}
                  onChoice={(v) => setChoice(q.id, v)}
                  onText={(v) => {
                    setAnswers((a) => ({ ...a, [q.id]: v }));
                  }}
                  onCommit={(v) => persist(q.id, v)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14">
        <button
          type="button"
          onClick={onSubmit}
          className="w-full rounded-xl bg-olive px-6 py-4 font-medium text-olive-ink transition-opacity hover:opacity-90 sm:w-auto sm:px-10"
        >
          {done ? "Надіслати ще раз" : "Надіслати анкету"}
        </button>
        <p className="mt-3 text-sm text-muted">Надсилати можна навіть частково заповнену анкету.</p>
      </div>
    </div>
  );
}

function QuestionField({
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

function StatusDot({ status }: { status?: Status }) {
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
