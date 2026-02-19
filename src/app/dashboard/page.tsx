import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { AppSidebarShell } from "@/components/AppSidebarShell";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const isOrganizerLike = user.role === "ORGANIZER" || user.role === "ADMIN";
  const isVendorLike = user.role === "VENDOR" || user.role === "ADMIN";

  const organizerProfile = isOrganizerLike
    ? await prisma.organizerProfile.findUnique({ where: { userId: user.id } })
    : null;
  const vendorProfile = isVendorLike
    ? await prisma.vendorProfile.findUnique({ where: { userId: user.id } })
    : null;

  const [projects, openEventsCount, myAppsCount] = await Promise.all([
    organizerProfile
      ? prisma.event.findMany({
          where: { organizerId: organizerProfile.id },
          include: { _count: { select: { applications: true } } },
          orderBy: { updatedAt: "desc" },
          take: 6,
        })
      : user.role === "ADMIN"
        ? prisma.event.findMany({
            include: { _count: { select: { applications: true } } },
            orderBy: { updatedAt: "desc" },
            take: 6,
          })
        : [],
    prisma.event.count({ where: { status: "OPEN" } }),
    vendorProfile
      ? prisma.application.count({ where: { vendorId: vendorProfile.id } })
      : user.role === "ADMIN"
        ? prisma.application.count()
        : 0,
  ]);

  const quickActions = [
    ...(isOrganizerLike ? [{ label: "イベント管理", href: "/organizer/events" }, { label: "新規イベント作成", href: "/organizer/events/new" }] : []),
    { label: "写真設定", href: "/dashboard/media" },
    { label: "ガイド", href: "/guide" },
  ];

  return (
    <AppSidebarShell user={user}>
      <div className="mb-4 flex items-center justify-between">
        <button className="rounded-md px-3 py-1.5 text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          All Projects
        </button>
        <h1 className="text-xl font-semibold">Overview</h1>
        <button className="rounded-md px-3 py-1.5 text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          ...
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        <div className="flex-1 rounded-lg px-4 py-2 text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--muted)" }}>
          Search Projects...
        </div>
        <button className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          Grid
        </button>
        <button className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          List
        </button>
        <Link
          href={isOrganizerLike ? "/organizer/events/new" : "/events"}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Add New...
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Usage</h2>
          <div className="rounded-xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">Last 30 days</p>
              <button className="rounded-md px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: "var(--accent)" }}>
                Upgrade
              </button>
            </div>
            <UsageRow label="Open Events" value={`${openEventsCount} / 100`} />
            <UsageRow label="My Projects" value={`${projects.length} / 20`} />
            <UsageRow label="My Applications" value={`${myAppsCount} / 100`} />
            <UsageRow label="Image Storage" value="-- / --" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Projects</h2>
          {projects.length === 0 ? (
            <div className="rounded-xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
              <p className="font-medium">No projects yet</p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                新規イベント作成から最初のプロジェクトを作成してください。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/organizer/events/${project.id}/applications`}
                  className="block rounded-xl p-4 transition"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                >
                  <p className="text-lg font-semibold">{project.title}</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {project.location ?? "場所未設定"}
                  </p>
                  <p className="mt-2 text-sm">
                    申請 {project._count.applications} 件 · {new Date(project.updatedAt).toLocaleString("ja-JP")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 rounded-xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <h2 className="text-lg font-semibold">クイックアクション</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-lg px-3 py-2 text-sm hover:text-[var(--accent)]"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </AppSidebarShell>
  );
}

const UsageRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm" style={{ backgroundColor: "var(--background)" }}>
    <span>{label}</span>
    <span style={{ color: "var(--muted)" }}>{value}</span>
  </div>
);
