"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "register";

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    const name = String(f.get("name") || email.split("@")[0]);

    const res =
      mode === "register"
        ? await authClient.signUp.email({ email, password, name, callbackURL: "/survey" })
        : await authClient.signIn.email({ email, password, callbackURL: "/survey" });

    setBusy(false);

    if (res.error) {
      // Unverified email: Better Auth resends the link (sendOnSignIn) — show the check-inbox screen.
      if (res.error.status === 403 || res.error.code === "EMAIL_NOT_VERIFIED") {
        setSentTo(email);
        return;
      }
      setError(res.error.message || "Не вдалося увійти. Перевірте дані.");
      return;
    }

    // Registration with verification returns no active session — ask them to confirm.
    if (mode === "register") {
      setSentTo(email);
      return;
    }
    router.push("/survey");
    router.refresh();
  }

  if (sentTo) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-paper p-6">
        <div className="mb-4 h-1.5 w-12 rounded-full bg-signal" aria-hidden />
        <h2 className="font-display text-lg font-semibold">Підтвердіть пошту</h2>
        <p className="mt-3 leading-relaxed text-muted">
          Ми надіслали лист із посиланням на <span className="text-ink">{sentTo}</span>. Відкрийте його й
          підтвердіть пошту, щоб продовжити. Перевірте також папку «Спам».
        </p>
        <button
          type="button"
          onClick={() => {
            setSentTo(null);
            setError(null);
          }}
          className="mt-6 text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          ← Назад
        </button>
      </div>
    );
  }

  async function google() {
    setError(null);
    setBusy(true);
    const res = await authClient.signIn.social({ provider: "google", callbackURL: "/survey" });
    if (res.error) {
      setBusy(false);
      setError(res.error.message || "Не вдалося увійти через Google.");
    }
  }

  return (
    <div className="mt-8">
      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-paper px-5 py-3.5 font-medium hover:bg-canvas disabled:opacity-60"
          >
            <GoogleIcon />
            Увійти через Google
          </button>
          <div className="my-6 flex items-center gap-4 text-sm text-muted">
            <span className="h-px flex-1 bg-line" />
            або
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {mode === "register" && (
          <Field name="name" label="Ім'я або позивний" type="text" autoComplete="name" required />
        )}
        <Field name="email" label="Email" type="email" autoComplete="email" required />
        <Field
          name="password"
          label="Пароль"
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          minLength={8}
          required
        />

        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-xl bg-olive px-5 py-3.5 font-medium text-olive-ink transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Зачекайте…" : mode === "register" ? "Зареєструватися" : "Увійти"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}
        className="mt-6 text-sm text-muted underline underline-offset-4 hover:text-ink"
      >
        {mode === "login" ? "Немає акаунту? Зареєструватися" : "Вже є акаунт? Увійти"}
      </button>
    </div>
  );
}

function Field({ name, label, ...rest }: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      <input
        name={name}
        {...rest}
        className="rounded-xl border border-line bg-paper px-4 py-3 text-ink outline-none focus:border-olive"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
