import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(13, 18, 38, 0.95)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            color: "#f1f5f9",
            backdropFilter: "blur(20px)",
            borderRadius: "12px",
            fontSize: "14px",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#0d1226" },
          },
          error: {
            iconTheme: { primary: "#f87171", secondary: "#0d1226" },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
