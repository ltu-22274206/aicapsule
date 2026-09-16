const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// every route below requires a valid jwt AND scopes queries to req.userId,
// which comes from the verified jwt, never from the request body/params.
router.use(requireAuth);

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.userId);
  res.json(rows);
});

router.post("/", (req, res) => {
  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  if (!project_name || !prompt_title || !prompt_text) {
    return res
      .status(400)
      .json({ error: "project_name, prompt_title and prompt_text are required" });
  }

  const stmt = db.prepare(`
    INSERT INTO capsules
      (user_id, project_name, prompt_title, prompt_version, prompt_text,
       response_summary, category, usefulness, reviewed, improved,
       screenshot_url, notes)
    VALUES (@user_id, @project_name, @prompt_title, @prompt_version, @prompt_text,
       @response_summary, @category, @usefulness, @reviewed, @improved,
       @screenshot_url, @notes)
  `);

  const info = stmt.run({
    user_id: req.userId,
    project_name,
    prompt_title,
    prompt_version: prompt_version || null,
    prompt_text,
    response_summary: response_summary || null,
    category: category || null,
    usefulness: usefulness || null,
    reviewed: reviewed ? 1 : 0,
    improved: improved ? 1 : 0,
    screenshot_url: screenshot_url || null,
    notes: notes || null,
  });

  const created = db.prepare("SELECT * FROM capsules WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(created);
});

router.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM capsules WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);

  if (!existing) {
    // don't leak whether the record exists for another user - just 404
    return res.status(404).json({ error: "capsule not found" });
  }

  const merged = { ...existing, ...req.body };

  db.prepare(`
    UPDATE capsules SET
      project_name = @project_name,
      prompt_title = @prompt_title,
      prompt_version = @prompt_version,
      prompt_text = @prompt_text,
      response_summary = @response_summary,
      category = @category,
      usefulness = @usefulness,
      reviewed = @reviewed,
      improved = @improved,
      screenshot_url = @screenshot_url,
      notes = @notes
    WHERE id = @id AND user_id = @user_id
  `).run({
    ...merged,
    reviewed: merged.reviewed ? 1 : 0,
    improved: merged.improved ? 1 : 0,
    id: existing.id,
    user_id: req.userId,
  });

  const updated = db.prepare("SELECT * FROM capsules WHERE id = ?").get(existing.id);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const info = db
    .prepare("DELETE FROM capsules WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.userId);

  if (info.changes === 0) {
    return res.status(404).json({ error: "capsule not found" });
  }
  res.status(204).send();
});

module.exports = router;
