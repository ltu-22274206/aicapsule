require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const capsuleRoutes = require("./routes/capsules");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

// same-origin in production (frontend served by this same express app),
// so cors is really only needed for local dev with a separate vite server.
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
    credentials: true,
  })
);

// public health check - required by the assignment, must stay unauthenticated
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/api/capsules", capsuleRoutes);

// serve the built react app in production
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/auth")) return next();
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`ai capsule server listening on port ${PORT}`);
});
