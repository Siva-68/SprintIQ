import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaGithub,
  FaUsers,
  FaTasks,
  FaChartLine,
  FaBell,
  FaExternalLinkAlt,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import "./Home.css";

// const API_BASE = "http://localhost:5000";
const API_BASE = import.meta.env.VITE_API_BASE;


export default function Home() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || { name: "John Doe" };
    } catch {
      return { name: "John Doe" };
    }
  }, []);


  // UI State
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(null);

const [teams, setTeams] = useState([]);
const [selectedTeamId, setSelectedTeamId] = useState(""); // "" = All repos
const [contributors, setContributors] = useState([]);
const [contributorsLoading, setContributorsLoading] = useState(false);

  // Data State
 const [repos, setRepos] = useState([]);
 const [commits, setCommits] = useState([]);
const [commitsLoading, setCommitsLoading] = useState(false);
const [refreshing, setRefreshing] = useState(false);
const [alerts, setAlerts] = useState([]);
const [alertsLoading, setAlertsLoading] = useState(false);


  // const alerts = useMemo(() => {
  //   // Simple auto-alerts based on repos
  //   const riskRepos = repos.filter((r) => r.status === "RISK");
  //   const list = [];

  //   if (riskRepos.length > 0) {
  //     list.push({
  //       id: "a1",
  //       type: "warning",
  //       title: "Low Activity Detected",
  //       desc: `${riskRepos[0].owner}/${riskRepos[0].repo} has no commits recently`,
  //       severity: "medium",
  //       time: "1 hour ago",
  //     });
  //   }

  //   list.push({
  //     id: "a2",
  //     type: "danger",
  //     title: "Deadline Approaching",
  //     desc: `Task "API Integration" is due in 2 days with 0% completion`,
  //     severity: "high",
  //     time: "3 hours ago",
  //   });

  //   list.push({
  //     id: "a3",
  //     type: "warning",
  //     title: "Workload Imbalance",
  //     desc: "Sarah Chen has 8 tasks assigned, while 2 team members have 1 task each",
  //     severity: "medium",
  //     time: "5 hours ago",
  //   });

  //   return list.slice(0, 3);
  // }, [repos]);

  // Protect route



  useEffect(() => {
  const t = localStorage.getItem("token");
  if (!t) navigate("/login");
}, [navigate]);


// Load repositories from backend
useEffect(() => {
  const loadRepos = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_BASE}/api/repos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setRepos(res.data.repos);
      }
    } catch (e) {
      console.log("Failed to load repos", e);
    }
  };

  loadRepos();
}, []);



useEffect(() => {
  const loadCommits = async () => {
    try {
      setCommitsLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_BASE}/api/repos/recent-commits`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) setCommits(res.data.commits || []);
    } catch (e) {
      console.log("Failed to load commits", e);
    } finally {
      setCommitsLoading(false);
    }
  };

  loadCommits();
}, []);






const loadContributors = async () => {
  try {
    setContributorsLoading(true);
    const token = localStorage.getItem("token");

    const res = await axios.get(`${API_BASE}/api/dashboard/top-contributors`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.success) {
      setContributors(res.data.contributors || []);
    } else {
      setContributors([]);
    }
  } catch (e) {
    console.log("Failed to load contributors", e);
    setContributors([]);
  } finally {
    setContributorsLoading(false);
  }
};

useEffect(() => {
  loadContributors();

  // optional auto refresh every 1 min (same as alerts)
  const interval = setInterval(loadContributors, 60000);
  return () => clearInterval(interval);
}, []);




useEffect(() => {
  const loadTopContributors = async () => {
    try {
      setContributorsLoading(true);
      const token = localStorage.getItem("token");

      const url =
        selectedTeamId
          ? `${API_BASE}/api/dashboard/top-contributors?teamId=${selectedTeamId}`
          : `${API_BASE}/api/dashboard/top-contributors`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) setContributors(res.data.contributors || []);
      else setContributors([]);
    } catch (e) {
      console.log("Failed to load contributors", e);
      setContributors([]);
    } finally {
      setContributorsLoading(false);
    }
  };

  loadTopContributors();
}, [selectedTeamId]);


const loadAlerts = async () => {
  try {
    setAlertsLoading(true);
    const token = localStorage.getItem("token");

    const res = await axios.get(`${API_BASE}/api/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.success) {
      setAlerts(res.data.alerts || []);
    } else {
      setAlerts([]);
    }
  } catch (e) {
    console.log("Failed to load alerts", e);
    setAlerts([]);
  } finally {
    setAlertsLoading(false);
  }
};





