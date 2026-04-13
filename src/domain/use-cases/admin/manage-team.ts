"use server";

import { auth } from "@/lib/auth";
import { getUserModel } from "@/data/models/user.model";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Only admins can perform this action");
  }
  return session as { user: NonNullable<typeof session.user> & { id: string } };
}

export async function getTeamMembers() {
  await checkAdmin();
  const UserModel = await getUserModel();
  const users = await UserModel.find({}).sort({ createdAt: -1 }).lean();
  
  // Sanitize the user data before returning to client components
  return users.map((user) => ({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt?.toISOString(),
  }));
}

export async function createTeamMember(data: { name: string; email: string; role: "admin" | "user"; password?: string }) {
  await checkAdmin();
  const UserModel = await getUserModel();

  const existingUser = await UserModel.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Set default password if none provided
  const rawPassword = data.password || "password123";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const newUser = await UserModel.create({
    name: data.name,
    email: data.email.toLowerCase(),
    role: data.role,
    password: hashedPassword,
  });

  revalidatePath("/admin/team");
  
  return {
    id: newUser._id.toString(),
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
}

export async function updateTeamMemberRole(userId: string, newRole: "admin" | "user") {
  const session = await checkAdmin();
  
  if (userId === session.user.id) {
    throw new Error("You cannot change your own role");
  }

  const UserModel = await getUserModel();
  const user = await UserModel.findById(userId);
  
  if (!user) {
    throw new Error("User not found");
  }

  user.role = newRole;
  await user.save();

  revalidatePath("/admin/team");
  
  return { success: true };
}

export async function deleteTeamMember(userId: string) {
  const session = await checkAdmin();
  
  if (userId === session.user.id) {
    throw new Error("You cannot delete your own account");
  }

  const UserModel = await getUserModel();
  await UserModel.findByIdAndDelete(userId);

  revalidatePath("/admin/team");
  
  return { success: true };
}
