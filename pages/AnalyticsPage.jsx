import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
} from "recharts";

import {
  FaArrowLeft,
  FaCrown,
  FaChartPie,
  FaTasks,
  FaBolt,
} from "react-icons/fa";

import "./AnalyticsPage.css";

// const API_BASE = "http://localhost:5000";
const API_BASE = import.meta.env.VITE_API_BASE;



export default function AnalyticsPage() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [members, setMembers] = useState([]);

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const [activeTab, setActiveTab] = useState("trends"); // trends | performance | distribution | tasks

  const BAR_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#06b6d4"];

  // ✅ load teams
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const res = await axios.get(`${API_BASE}/api/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          const list = res.data.teams || [];
          setTeams(list);

          if (list.length > 0) {
            setSelectedTeamId(list[0]._id);
            setSelectedTeam(list[0]);
          }
        }
      } catch {
        setErr("Failed to load teams");
      } finally {
        setLoadingTeams(false);
      }
    };

    loadTeams();
  }, [token]);

  // ✅ load analytics
  useEffect(() => {
    if (!selectedTeamId) return;

    const loadAnalytics = async () => {
      try {
        setErr("");
        setLoadingAnalytics(true);

        const res = await axios.get(`${API_BASE}/api/teams/${selectedTeamId}/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setAnalytics(res.data.analytics);
          setMembers(res.data.members || []);
        }
      } catch {
        setErr("Failed to load analytics");
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, [selectedTeamId, token]);




  const updateTaskStatus = async (memberId, taskId, status) => {
  try {
    const res = await axios.put(
      `${API_BASE}/api/teams/${selectedTeamId}/members/${memberId}/tasks/${taskId}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      setMembers(res.data.team.members || []);
    }
  } catch (e) {
    setErr(e.response?.data?.message || "Failed to update task status");
  }
};

  // ✅ refresh analytics
  const refreshAnalytics = async () => {
    if (!selectedTeamId) return;

    try {
      setErr("");
      setRefreshing(true);

      const res = await axios.post(
        `${API_BASE}/api/teams/${selectedTeamId}/refresh-analytics`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAnalytics(res.data.analytics);
        setMembers(res.data.members || []);
      } else {
        setErr(res.data.message || "Refresh failed");
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const onTeamChange = (id) => {
    setSelectedTeamId(id);
    setSelectedTeam(teams.find((t) => t._id === id) || null);
    setAnalytics(null);
    setMembers([]);
  };

  // ------------------ DATA (charts + cards) ------------------
  const chartData = useMemo(() => {
    return (members || []).map((m) => ({
      name: m.githubUsername,
      commits: Number(m.commits7d || 0),
    }));
  }, [members]);

  const totalCommits = analytics?.totalCommits7d || 0;
  const avgCommits = members?.length ? (totalCommits / members.length).toFixed(1) : "0.0";

  const topContributor = useMemo(() => {
    if (!members?.length) return null;
    return [...members].sort((a, b) => (b.commits7d || 0) - (a.commits7d || 0))[0];
  }, [members]);

  const workloadBars = useMemo(() => {
    const sum = members.reduce((s, m) => s + Number(m.commits7d || 0), 0) || 1;
    return members
      .map((m) => ({
        name: m.githubUsername,
        commits: Number(m.commits7d || 0),
        pct: Math.round((Number(m.commits7d || 0) / sum) * 100),
      }))
      .sort((a, b) => b.commits - a.commits);
  }, [members]);

const tasksByMember = useMemo(() => {
  const normalizeTask = (t) => {
    // if old tasks were strings, convert to object
    if (typeof t === "string") {
      return { _id: t, title: t, status: "PENDING", dueDate: null };
    }
    return {
      _id: t._id || `${t.title}-${t.dueDate || ""}`,
      title: t.title || "Untitled",
      status: t.status || "PENDING",
      dueDate: t.dueDate || null,
    };
  };

  return (members || []).map((m) => {
    const safeTasks = Array.isArray(m.tasks) ? m.tasks.map(normalizeTask) : [];
    return {
      memberId: m._id,
      name: m.githubUsername,
      tasks: safeTasks,
      taskCount: safeTasks.length,
    };
  });
}, [members]);


const taskStats = useMemo(() => {
  const now = new Date();

  let pending = 0;
  let inProgress = 0;
  let done = 0;
  let overdue = 0;
  let total = 0;

  (tasksByMember || []).forEach((m) => {
    (m.tasks || []).forEach((t) => {
      total++;

      const status = (t.status || "PENDING").toUpperCase();
      const due = t.dueDate ? new Date(t.dueDate) : null;

      if (status === "DONE") done++;
      else if (status === "IN_PROGRESS") inProgress++;
      else pending++;

      if (due && status !== "DONE" && due < now) overdue++;
    });
  });

  return { total, pending, inProgress, done, overdue };
}, [tasksByMember]);

const taskChartData = useMemo(() => {
  return [
    { name: "Pending", value: taskStats.pending },
    { name: "In Progress", value: taskStats.inProgress },
    { name: "Done", value: taskStats.done },
    { name: "Overdue", value: taskStats.overdue },
  ];
}, [taskStats]);



const totalTasks = useMemo(() => {
  return tasksByMember.reduce((s, x) => s + (x.taskCount || 0), 0);
}, [tasksByMember]);


const isOverdue = (t) => {
  if (!t?.dueDate) return false;
  const due = new Date(t.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today && (t.status || "PENDING") !== "DONE";
};

const taskStatusSummary = useMemo(() => {
  let pending = 0, inProgress = 0, done = 0, overdue = 0;

  tasksByMember.forEach((m) => {
    m.tasks.forEach((t) => {
      const st = (t.status || "PENDING").toUpperCase();
      if (isOverdue(t)) overdue++;

      if (st === "DONE") done++;
      else if (st === "IN_PROGRESS") inProgress++;
      else pending++;
    });
  });

  return { pending, inProgress, done, overdue };
}, [tasksByMember]);


const taskBarData = useMemo(() => {
  return tasksByMember.map((m) => {
    let pending = 0, inProgress = 0, done = 0, overdue = 0;

    m.tasks.forEach((t) => {
      const st = (t.status || "PENDING").toUpperCase();
      if (isOverdue(t)) overdue++;

      if (st === "DONE") done++;
      else if (st === "IN_PROGRESS") inProgress++;
      else pending++;
    });

    return {
      name: m.name,
      Pending: pending,
      "In Progress": inProgress,
      Done: done,
      Overdue: overdue,
    };
  });
}, [tasksByMember]);

const taskPieData = useMemo(() => ([
  { name: "Pending", value: taskStatusSummary.pending },
  { name: "In Progress", value: taskStatusSummary.inProgress },
  { name: "Done", value: taskStatusSummary.done },
  { name: "Overdue", value: taskStatusSummary.overdue },
]), [taskStatusSummary]);




  const taskAllocation = useMemo(() => {
    const denom = totalTasks || 1;
    return tasksByMember
      .map((x) => ({
        name: x.name,
        pct: Math.round((x.taskCount / denom) * 100),
        taskCount: x.taskCount,
        tasks: x.tasks,
      }))
      .sort((a, b) => b.taskCount - a.taskCount);
  }, [tasksByMember, totalTasks]);

  const initial2 = (username = "U") => username.slice(0, 2).toUpperCase();

  // ✅ Trend chart (fake day data based on total commits, just for UI style)
  // If you want real per-day commits, I will give backend endpoint next.
// ✅ Trend chart (REAL daily commits from backend)
const trendData = useMemo(() => {
  const arr = analytics?.dailyCommits7d || [];

  // convert to recharts-friendly shape
  return arr.map((d) => ({
    day: d.date,           // keep ISO date as x-axis key
    commits: Number(d.commits || 0),
  }));
}, [analytics]);


  const pieData = useMemo(() => {
    return (members || []).map((m) => ({
      name: m.githubUsername,
      value: Number(m.commits7d || 0),
    }));
  }, [members]);

  // -----------------------------------------------------------
  return (
    <div className="ap-root">
      {/* Top Header */}
      <div className="ap-top">
        <div className="ap-left">
          <button className="ap-back" onClick={() => navigate("/home")} type="button">
            <FaArrowLeft /> <span>Back to Dashboard</span>
          </button>

          <div className="ap-title">
            <h1>Analytics & Insights</h1>
            <p>Team health, charts, and AI-powered smart suggestions</p>
          </div>
        </div>

        <div className="ap-controls">
          <select value={selectedTeamId} onChange={(e) => onTeamChange(e.target.value)} disabled={loadingTeams}>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.repoFullName})
              </option>
            ))}
            {!teams.length && <option>No teams found</option>}
          </select>

          <button className="ap-refresh" onClick={refreshAnalytics} disabled={refreshing || !selectedTeamId}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && <div className="ap-error">{err}</div>}
      {loadingTeams && <div className="ap-loading">Loading teams...</div>}
      {loadingAnalytics && <div className="ap-loading">Loading analytics...</div>}

      {!loadingAnalytics && analytics && (
        <>
          {/* KPI Cards */}
          <div className="ap-kpiGrid">
            <div className="ap-kpiCard ap-kpiBlue">
              <div className="ap-kpiLabel">Total Commits (7 days)</div>
              <div className="ap-kpiValue">{analytics.totalCommits7d}</div>
              <div className="ap-kpiHint">Weekly velocity snapshot</div>
            </div>

            <div className="ap-kpiCard ap-kpiGrey">
              <div className="ap-kpiLabel">Active Contributors</div>
              <div className="ap-kpiValue">{analytics.activeMembersCount}</div>
              <div className="ap-kpiHint">Active in last 7 days</div>
            </div>

            <div className="ap-kpiCard ap-kpiPink">
              <div className="ap-kpiLabel">Health Status</div>
              <div className="ap-kpiValueRow">
                <span className={`ap-badge ap-${analytics.healthStatus}`}>{analytics.healthStatus}</span>
              </div>
              <div className="ap-kpiHint">Bus factor: {analytics.busFactorRisk}</div>
            </div>

            <div className="ap-kpiCard ap-kpiGrey">
              <div className="ap-kpiLabel">Avg Commits / Member</div>
              <div className="ap-kpiValue">{avgCommits}</div>
              <div className="ap-kpiHint">7-day contribution average</div>
            </div>
          </div>

          {/* Main Grid: Charts (left) + Suggestions (right) */}
          <div className="ap-mainGrid">
            {/* LEFT: Charts */}
            <div className="ap-panel">
              <div className="ap-panelHead">
                <div className="ap-panelTitle">
                  <FaBolt /> Charts
                </div>

                <div className="ap-tabs">
                  <button className={activeTab === "trends" ? "active" : ""} onClick={() => setActiveTab("trends")}>
                    Trends
                  </button>
                  <button className={activeTab === "performance" ? "active" : ""} onClick={() => setActiveTab("performance")}>
                    Performance
                  </button>
                  <button className={activeTab === "distribution" ? "active" : ""} onClick={() => setActiveTab("distribution")}>
                    Distribution
                  </button>
                  <button className={activeTab === "tasks" ? "active" : ""} onClick={() => setActiveTab("tasks")}>
                    Task Analytics
                  </button>
                </div>
              </div>

              <div className="ap-chartBox">
                {activeTab === "trends" && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
  dataKey="day"
  tickFormatter={(v) => v?.slice(5)} // shows MM-DD
/>

                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="commits" strokeWidth={3} stroke="#3b82f6" dot />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {activeTab === "performance" && (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-10} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="commits" radius={[10, 10, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {activeTab === "distribution" && (
                  <div className="ap-pieWrap">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Tooltip />
                        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>
                          {pieData.map((_, index) => (
                            <Cell key={`p-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="ap-pieLegend">
                      {pieData.map((x, i) => (
                        <div key={x.name} className="ap-legendRow">
                          <span className="ap-dot" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                          <span className="ap-legendName">{x.name}</span>
                          <span className="ap-legendVal">{x.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {activeTab === "tasks" && (
  <div className="ap-taskView">
    {/* KPIs */}



    {/* ✅ Task Status Chart */}
<div className="ap-taskChartRow">
  <div className="ap-taskSummaryGrid">
    <div className="ap-taskKpi">
      <div className="ap-taskLabel">Total</div>
      <div className="ap-taskValue">{taskStats.total}</div>
    </div>
    <div className="ap-taskKpi">
      <div className="ap-taskLabel">Pending</div>
      <div className="ap-taskValue">{taskStats.pending}</div>
    </div>
    <div className="ap-taskKpi">
      <div className="ap-taskLabel">In Progress</div>
      <div className="ap-taskValue">{taskStats.inProgress}</div>
    </div>
    <div className="ap-taskKpi">
      <div className="ap-taskLabel">Done</div>
      <div className="ap-taskValue">{taskStats.done}</div>
    </div>
    <div className="ap-taskKpi">
      <div className="ap-taskLabel">Overdue</div>
      <div className="ap-taskValue">{taskStats.overdue}</div>
    </div>
  </div>

  <div className="ap-taskChartBox">
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={taskChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
          {taskChartData.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

    <div className="ap-taskKpis">
      <div className="ap-taskKpi">
        <div className="ap-taskLabel">Total Tasks</div>
        <div className="ap-taskValue">{totalTasks}</div>
      </div>

      <div className="ap-taskKpi">
        <div className="ap-taskLabel">Members With Tasks</div>
        <div className="ap-taskValue">
          {
            tasksByMember.filter((m) => (m.tasks?.length || 0) > 0).length
          }
        </div>
      </div>

      <div className="ap-taskKpi">
        <div className="ap-taskLabel">Avg Tasks / Member</div>
        <div className="ap-taskValue">
          {members.length ? (totalTasks / members.length).toFixed(1) : "0.0"}
        </div>
      </div>
    </div>

    {/* Task List by Member */}
    <div className="ap-taskMembers">
      {tasksByMember.map((m) => (
        <div key={m.memberId} className="ap-taskMember">
          <div className="ap-taskMemberHead">
            <b>{m.name}</b>
            <span className="ap-taskCount">{m.tasks.length} tasks</span>
          </div>

          {m.tasks.length === 0 ? (
            <div className="ap-empty">No tasks assigned</div>
          ) : (
            m.tasks.map((t) => (
              <div key={t._id} className="ap-taskRow">
                <div className="ap-taskLeft">
                  <div className="ap-taskTitle">{t.title}</div>
                  <div className="ap-taskMeta">
                    Due:{" "}
                    {t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString()
                      : "—"}
                  </div>
                </div>

                <div className="ap-statusWrapper">
  <select
    className={`ap-taskStatus ap-status-${(t.status || "PENDING").toLowerCase()}`}
    value={t.status || "PENDING"}
    onChange={(e) =>
      updateTaskStatus(m.memberId, t._id, e.target.value)
    }
  >
    <option value="PENDING">Pending</option>
    <option value="IN_PROGRESS">In Progress</option>
    <option value="DONE">Done</option>
  </select>
</div>

              </div>
            ))
          )}
        </div>
      ))}
    </div>
  </div>
)}
</div>
</div>

            {/* RIGHT: Smart Suggestions */}
            <div className="ap-panel">
              <div className="ap-panelHead">
                <div className="ap-panelTitle">
                  <FaBolt /> AI Smart Suggestions
                </div>
              </div>

              <div className="ap-suggBox">
                {(analytics.suggestions || []).length ? (
                  (analytics.suggestions || []).slice(0, 3).map((s, i) => (
                    <div className="ap-suggCard" key={i}>
                      <div className="ap-suggIcon">
                        <FaBolt />
                      </div>
                      <div className="ap-suggText">
                        <div className="ap-suggTitle">Suggestion {i + 1}</div>
                        <div className="ap-suggDesc">{s}</div>
                      </div>
                      <div className="ap-suggTag">MED</div>
                    </div>
                  ))
                ) : (
                  <div className="ap-empty">No suggestions yet. Click Refresh.</div>
                )}

                <div className="ap-updatedLine">
                  Updated: {analytics.updatedAt ? new Date(analytics.updatedAt).toLocaleString() : "-"}
                </div>
              </div>

              {/* Bottom cards on right */}
              <div className="ap-rightBottom">
                {/* Top Contributor */}
                <div className="ap-miniCard">
                  <div className="ap-miniTitle">
                    <FaCrown /> Top Contributor
                  </div>

                  {topContributor ? (
                    <div className="ap-topRow">
                      <div className="ap-avatar">{initial2(topContributor.githubUsername)}</div>
                      <div className="ap-topInfo">
                        <div className="ap-topName">
                          {topContributor.githubUsername}
                          <span className="ap-roleBadge">
                            {topContributor.role === "Leader" ? "Leader" : "Member"}
                          </span>
                        </div>
                        <div className="ap-topMeta">
                          Commits (7d): <b>{topContributor.commits7d || 0}</b>
                        </div>
                        <div className="ap-topMeta ap-ellipsis">
                          Repo: <b>{selectedTeam?.repoFullName || "-"}</b>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="ap-empty">No contributor data</div>
                  )}
                </div>

                {/* Workload Split */}
                <div className="ap-miniCard">
                  <div className="ap-miniTitle">
                    <FaChartPie /> Workload Split
                  </div>

                  <div className="ap-splitList">
                    {workloadBars.slice(0, 4).map((w) => (
                      <div key={w.name} className="ap-splitRow">
                        <div className="ap-splitHead">
                          <span className="ap-splitName">{w.name}</span>
                          <span className="ap-splitPct">{w.pct}%</span>
                        </div>
                        <div className="ap-splitTrack">
                          <div className="ap-splitFill" style={{ width: `${w.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {workloadBars[0]?.pct >= 70 && (
                    <div className="ap-warningNote">
                      High concentration risk → distribute tasks to reduce bus factor.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
