import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createClient } from "@supabase/supabase-js";
import express from "express";
import { z } from "zod";

// ─── Supabase client (credentials never leave this container) ────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// ─── MCP Server ──────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "mcp-gateway",
  version: "1.0.0",
});

// ─── TOOLS ───────────────────────────────────────────────────────────────────
// These are the ONLY operations the agent can perform.
// No tool = no access. Period.

// -- notes: read ---------------------------------------------------------------
server.tool(
  "get_notes",
  "Fetch notes for a given user. Returns id, content, and created_at only.",
  {
    user_id: z.string().uuid().describe("UUID of the user"),
  },
  async ({ user_id }) => {
    const { data, error } = await supabase
      .from("notes")
      .select("id, content, created_at") // never expose user_id back or sensitive cols
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  },
);

// -- notes: create -------------------------------------------------------------
server.tool(
  "create_note",
  "Create a new note for a user.",
  {
    user_id: z.string().uuid().describe("UUID of the user"),
    content: z
      .string()
      .min(1)
      .max(2000)
      .describe("Note content, max 2000 characters"),
  },
  async ({ user_id, content }) => {
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id, content })
      .select("id")
      .single();

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return {
      content: [{ type: "text", text: `Created note with id: ${data.id}` }],
    };
  },
);

// -- notes: update (content only, no ownership transfer) -----------------------
server.tool(
  "update_note",
  "Update the content of an existing note. Cannot change ownership.",
  {
    id: z.string().uuid().describe("UUID of the note to update"),
    content: z.string().min(1).max(2000).describe("New content"),
  },
  async ({ id, content }) => {
    const { error } = await supabase
      .from("notes")
      .update({ content })
      .eq("id", id);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return {
      content: [{ type: "text", text: `Updated note ${id}` }],
    };
  },
);

// ─── INTENTIONALLY OMITTED ───────────────────────────────────────────────────
// delete_note  → not exposed, agent cannot delete anything
// get_users    → not exposed, agent cannot enumerate users
// Any DDL      → not exposed, agent cannot alter schema
// ─────────────────────────────────────────────────────────────────────────────

// ─── Express + SSE transport ─────────────────────────────────────────────────
const app = express();

// NOTE: No global express.json() here — it consumes the request body stream
// before the SSE transport can read it, causing "stream is not readable" errors.

const transports = {}; // sessionId → SSEServerTransport

app.get("/sse", async (req, res) => {
  console.log("[gateway] New SSE connection");
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;

  res.on("close", () => {
    console.log(`[gateway] SSE connection closed: ${transport.sessionId}`);
    delete transports[transport.sessionId];
  });

  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const { sessionId } = req.query;
  const transport = transports[sessionId];

  if (!transport) {
    console.error(`[gateway] No transport for session: ${sessionId}`);
    return res.status(404).json({ error: "Session not found" });
  }

  await transport.handlePostMessage(req, res);
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(3100, () => {
  console.log("[gateway] MCP gateway running on :3100");
  console.log(
    `[gateway] Supabase URL: ${process.env.SUPABASE_URL ?? "NOT SET"}`,
  );
});
