import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";   // ✅ main app
import "./index.css";         // ✅ tailwind styles loaded here

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
