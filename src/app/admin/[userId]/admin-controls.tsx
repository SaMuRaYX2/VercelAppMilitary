"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SECTIONS } from "@/lib/questions";
import { QuestionField, type Status } from "../../question-field";
import { adminUpdateAnswer, adminUpdateUser, deleteRespondent, setUserRole } from "../actions";

export function ProfileEditor({
  userId,
  name: initialName,
  email: initialEmail,
}: {
  userId: string;
  name: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty = name !== initialName || email !== initialEmail;

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await adminUpdateUser(userId, { name, email });
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: "Збережено" } : { ok: false, text: res.error });
  }

  return (
    <section className="mt-6 rounded-2xl border border-line bg-paper p-5">
      <h2 className="mb-4 font-display text-sm font-semibold text-muted">Редагувати дані</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Ім'я</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-line bg-canvas px-3.5 py-2.5 outline-none focus:border-olive"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-line bg-canvas px-3.5 py-2.5 outline-none focus:border-olive"
          />
        </label>
      </div>
      {email.trim().toLowerCase() !== initialEmail && (
        <p className="mt-3 text-sm text-muted">
          Після зміни пошти користувача буде розлогінено, і він має підтвердити нову адресу.
        </p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="rounded-xl bg-olive px-5 py-2.5 text-sm font-medium text-olive-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Збереження…" : "Зберегти зміни"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-olive" : "text-danger"}`}>{msg.text}</span>}
      </div>
    </section>
  );
}

export function RoleEditor({
  userId,
  role,
  emailVerified,
  isSelf,
}: {
  userId: string;
  role: string;
  emailVerified: boolean;
  isSelf: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = role === "admin";

  async function apply() {
    setBusy(true);
    setError(null);
    const res = await setUserRole(userId, isAdmin ? "user" : "admin");
    setBusy(false);
    setConfirming(false);
    if (!res.ok) setError(res.error);
  }

  let note: string | null = null;
  if (isSelf) note = "Це ваш акаунт. Власну роль змінити не можна.";
  else if (!isAdmin && !emailVerified) note = "Адміністратором можна зробити лише після підтвердження пошти.";

  return (
    <section className="mt-6 rounded-2xl border border-line bg-paper p-5">
      <h2 className="font-display text-sm font-semibold text-muted">Роль</h2>
      <p className="mt-1">{isAdmin ? "Адміністратор" : "Користувач"}</p>
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {!note &&
        (confirming ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">
              {isAdmin
                ? "Зняти роль адміністратора?"
                : "Зробити адміністратором? Він бачитиме всі анкети й зможе керувати користувачами."}
            </span>
            <button
              type="button"
              onClick={apply}
              disabled={busy}
              className="rounded-xl bg-olive px-4 py-2 text-sm font-medium text-olive-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Збереження…" : "Так"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="rounded-xl border border-line px-4 py-2 text-sm hover:bg-canvas"
            >
              Скасувати
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 rounded-xl border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-canvas"
          >
            {isAdmin ? "Зняти роль адміністратора" : "Зробити адміністратором"}
          </button>
        ))}
    </section>
  );
}

export function AnswersEditor({ userId, answers: initial }: { userId: string; answers: Record<string, string> }) {
  const [answers, setAnswers] = useState(initial);
  const [status, setStatus] = useState<Record<string, Status>>({});

  async function persist(id: string, value: string) {
    setStatus((s) => ({ ...s, [id]: "saving" }));
    try {
      const res = await adminUpdateAnswer(userId, id, value);
      setStatus((s) => ({ ...s, [id]: res.ok ? "saved" : "error" }));
    } catch {
      setStatus((s) => ({ ...s, [id]: "error" }));
    }
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      {SECTIONS.map((section) => (
        <section key={section.id}>
          <h2 className="mb-4 font-display text-base font-semibold">
            {section.id}. {section.title}
          </h2>
          <div className="flex flex-col gap-4">
            {section.questions.map((q) => (
              <QuestionField
                key={q.id}
                q={q}
                value={answers[q.id] ?? ""}
                status={status[q.id]}
                onChoice={(v) => {
                  const next = answers[q.id] === v ? "" : v;
                  setAnswers((a) => ({ ...a, [q.id]: next }));
                  persist(q.id, next);
                }}
                onText={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                onCommit={(v) => persist(q.id, v)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await deleteRespondent(userId);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }
    setBusy(false);
    setError(res.error);
  }

  return (
    <section className="mt-12 rounded-2xl border border-danger/40 bg-danger/5 p-5">
      <h2 className="font-display text-sm font-semibold text-danger">Видалити з бази</h2>
      <p className="mt-1 text-sm text-muted">
        Повне видалення {name}: акаунт, усі відповіді та сесії. Дію не можна скасувати.
      </p>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {confirming ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">Точно видалити?</span>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Видалення…" : "Так, видалити"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-xl border border-line px-4 py-2 text-sm hover:bg-paper"
          >
            Скасувати
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 rounded-xl border border-danger/50 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          Видалити користувача
        </button>
      )}
    </section>
  );
}
