"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, UserPlus, Loader2 } from "lucide-react";
import { createTeamMember, deleteTeamMember, updateTeamMemberRole } from "@/domain/use-cases/admin/manage-team";
import { useTranslations } from "next-intl";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt?: string;
};

export function TeamClient({ initialMembers, currentUserId }: { initialMembers: TeamMember[], currentUserId: string }) {
  const t = useTranslations("team");
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "user" as "admin" | "user", password: "" });
  const router = useRouter();

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const result = await createTeamMember(newMember);
      setMembers([result, ...members]);
      setIsCreateOpen(false);
      setNewMember({ name: "", email: "", role: "user", password: "" });
      toast.success(t("createSuccess"));
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("createError")));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    
    setIsDeleting(id);
    try {
      await deleteTeamMember(id);
      setMembers(members.filter(m => m.id !== id));
      toast.success(t("deleteSuccess"));
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("deleteError")));
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRoleChange = async (id: string, newRole: "admin" | "user") => {
    try {
      await updateTeamMemberRole(id, newRole);
      setMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));
      toast.success(t("roleUpdateSuccess"));
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("roleUpdateError")));
      // Revert select visually by re-fetching or forcing state refresh, though simplified here.
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("addUser")}
            </Button>
          } />
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>{t("addMember")}</DialogTitle>
                <DialogDescription>
                  {t("addMemberDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    required
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                    value={newMember.password}
                    onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("role")}</Label>
                  <Select
                    onValueChange={(val) => setNewMember({ ...newMember, role: (val as "admin" | "user") || "user" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t("user")}</SelectItem>
                      <SelectItem value="admin">{t("admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(val) => handleRoleChange(member.id, (val as "admin" | "user") || "user")}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t("user")}</SelectItem>
                      <SelectItem value="admin">{t("admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={member.id === currentUserId || isDeleting === member.id}
                    onClick={() => handleDelete(member.id)}
                  >
                    {isDeleting === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  {t("noMembers")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
