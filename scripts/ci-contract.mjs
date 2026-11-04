import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const requiredJobs = ["repository-contract", "frontend", "database"];
export const minimumBrowserTests = 42;

export function checkMigrationFiles(files) {
  const errors = [];
  const sql = files.filter((file) => file.name.endsWith(".sql"));
  if (sql.length === 0) errors.push("No application SQL migrations found");
  const timestamps = new Set();
  for (const file of sql) {
    const match = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(file.name);
    if (!match) errors.push(`Invalid migration name: ${file.name}`);
    if (match && timestamps.has(match[1])) {
      errors.push(`Duplicate migration timestamp: ${match[1]}`);
    }
    if (match) timestamps.add(match[1]);
    if (!file.content.trim()) errors.push(`Empty migration: ${file.name}`);
  }
  return errors;
}

export function parseEnv(text) {
  const values = {};
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match || Object.hasOwn(values, match[1])) {
      throw new Error(`Ambiguous environment syntax at line ${index + 1}`);
    }
    let value = match[2].trim();
    if (value.startsWith('"') || value.startsWith("'")) {
      if (value.at(-1) !== value[0] || value.length < 2) {
        throw new Error(`Unclosed environment value at line ${index + 1}`);
      }
      value = value.slice(1, -1);
    } else if (value.includes(" #")) {
      value = value.slice(0, value.indexOf(" #")).trimEnd();
    }
    values[match[1]] = value;
  }
  return values;
}

export function isLocalUrl(value, port) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      url.port === String(port) &&
      !url.username && !url.password &&
      url.pathname === "/" && !url.search && !url.hash
    );
  } catch {
    return false;
  }
}

export function checkLocalEnvironment(fileValues, inherited = {}) {
  const errors = [];
  const effective = { ...fileValues, ...inherited };
  for (const [key, port] of [
    ["NEXT_PUBLIC_SITE_URL", 3000],
    ["NEXT_PUBLIC_SUPABASE_URL", 54321],
  ]) {
    if (!isLocalUrl(effective[key], port)) {
      errors.push(`${key} must target the disposable loopback service`);
    }
  }
  for (const source of [fileValues, inherited]) {
    for (const [key, port] of [
      ["SUPABASE_URL", 54321],
      ["NEXT_PUBLIC_SUPABASE_URL", 54321],
      ["NEXT_PUBLIC_SITE_URL", 3000],
      ["MAILPIT_BASE_URL", 54324],
    ]) {
      if (source[key] && !isLocalUrl(source[key], port)) {
        errors.push(`${key} contains a nonlocal or invalid override`);
      }
    }
    for (const key of Object.keys(source)) {
      if (!source[key]) continue;
      if (/^(DATABASE_URL|DIRECT_URL|POSTGRES_URL.*|SUPABASE_DB_URL|SUPABASE_ACCESS_TOKEN|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|RESEND_API_KEY|SMTP_PASS(?:WORD)?|CLOUDINARY_API_SECRET)$/.test(key)) {
        errors.push(`${key} must not be supplied to isolated CI`);
      }
      if (/^(RUN_LIVE_TESTS|ENABLE_LIVE_TESTS|STRIPE_LIVE_TESTS)$/.test(key) && /^(1|true|yes)$/i.test(source[key])) {
        errors.push(`${key} must remain disabled`);
      }
    }
  }
  return [...new Set(errors)];
}

export function findCredentialPatterns(filename, text) {
  const patterns = [
    ["Stripe secret", /\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]{24,}\b/g],
    ["Supabase secret", /\bsb_secret_[A-Za-z0-9_-]{24,}\b/g],
    ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
    ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ];
  const findings = [];
  for (const [kind, pattern] of patterns) {
    for (const match of text.matchAll(pattern)) {
      findings.push({
        file: filename,
        line: text.slice(0, match.index).split("\n").length,
        kind,
      });
    }
  }
  return findings;
}

