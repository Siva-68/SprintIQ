const cron = require("node-cron");
const Team = require("../models/Team");
const Alert = require("../models/Alerts");
const {
  getMemberCommitsThisWeek,
  getMemberLastCommitTime,
} = require("../services/githubService");

function hoursBetween(now, past) {
  return Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
}

// ✅ normalize helpers (prevents enum issues forever)
const normalizeSeverity = (sev = "INFO") => String(sev).trim().toUpperCase();
const normalizeType = (type = "") => String(type).trim().toUpperCase();

async function runAlertScan() {
  console.log("⏳ [CRON] Running alert scan...");

  const teams = await Team.find({}).lean();

  for (const t of teams) {
    if (!t.repoFullName) continue;

    const members = t.members || [];
    if (!members.length) continue;

    for (const m of members) {
      const username = (m.githubUsername || "").trim();
      if (!username) continue;

      try {
        const commitsThisWeek = await getMemberCommitsThisWeek(
          t.repoFullName,
          username
        );

        const lastCommitTime = await getMemberLastCommitTime(
          t.repoFullName,
          username
        );

        const now = new Date();
        const inactiveHours = lastCommitTime
          ? hoursBetween(now, lastCommitTime)
          : 9999;

        console.log("🔍 Repo:", t.repoFullName, "User:", username);
        console.log("🔍 CommitsThisWeek:", commitsThisWeek);
        console.log("🔍 InactiveHours:", inactiveHours);

        // ==============================
        // 🔴🟡 ALERT RULES
        // ==============================
        let severity = null;
        let type = null;
        let message = "";

        // 🔴 Critical inactivity
        if (inactiveHours >= 72) {
          type = "INACTIVITY";
          severity = "CRITICAL";
          message = `🔴 ${username} has no commits in ${t.repoFullName} for ${inactiveHours} hours`;
        }
        // 🟡 Warning inactivity
        else if (inactiveHours >= 24) {
          type = "INACTIVITY";
          severity = "WARNING";
          message = `🟡 ${username} has no commits in ${t.repoFullName} for ${inactiveHours} hours`;
        }

        // normalize before DB (extra safety)
        if (type) type = normalizeType(type);
        if (severity) severity = normalizeSeverity(severity);

        // ==============================
        // ✅ MEMBER IS ACTIVE -> resolve old alerts
        // ==============================
        if (!severity) {
          await Alert.updateMany(
            {
              teamId: t._id,
              repoFullName: t.repoFullName,
              githubUsername: username,
              isActive: true,
              type: "INACTIVITY", // ✅ consistent
            },
            { isActive: false, resolvedAt: new Date() }
          );
          continue;
        }

        // ==============================
        // 🔁 CREATE OR UPDATE ALERT
        // ==============================
       


        // ✅ CREATE ONCE + UPDATE FOREVER (no duplicates)
await Alert.updateOne(
  {
    teamId: t._id,
    repoFullName: t.repoFullName,
    githubUsername: username,
    isActive: true,
    $or: [
      { type: "INACTIVITY" },
      { type: { $exists: false } },
      { type: null }
    ],
  },
  {
    $set: {
      owner: t.owner || t.userId,
      memberEmail: m.email || "",
      type: "INACTIVITY",        // always enforce now
      severity,
      message,
      inactiveHours,
      lastCommitTime,
      resolvedAt: null,
    },
    $setOnInsert: {
      isActive: true,
      createdAt: new Date(),
    },
  },
  { upsert: true }
);



       
      } catch (err) {
        console.log(
          "❌ [CRON] Failed for:",
          t.repoFullName,
          username,
          err.message
        );
      }
    }
  }

  console.log("✅ [CRON] Alert scan finished.");
}

function startAlertCron() {
  cron.schedule("*/1 * * * *", async () => {
    console.log("⏱️ cron running...");
    try {
      await runAlertScan();
    } catch (e) {
      console.log("❌ [CRON] Job crashed:", e.message);
    }
  });

  console.log("✅ Alert cron scheduled: every 1 minute (testing)");
}

module.exports = { startAlertCron, runAlertScan };
