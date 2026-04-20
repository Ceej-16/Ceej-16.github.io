---
title: Connecting Your Obsidian Vault to a Local AI with MCPVault
description: How to set up MCPVault with LM Studio so your local model can read and write your notes without you copy-pasting everything
date: 2026-04-19
tags:
  - obsidian
  - mcp
  - lm-studio
  - local-ai
  - mcpvault
---

## Overview

If you've been running a local model and finding yourself constantly copying note content into the chat window, MCPVault is what fixes that. It's a lightweight MCP server that gives your local AI direct access to your Obsidian vault — it can list folders, read notes, search across your whole vault, add tags, and write content directly to your files. No Obsidian plugins needed, no API keys, just a vault path and a small config file.

This guide walks through getting it set up in LM Studio from scratch, including some real workflow examples and notes on how different models handle the same tasks.

### What You're Building

- **MCPVault** — the MCP server that sits between your AI and your vault
- **LM Studio** — where your local model runs and where you'll chat with it
- **Node.js** — MCPVault needs this to run

### What You Need Before Starting

- Basic familiarity with local LLMs — you don't need one set up yet but you should know what they are
- An Obsidian vault you want to connect
- A terminal or PowerShell

---

## Phase 1: Get LM Studio and a Model Running

### Step 1: Install LM Studio

Download LM Studio from lmstudio.ai and install it. As of the writing of this guide, my LM Studio is at 0.4.12

### Step 2: Download a Model

This is where model choice actually matters for what we're doing. MCPVault works through tool calling — the model needs to make structured function calls to read and write your vault rather than just chatting. Not every model handles this reliably.

In LM Studio's model browser, look for a model that shows a tool icon in its capabilities. Two that I tested and can speak to:

**Gemma 4 E4B** (`unsloth/gemma-4-e4b-it`) — runs fast, handles broad concept searches well, and defaults to clean lowercase-hyphenated tag formatting without being told to. Good starting point if you're not sure what to pick.

**Qwen3 14B** — produces more detailed analysis and finds more files on specific technical term searches, but misses on broader concept searches and defaults to CamelCase tags if there's no existing formatting to reference. You can tell it what format to use and it'll follow instructions, it just won't guess correctly on its own.

Neither one is strictly better — they just have different strengths depending on what you're searching for. I'd start with Gemma 4 E4B if you're newer to this and swap around once you know what your vault needs.

> 💡 One thing to watch out for — some models throw a prompt template error in LM Studio when tool calling is involved. If you get an error about "Unknown StringValue filter: safe" when sending your first message, that model has a broken chat template for this version of LM Studio. Switch to a different model or look for a lmstudio-community version of the same model which usually has the template fixed.

### Step 3: Load Your Model and Confirm It's Running

Once downloaded, load the model and go to the **Developer** tab. You should see Status: Running with your model listed. Leave this running in the background while we set up MCPVault.

---

## Phase 2: Set Up Node.js

MCPVault runs via `npx` so Node needs to be installed. If you already have it, skip ahead.

### Step 4: Install Node.js

Download the LTS version from nodejs.org and install it.

### Step 5: Verify It Works

Open PowerShell and run:

```powershell
node --version
npm --version
```

If you get version numbers back you're good. If npm throws an error about `.ps1` files and scripts being disabled, run this first and then try again:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Phase 3: Configure MCPVault in LM Studio

MCPVault doesn't need a separate install step. It runs on demand through `npx`, so all you're doing here is telling LM Studio where to find it and which vault to point it at.

### Step 6: Open mcp.json

1. In LM Studio, go to the **Server** tab
2. At the top of the screen click **mcp.json**
3. This opens the config file in LM Studio's built-in editor

### Step 7: Add the MCPVault Config

