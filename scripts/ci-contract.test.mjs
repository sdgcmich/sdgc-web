import test from "node:test";
import assert from "node:assert/strict";
import { checkMigrationFiles, parseEnv, isLocalUrl, checkLocalEnvironment,
  findCredentialPatterns, checkWorkflowPins, checkBrowserReport,
  checkJobResults, checkCommitBinding } from "./ci-contract.mjs";

const local = { NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" };
const report = () => ({ stats: { expected: 42, unexpected: 0, flaky: 0, skipped: 0 }, errors: [], config: { projects: [{ name: "chromium" }, { name: "mobile" }] } });
const a = "a".repeat(40);
const b = "b".repeat(40);

test("nonempty timestamped migrations pass", () => {
  assert.deepEqual(checkMigrationFiles([{ name: "20261104000100_guard.sql", content: "select 1;" }]), []);
});
test("missing migrations fail closed", () => assert.ok(checkMigrationFiles([]).length));
test("malformed, duplicate, and empty migrations fail", () => {
  assert.equal(checkMigrationFiles([{ name: "bad.sql", content: "" }, { name: "20261104000100_a.sql", content: "select 1;" }, { name: "20261104000100_b.sql", content: "select 1;" }]).length, 3);
});
test("dotenv parser supports expected quotes and comments", () => {
  assert.deepEqual(parseEnv("# note\nA=one\nB='two'\nC=three # comment\n"), { A: "one", B: "two", C: "three" });
});
test("ambiguous dotenv never leaks values", () => {
  for (const text of ["A=private\nA=other", "export A=private", "A='private"]) {
    assert.throws(() => parseEnv(text), (error) => !error.message.includes("private"));
  }
});
test("only exact loopback service URLs pass", () => {
  for (const value of ["http://127.0.0.1:54321", "http://localhost:54321/", "http://[::1]:54321"]) assert.equal(isLocalUrl(value, 54321), true);
  for (const value of ["https://project.supabase.co", "http://localhost.evil.test:54321", "http://user:pass@localhost:54321", "http://127.0.0.1:54321/path", "http://localhost:3000", "http://localhost:54321?x=1"]) assert.equal(isLocalUrl(value, 54321), false);
});
test("local generated environment passes", () => assert.deepEqual(checkLocalEnvironment(local), []));
test("remote effective and shadowed overrides fail", () => {
  assert.ok(checkLocalEnvironment(local, { SUPABASE_URL: "https://remote.example.test" }).length);
  assert.ok(checkLocalEnvironment({ ...local, NEXT_PUBLIC_SITE_URL: "https://remote.example.test" }, local).length);
});
test("external provider secrets and DB URLs are forbidden", () => {
  for (const key of ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "RESEND_API_KEY", "SMTP_PASSWORD", "CLOUDINARY_API_SECRET", "DATABASE_URL", "SUPABASE_ACCESS_TOKEN"]) {
    const errors = checkLocalEnvironment(local, { [key]: "private-value" });
    assert.equal(errors.length, 1);
    assert.ok(!errors.join().includes("private-value"));
  }
});
test("credential diagnostics contain location not secret", () => {
  const value = ["rk", "test", "A".repeat(36)].join("_");
  const findings = findCredentialPatterns("note.md", `title\n${value}\n`);
  assert.deepEqual(findings, [{ file: "note.md", line: 2, kind: "Stripe secret" }]);
  assert.ok(!JSON.stringify(findings).includes(value));
});
test("short placeholders and regex source are not credentials", () => {
  assert.deepEqual(findCredentialPatterns("example", "STRIPE_SECRET_KEY=replace-me\nsb_publishable_example"), []);
});
test("workflow refs must be pinned, local actions remain valid", () => {
  assert.deepEqual(checkWorkflowPins("ci.yml", `uses: actions/checkout@${a}\nuses: ./local`), []);
  assert.ok(checkWorkflowPins("ci.yml", "uses: actions/checkout@v7").length);
});
test("privileged PR and write-all are rejected", () => {
  assert.equal(checkWorkflowPins("ci.yml", "pull_request_target:\npermissions: write-all").length, 2);
});
test("complete unskipped two-project browser report passes", () => assert.deepEqual(checkBrowserReport(report()), []));
test("empty, skipped, flaky, missing-project or failed browser reports fail", () => {
  for (const key of ["skipped", "flaky", "unexpected"]) { const r = report(); r.stats[key] = 1; assert.ok(checkBrowserReport(r).length); }
  const empty = report(); empty.stats.expected = 0; assert.ok(checkBrowserReport(empty).length);
  const oneProject = report(); oneProject.config.projects.pop(); assert.ok(checkBrowserReport(oneProject).length);
  const error = report(); error.errors.push({ message: "setup failed" }); assert.ok(checkBrowserReport(error).length);
  assert.ok(checkBrowserReport({}).length);
});
test("terminal gate requires every upstream job to succeed", () => {
  assert.deepEqual(checkJobResults({ "repository-contract": "success", frontend: "success", database: "success" }), []);
  for (const status of ["skipped", "cancelled", "failure", undefined]) assert.ok(checkJobResults({ "repository-contract": "success", frontend: "success", database: status }).length);
});
test("push and genuine PR-merge evidence bind correctly", () => {
  assert.deepEqual(checkCommitBinding({ checkedOut: a, tested: a, source: a, parents: [] }), []);
  assert.deepEqual(checkCommitBinding({ checkedOut: a, tested: a, source: b, parents: [b] }), []);
});
test("wrong checkout, stale source, and short SHAs are rejected", () => {
  assert.ok(checkCommitBinding({ checkedOut: b, tested: a, source: a, parents: [] }).length);
  assert.ok(checkCommitBinding({ checkedOut: a, tested: a, source: b, parents: [] }).length);
  assert.ok(checkCommitBinding({ checkedOut: "short", tested: a, source: a, parents: [] }).length);
});
