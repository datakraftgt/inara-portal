import { redirect } from "next/navigation";
import { getAdminServerSession } from "@/lib/session";

export const metadata = { title: "Admin — Inara Américas II" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminServerSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f7f4f0]">
      {children}
    </div>
  );
}
