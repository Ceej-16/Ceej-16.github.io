---
title: Setting Up Ollama with Obsidian Copilot
description: How to run a local AI model with Ollama and connect it to your Obsidian vault using the Copilot plugin
date: 2026-04-18
tags:
  - obsidian
  - ollama
  - local-ai
  - copilot
  - qwen3
---

## Overview

If you want a local AI assistant living inside Obsidian without bouncing between apps, this is the setup for it. Ollama runs your models as a background service, the Copilot plugin connects your vault to those models, and the whole thing stays on your machine with no data leaving.

This guide covers installing Ollama, pulling the models you need, wiring everything up through the Copilot plugin, and verifying it's actually working.

### What You're Building

- **Ollama** — the local model server that runs as a background service
- **Qwen3 14B** — the chat and reasoning model
- **Nomic Embed Text** — the embedding model that indexes your vault for search
- **Obsidian Copilot** — the plugin that ties everything together inside Obsidian

### What You Need Before Starting

- Obsidian installed with an existing vault
- Basic familiarity with local LLMs — you don't need one set up yet but you should know what they are
- A terminal or PowerShell

---

## Phase 1: Install Ollama

### Step 1: Download and Install

Go to ollama.com and download the Windows installer. Run it and follow the prompts — Ollama installs as a background service that starts automatically when Windows boots, so you won't need to launch it manually after this.

Once installed, verify it's working by opening PowerShell and running:

```powershell
ollama --version
```

You should see a version number. If you get an error, restart your PC and try again.

> 💡 Ollama runs in the system tray after install — look for the llama icon in the bottom right of your taskbar. If it's there, it's running.

---

## Phase 2: Pull the Models

You need two models — one for chat and one for embeddings. They serve different purposes and both need to be running for the full Copilot feature set to work.

### Step 2: Pull the Chat Model

Qwen3 14B handles writing, research, reasoning, and general chat. It has a 256K context window which gives it plenty of room to work with large vaults.

```powershell
ollama pull qwen3:14b
```

> 💡 This is around 9GB so give it time depending on your connection. You can move on to the next step while it downloads.

### Step 3: Pull the Embedding Model

Nomic Embed Text is what indexes your vault notes so Copilot can search them. It's small and fast and runs on CPU in the background — you'll barely notice it except when indexing first kicks off.

```powershell
ollama pull nomic-embed-text
```

### Step 4: Verify Both Models Are There

```powershell
ollama list
```

You should see both `qwen3:14b` and `nomic-embed-text` in the output before moving on.

---

## Phase 3: Install the Copilot Plugin

### Step 5: Install Copilot in Obsidian

1. Open Obsidian and go to **Settings**
2. Click **Community Plugins** in the left sidebar
3. Turn off Safe Mode if prompted
4. Click **Browse** and search for **Copilot**
5. Click **Install** then **Enable**

---

## Phase 4: Configure Copilot

### Step 6: Connect the Chat Model

1. Go to **Settings → Copilot**
2. Find the Model section and set the provider to **Ollama**
3. Set the base URL to `http://localhost:11434`
4. Set the model name to `qwen3:14b`

### Step 7: Connect the Embedding Model

1. In the same Copilot settings page, find the **Embedding Model** section
2. Set the provider to **Ollama**
3. Set the base URL to `http://localhost:11434`
4. Set the embedding model to `nomic-embed-text`
5. Save your settings

> 💡 Both models use the same Ollama server URL — Ollama handles routing requests to the right model automatically so you don't need two different addresses.

---

## Phase 5: Index Your Vault

### Step 8: Run the Initial Index

Before vault search works, Copilot needs to build an index of your notes using the embedding model.

1. In Copilot settings, find the **Indexing** section
2. Click **Index Vault**
3. Wait for it to finish — your CPU will spike to 100% while it runs, which is normal

> 💡 How long this takes depends on how many notes you have. Once it's done your CPU will drop back to idle, and new notes get indexed automatically after that so you only need to do this manually once.

---

## Phase 6: Test That Everything Works

### Step 9: Test Vault Search

Open the Copilot chat panel in Obsidian and send this:

```
@vault What are the main topics I have written about?
```

The `@vault` prefix tells Copilot to search your indexed notes before responding. If it comes back with something that references your actual note content, everything is connected correctly. If the response feels generic and unrelated to your notes, indexing probably didn't complete — go back and re-run it from Copilot settings.

### Step 10: Test General Chat

You can also use Copilot without vault context for general AI assistance:

```
Help me write an introduction for a blog post about local AI tools
```

This sends the prompt directly to Qwen3 14B without searching your vault first.

### Step 11: Test Note Connections

```
@vault Which of my notes are related to each other but not yet linked?
```

If this returns meaningful results that reference your actual notes, the full pipeline is working.

---

## Day-to-Day Workflow

Once everything is set up, Ollama runs in the background automatically so you don't need to think about it. Open Obsidian, open the Copilot panel, and start asking questions. Use `@vault` when you want it to search your notes and leave it off when you just want general chat.

LM Studio and Ollama will conflict over GPU access if both are running at the same time — if you use [LM Studio for MCPVault](/guides/mcpvault-with-lmstudio-guide/) or other things, make sure it's closed before opening Ollama.

---

## Troubleshooting

### Copilot not finding vault content

If `@vault` queries return generic responses that don't reference your notes, re-index your vault from Copilot settings. Also confirm the embedding model is set to `nomic-embed-text` and the base URL is correct.

---

## Quick Reference

| Item | Value |
|------|-------|
| Ollama server URL | `http://localhost:11434` |
| Chat model | `qwen3:14b` |
| Embedding model | `nomic-embed-text` |
| Vault search prefix | `@vault` |

---

## Related

[Connecting Your Obsidian Vault to a Local AI with MCPVault](/guides/mcpvault-with-lmstudio-guide/)

**Getting started with the blog setup:**
- [Getting Started with Astro and Starlight](/blog/setting-up-the-blog/)
- [GitHub Pages Setup Guide with Astro](/guides/github-pages-setup-guide-with-astro/)