export function checkWorkflowPins(filename, text) {
  const errors = [];
  if (/\bpull_request_target\s*:/.test(text)) {
    errors.push(`${filename}: privileged PR execution requires separate review`);
  }
  if (/permissions:\s*write-all\b/.test(text)) {
    errors.push(`${filename}: broad write permissions are forbidden`);
  }
  for (const match of text.matchAll(/\buses:\s*["']?([^\s"'#]+)/g)) {
    const action = match[1];
    if (!action.startsWith("./") && !/^[^@]+@[a-f0-9]{40}$/i.test(action)) {
      errors.push(`${filename}: action reference must use a reviewed full commit SHA`);
    }
  }
  return errors;
}

export function checkBrowserReport(report) {
  const errors = [];
  const stats = report?.stats;
  if (!stats || !["expected", "unexpected", "flaky", "skipped"].every(
    (key) => Number.isInteger(stats[key]) && stats[key] >= 0,
  )) return ["Browser report is missing valid execution statistics"];
  if (stats.expected < minimumBrowserTests) errors.push("Browser contract population is incomplete");
  for (const key of ["unexpected", "flaky", "skipped"]) {
    if (stats[key] !== 0) errors.push(`Browser contract has ${key} tests`);
  }
  if (!Array.isArray(report.errors) || report.errors.length !== 0) {
    errors.push("Browser report has global errors or a missing error ledger");
  }
  const projects = new Set(report.config?.projects?.map((project) => project.name));
  if (!projects.has("chromium") || !projects.has("mobile")) {
    errors.push("Both configured browser projects must execute");
  }
  return errors;
}

export function checkJobResults(results) {
  return requiredJobs.filter((name) => results[name] !== "success")
    .map((name) => `${name} did not succeed`);
}

export function checkCommitBinding({ checkedOut, tested, source, parents }) {
  const sha = /^[a-f0-9]{40}$/i;
  if (![checkedOut, tested, source].every((value) => sha.test(value ?? ""))) {
    return ["Commit binding requires three complete SHAs"];
  }
  if (checkedOut !== tested) return ["Checked-out commit does not match tested commit"];
  if (source !== tested && !parents.includes(source)) {
    return ["PR source is not a parent of the tested merge commit"];
  }
  return [];
}

function git(...args) {
  const result = spawnSync("git", args, { encoding: "utf8", shell: false });
  if (result.status !== 0) throw new Error("Git evidence command failed");
  return result.stdout.trim();
}

function enforce(errors) {
  for (const error of errors) console.error(error);
  if (errors.length) process.exitCode = 1;
  else console.log("Quality contract passed for the requested scope");
}

function repository() {
  const files = git("ls-files", "-z").split("\0").filter(Boolean);
  const errors = [];
  const migrations = readdirSync("supabase/migrations").filter((name) => name.endsWith(".sql"));
  errors.push(...checkMigrationFiles(migrations.map((name) => ({
    name,
    content: readFileSync(`supabase/migrations/${name}`, "utf8"),
  }))));
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  if (packageJson.scripts?.["db:reset"] !== "supabase db reset --local") {
    errors.push("db:reset must remain explicitly local");
  }
  for (const filename of files) {
    if (/(^|\/)\.env(?:\.|$)/.test(filename) && !filename.endsWith(".env.example")) {
      errors.push(`Environment file must not be tracked: ${filename}`);
    }
    const bytes = readFileSync(filename);
    if (bytes.includes(0)) continue;
    const text = bytes.toString("utf8");
    for (const finding of findCredentialPatterns(filename, text)) {
      errors.push(`${finding.file}:${finding.line}: ${finding.kind} pattern (value redacted)`);
    }
    if (/^\.github\/workflows\/.*\.ya?ml$/.test(filename)) {
      errors.push(...checkWorkflowPins(filename, text));
    }
  }
  enforce(errors);
}

function receipt() {
  const env = process.env;
  const jobs = JSON.parse(env.JOB_RESULTS ?? "{}");
  const checkedOut = git("rev-parse", "HEAD");
  const tree = git("rev-parse", "HEAD^{tree}");
  const parents = git("show", "-s", "--format=%P", "HEAD").split(" ");
  const binding = {
    checkedOut,
    tested: env.GITHUB_SHA,
    source: env.SOURCE_HEAD_SHA,
    parents,
  };
  const errors = [...checkJobResults(jobs), ...checkCommitBinding(binding)];
  const document = {
    schema_version: 1,
    scope: "isolated-ci-only",
    repository: env.GITHUB_REPOSITORY,
    source_head_sha: binding.source,
    tested_sha: checkedOut,
    tested_tree: tree,
    base_sha: env.BASE_SHA || null,
    run_id: env.GITHUB_RUN_ID,
    run_attempt: env.GITHUB_RUN_ATTEMPT,
    event: env.GITHUB_EVENT_NAME,
    job_results: jobs,
    result: errors.length ? "failed" : "passed",
    errors,
    release_authorized: false,
    not_proven: ["independent-review", "hosted-acceptance", "production-configuration", "release-approval", "deployment", "monitoring"],
  };
  mkdirSync("artifacts", { recursive: true });
  writeFileSync("artifacts/ci-receipt.json", `${JSON.stringify(document, null, 2)}\n`);
  enforce(errors);
}

export function main(command, argument) {
  if (command === "repository") repository();
  else if (command === "local-env") {
    enforce(checkLocalEnvironment(parseEnv(readFileSync(".env.local", "utf8")), process.env));
  } else if (command === "browser-report") {
    enforce(checkBrowserReport(JSON.parse(readFileSync(argument ?? "artifacts/quality-browser.json", "utf8"))));
  } else if (command === "receipt") receipt();
  else throw new Error("Use repository, local-env, browser-report, or receipt");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv[2], process.argv[3]);
  } catch {
    console.error("Quality contract could not finish; validate required files and syntax (values redacted)");
    process.exitCode = 1;
  }
}