useEffect(() => {
  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_BASE}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.log("Failed to load stats", err);
    }
  };

  loadStats();
}, []);

useEffect(() => {
  const loadTeams = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setTeams(res.data.teams || []);
    } catch (e) {
      console.log("Failed to load teams", e);
    }
  };

  loadTeams();
}, []);


useEffect(() => {
  loadAlerts();
  const interval = setInterval(()=>{loadAlerts();
  },15000); // every 1 min
  return () => clearInterval(interval);
}, []);


  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openAddRepo = () => {
    setErr("");
    setMsg("");
    setOwner("");
    setRepo("");
    setShowAddRepo(true);
  };

  const addRepository = async () => {
    setErr("");
    setMsg("");

    if (!owner.trim() || !repo.trim()) {
      setErr("Owner and repo are required (example: cs-team / project-alpha)");
      return;
    }

    try {
      setAdding(true);
       const token = localStorage.getItem("token"); // ✅ get token here

    const res = await axios.post(
      `${API_BASE}/api/repos/add`,
      { owner: owner.trim(), repo: repo.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
      if (res.data.success) {
        setMsg("✅ Repository added successfully!");
        // Add to UI list instantly
        setRepos((prev) => [res.data.repository, ...prev]);
        setTimeout(() => {
          setShowAddRepo(false);
        }, 700);
      } else {
        setErr(res.data.message || "Failed to add repository");
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Network error while adding repo");
    } finally {
      setAdding(false);
    }
  };



  const handleDelete = async (id) => {
  try {
    const token = localStorage.getItem("token");

    await axios.delete(`${API_BASE}/api/repos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setRepos(prev => prev.filter(r => r._id !== id));
  } catch (err) {
    console.log("Delete failed", err);
  }
};




const refreshRepo = async (id) => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.put(`${API_BASE}/api/repos/${id}/refresh`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.success) {
      setRepos((prev) => prev.map((r) => (r._id === id ? res.data.repo : r)));
    }
  } catch (e) {
    console.log("Refresh failed", e);
  }
};

const refreshAll = async () => {
  try {
    setRefreshing(true);
    const token = localStorage.getItem("token");

    const res = await axios.put(`${API_BASE}/api/repos/refresh-all`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.success) {
      setRepos(res.data.repos);
      await loadAlerts(); // ✅ IMPORTANT: update alerts right away
    }
  } catch (e) {
    console.log("Refresh failed", e);
  } finally {
    setRefreshing(false);
  }
};


// ✅ Repo status based on inactive hours
const getRepoSeverity = (inactiveHours) => {
  const h = Number(inactiveHours || 0);

  // your main rules (same as alerts)
  if (h >= 72) return "CRITICAL";   // red
  if (h >= 24) return "WARNING";    // yellow
  return "ACTIVE";                  // normal
};





  return (
    <div className="dash-root">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="brand">
          <div className="brand-icon">
            <FaGithub />
          </div>
          <div>
            <div className="brand-title">SprintIQ</div>
            <div className="brand-sub">Welcome back, {user.name}</div>
          </div>
        </div>

        <nav className="nav">
          <button
            className={`nav-item ${activeMenu === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveMenu("dashboard")}
          >
            <FaChartLine /> Dashboard
          </button>

          <button
            className={`nav-item ${activeMenu === "teams" ? "active" : ""}`}
            onClick={() => {
              setActiveMenu("teams");
               navigate("/teams")  // add later
            }}
          >
            <FaUsers /> Teams
          </button>

          <button
            className={`nav-item ${activeMenu === "tasks" ? "active" : ""}`}
            onClick={() => {
              setActiveMenu("tasks");
              navigate("/analytics") // add later
            }}
          >
            <FaTasks /> Analytics
          </button>
          

          <button
            className={`nav-item ${activeMenu === "alerts" ? "active" : ""}`}
            onClick={() => {
              setActiveMenu("alerts");
              navigate("/alerts") // add later
            }}
          >
            <FaBell /> Alerts
          </button>

          <button className="logout" onClick={logout}>
          Logout
        </button>
        </nav>

       
      </aside>

      {/* Main */}
      <main className="dash-main">
        {/* Top Header */}
        {/* <header className="dash-topbar">
          <div className="topbar-left">
            <div className="topbar-title">Project Management Dashboard</div>
          </div>
          <div className="topbar-actions">
            <button className="chip-btn">
              <FaUsers /> Teams
            </button>
            <button className="chip-btn">
              <FaTasks /> Tasks
            </button>
            <button className="chip-btn">
              <FaChartLine /> Analytics
            </button>
            <button className="chip-btn">
              <FaBell /> Alerts
            </button>
          </div>
        </header> */}

        {/* Alerts Section */}
        <section className="section">
          <div className="section-title">
            <span className="dot-warn" />
            Active Alerts ({alerts.length})
          </div>

<div className="alert-list">
  {alertsLoading && <div className="alert-row warning">Loading alerts...</div>}

  {!alertsLoading && alerts.length === 0 && (
    <div className="alert-row warning">✅ No alerts right now</div>
  )}

  {!alertsLoading &&
  alerts.map((a) => {
    const liveHours = a.lastCommitTime
      ? Math.floor(
          (Date.now() - new Date(a.lastCommitTime)) / (1000 * 60 * 60)
        )
      : a.inactiveHours;

    const sev = (a.severity || "").toUpperCase();

    return (
      <div
        key={a._id}
        className={`alert-row ${
          sev === "CRITICAL"
            ? "danger"
            : sev === "WARNING"
            ? "warning"
            : "info"
        }`}
      >
        <div className="alert-left">
          <div
            className={`alert-dot ${
              sev === "CRITICAL"
                ? "danger"
                : sev === "WARNING"
                ? "warning"
                : "info"
            }`}
          />

          <div className="alert-title">
            Alert
            <span className={`badge ${sev === "CRITICAL" ? "bad" : ""}`}>
              {sev.toLowerCase()}
            </span>
          </div>

          <div className="alert-desc">
            <b>{a.repoFullName}</b>
            {a.githubUsername ? ` • ${a.githubUsername}` : " • Team Repo"}
            <br />
            ⏳ Inactive for {liveHours} hours
          </div>
        </div>

        <div className="alert-time">
          {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
        </div>
      </div>
    );
  })}

</div>


        </section>

        {/* Grid */}
        <section className="grid">
          {/* Left big cards */}
          <div className="col-left">
            {/* Connected Repositories */}
            <div className="card">
             <div className="card-head">
  <div>
    <div className="card-title">Connected Repositories</div>
    <div className="card-sub">GitHub repositories linked to SprintIQ</div>
  </div>

  <div className="repo-head-actions">
    <button
      className="outline-btn"
      onClick={refreshAll}
      disabled={refreshing}
      title="Refresh all repositories"
    >
      {refreshing ? "Refreshing..." : "Refresh All"}
    </button>

    <button className="primary-btn" onClick={openAddRepo}>
      <FaPlus /> Add Repository
    </button>
  </div>
</div>
             
<div className="repo-list">
  {repos.map((r) => {
    const sev = getRepoSeverity(r.inactiveHours);

    return (
      <div className="repo-row" key={r._id}>
        <div className="repo-left">
          <span
            className={`repo-status ${
              sev === "ACTIVE" ? "ok" : sev === "WARNING" ? "warn" : "danger"
            }`}
          />

          <div>
            <div className="repo-name">
              {r.owner}/{r.repo}
              <FaExternalLinkAlt className="ext" />
            </div>

            <div className="repo-meta">
              <span className="meta-pill">
                Last commit:{" "}
                {r.inactiveHours == null ? "No commits" : `${r.inactiveHours}h ago`}
              </span>

              {sev !== "ACTIVE" && (
                <span className={`status-pill ${sev.toLowerCase()}`}>Alert</span>
              )}
            </div>
          </div>
        </div>

        <div className="repo-actions">
          <button className="outline-btn" onClick={() => navigate(`/repo/${r._id}`)}>
            View Details
          </button>

          <button className="outline-btn" onClick={() => refreshRepo(r._id)}>
            Refresh
          </button>
        </div>
      </div>
    );
  })}
</div>

               
            {/* Recent Commits (UI placeholder like Figma) */}
            {/* Recent Commits (Dynamic) */}
<div className="card">
  <div className="card-head">
    <div>
      <div className="card-title">Recent Commits</div>
      <div className="card-sub">Latest activity across all repositories</div>
    </div>
  </div>

  <div className="commits">
    {commitsLoading && <div className="commit-row">Loading commits...</div>}

    {!commitsLoading && commits.length === 0 && (
      <div className="commit-row">No recent commits found</div>
    )}

    {commits.map((c, i) => (
      <div className="commit-row" key={i}>
        <div className="avatar">
          {(c.author || "U")
            .split(" ")
            .map((x) => x[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>

        <div className="commit-body">
          <div className="commit-top">
            <b>{c.author || "Unknown"}</b> <span>committed to</span>{" "}
            <span className="mini-badge">
              {c.owner ? `${c.owner}/` : ""}
              {c.repo}
            </span>
          </div>

          <div className="commit-msg">{c.message || "No message"}</div>

          <div className="commit-time">
            {c.date ? new Date(c.date).toLocaleString() : "N/A"}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
          </div>
          </div>

          {/* Right side */}
          <div className="col-right">
            <div className="card">
              <div className="card-head">
                <div className="card-title">Quick Stats</div>
              </div>

              <div className="stats">
               <div className="stats">
  <div className="stat-row">
    <span>Active Repositories</span>
    <b>{stats?.activeRepos ?? 0}</b>
  </div>

  <div className="stat-row">
    <span>Team Members</span>
    <b>{stats?.teamMembers ?? 0}</b>
  </div>

  {/* <div className="stat-row">
    <span>Active Tasks</span>
    <b>{stats?.activeTasks ?? 0}</b>
  </div> */}

  <div className="stat-row">
    <span>Commits (7 days)</span>
    <b className="green">{stats?.commits7Days ?? 0}</b>
  </div>
</div>

              </div>
            </div>

            {/* <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Top Contributors</div>
                  <div className="card-sub">This week</div>
                </div>
              </div>

             <div className="contributors">
  {contributorsLoading && (
    <div className="contrib-row">
      <div className="contrib-body">
        <div className="contrib-name">Loading...</div>
      </div>
    </div>
  )}

  {!contributorsLoading && contributors.length === 0 && (
    <div className="contrib-row">
      <div className="contrib-body">
        <div className="contrib-name">No contributors this week</div>
      </div>
    </div>
  )}

  {!contributorsLoading &&
    contributors.map((p, idx) => (
      <div className="contrib-row" key={`${p.name}-${idx}`}>
        <div className="avatar sm">
          {(p.name || "U")
            .split(" ")
            .map((x) => x[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>

        <div className="contrib-body">
          <div className="contrib-name">{p.name}</div>
          <div className="contrib-sub">{p.commits} commits</div>
        </div>

        <div className="rank">{idx + 1}</div>
      </div>
    ))}
</div>

            </div> */}
            <div className="card">
  <div className="card-head card-head-split">
    <div>
      <div className="card-title">Top Contributors</div>
      <div className="card-sub">This week</div>
    </div>

    <select
      className="team-filter"
      value={selectedTeamId}
      onChange={(e) => setSelectedTeamId(e.target.value)}
      title="Filter by team"
    >
      <option value="">All Repos</option>
      {teams.map((t) => (
        <option key={t._id} value={t._id}>
          {t.name}
        </option>
      ))}
    </select>
  </div>

  <div className="contributors">
    {contributorsLoading && (
      <div className="contrib-empty">Loading contributors...</div>
    )}

    {!contributorsLoading && contributors.length === 0 && (
      <div className="contrib-empty">No contributors found for this filter</div>
    )}

    {!contributorsLoading &&
      contributors.map((p, idx) => (
        <div className="contrib-row" key={p.name}>
          <div className="avatar sm">
            {String(p.name)
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="contrib-body">
            <div className="contrib-name">{p.name}</div>
            <div className="contrib-sub">{p.commits} commits</div>
          </div>

          <div className="rank">{idx + 1}</div>
        </div>
      ))}
  </div>
</div>

          </div>
        </section>
      </main>

      {/* Add Repo Modal */}
      {showAddRepo && (
        <div className="modal-overlay" onClick={() => !adding && setShowAddRepo(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
  <div>
    <div className="modal-title">Add Repository</div>
    <div className="modal-sub">Enter GitHub repo details</div>
  </div>

  {/* ✅ RIGHT SIDE BUTTONS */}
  <div className="modal-head-actions">
    <button
      type="button"
      className="outline-btn"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("🔥 Refresh clicked");
        refreshAll();
      }}
      disabled={adding}
    >
      Refresh All
    </button>

    <button
      type="button"
      className="icon-btn"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        !adding && setShowAddRepo(false);
      }}
      aria-label="Close"
    >
      <FaTimes />
    </button>
  </div>
</div>

            <div className="modal-body">
              <label>Owner / Organization</label>
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="ex: cs-team"
              />

              <label>Repository name</label>
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="ex: project-alpha"
              />

              {err && <div className="msg err">{err}</div>}
              {msg && <div className="msg ok">{msg}</div>}
            </div>

            <div className="modal-actions">
              <button className="outline-btn" onClick={() => !adding && setShowAddRepo(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={addRepository} disabled={adding}>
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}