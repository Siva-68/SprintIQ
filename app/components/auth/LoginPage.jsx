// src/app/components/auth/LoginPage.jsx
import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SignupPage.css"; // reuse the same CSS
const API_BASE = import.meta.env.VITE_API_BASE;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // Call your backend login route
    const res = await axios.post(
  `${API_BASE}/api/auth/login`,
  {
    email,
    password,
  }
);


      if (res.data.success) {
        // Save token in localStorage
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        // Redirect to a home/dashboard page (update this path if needed)
        navigate("/home"); 
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-logo">
          <FaGithub size={32} />
        </div>
        <h1 className="signup-title">Welcome Back</h1>
        <p className="signup-subtitle">
          Sign in to monitor your team's GitHub activity
        </p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}

        <p className="signup-footer">
          Don't have an account?{" "}
          <span
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => navigate("/signup")}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}