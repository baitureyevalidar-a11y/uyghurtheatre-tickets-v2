import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Вход — Уйғур театры",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-muted px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="font-display text-2xl text-brand-teal-dark">
            Уйғур театры
          </div>
          <h2 className="mt-2 font-display text-xl font-medium text-text-primary">
            Вход в админку
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
