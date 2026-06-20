import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import "./RepoDetails.css";

// const API_BASE = "http://localhost:5000";
const API_BASE = import.meta.env.VITE_API_BASE;



export default function RepoDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem("token"), []);
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  useEffect(() => {
    const loadRepo = async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await axios.get(`${API_BASE}/api/repos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) setRepo(res.data.repo);
        else setErr(res.data.message || "Failed to load repository");
      } catch (e) {
        setErr(e.response?.data?.message || "Network error");
      } finally {
        setLoading(false);
      }
    };

    loadRepo();
  }, [id, token]);


  const refreshNow = async () => {
  try {
    setRefreshing(true);
    setErr("");

    const res = await axios.put(
      `${API_BASE}/api/repos/${id}/refresh`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) setRepo(res.data.repo);
    else setErr(res.data.message || "Refresh failed");
  } catch (e) {
    setErr(e.response?.data?.message || "Network error");
  } finally {
    setRefreshing(false);
  }
};

  return (
    <div className="rd-wrap">
      <div className="rd-top">
        <button className="rd-back" onClick={() => navigate("/home")}>
          <FaArrowLeft /> Back
        </button>
        <h2 className="rd-title">Repository Details</h2>

       <button
  className={`rd-refresh ${refreshing ? "loading" : ""}`}
  onClick={refreshNow}
  disabled={refreshing}
>
  {refreshing ? "Refreshing..." : "↻ Refresh Status"}
</button>


      </div>

      {loading && <div className="rd-card">Loading...</div>}
      {err && <div className="rd-card rd-err">{err}</div>}

      {repo && (
        <div className="rd-card">
          <h3 className="rd-name">
            {repo.owner}/{repo.repo}
          </h3>

          <div className="rd-grid">
            <div className="rd-item">
              <span>Status</span>
              <b className={`rd-pill ${repo.status}`}>{repo.status}</b>
            </div>

            <div className="rd-item">
              <span>Inactive Hours</span>
              <b>{repo.inactiveHours == null ? "No commits" : repo.inactiveHours}</b>
            </div>

            <div className="rd-item">
              <span>Last Commit Time</span>
              <b>{repo.lastCommitTime ? new Date(repo.lastCommitTime).toLocaleString() : "N/A"}</b>
            </div>

            <div className="rd-item">
              <span>Last Checked</span>
              <b>{repo.lastChecked ? new Date(repo.lastChecked).toLocaleString() : "N/A"}</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}