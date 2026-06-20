import { useMemo, useState } from "react";
import Sidebar from "./layout/Sidebar";
import {
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  GitCommit,
  Menu,
  Plus,
  Users,
  ListChecks,
  BarChart3,
  Bell,
  X,
} from "lucide-react";

const Badge = ({ children, tone = "neutral" }) => {
  const map = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-slate-100 text-slate-700 border-slate-200",
    high: "bg-red-100 text-red-700 border-red-200",
    outline: "bg-white text-slate-700 border-slate-200",
  };
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-[2px] text-xs font-semibold rounded-full border",
        map[tone] || map.neutral,
      ].join(" ")}
    >
      {children}
    </span>
  );
};

const Card = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-2xl border bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const CardHeader = ({ title, subtitle, right }) => (
  <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {right}
  </div>
);

const Dot = ({ color = "green" }) => {
  const map = {
    green: "bg-green-500",
    orange: "bg-orange-500",
    blue: "bg-blue-500",
    cyan: "bg-cyan-500",
    yellow: "bg-yellow-500",
    gray: "bg-slate-400",
  };
  return <span className={`h-2.5 w-2.5 rounded-full ${map[color] || map.gray}`} />;
};

const Avatar = ({ name }) => {
  const initials = useMemo(() => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [name]);

  return (
    <div className="h-8 w-8 rounded-full bg-slate-100 border grid place-items-center text-xs font-semibold text-slate-700">
      {initials}
    </div>
  );
};

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const alerts = [
    {
      id: 1,
      title: "Low Activity Detected",
      desc: "backend-api has received no commits in the last 72 hours",
      severity: "medium",
      time: "1 hour ago",
      tone: "warning",
    },
    {
      id: 2,
      title: "Deadline Approaching",
      desc: 'Task "API Integration" is due in 2 days with 0% completion',
      severity: "high",
      time: "3 hours ago",
      tone: "error",
    },
    {
      id: 3,
      title: "Workload Imbalance",
      desc: "Sarah Chen has 8 tasks assigned, while 2 team members have 1 task each",
      severity: "medium",
      time: "5 hours ago",
      tone: "warning",
    },
  ];

  const repos = [
    { id: 1, full: "cs-team/project-alpha", lang: "TypeScript", last: "2 hours ago", status: "active" },
    { id: 2, full: "cs-team/mobile-app", lang: "React Native", last: "5 hours ago", status: "active" },
    { id: 3, full: "cs-team/backend-api", lang: "Python", last: "3 days ago", status: "warning" },
  ];

  const commits = [
    { id: 1, author: "Sarah Chen", repo: "project-alpha", msg: "Add user authentication flow", sha: "a3f9e2c", time: "2 hours ago" },
    { id: 2, author: "Mike Johnson", repo: "mobile-app", msg: "Fix navigation bug on mobile", sha: "b7c1d4e", time: "5 hours ago" },
    { id: 3, author: "Alex Rivera", repo: "backend-api", msg: "Update API documentation", sha: "c2e5f8a", time: "8 hours ago" },
    { id: 4, author: "Sarah Chen", repo: "project-alpha", msg: "Implement dark mode toggle", sha: "d9a3b6c", time: "1 day ago" },
  ];

  const contributors = [
    { name: "Sarah Chen", commits: 34 },
    { name: "Mike Johnson", commits: 28 },
    { name: "Alex Rivera", commits: 22 },
    { name: "Jamie Lee", commits: 18 },
  ];

  const langDot = (lang) => {
    const map = {
      TypeScript: "blue",
      JavaScript: "yellow",
      Python: "green",
      "React Native": "cyan",
    };
    return map[lang] || "gray";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 transition"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white">
              <GitCommit className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-900">SprintIQ</span>
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-xl">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="font-semibold text-slate-900">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar
              active="dashboard"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar active="dashboard" />

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="hidden lg:block bg-white border-b">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white shadow-sm">
                  <GitCommit className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">SprintIQ</p>
                  <p className="text-xs text-slate-500">Welcome back, John Doe</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3 py-2 rounded-xl border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
                  <Users className="h-4 w-4" /> Teams
                </button>
                <button className="px-3 py-2 rounded-xl border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Tasks
                </button>
                <button className="px-3 py-2 rounded-xl border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Analytics
                </button>
                <button className="px-3 py-2 rounded-xl border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Alerts
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
            {/* Alerts */}
            <div className="mb-6 lg:mb-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Active Alerts ({alerts.length})
              </div>

              <div className="space-y-3">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className={[
                      "rounded-2xl border px-4 py-3 flex items-start gap-3",
                      a.tone === "error"
                        ? "border-red-200 bg-white"
                        : "border-orange-200 bg-orange-50/60",
                    ].join(" ")}
                  >
                    <AlertTriangle
                      className={[
                        "h-4 w-4 mt-0.5",
                        a.tone === "error" ? "text-red-500" : "text-orange-600",
                      ].join(" ")}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {a.title}
                        </p>
                        <Badge tone={a.severity === "high" ? "high" : "medium"}>
                          {a.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{a.desc}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      {a.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left */}
              <div className="lg:col-span-2 space-y-6">
                {/* Repos */}
                <Card>
                  <CardHeader
                    title="Connected Repositories"
                    subtitle="GitHub repositories linked to SprintIQ"
                    right={
                      <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition inline-flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Repository
                      </button>
                    }
                  />
                  <div className="px-5 pb-5 space-y-3">
                    {repos.map((r) => (
                      <div
                        key={r.id}
                        className="group rounded-2xl border p-4 flex items-center justify-between hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={[
                              "mt-1 h-2.5 w-2.5 rounded-full",
                              r.status === "active" ? "bg-green-500" : "bg-orange-500",
                            ].join(" ")}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {r.full}
                              </p>
                              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition" />
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-2">
                                <Dot color={langDot(r.lang)} />
                                {r.lang}
                              </span>
                              <span className="text-slate-500">
                                Last commit: {r.last}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button className="px-3 py-2 rounded-xl border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent commits */}
                <Card>
                  <CardHeader
                    title="Recent Commits"
                    subtitle="Latest activity across all repositories"
                  />
                  <div className="px-5 pb-5">
                    <div className="max-h-[420px] overflow-auto pr-1">
                      <div className="space-y-4">
                        {commits.map((c) => (
                          <div
                            key={c.id}
                            className="pb-4 border-b last:border-0 flex gap-3"
                          >
                            <Avatar name={c.author} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {c.author}
                                </span>
                                <span className="text-xs text-slate-500">
                                  committed to
                                </span>
                                <Badge tone="outline">{c.repo}</Badge>
                              </div>
                              <p className="text-sm text-slate-700 mt-1">
                                {c.msg}
                              </p>
                              <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <GitCommit className="h-3 w-3" />
                                  {c.sha}
                                </span>
                                <span>{c.time}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right */}
              <div className="space-y-6">
                <Card>
                  <CardHeader title="Quick Stats" />
                  <div className="px-5 pb-5 space-y-3">
                    {[
                      ["Active Repositories", "3", "text-slate-900"],
                      ["Team Members", "8", "text-slate-900"],
                      ["Active Tasks", "24", "text-slate-900"],
                      ["Commits (7 days)", "127", "text-green-600"],
                    ].map(([label, value, color]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-slate-600">{label}</span>
                        <span className={`text-sm font-semibold ${color}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Top Contributors" subtitle="This week" />
                  <div className="px-5 pb-5 space-y-4">
                    {contributors.map((p, idx) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <Avatar name={p.name} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-500">{p.commits} commits</p>
                        </div>
                        <Badge tone="neutral">{idx + 1}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}