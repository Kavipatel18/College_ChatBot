import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard">
      {/* <h1>BVM Dashboard</h1> */}
      <iframe
        src="https://bvmengineering.ac.in/" // Replace with the URL of the website you want to embed
        title="Embedded Website"
        className="embedded-website"
        frameBorder="0"
        allowFullScreen
      />
    </div>
  );
};

export default Dashboard;
