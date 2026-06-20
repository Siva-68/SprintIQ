import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaUserPlus,
  FaTimes,
  FaEnvelope,
  FaTrash,
  FaCrown,
  FaPlus,
  FaEdit,
} from "react-icons/fa";
import "./ManageTeam.css";

// NOTE: later you will fetch this from backend using teamId

const API_BASE = import.meta.env.VITE_API_BASE;


export default function ManageTeam() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  console.log("✅ teamId from URL =", teamId);

  // ✅ backend team + members
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showAdd, setShowAdd] = useState(false);

  // form state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");
  const [commitsThisWeek, setCommitsThisWeek] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState([]);
  const [err, setErr] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [repoFullName, setRepoFullName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
const [taskTitle, setTaskTitle] = useState("");
const [taskDueDate, setTaskDueDate] = useState(""); // yyyy-mm-dd

  // edit state
  const [editingMember, setEditingMember] = useState(null);

  // ---- helpers ----
  const initials = (emailStr) => {
    const base = (emailStr || "U").split("@")[0] || "U";
    return base
      .split(/[._-]/)
      .filter(Boolean)
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const openAdd = () => {
    setErr("");
    setEmail("");
    setRole("Member");
     setGithubUsername("");
    setCommitsThisWeek("");
    setTaskInput("");
    setTasks([]);
    setEditingMember(null); // ✅ important
    setShowAdd(true);
  };

const fetchCommitsForMember = async (repoFullName, username) => {
  try {
    if (!repoFullName || !username) return 0;

   const res = await axios.get(`${API_BASE}/api/github/repo-commits`, {
  params: { repoFullName, username },
});


    return res.data.commitsThisWeek || 0;
  } catch {
    return 0;
  }
};

 const refreshCommits = async () => {
  try {
    setRefreshing(true);
    setErr("");

    const updated = await Promise.all(
      (members || []).map(async (m) => {
        const commits = await fetchCommitsForMember(team?.repoFullName, m.githubUsername);
        return { ...m, commitsThisWeek: commits };
      })
    );

    setMembers(updated);
  } catch (e) {
    setErr("Failed to refresh commits");
  } finally {
    setRefreshing(false);
  }
};


  useEffect(() => {
  const loadTeam = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      console.log("teamId param =", teamId);
console.log("token exists =", !!localStorage.getItem("token"));
     const res = await axios.get(
  `${API_BASE}/api/teams/${teamId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);


     if (res.data.success) {
  setTeam(res.data.team);

  const updatedMembers = await Promise.all(
    (res.data.team.members || []).map(async (m) => {
      const commits = await fetchCommitsForMember(m.githubUsername);
      return { ...m, commitsThisWeek: commits };
    })
  );

  setMembers(updatedMembers);
} else {
  setErr(res.data.message || "Team not found");
}
    } catch (e) {
      console.log("ERR status:", e.response?.status);
console.log("ERR data:", e.response?.data);
console.log("ERR message:", e.message);
console.log("Calling URL:", `${API_BASE}/api/teams/${teamId}`);
      setErr(e.response?.data?.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  loadTeam();
}, [teamId]);
  const openEdit = (member) => {
    setErr("");
    setEmail(member.email || "");
    setRole(member.role || "Member");
     setGithubUsername(member.githubUsername || "");
    setCommitsThisWeek(
      member.commitsThisWeek === undefined || member.commitsThisWeek === null
        ? ""
        : String(member.commitsThisWeek)
    );
    setTasks(Array.isArray(member.tasks) ? member.tasks : []);
    setTaskInput("");
    setEditingMember(member);
    setShowAdd(true);
  };

  const closeModal = () => {
    setShowAdd(false);
    setEditingMember(null);
  };

const addTaskChip = () => {
  const title = taskTitle.trim();
  if (!title) return;

  // prevent duplicates by title
  if (tasks.some((t) => (t.title || "").toLowerCase() === title.toLowerCase())) return;

  setTasks((prev) => [
    ...prev,
    {
      title,
      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      status: "PENDING",
    },
  ]);

  setTaskTitle("");
  setTaskDueDate("");
};


 const removeTaskChip = (index) => {
  setTasks((prev) => prev.filter((_, i) => i !== index));
};

const deleteMember = async (memberId) => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.delete(
      `${API_BASE}/api/teams/${teamId}/members/${memberId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      setTeam(res.data.team);
      setMembers(res.data.team.members || []);
    }
  } catch (e) {
    setErr(e.response?.data?.message || "Delete failed");
  }
};


const createOrUpdateMember = async () => {
  try {
    setErr("");

    if (!email.trim()) {
      setErr("Email is required");
      return;
    }
    if (!githubUsername.trim()) {
  setErr("GitHub Username is required");
  return;
}

    const token = localStorage.getItem("token");

    // payload that backend expects
    const payload = {
      email: email.trim(),
      role,
      tasks,
      githubUsername: githubUsername.trim(),
     
    };

    let res;

    if (editingMember) {
      // ✅ EDIT MEMBER (Mongo member id is _id)
      res = await axios.put(
        `${API_BASE}/api/teams/${teamId}/members/${editingMember._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      // ✅ ADD MEMBER
      res = await axios.post(`${API_BASE}/api/teams/${teamId}/members`,
         payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }


    if (res.data.success) {
      // ✅ always trust backend latest data
      setTeam(res.data.team);
      setMembers(res.data.team.members || []);
      closeModal();
    } else {
      setErr(res.data.message || "Operation failed");
    }
  } catch (e) {
    setErr(e.response?.data?.message || "Operation failed");
  }
};

if (loading) {
  return <div style={{ padding: 30 }}>Loading team...</div>;
}

if (!team) {
  return (
    <div style={{ padding: 30 }}>
      <b>Team not found</b>
      <div style={{ marginTop: 10 }}>
        <button onClick={() => navigate("/teams")}>Back</button>
      </div>
      {err && <div style={{ marginTop: 10, color: "red" }}>{err}</div>}
    </div>
  );
}



  return (
    <div className="mg-root">
      {/* top bar */}
      <div className="mg-topbar">
  <button className="mg-back" onClick={() => navigate("/teams")}>
    <FaArrowLeft /> <span>Back to Dashboard</span>
  </button>

  <div className="mg-title-center">
    <h1>{team.name}</h1>
    <div className="mg-sub">{team.description}</div>
  </div>

  <div className="mg-actions">
  <button
    className="mg-secondary"
    onClick={refreshCommits}
    disabled={refreshing}
    title="Refresh commits"
    type="button"
  >
    {refreshing ? "Refreshing..." : "Refresh Commits"}
  </button>

  <button className="mg-primary" onClick={openAdd} type="button">
    <FaUserPlus /> Add Member
  </button>

  <button className="mg-close" onClick={() => navigate("/teams")} type="button">
    Close
  </button>
</div>
</div>

      <div className="mg-wrap">
        <div className="mg-card">
          <div className="mg-card-head">
            <div className="mg-card-title">Team Members</div>
            <span className="mg-pill">{members.length} members</span>
          </div>

          <div className="mg-list">
            {members.map((m) => (
              <div className="mg-row" key={m._id}>
                <div className="mg-left">
                  <div className="mg-avatar">{initials(m.email)}</div>

                  <div className="mg-info">
                    <div className="mg-name">
                      {m.email.split("@")[0]}
                      {m.role === "Leader" && (
                        <span className="mg-leader">
                          <FaCrown /> Leader
                        </span>
                      )}
                    </div>

                    <div className="mg-email">
                      <FaEnvelope /> {m.email}
                    </div>

                   
                    <div className="mg-meta">
                     <span className="mg-meta-item">
  Tasks:{" "}
  <span className="mg-tasks">
    {m.tasks?.length ? (
      <>
        {m.tasks.slice(0, 2).map((t, idx) => (
          <span className="mg-chip" key={`${t._id || t.title}-${idx}`}>
            {t.title}
            {t.dueDate && (
              <small style={{ marginLeft: 8, opacity: 0.7 }}>
                ({new Date(t.dueDate).toLocaleDateString()})
              </small>
            )}
          </span>
        ))}

        {m.tasks.length > 2 && (
          <span className="mg-more">+{m.tasks.length - 2} more</span>
        )}
      </>
    ) : (
      <span className="mg-none">No tasks</span>
    )}
  </span>
</span>



                      <span className="mg-meta-item">
                        Commits this week: <b>{Number(m.commitsThisWeek || 0)}</b>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mg-right">
                  <button
                    className="mg-icon"
                    title="Edit"
                    onClick={() => openEdit(m)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="mg-icon danger"
                    title="Delete"
                    onClick={() => deleteMember(m._id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {showAdd && (
        <div className="mg-overlay" onClick={closeModal}>
          <div className="mg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mg-modal-head">
              <div>
                <h2>{editingMember ? "Edit Team Member" : "Add Team Member"}</h2>
                <p>
                  {editingMember
                    ? "Update member details"
                    : "Invite a member and assign role + tasks"}
                </p>
              </div>

              <button className="mg-x" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <div className="mg-modal-body">
              <label>Email ID</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., sarah@example.com"
              />

              <label>GitHub Username</label>
<input
  value={githubUsername}
  onChange={(e) => setGithubUsername(e.target.value)}
  placeholder="e.g., torvalds"
/>

              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Leader">Leader</option>
                <option value="Member">Member</option>
              </select>

            <label>Member Tasks</label>
<div className="mg-task-input">
  <input
    value={taskTitle}
    onChange={(e) => setTaskTitle(e.target.value)}
    placeholder="Task title (e.g., UI Design)"
  />

  <input
    type="date"
    value={taskDueDate}
    onChange={(e) => setTaskDueDate(e.target.value)}
    title="Deadline"
  />

  <button type="button" className="mg-addchip" onClick={addTaskChip}>
    <FaPlus />
  </button>
</div>


              {tasks.length > 0 && (
                <div className="mg-chipbox">
                 {tasks.map((t, idx) => (
  <span className="mg-chip removable" key={`${t.title}-${idx}`}>
    {t.title}
    {t.dueDate && (
      <small style={{ marginLeft: 8, opacity: 0.7 }}>
        ({new Date(t.dueDate).toLocaleDateString()})
      </small>
    )}
    <button onClick={() => removeTaskChip(idx)} type="button">×</button>
  </span>
))}

                </div>
              )}

             

              {err && <div className="mg-error">{err}</div>}
            </div>

            <div className="mg-modal-actions">
              <button className="mg-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button className="mg-primary" onClick={createOrUpdateMember}>
                {editingMember ? "Update Member" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}