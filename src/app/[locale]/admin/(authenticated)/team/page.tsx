import { getTeamMembers } from "@/domain/use-cases/admin/manage-team";
import { TeamClient } from "./team-client";
import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";

export default async function TeamPage() {
  const session = await auth();

  // Make sure only admins can access this page
  if (session?.user && (session.user as any).role !== "admin") {
    redirect({ href: "/admin/dashboard", locale: "en" }); // or localized based on request
  }

  const teamMembers = await getTeamMembers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your admins and users.
        </p>
      </div>

      <TeamClient initialMembers={teamMembers as any} currentUserId={(session?.user as any).id} />
    </div>
  );
}