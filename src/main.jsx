import React from "react";
import { createRoot } from "react-dom/client";
import HomeRouter from "./home/HomeRouter.jsx";
import ApplicationBoundary from "./components/ApplicationBoundary.jsx";
import { restoreSceneReloadCheckpoint } from "./exploration/reloadCheckpoint.js";
import "./styles.css";
restoreSceneReloadCheckpoint();
createRoot(document.getElementById("root")).render(
  <ApplicationBoundary>
    <HomeRouter />
  </ApplicationBoundary>,
);
