import React from "react";
import { createRoot } from "react-dom/client";
import HomeRouter from "./home/HomeRouter.jsx";
import ApplicationBoundary from "./components/ApplicationBoundary.jsx";
import "./styles.css";
createRoot(document.getElementById("root")).render(
  <ApplicationBoundary>
    <HomeRouter />
  </ApplicationBoundary>,
);
