import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="py-12">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="mt-4 rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
        <p className="mt-1 font-medium">{user.name ?? user.email}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Role: <span className="font-medium">{user.role}</span>
        </p>
      </div>
    </div>
  );
}
