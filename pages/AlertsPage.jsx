import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaBell,
  FaExclamationTriangle,
  FaInfoCircle,
  FaClock,
  FaTasks,
  FaShieldAlt,
  FaProjectDiagram,
  FaTimes,
} from "react-icons/fa";
import "./AlertsPage.css";

// const API_BASE = "http://localhost:5000";
const API_BASE = import.meta.env.VITE_API_BASE;



const TYPE_META = {
  ALL: { label: "All", icon: <FaBell /> },
  INACTIVITY: { label: "Inactivity", icon: <FaClock /> },
  DEADLINE: { label: "Deadlines", icon: <FaTasks /> },
  WORKLOAD: { label: "Workload", icon: <FaProjectDiagram /> },
  QUALITY: { label: "Quality", icon: <FaShieldAlt /> },
  DEPENDENCY: { label: "Dependency", icon: <FaInfoCircle /> },
};

// --- helpers: normalize backend variations ---
const normalizeUpper = (v) => String(v || "").trim().toUpperCase();

const normalizeType = (raw) => {
  const t = normalizeUpper(raw);
  if (t === "DEADLINES") return "DEADLINE";
  if (t === "DUE" || t === "DUE_DATE") return "DEADLINE";
  if (t === "INACTIVE") return "INACTIVITY";
  if (t === "WORK_LOAD" || t === "WORK LOAD") return "WORKLOAD";
  if (t === "DEPENDENCIES") return "DEPENDENCY";
  return t || "INFO";
};