Paste this into the file, swapping in your actual vault path:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": [
        "@bitbonsai/mcpvault@latest",
        "C:\\Users\\YourName\\Documents\\YourVault"
      ]
    }
  }
}
```

Windows paths need double backslashes in JSON — so `C:\Users\YourName\Documents\YourVault` becomes `C:\\Users\\YourName\\Documents\\YourVault`. That's the most common thing that breaks this step so double check before saving.

If there's already content in your mcp.json from a previous MCP server, add the new block inside the existing `mcpServers` object rather than replacing the whole file.

### Step 8: Restart LM Studio

Close it completely and reopen it. MCP servers don't hot-reload when you edit the config file — a full restart is the only reliable way to pick up changes.

---

## Phase 4: Verify the Connection

### Step 9: Check the Integration Panel

1. Go to **Settings** by clicking the gear icon in the bottom left on windows
2. Look for an **Integrations** section — you should see `mcp/obsidian` listed
3. On the right sidebar, look for the integrations tab that looks like a hammer. Under that tab, a list of tools under `mcp/obsidian` should populate

If you see a list of tools load under the toggle, you're connected. If the toggle throws an error, the most likely cause is Node not being found or a typo in the vault path. Go back to Step 5 and confirm `npx` works in PowerShell, then recheck the path in mcp.json.

> 💡 If the error says "vault directory does not exist" that's actually progress — MCPVault is running, it just can't find the path. Check your backslashes.

### Step 10: Run a Test

Switch to the **Chat** tab with your model loaded and send this:

```
List all folders in my Obsidian vault and summarize what you found
```

The "summarize what you found" part is worth including — some models will call the tool, get the result, and then just not say anything. Adding an instruction to summarize forces a text response after the tool call. Worth knowing about upfront rather than spending time troubleshooting a working setup.

If it returns your actual folder structure, everything is working.

> 💡 Depending on your model you might see hidden folders like `.git` and `.smart-env` show up in the listing alongside your actual notes folders. From my understanding, .obsidian should've been excluded but I didn't look into it for this initial test and set-up.

---

## Phase 5: Working With Your Vault

Now the useful part. Here's what actually worked in practice.

### Reading Notes

Start every session by asking the model to list your vault structure — don't assume it knows where things are, especially if your folders use a naming convention like Johnny Decimal:

```
List all folders in my vault and summarize what you found
```

Once you know the exact folder names, reference them precisely when reading files:

```
Read the file in "YourFolder/YourNote.md" and tell me what it covers
```

Listing a folder only shows the top level — it won't recurse into subfolders unless you ask. If a folder has subfolders worth exploring, ask for those specifically.

### Searching Your Vault

Search works well for topic-based queries across the whole vault:

```
Search my entire vault for certification-related content and list what you find
```

The "entire vault" phrasing matters more than you'd think. In a session where the model has already been working in a specific folder, vague search queries tend to pull results from that area rather than searching everywhere. "Entire vault" or "all folders" breaks that bias consistently. A fresh chat session does too if results keep feeling off.

> 💡 This is where the model difference showed up most in my testing so far. Gemma 4 E4B found study notes in a certification study material repo folder called "Cert Repo" on a broad "certification" search while Qwen3 14B missed that folder entirely — but then Qwen3 14B found significantly more files when I searched for specific technical terms like "AWS" or "cloud computing," pulling in Kindle highlights and a meta notes folder that Gemma missed entirely. Neither model found everything. If results feel incomplete, try rephrasing with more specific terms or swapping models before assuming the content isn't there.

### Adding Tags to Notes

For a single note:

```
Add the tags "your-tag" and "another-tag" to "YourFolder/YourNote.md" and confirm what tags are now in the file
```

For tagging across multiple related files at once — this is the use case that got me interested in MCPVault to begin with:

```
Read the files in "YourFolder/YourSubfolder", identify themes they share, and suggest tags for each file based on those shared themes
```

Both models analyzed the content, identified shared themes, suggested specific tags per file, and then asked for confirmation before writing anything. That confirmation step is intentional — MCPVault won't write until you say yes, which is a nice safety net when you're touching multiple files at once.

> 💡 A couple of things that affected tag suggestions more than I expected. If your notes already have tags in the frontmatter, the model reads those and factors them into what it suggests — which sounds useful but can also mean it just echoes back what's already there rather than doing fresh analysis. Clear the existing tags first if you want unbiased suggestions. Tag format also varies by model — Gemma defaulted to lowercase-hyphenated on its own, Qwen3 14B went with CamelCase when there was no existing formatting to copy. Just tell it what format you want before it writes and it'll follow that without complaint.

### What the Models Actually Did

I ran both Gemma 4 E4B and Qwen3 14B through the same workflow on my job-related notes — three files covering my goals, job profile, and a skills list. Both models read all three files, identified shared themes around information assurance and compliance frameworks, and suggested relevant tags. Qwen3 14B went deeper on the analysis, breaking out more specific sub-themes and suggesting 7 tags per file versus Gemma's 4. Whether that's better or just more depends on how granular you want your tagging to be.

The bigger practical difference was in search. For my vault, Gemma handled broad concept searches better and Qwen3 14B handled specific technical term searches better. Your results will depend on what's in your vault and how your notes are written — worth testing both before committing to one.

---

## Day-to-Day Workflow

Once everything is set up, a session looks like this:

1. Open LM Studio and load your model
2. Ask it to list your vault structure so it knows the exact folder names
3. Work through whatever you need — reading, tagging, searching
4. Check your files in Obsidian as you go — changes appear in real time which is a good gut check before things go too far in a direction you don't want

> 💡 Keep Obsidian open while you work. Watching the files update as the model writes to them is both satisfying and a useful sanity check.

The model starts fresh every session with no memory of your vault structure. In some brief use with plugins such as `copilot for obsidian` I know there are ways to include something resembling persistent memory with an index but I'll cover those in a follow-up once I've actually kicked the tires on them enough. 

---

## Troubleshooting

### The toggle turns on but the model doesn't make any tool calls

Your model probably doesn't support tool calling well enough for this workflow. Look for a tool icon in LM Studio's model info panel. If it's not there, try Gemma 4 E4B or Qwen3 14B.

### "Vault directory does not exist" error

Your path in mcp.json is wrong. Most common cause is single backslashes — make sure every `\` in your path is doubled to `\\`. Also check for a trailing backslash at the end of the path.

### Model calls the tool but returns no text response

Add "and summarize what you found" to your prompt. Some models complete the tool call and then stop without generating a text response — the extra instruction forces output. Going to a larger model or one more focused on tool calling is also worth looking into if your hardware can handle it. 

### Search results feel incomplete or biased toward one folder

Start a fresh chat session and use "entire vault" or "all folders" in your search query. Long sessions where the model has been working in a specific area tend to bias subsequent searches toward that area.

### "Unknown StringValue filter: safe" error

Your model has a broken prompt template for this version of LM Studio. Look for a lmstudio-community version of the same model which usually has the template fixes applied, or just try a different model.

## Related

[Setting Up Ollama with Obsidian Copilot](/guides/ollama-copilot-for-obsidian-local-ai-guide/)