
import { Routes, Route, Navigate } from "react-router-dom";

import SignupPage from "./app/components/auth/SignupPage";
import LoginPage from "./app/components/auth/LoginPage";
import Home from "./pages/Home";
import RepoDetails from "./pages/RepoDetails";
import TeamsPage from "./pages/TeamsPage";
import ManageTeam from "./pages/ManageTeam";
import AnalyticsPage from "./pages/AnalyticsPage";
import AlertsPage from "./pages/AlertsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<Home />} />
      <Route path="/repo/:id" element={<RepoDetails />} />

      {/* ✅ Teams */}
      <Route path="/teams" element={<TeamsPage />} />
      <Route path="/teams/:teamId" element={<ManageTeam />} />
      {/* fallback */}
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/alerts" element={<AlertsPage />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}