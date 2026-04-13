import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/presentation/components/shared/language-switcher";
import { ThemeToggle } from "@/presentation/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, LogOut, Settings, Image, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/lib/auth";
import { LiveNotifications } from "@/presentation/components/admin/live-notifications";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("nav");

  if (!session?.user) {
    redirect({ href: "/admin/login", locale });
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-e bg-card">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary">SCCT</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {session.user.name}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("dashboard")}
          </Link>
          <Link
            href="/admin/forms"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <FileText className="h-4 w-4" />
            {t("forms")}
          </Link>
          <Link
            href="/admin/media"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Image className="h-4 w-4" />
            Media Manager
          </Link>
          {(session.user as any).role === "admin" && (
            <Link
              href="/admin/team"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Users className="h-4 w-4" />
              Team
            </Link>
          )}
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t space-y-2">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex md:hidden items-center justify-between border-b px-4 py-3">
          <h1 className="text-lg font-bold text-primary">SCCT</h1>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6">
          <LiveNotifications />
          {children}
        </main>
      </div>
    </div>
  );
}
