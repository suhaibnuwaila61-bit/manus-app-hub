

## Understanding your request

You want to connect a **custom remote MCP server** using a **Remote MCP URL + OAuth Client ID + Client Secret**. There are two very different things this could mean — let me explain both, then recommend.

---

### Option A — Connect it to Lovable's builder agent (the AI building your app)

This would let me (the Lovable AI) call tools from your MCP server while building your app.

**Status: Not possible today.** Lovable's MCP system only supports a fixed catalog (Linear, Notion, Sentry, n8n, Atlassian, Hex, Miro, PostHog, Sentry, Amplitude, Sanity, Polar, Granola, Confidence). There is **no "custom remote MCP" connector** with your own OAuth credentials in the cloud. The only way to add a custom MCP server is via **Lovable Desktop's local MCP** (running on your computer), not via remote URL + OAuth credentials.

➡️ If this was your goal, the answer is: not supported. You'd need to use one of the featured connectors instead.

---

### Option B — Connect it INTO your Financial Nexus app (recommended interpretation)

Your AI Assistant page would be able to call tools exposed by the remote MCP server (e.g., custom finance tools, external data lookups, actions on third-party services). You authorize **once** as the app owner; all users share that connection.

**This IS buildable.** Here's the plan:

### Architecture

```text
[User in AI Assistant]
        ↓ chat message
[financial-advisor edge function]
        ↓ asks AI for tool calls
[Lovable AI Gateway]
        ↓ "call tool X with args Y"
[mcp-proxy edge function]  ← stores OAuth tokens, refreshes them
        ↓ HTTPS + Bearer token
[Your remote MCP server]
```

### What gets built

1. **Secrets stored in backend** (you'll provide them via the secret-add prompt):
   - `MCP_SERVER_URL` — the remote MCP server URL
   - `MCP_OAUTH_CLIENT_ID`
   - `MCP_OAUTH_CLIENT_SECRET`
   - `MCP_OAUTH_TOKEN_URL` — the OAuth token endpoint (needed for client_credentials or refresh)
   - `MCP_OAUTH_AUTHORIZE_URL` — only if using authorization_code flow

2. **New table `mcp_oauth_tokens`** (single row, app-wide shared token):
   - `access_token`, `refresh_token`, `expires_at`, `updated_at`
   - RLS: only service role can read/write (no user access)

3. **New edge function `mcp-oauth-callback`** — handles the OAuth redirect, exchanges code for tokens, stores them. Used once during initial setup by you (the admin).

4. **New edge function `mcp-proxy`** — internal helper:
   - Reads stored access token
   - Auto-refreshes if expired (using refresh_token + client_id/secret)
   - Forwards JSON-RPC `tools/list` and `tools/call` requests to the MCP server with required headers (`Accept: application/json, text/event-stream`, `Authorization: Bearer …`)

5. **Update `financial-advisor` edge function** — on each AI turn:
   - Calls `mcp-proxy` `tools/list` to discover MCP tools
   - Passes them as `tools` to the Lovable AI Gateway
   - When the AI returns a tool call, executes it via `mcp-proxy` `tools/call` and feeds the result back into the conversation
   - Loops until the AI returns a final text response

6. **Settings page — new "MCP Connection" card**:
   - Shows connection status (Connected / Not connected / Token expired)
   - "Authorize" button → opens OAuth authorize URL with redirect to `mcp-oauth-callback`
   - "Disconnect" button → clears the row in `mcp_oauth_tokens`
   - Visible to all logged-in users but only useful for you as admin

7. **AI Assistant page** — small "MCP tools available: N" indicator so users see when external tools are active.

### OAuth flow choice

Two flows are common for MCP:
- **`client_credentials`** — simplest. App authenticates itself with client_id+secret, gets an access_token. No user redirect. Best for "shared by all users".
- **`authorization_code`** — you (admin) click "Authorize", get redirected to the MCP server's auth page, approve, redirected back with a code that's exchanged for tokens.

I'll implement **both** and auto-pick based on which URLs you provide.

### Security notes
- Client secret + tokens never leave the edge function — frontend never sees them.
- The `mcp-proxy` function is only callable from inside other edge functions (or with a service-role check) — never directly from the browser.
- Rate limiting added to prevent abuse from the AI Assistant page.

---

### Files to be created / edited

**Created:**
- `supabase/functions/mcp-proxy/index.ts`
- `supabase/functions/mcp-oauth-callback/index.ts`
- `supabase/migrations/<timestamp>_mcp_oauth_tokens.sql`

**Edited:**
- `supabase/functions/financial-advisor/index.ts` — add MCP tool discovery + execution loop
- `src/pages/Settings.tsx` — add MCP Connection card
- `src/pages/AIAssistant.tsx` — add small "MCP tools available" indicator
- `src/lib/i18n.ts` — translation keys for new UI

### Secrets you'll be asked to provide

Once you approve, I'll trigger a secret-add prompt for:
`MCP_SERVER_URL`, `MCP_OAUTH_CLIENT_ID`, `MCP_OAUTH_CLIENT_SECRET`, `MCP_OAUTH_TOKEN_URL`, and optionally `MCP_OAUTH_AUTHORIZE_URL` + `MCP_OAUTH_SCOPES`.

### One thing to confirm before I build

You mentioned "Claude" — is your remote MCP server **hosted by Anthropic/Claude** (i.e., Anthropic's hosted MCP service), or is it **your own MCP server** that you happen to also use with Claude Desktop? The implementation is the same either way, but the OAuth URLs differ. You can just tell me when you approve.

