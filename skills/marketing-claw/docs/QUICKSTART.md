# Quickstart — Marketing Claw in 5 Minutes

This guide gets you from install to first agent running in under 5 minutes.

---

## Prerequisites

Before you start, you need:

- **[OpenClaw](https://openclaw.ai)** installed and configured with your channel (Telegram recommended)
- **Node.js v18+** — check with `node --version`
- **A Telegram bot** connected to OpenClaw (or your configured channel)
- **Your brand info** — have it ready: company name, social handles, ICP description, top competitors

---

## Step 1: Clone and Install

```bash
git clone https://github.com/your-org/marketing-claw
cd marketing-claw
```

No npm install required. The setup wizard uses only Node.js built-ins.

---

## Step 2: Run the Setup Wizard

```bash
node setup.mjs
```

The wizard will ask you 10 questions:

| Question | What to Enter |
|----------|--------------|
| Brand name | Your company name (e.g., "Acme") |
| Your name | First name is fine |
| Your role | e.g., "Founder" or "Head of Marketing" |
| What you do | One sentence: "We help X do Y" |
| Industry/niche | e.g., "B2B SaaS", "E-commerce" |
| Brand tone | Casual / Professional / Edgy / Friendly |
| Primary social platform | X, LinkedIn, or Both |
| Social handle | Without the @ symbol |
| Newsletter platform | Beehiiv, Substack, ConvertKit, or None |
| Analytics tool | Fathom, GA4, Plausible, or None |
| ICP description | 1-2 sentences on your ideal customer |
| Top competitors | 3-5 names, comma-separated |
| Workspace path | Auto-detected or enter manually |
| Timezone | Auto-detected |
| Telegram Chat ID | Your chat ID (get it from @userinfobot on Telegram) |
| Tier | Starter (5 agents) or Pro (12 agents) |

The wizard then:
1. Fills all template variables with your answers
2. Copies configured files to your OpenClaw workspace
3. Saves filled agent configs to `~/.openclaw/workspace/marketing-claw/agents/`
4. Prints exact CLI commands to register each agent

---

## Step 3: Register Your Agents

The setup wizard prints the exact commands. They look like this:

```bash
openclaw cron add --config "/path/to/workspace/marketing-claw/agents/pulse.json"
openclaw cron add --config "/path/to/workspace/marketing-claw/agents/hype.json"
openclaw cron add --config "/path/to/workspace/marketing-claw/agents/megaphone.json"
openclaw cron add --config "/path/to/workspace/marketing-claw/agents/mingle.json"
openclaw cron add --config "/path/to/workspace/marketing-claw/agents/ghost.json"
```

Run them all, or just the ones you want active.

---

## Step 4: Open Your Dashboards

Find the dashboards in your workspace at `dashboards/`. Open them directly in your browser:

```
~/.openclaw/workspace/dashboards/command-center.html
~/.openclaw/workspace/dashboards/editorial-kanban.html
~/.openclaw/workspace/dashboards/social-kanban.html
```

Add the Command Center to your browser bookmarks. It's your daily starting point.

---

## Step 5: Wait for the First Run

Your agents run on their scheduled times. Here's what to expect first:

| Agent | First Run | What You'll Get |
|-------|-----------|-----------------|
| **Hunter** | Tomorrow 7:30 AM | First lead scan report via Telegram |
| **Pulse** | Tomorrow 8:00 AM | Analytics digest (data may be limited initially) |
| **Scout** | Tomorrow 8:30 AM | Community and competitor scan |
| **Hype** | Tomorrow 9:00 AM | 3 post ideas with full draft copy |
| **Standup** | Tomorrow 9:30 AM | Agent status report |
| **Megaphone** | Tomorrow 10:00 AM | Checks queue for approved posts |
| **Mingle** | Tomorrow 11:00 AM | First engagement session |
| **Ghost** | Next Tue or Thu | First blog draft |
| **Oracle** | Next Monday | Weekly editorial brief |
| **Quill** | Next Wednesday | First newsletter draft |
| **Judge** | Next Friday | First performance review |
| **Prospector** | Next M/W/F | First lead gen batch |

---

## What to Do on Day 1

**Morning (after agents run):**
1. Check Telegram — you'll have reports from Pulse, Scout, Hype, Hunter, and Standup
2. Review Hype's 3 post ideas — mark the best one [READY] in `memory/content-queue.md`
3. Review Hunter's lead report — check any HOT leads and reach out today
4. Check Scout's community report — any competitor moves or brand mentions?

**Mid-morning:**
5. Megaphone will check the queue at 10 AM — if you approved a post, it'll go out
6. Mingle runs at 11 AM — review flagged reply opportunities

**Your job today:**
- Review and approve content
- Contact hot leads
- Read the Standup report and fix any blockers

The agents do the work. Your job is to review, approve, and act on what they surface.

---

## Getting Your Telegram Chat ID

If you don't know your Telegram chat ID:

1. Open Telegram
2. Search for `@userinfobot`
3. Start a chat with it — it will immediately reply with your user ID
4. Use that number as your Chat ID in the setup wizard

For group chats, add `@userinfobot` to the group and it will share the group's chat ID.

---

## Troubleshooting

**Setup wizard can't find my workspace**
Enter the full path manually when prompted. Default is `~/.openclaw/workspace` or `%USERPROFILE%\.openclaw\workspace` on Windows.

**Agents aren't sending Telegram messages**
Make sure your Telegram bot is configured in OpenClaw and your Chat ID is correct. Test with `openclaw notify "test"`.

**I want to change my settings**
Re-run `node setup.mjs` — existing files will be backed up before overwriting.

**Agent is running but output looks wrong**
Edit the filled agent config in your workspace at `marketing-claw/agents/agentname.json`. The prompts are fully editable.

---

## Next Steps

- Read [`AGENTS-GUIDE.md`](AGENTS-GUIDE.md) to understand what each agent does in depth
- Read [`CUSTOMIZATION.md`](CUSTOMIZATION.md) to personalize everything
- Read the playbooks in `playbooks/` — they contain the frameworks the agents use

Your marketing squad is running. Give it a week to get into rhythm.
