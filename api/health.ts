import express from "express";
const app = express();
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", vercel: true });
});
export default app;
