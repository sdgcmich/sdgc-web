#!/usr/bin/env node
/**
 * Supabase MCP Client CLI
 * Executes database inspections, SQL execution, advisors, and migrations
 * directly against the local Docker Supabase MCP endpoint on port 54321.
 */

const ENDPOINT = process.env.SUPABASE_MCP_URL || "http://127.0.0.1:54321/mcp";

async function callTool(name, args = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`MCP request failed with HTTP ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`MCP Error [${data.error.code}]: ${data.error.message}`);
  }

  return data.result;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    console.log(`
Supabase MCP CLI Helper
Usage:
  node scripts/supabase-mcp.mjs sql "<SQL_QUERY>"
  node scripts/supabase-mcp.mjs tables [schema]
  node scripts/supabase-mcp.mjs advisors [security|performance]
  node scripts/supabase-mcp.mjs migrate <name> "<SQL_QUERY>"
  node scripts/supabase-mcp.mjs types
`);
    return;
  }

  try {
    switch (command) {
      case "sql": {
        const query = rest.join(" ");
        if (!query) throw new Error("SQL query is required.");
        const result = await callTool("execute_sql", { query });
        console.log(result?.content?.[0]?.text || JSON.stringify(result, null, 2));
        break;
      }
      case "tables": {
        const schema = rest[0] || "public";
        const result = await callTool("list_tables", { schemas: [schema], verbose: true });
        console.log(result?.content?.[0]?.text || JSON.stringify(result, null, 2));
        break;
      }
      case "advisors": {
        const type = rest[0] || "security";
        const result = await callTool("get_advisors", { type });
        console.log(result?.content?.[0]?.text || JSON.stringify(result, null, 2));
        break;
      }
      case "migrate": {
        const [name, ...sqlParts] = rest;
        const query = sqlParts.join(" ");
        if (!name || !query) throw new Error("Migration name and SQL query are required.");
        const result = await callTool("apply_migration", { name, query });
        console.log(result?.content?.[0]?.text || JSON.stringify(result, null, 2));
        break;
      }
      case "types": {
        const result = await callTool("generate_typescript_types", {});
        console.log(result?.content?.[0]?.text || JSON.stringify(result, null, 2));
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
