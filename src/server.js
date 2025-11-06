import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import { initDatabase } from "./storage/db.js";
import expressLayouts from "express-ejs-layouts";
import adminRouter from "./web/admin.js";
import employeeRouter from "./web/employee.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", path.join(__dirname, "views", "layout"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
// Default view locals
app.use((req, res, next) => {
  if (typeof res.locals.title === "undefined") {
    res.locals.title = "Offer Platform";
  }
  res.locals.admin = req.session?.admin || null;
  next();
});
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
  })
);

app.use("/public", express.static(path.join(__dirname, "public")));

// Home redirects
app.get("/", (req, res) => {
  res.redirect("/employee");
});

// Routers
app.use("/admin", adminRouter);
app.use("/employee", employeeRouter);

// Start server after DB init
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
await initDatabase();
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});


