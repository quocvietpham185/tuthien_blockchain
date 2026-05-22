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
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            color: "#111827",
            borderRadius: "8px",
            fontSize: "14px",
            boxShadow: "0 12px 30px rgba(17, 24, 39, 0.12)",
          },
          success: {
            iconTheme: { primary: "#059669", secondary: "#ffffff" },
          },
          error: {
            iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
