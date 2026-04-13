"use server";

import { auth } from "@/lib/auth";
import { getUserModel } from "@/data/models/user.model";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

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

  const normalizedEmail = normalizeEmail(data.email);
  const normalizedName = data.name.trim();
  const rawPassword = data.password?.trim() || "password123";

  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const newUser = await UserModel.create({
    name: normalizedName,
    email: normalizedEmail,
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

export async function updateTeamMember(
  userId: string,
  data: {
    name: string;
    email: string;
    password?: string;
  },
) {
  await checkAdmin();
  const UserModel = await getUserModel();

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const normalizedEmail = normalizeEmail(data.email);
  const normalizedName = data.name.trim();

  const existingUser = await UserModel.findOne({
    email: normalizedEmail,
    _id: { $ne: userId },
  });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  user.name = normalizedName;
  user.email = normalizedEmail;

  const nextPassword = data.password?.trim();
  if (nextPassword) {
    user.password = await bcrypt.hash(nextPassword, 10);
  }

  await user.save();

  revalidatePath("/admin/team");

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
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
