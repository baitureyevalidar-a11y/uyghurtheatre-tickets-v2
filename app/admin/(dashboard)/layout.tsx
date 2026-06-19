import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  LayoutDashboard,
  type LucideIcon,
  LogOut,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { UserRole } from "@prisma/client";
import { auth, signOut } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SUPER_ADMIN)
  ) {
    redirect("/admin/login");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col bg-brand-teal-dark text-white">
        <div className="border-b border-white/10 p-6">
          <div className="font-display text-xl leading-tight">
            Уйғур театры
          </div>
          <div className="mt-1 text-xs text-white/60">Админка</div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavLink href="/admin" icon={LayoutDashboard}>
            Дашборд
          </NavLink>
          <NavLink href="/admin/events" icon={Calendar}>
            События
          </NavLink>
          <NavLink href="/admin/bookings" icon={Ticket}>
            Брони
          </NavLink>
          {session.user.role === UserRole.SUPER_ADMIN && (
            <NavLink href="/admin/users" icon={Users}>
              Пользователи
            </NavLink>
          )}
          <NavLink href="/admin/settings" icon={Settings}>
            Настройки
          </NavLink>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="text-sm font-medium">{session.user.name}</div>
          <div className="mt-0.5 mb-3 text-xs text-white/60">
            {session.user.phone}
          </div>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Выйти
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-bg-elevated p-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span>{children}</span>
    </Link>
  );
}