const normalizeAlert = (a) => {
  const type = normalizeType(a?.type || a?.alertType || a?.category);
  return {
    ...a,
    _id: a?._id || a?.id || `${type}-${a?.createdAt || a?.time || Math.random()}`,
    type,
    title: a?.title || a?.heading || type,
    message: a?.message || a?.description || a?.reason || a?.summary || "",
    createdAt: a?.createdAt || a?.time || a?.date || null,
    details: a?.details || a?.meta || a?.data || null,
    // keep notify fields if present
    notifiedCount: a?.notifiedCount ?? 0,
    lastNotifiedAt: a?.lastNotifiedAt ?? null,
  };
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [err, setErr] = useState("");

  const [alerts, setAlerts] = useState([]);

  // modal
  const [selectedAlert, setSelectedAlert] = useState(null);

  // ✅ Take Action loading
  const [actionLoadingId, setActionLoadingId] = useState("");

  // load teams
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        setErr("");

        const res = await axios.get(`${API_BASE}/api/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          const list = res.data.teams || [];
          setTeams(list);
          if (list.length) setSelectedTeamId(list[0]._id);
        } else {
          setErr(res.data?.message || "Failed to load teams");
        }
      } catch (e) {
        setErr(e.response?.data?.message || "Failed to load teams");
      } finally {
        setLoadingTeams(false);
      }
    };

    loadTeams();
  }, [token]);

  // load alerts
  const loadAlerts = async () => {
    if (!selectedTeamId) return;

    try {
      setErr("");
      setLoadingAlerts(true);

      const res = await axios.get(`${API_BASE}/api/alerts`, {
        params: { teamId: selectedTeamId },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const raw = res.data.alerts || [];
        const normalized = Array.isArray(raw) ? raw.map(normalizeAlert) : [];
        setAlerts(normalized);
      } else {
        setErr(res.data?.message || "Failed to load alerts");
        setAlerts([]);
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load alerts");
      setAlerts([]);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId]);

  // counts
  const counts = useMemo(() => {
    let critical = 0;
    let warning = 0;

    for (const a of alerts) {
      const s = normalizeUpper(a.severity);
      if (s === "CRITICAL") critical++;
      else if (s === "WARNING") warning++;
    }

    return { active: alerts.length, critical, warning };
  }, [alerts]);

  // filter list by tab
  const filteredAlerts = useMemo(() => {
    if (selectedType === "ALL") return alerts;
    return alerts.filter((a) => a.type === selectedType);
  }, [alerts, selectedType]);

  const severityPill = (sev = "") => {
    const s = normalizeUpper(sev);
    if (s === "CRITICAL") return "ap-sev ap-critical";
    if (s === "WARNING") return "ap-sev ap-warning";
    return "ap-sev ap-info";
  };

  const iconForSeverity = (sev = "") => {
    const s = normalizeUpper(sev);
    if (s === "CRITICAL") return <FaExclamationTriangle />;
    if (s === "WARNING") return <FaInfoCircle />;
    return <FaBell />;
  };

  const openDetails = (a) => setSelectedAlert(a);
  const closeDetails = () => setSelectedAlert(null);

  // ✅ FIXED: Take Action uses the clicked alert directly (no async state issue)
  const handleTakeAction = async (alertObj) => {
    if (!alertObj?._id) return;

    try {
      setActionLoadingId(alertObj._id);

      await axios.post(
        `${API_BASE}/api/alerts/${alertObj._id}/notify`,
        { message: "Please complete your pending work as soon as possible." },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Update UI immediately (optional but makes it feel working)
      setAlerts((prev) =>
        prev.map((x) =>
          x._id === alertObj._id
            ? {
                ...x,
                notifiedCount: (x.notifiedCount || 0) + 1,
                lastNotifiedAt: new Date().toISOString(),
              }
            : x
        )
      );

      alert("📧 Email sent successfully ✅");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send email");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="al-root">
      {/* top */}
      <div className="al-top">
        <button className="al-back" onClick={() => navigate("/home")} type="button">
          <FaArrowLeft /> Back to Dashboard
        </button>

        <div className="al-title">
          <h1>Alert Monitoring</h1>
          <p>Detailed alerts by member, tasks, and activity signals</p>
        </div>

        <div className="al-controls">
          <select
            value={selectedTeamId}
            disabled={loadingTeams}
            onChange={(e) => {
              setSelectedTeamId(e.target.value);
              setSelectedType("ALL");
            }}
          >
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.repoFullName})
              </option>
            ))}
            {!teams.length && <option>No teams</option>}
          </select>

          <button className="al-refresh" onClick={loadAlerts} disabled={loadingAlerts || !selectedTeamId}>
            {loadingAlerts ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && <div className="al-error">{err}</div>}

      {/* KPI cards */}
      <div className="al-kpis">
        <div className="al-kpiCard">
          <div className="al-kpiRow">
            <span>Active Alerts</span>
            <FaBell />
          </div>
          <div className="al-kpiValue">{counts.active}</div>
        </div>

        <div className="al-kpiCard">
          <div className="al-kpiRow">
            <span>Critical</span>
            <FaExclamationTriangle />
          </div>
          <div className="al-kpiValue al-criticalText">{counts.critical}</div>
        </div>

        <div className="al-kpiCard">
          <div className="al-kpiRow">
            <span>Warnings</span>
            <FaInfoCircle />
          </div>
          <div className="al-kpiValue al-warningText">{counts.warning}</div>
        </div>
      </div>

      {/* Tabs (ONLY ALL) */}
      <div className="al-tabs">
        <button className="active" type="button" onClick={() => setSelectedType("ALL")}>
          <span className="al-tabIcon">{TYPE_META.ALL.icon}</span>
          <span>{TYPE_META.ALL.label}</span>
          <span className="al-tabCount">{counts.active}</span>
        </button>
      </div>

      {/* List */}
      <div className="al-list">
        {loadingAlerts && <div className="al-loading">Loading alerts...</div>}

        {!loadingAlerts && !filteredAlerts.length && <div className="al-empty">No alerts found ✅</div>}

        {filteredAlerts.map((a) => (
          <div
  key={a._id}
  className={`al-card sev-${normalizeUpper(a.severity)}`}
>

            <div className="al-cardHead">
              <div className="al-cardLeft">
                <div className="al-ic">{iconForSeverity(a.severity)}</div>
                <div>
                <div className="al-cardTitle">Alert</div>
                  <div className="al-cardSub">
                    {a.memberName || a.githubUsername || a.memberEmail || "—"}
                    {a.repoFullName ? ` • ${a.repoFullName}` : ""}
                  </div>
                </div>
              </div>

              <div className={severityPill(a.severity)}>{normalizeUpper(a.severity || "INFO")}</div>
            </div>

            <div className="al-cardBody">
              <div className="al-msg">{a.message || "—"}</div>

              <div className="al-meta">
                <span>
                  Type: <b>{a.type || "—"}</b>
                </span>
                {a.createdAt && <span>• {new Date(a.createdAt).toLocaleString()}</span>}
              </div>

              {/* ✅ Optional: show notify info if available */}
            {a.lastNotifiedAt && (
  <div className="al-meta" style={{ marginTop: 6 }}>
    <span>
      📧 Notified <b>{a.notifiedCount || 0}</b> time(s)
    </span>
    <span>• Last: {new Date(a.lastNotifiedAt).toLocaleString()}</span>
  </div>
)}

            </div>

            <div className="al-cardBtns">
              <button
                className="al-btnPrimary"
                type="button"
                onClick={() => handleTakeAction(a)}
                disabled={actionLoadingId === a._id}
              >
                {actionLoadingId === a._id ? "Sending..." : "Take Action"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedAlert && (
        <div className="al-modalOverlay" onClick={closeDetails}>
          <div className="al-modal" onClick={(e) => e.stopPropagation()}>
            <div className="al-modalHead">
              <div>
                <div className="al-modalTitle">
                  {selectedAlert.title || selectedAlert.type || "Alert Details"}
                </div>
                <div className="al-modalSub">
                  {selectedAlert.memberName ||
                    selectedAlert.githubUsername ||
                    selectedAlert.memberEmail ||
                    "—"}
                  {selectedAlert.repoFullName ? ` • ${selectedAlert.repoFullName}` : ""}
                </div>
              </div>

              <button className="al-modalClose" onClick={closeDetails} type="button">
                <FaTimes />
              </button>
            </div>

            <div className="al-modalBody">
              <div className="al-modalRow">
                <span className={severityPill(selectedAlert.severity)}>
                  {normalizeUpper(selectedAlert.severity || "INFO")}
                </span>
                <span style={{ marginLeft: 10 }}>
                  Type: <b>{selectedAlert.type}</b>
                </span>
                {selectedAlert.createdAt && (
                  <span style={{ marginLeft: 10 }}>
                    • {new Date(selectedAlert.createdAt).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="al-modalMsg">{selectedAlert.message || "No message provided."}</div>

              <div className="al-modalSection">
                <div className="al-modalSectionTitle">Details</div>
                <pre className="al-modalPre">
{selectedAlert.details
  ? JSON.stringify(selectedAlert.details, null, 2)
  : JSON.stringify(selectedAlert, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
