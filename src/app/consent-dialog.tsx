"use client";

import { useEffect, useRef } from "react";

// Rendered only for logged-out visitors (see layout), so it reappears on every
// visit until the person signs in.
export function ConsentDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const accepted = useRef(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function accept() {
    accepted.current = true;
    ref.current?.close();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="consent-title"
      onCancel={(e) => e.preventDefault()}
      onClose={() => !accepted.current && ref.current?.showModal()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-paper p-6 text-ink shadow-2xl sm:p-8"
    >
      <div className="mb-5 h-1.5 w-12 rounded-full bg-signal" aria-hidden />
      <h2
        id="consent-title"
        className="font-display text-xl font-semibold leading-tight sm:text-2xl"
      >
        Перед початком
      </h2>
      <p className="mt-4 leading-relaxed">
        Ваші відповіді є повністю конфеденційними. Дані не передаються третім
        особам і використовуються виключно для покращення умов служби анонімно.
      </p>
      <p className="mt-3 leading-relaxed text-muted">
        Для заповнення анкети потрібно увійти через Google або email для
        збереження відповідей все анонімно. Кожна відповідь зберігається одразу,
        тож можна перерватися і продовжити пізніше.
      </p>
      <button
        type="button"
        autoFocus
        onClick={accept}
        className="mt-7 w-full rounded-xl bg-olive px-5 py-3.5 font-medium text-olive-ink transition-opacity hover:opacity-90 sm:w-auto"
      >
        Зрозуміло
      </button>
    </dialog>
  );
}
