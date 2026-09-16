import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, getCapsules, createCapsule, updateCapsule, deleteCapsule } from "../api.js";

const emptyForm = {
  project_name: "",
  prompt_title: "",
  prompt_version: "",
  prompt_text: "",
  response_summary: "",
  category: "",
  usefulness: "",
  reviewed: false,
  improved: false,
  screenshot_url: "",
  notes: "",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [login, setLogin] = useState("");
  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMe().then((me) => {
      if (!me.loggedIn) {
        navigate("/login");
        return;
      }
      setLogin(me.login);
      setCheckedAuth(true);
      loadCapsules();
    });
  }, []);

  async function loadCapsules() {
    try {
      const data = await getCapsules();
      setCapsules(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await updateCapsule(editingId, form);
      } else {
        await createCapsule(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      loadCapsules();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(capsule) {
    setEditingId(capsule.id);
    setForm({
      project_name: capsule.project_name || "",
      prompt_title: capsule.prompt_title || "",
      prompt_version: capsule.prompt_version || "",
      prompt_text: capsule.prompt_text || "",
      response_summary: capsule.response_summary || "",
      category: capsule.category || "",
      usefulness: capsule.usefulness || "",
      reviewed: !!capsule.reviewed,
      improved: !!capsule.improved,
      screenshot_url: capsule.screenshot_url || "",
      notes: capsule.notes || "",
    });
  }

  async function handleDelete(id) {
    if (!confirm("delete this capsule?")) return;
    try {
      await deleteCapsule(id);
      loadCapsules();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!checkedAuth) return <div className="page">checking session...</div>;

  return (
    <div className="page">
      <div className="dash-header">
        <h1>Dashboard</h1>
        <div>
          <span>logged in as {login}</span>
          <a className="btn small" href="/auth/logout">logout</a>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <form className="capsule-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "edit capsule" : "new capsule"}</h2>
        <div className="grid">
          <input name="project_name" placeholder="project name *" value={form.project_name} onChange={handleChange} required />
          <input name="prompt_title" placeholder="prompt title *" value={form.prompt_title} onChange={handleChange} required />
          <input name="prompt_version" placeholder="version (v1, v2...)" value={form.prompt_version} onChange={handleChange} />
          <input name="category" placeholder="category" value={form.category} onChange={handleChange} />
          <input name="usefulness" placeholder="usefulness rating" value={form.usefulness} onChange={handleChange} />
          <input name="screenshot_url" placeholder="screenshot url (optional)" value={form.screenshot_url} onChange={handleChange} />
        </div>
        <textarea name="prompt_text" placeholder="prompt text *" value={form.prompt_text} onChange={handleChange} required />
        <textarea name="response_summary" placeholder="response summary" value={form.response_summary} onChange={handleChange} />
        <textarea name="notes" placeholder="notes" value={form.notes} onChange={handleChange} />
        <div className="checks">
          <label><input type="checkbox" name="reviewed" checked={form.reviewed} onChange={handleChange} /> reviewed</label>
          <label><input type="checkbox" name="improved" checked={form.improved} onChange={handleChange} /> improved</label>
        </div>
        <div className="form-actions">
          <button className="btn" type="submit">{editingId ? "save changes" : "add capsule"}</button>
          {editingId && (
            <button type="button" className="btn secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
              cancel
            </button>
          )}
        </div>
      </form>

      <h2>your capsules ({capsules.length})</h2>
      <div className="capsule-list">
        {capsules.map((c) => (
          <div className="capsule-card" key={c.id}>
            <div className="capsule-card-head">
              <strong>{c.prompt_title}</strong>
              <span>{c.project_name} - {c.prompt_version}</span>
            </div>
            <p>{c.prompt_text}</p>
            {c.response_summary && <p className="muted">summary: {c.response_summary}</p>}
            <div className="capsule-meta">
              <span>category: {c.category || "-"}</span>
              <span>usefulness: {c.usefulness || "-"}</span>
              <span>reviewed: {c.reviewed ? "yes" : "no"}</span>
              <span>improved: {c.improved ? "yes" : "no"}</span>
            </div>
            <div className="form-actions">
              <button className="btn small" onClick={() => startEdit(c)}>edit</button>
              <button className="btn small secondary" onClick={() => handleDelete(c.id)}>delete</button>
            </div>
          </div>
        ))}
        {capsules.length === 0 && <p className="muted">no capsules yet - add your first one above.</p>}
      </div>
    </div>
  );
}
