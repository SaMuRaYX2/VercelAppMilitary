"use client";

import { useEffect, useMemo, useState } from "react";
import { SECTIONS, TOTAL } from "@/lib/questions";
import { QuestionField, type Status } from "../question-field";
import { saveAnswer, saveClientInfo, submitSurvey } from "./actions";

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
