import { redirect } from "next/navigation";
import { googleEnabled } from "@/lib/auth";
import { getUser } from "@/lib/session";
import { SignInForm } from "./form";

export default async function SignInPage() {
  if (await getUser()) redirect("/survey");
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 h-1.5 w-12 rounded-full bg-signal" aria-hidden />
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">Вхід до анкети</h1>
      <p className="mt-3 text-muted">Увійдіть, щоб почати або продовжити заповнення.</p>
      <SignInForm googleEnabled={googleEnabled} />
    </main>
  );
}
