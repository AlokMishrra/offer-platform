import express from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { get, run, all } from "../storage/db.js";

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect("/admin/login");
}

// Bootstrap default admin if missing (username: admin, password from .env or 'admin123')
async function ensureDefaultAdmin() {
  const username = "admin";
  const admin = await get("SELECT * FROM admins WHERE username = ?", [username]);
  if (!admin) {
    const pass = process.env.ADMIN_PASSWORD || "admin123";
    const hash = await bcrypt.hash(pass, 10);
    await run("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [username, hash]);
  }
}

router.get("/login", async (req, res) => {
  await ensureDefaultAdmin();
  res.render("admin_login");
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const admin = await get("SELECT * FROM admins WHERE username = ?", [username]);
  if (!admin) return res.render("admin_login", { error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return res.render("admin_login", { error: "Invalid credentials" });
  req.session.admin = { username };
  res.redirect("/admin");
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

router.get("/", requireAdmin, async (req, res) => {
  const offers = await all("SELECT * FROM offers ORDER BY id DESC");
  res.render("admin_dashboard", { offers });
});

router.get("/offer/new", requireAdmin, (req, res) => {
  res.render("admin_offer_form", { offer: null });
});

router.post("/offer/new", requireAdmin, async (req, res) => {
  const { employee_code, content } = req.body;
  await run("INSERT INTO offers (employee_code, content, status) VALUES (?, ?, 'draft')", [employee_code, content]);
  res.redirect("/admin");
});

router.post("/offer/:id/publish", requireAdmin, async (req, res) => {
  const { id } = req.params;
  await run("UPDATE offers SET status='published', published_at=datetime('now') WHERE id=?", [id]);
  res.redirect("/admin");
});

router.get("/employees", requireAdmin, async (req, res) => {
  const employees = await all("SELECT * FROM employees ORDER BY id DESC");
  res.render("admin_employees", { employees });
});

router.post("/employees/upsert", requireAdmin, async (req, res) => {
  const { employee_code, full_name, email, details_json } = req.body;
  const existing = await get("SELECT id FROM employees WHERE employee_code = ?", [employee_code]);
  if (existing) {
    await run(
      "UPDATE employees SET full_name=?, email=?, details_json=? WHERE employee_code=?",
      [full_name || null, email || null, details_json || null, employee_code]
    );
  } else {
    await run(
      "INSERT INTO employees (employee_code, full_name, email, details_json) VALUES (?,?,?,?)",
      [employee_code, full_name || null, email || null, details_json || null]
    );
  }
  res.redirect("/admin/employees");
});

router.post("/employees/:employee_code/generate-company-id", requireAdmin, async (req, res) => {
  const { employee_code } = req.params;
  const companyId = uuidv4();
  await run("UPDATE employees SET company_id=? WHERE employee_code=?", [companyId, employee_code]);
  res.redirect("/admin/employees");
});

// Terms & Conditions
router.get("/terms", requireAdmin, async (req, res) => {
  const row = await get("SELECT content FROM terms WHERE id = 1");
  res.render("admin_terms", { terms: row?.content || "" });
});

router.post("/terms", requireAdmin, async (req, res) => {
  const { content } = req.body;
  await run("UPDATE terms SET content=? WHERE id=1", [content || ""]);
  res.redirect("/admin/terms");
});

export default router;


