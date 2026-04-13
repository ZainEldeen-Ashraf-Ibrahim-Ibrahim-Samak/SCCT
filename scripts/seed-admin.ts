import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/data/models/user.model";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  console.log("Connecting to database...");
  await connectToDatabase();

  const existingAdmin = await UserModel.findOne({ email: "admin@scct.local" });

  if (existingAdmin) {
    console.log("Admin user already exists. Skipping seed.");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("changeme", 12);

  await UserModel.create({
    email: "admin@scct.local",
    name: "Admin",
    password: hashedPassword,
    role: "admin",
    languagePreference: "en",
    themePreference: "light",
  });

  console.log("✅ Admin user created successfully!");
  console.log("   Email: admin@scct.local");
  console.log("   Password: changeme");
  console.log("   ⚠️  Change this password after first login!");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
