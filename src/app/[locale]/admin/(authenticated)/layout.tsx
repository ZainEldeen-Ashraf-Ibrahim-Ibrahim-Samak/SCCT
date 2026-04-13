import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/presentation/components/shared/language-switcher";
import { ThemeToggle } from "@/presentation/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { LiveNotifications } from "@/presentation/components/admin/live-notifications";
import { SidebarNav } from "@/presentation/components/admin/sidebar-nav";
import { LogoutButton } from "@/presentation/components/admin/logout-button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const userRole = (session?.user as { role?: string } | undefined)?.role;

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

        <SidebarNav userRole={userRole} />

        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex md:hidden items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger
                nativeButton={false}
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Open menu" />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-primary">SCCT</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {session.user.name}
                  </p>
                </div>
                <SidebarNav userRole={userRole} />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-bold text-primary">SCCT</h1>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <LogoutButton showLabel={false} />
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
