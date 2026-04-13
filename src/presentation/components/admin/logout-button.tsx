"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";

interface LogoutButtonProps {
  variant?: "ghost" | "outline" | "default";
  showLabel?: boolean;
}

export function LogoutButton({ variant = "ghost", showLabel = true }: LogoutButtonProps) {
  const t = useTranslations("nav");
  const locale = useLocale();

  const handleLogout = async () => {
    // Client-side signOut is typically more reliable for UI triggers
    await signOut({ 
      callbackUrl: `/${locale}/admin/login`,
      redirect: true 
    });
  };

  if (!showLabel) {
    return (
      <Button 
        variant={variant} 
        size="icon" 
        className="h-9 w-9 text-red-500" 
        onClick={handleLogout}
        title={t("logout")}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button 
      variant={variant} 
      size="sm" 
      className="w-full justify-start gap-2 text-red-500"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      {t("logout")}
    </Button>
  );
}
