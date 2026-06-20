import React from "react";
import { FaUsers, FaTasks, FaChartBar, FaBell, FaPlus } from "react-icons/fa";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">SprintIQ</h2>
      <nav>
        <ul>
          <li><FaUsers /> Teams</li>
          <li><FaTasks /> Tasks</li>
          <li><FaChartBar /> Analytics</li>
          <li><FaBell /> Alerts</li>
          <li><FaPlus /> Create Team</li>
        </ul>
      </nav>
    </div>
  );
}