import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "offer.db");
export const db = new sqlite3.Database(dbPath);

export async function initDatabase() {
  await run(
    `CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT UNIQUE NOT NULL,
      full_name TEXT,
      email TEXT,
      company_id TEXT,
      details_json TEXT
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      published_at TEXT
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS signatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT NOT NULL,
      signed_name TEXT NOT NULL,
      signed_at TEXT NOT NULL,
      signature_image TEXT
    )`
  );

  // Prevent duplicate signatures per employee
  await run(
    `CREATE UNIQUE INDEX IF NOT EXISTS uniq_signature_employee ON signatures(employee_code)`
  );

  // Admin-editable Terms & Conditions (single row usage)
  await run(
    `CREATE TABLE IF NOT EXISTS terms (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      content TEXT
    )`
  );
  await run(`INSERT OR IGNORE INTO terms (id, content) VALUES (1, 'Default terms and conditions')`);
}

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}


