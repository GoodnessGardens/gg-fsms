import { neon } from "@neondatabase/serverless";

let _sql;
function client() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}
// lazy tagged-template wrapper so builds don't require DATABASE_URL
export function sql(strings, ...values) {
  return client()(strings, ...values);
}

export async function createTables() {
  // Users of the Food Safety Management System (its own accounts, separate from any other app)
  await sql`CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    pin_hash TEXT,
    role TEXT NOT NULL DEFAULT 'employee',
    department TEXT NOT NULL DEFAULT '',
    site TEXT NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    manager_id INT REFERENCES employees(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  // Operational checklists (daily / inspection checks) — standalone, no training dependency
  await sql`CREATE TABLE IF NOT EXISTS checklists (
    id TEXT PRIMARY KEY,
    department TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    title_es TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    note_es TEXT NOT NULL DEFAULT '',
    items JSONB NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS checklist_submissions (
    id SERIAL PRIMARY KEY,
    checklist_id TEXT NOT NULL REFERENCES checklists(id),
    employee_id INT NOT NULL REFERENCES employees(id),
    site TEXT NOT NULL DEFAULT '',
    shift TEXT NOT NULL DEFAULT '',
    unit TEXT NOT NULL DEFAULT '',
    results JSONB NOT NULL,
    has_issues BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  // FS controlled-document register (the index an auditor sees first)
  await sql`CREATE TABLE IF NOT EXISTS fs_documents (
    doc_no TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    module TEXT NOT NULL,
    module_no INT,
    section TEXT,
    primus_ref TEXT,
    doctype TEXT NOT NULL DEFAULT 'SOP',
    revision TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    content JSONB,
    edited BOOLEAN NOT NULL DEFAULT FALSE
  )`;

  // PrimusGFS internal self-audits
  await sql`CREATE TABLE IF NOT EXISTS fs_audits (
    id SERIAL PRIMARY KEY,
    module TEXT NOT NULL,
    module_no INT,
    site TEXT NOT NULL DEFAULT '',
    auditor INT NOT NULL REFERENCES employees(id),
    answers JSONB NOT NULL DEFAULT '{}',
    compliant INT NOT NULL DEFAULT 0,
    noncompliant INT NOT NULL DEFAULT 0,
    na INT NOT NULL DEFAULT 0,
    pct INT NOT NULL DEFAULT 0,
    autofail BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  // Deviations + CAPA reuse a lightweight incident/root-cause/corrective-action model
  await sql`CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    reported_by INT NOT NULL REFERENCES employees(id),
    incident_date TEXT NOT NULL,
    department TEXT NOT NULL,
    site TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    persons TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    injury TEXT NOT NULL DEFAULT '',
    treatment TEXT NOT NULL DEFAULT 'none',
    equipment TEXT NOT NULL DEFAULT '',
    conditions TEXT NOT NULL DEFAULT '',
    immediate_actions TEXT NOT NULL DEFAULT '',
    osha_reportable TEXT NOT NULL DEFAULT 'no',
    status TEXT NOT NULL DEFAULT 'open',
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS rca (
    id SERIAL PRIMARY KEY,
    incident_id INT NOT NULL REFERENCES incidents(id),
    problem TEXT NOT NULL DEFAULT '',
    whys JSONB NOT NULL DEFAULT '[]',
    root_causes TEXT NOT NULL DEFAULT '',
    factors JSONB NOT NULL DEFAULT '{}',
    completed_by INT REFERENCES employees(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS corrective_actions (
    id SERIAL PRIMARY KEY,
    incident_id INT NOT NULL REFERENCES incidents(id),
    action TEXT NOT NULL,
    hierarchy TEXT NOT NULL DEFAULT 'administrative',
    owner TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS witness_statements (
    id SERIAL PRIMARY KEY,
    incident_id INT NOT NULL REFERENCES incidents(id),
    witness_name TEXT NOT NULL,
    statement TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
}
