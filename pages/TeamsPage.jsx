import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUsers, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import "./TeamsPage.css";
import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE;

export default function TeamsPage() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [err, setErr] = useState("");
  const [repoFullName, setRepoFullName] = useState("");

  // ✅ Load teams
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setTeams(res.data.teams || []);
        }
      } catch (e) {
        console.log("Failed to load teams", e);
      }
    };

    loadTeams();
  }, []);

  const openCreate = () => {
    setErr("");
    setTeamName("");
    setTeamDesc("");
    setRepoFullName("");
    setShowCreate(true);
  };

  // ✅ DELETE TEAM
  const handleDeleteTeam = async (teamId) => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this team?");
      if (!confirmDelete) return;

      const token = localStorage.getItem("token");

      await axios.delete(`${API_BASE}/api/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTeams((prev) => prev.filter((team) => team._id !== teamId));
    } catch (error) {
      console.log("Delete error:", error);
      alert("Failed to delete team");
    }
  };

//   // ✅ CREATE TEAM
//   const createTeam = async () => {
//     setErr("");

//     if (!teamName.trim()) {
//       setErr("Team name is required");
//       return;
//     }

//     if (!repoFullName.trim() || !repoFullName.includes("/")) {
//   setErr("Repo must be like owner/repo (example: myOrg/myRepo)");
//   return;
// }

//     try {
//       const token = localStorage.getItem("token");

//       const res = await axios.post(
//   "http://localhost:5000/api/teams",
//   {
//     name: teamName.trim(),
//     description: teamDesc.trim(),
//     repoFullName: repoFullName.trim(),
//   },
//   { headers: { Authorization: `Bearer ${token}` } }
// );

//       if (res.data.success) {
//         setTeams((prev) => [res.data.team, ...prev]);
//         setShowCreate(false);
//       } else {
//         setErr(res.data.message || "Failed to create team");
//       }
//     } catch (e) {
//           console.log("createTeam error status:", e.response?.status);
// console.log("createTeam error data:", e.response?.data);
//       setErr(e.response?.data?.message || "Failed to create team");
//     }
//   };


const createTeam = async () => {
  setErr("");

  if (!teamName.trim()) {
    setErr("Team name is required");
    return;
  }

  // ✅ allow full URL OR owner/repo
  let repo = repoFullName.trim();

  // convert full github URL -> owner/repo
  if (repo.startsWith("http")) {
    try {
      const u = new URL(repo);
      repo = u.pathname.replace(/^\/+/, "").split("/").slice(0, 2).join("/");
    } catch {}
  }

  if (!repo || !repo.includes("/") || repo.split("/").length < 2) {
    setErr("Repo must be like owner/repo (example: myOrg/myRepo)");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    // ✅ 1) verify repo exists / accessible
    await axios.get(`${API_BASE}/api/github/verify-repo`, {
      params: { repoFullName: repo },
      // headers not required unless your backend protects github routes
      // headers: { Authorization: `Bearer ${token}` },
    });

    // ✅ 2) create team only if repo verified
    const res = await axios.post(
      `${API_BASE}/api/teams`,
      {
        name: teamName.trim(),
        description: teamDesc.trim(),
        repoFullName: repo,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      setTeams((prev) => [res.data.team, ...prev]);
      setShowCreate(false);
    } else {
      setErr(res.data.message || "Failed to create team");
    }
  } catch (e) {
    // ✅ better error messages
    const status = e.response?.status;
    const msg = e.response?.data?.message || e.message;

    if (status === 404) setErr("Repo not found. Check owner/repo name.");
    else if (status === 403) setErr("Repo access denied / rate limit. Token needed.");
    else setErr(msg || "Failed to create team");

    console.log("createTeam error status:", status);
    console.log("createTeam error data:", e.response?.data);
  }
};

  const memberInitials = (email) => {
    const base = email.split("@")[0] || "U";
    return base
      .split(/[._-]/)
      .filter(Boolean)
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="tm-root">
      {/* Top bar */}
      <div className="tm-topbar">
        <button className="tm-back" onClick={() => navigate("/home")}>
          <FaArrowLeft /> <span>Back to Dashboard</span>
        </button>

        <div className="tm-title">
          <div className="tm-icon">
            <FaUsers />
          </div>
          <div>
            <h1>Team Management</h1>
            <p>Organize and manage your project teams</p>
          </div>
        </div>

        <button className="tm-create" onClick={openCreate}>
          <FaPlus /> Create Team
        </button>
      </div>

      {/* Cards grid */}
      <div className="tm-grid">
        {teams.map((t) => (
          <div key={t._id} className="tm-card">
            <div className="tm-card-head">
              <div>
                <div className="tm-card-title">{t.name}</div>
                <div className="tm-card-sub">{t.description}</div>
              </div>

              <span className="tm-pill">{(t.members || []).length} members</span>
            </div>

            {/* member avatars */}
            <div className="tm-avatars">
              {(t.members || []).slice(0, 6).map((m) => (
                <div className="tm-avatar" key={m._id} title={m.email}>
                  {memberInitials(m.email)}
                </div>
              ))}
            </div>

            {/* ✅ Proper aligned actions row */}
            <div className="tm-card-actions">
              <button className="tm-manage" onClick={() => navigate(`/teams/${t._id}`)}>
                Manage Team
              </button>

              <button
                className="tm-delete-icon"
                onClick={() => handleDeleteTeam(t._id)}
                title="Delete Team"
                aria-label="Delete Team"
                type="button"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create team modal */}
      {showCreate && (
        <div className="tm-overlay" onClick={() => setShowCreate(false)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tm-modal-head">
              <div>
                <h2>Create New Team</h2>
                <p>Set up a new team for your project</p>
              </div>
              <button className="tm-x" onClick={() => setShowCreate(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="tm-modal-body">
              <label>Team Name</label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Frontend Team"
              />

              <label>Description</label>
              <textarea
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                placeholder="Brief description of team responsibilities"
              />

                <label>GitHub Repo (owner/repo)</label>
  <input
    value={repoFullName}
    onChange={(e) => setRepoFullName(e.target.value)}
    placeholder="e.g., myOrg/myRepo OR https://github.com/myOrg/myRepo"
  />

              {err && <div className="tm-error">{err}</div>}
            </div>

            <div className="tm-modal-actions">
              <button className="tm-cancel" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="tm-primary" onClick={createTeam}>
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}