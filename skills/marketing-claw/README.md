# Marketing Claw

**Your AI marketing team, always on.** 12 specialized agents that handle analytics, content, social, newsletters, and leads — running autonomously inside OpenClaw.

---

## The Problem

Running a modern marketing operation takes 10+ hours a week minimum. Daily analytics, content ideation, social posting, engagement, newsletter writing, lead generation — it never stops. Hiring a team is expensive. Doing it alone is unsustainable.

Marketing Claw is the third option.

---

## What You Get

A pre-configured squad of 12 AI agents, each with a specialized role and cron schedule. They wake up on their own, do their job, and report back to you. You stay in control without doing all the work.

### Core Capabilities

- **Daily pulse reports** — analytics, traffic, what's moving
- **Content briefings** — what to post today, based on trends and your strategy
- **Automated social posting** — executes from your approved queue
- **Community engagement** — replies, builds your presence, grows the account
- **Blog production** — outlines, drafts, and publishes on schedule
- **Newsletter drafting** — full issues, ready to review and send
- **Lead generation** — ICP-matched prospects from Reddit, X, LinkedIn, and job boards
- **Content scoring** — weekly performance analysis with actionable recommendations
- **Editorial intelligence** — trends, angles, and content gaps delivered every Monday

---

## Screenshots

> _Screenshots coming soon. Run `node setup.mjs` to get started in under 5 minutes._

---

## The Agent Roster

### Starter Tier

| Agent | Cadence | What It Does |
|-------|---------|--------------|
| **Pulse** | Daily | Analytics digest — traffic, top content, conversion signals |
| **Hype** | Daily | Content briefing — what to post, when, with sample copy |
| **Megaphone** | Daily | Posts approved content to your social channels |
| **Mingle** | 2x Daily | Engagement — replies, builds relationships, grows reach |
| **Ghost** | Tue/Thu | Blog engine — drafts posts from your editorial calendar |

### Pro Tier (Adds 7 More)

| Agent | Cadence | What It Does |
|-------|---------|--------------|
| **Scout** | Daily | Monitors Reddit, X, and communities for brand mentions and opportunities |
| **Oracle** | Weekly | Editorial intelligence — trending topics, content gaps, competitor moves |
| **Quill** | Weekly | Writes a full newsletter issue from scratch |
| **Judge** | Weekly | Scores content performance and surfaces what's working |
| **Hunter** | Daily | Identifies warm outbound leads and queues them for outreach |
| **Prospector** | 3x/Week | Lead gen batch — ICP matching from multiple signal sources |
| **Standup** | Daily | Agent audit — what ran, what's pending, surfaces blockers |

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-org/marketing-claw
cd marketing-claw

# 2. Run the setup wizard (takes ~5 minutes)
node setup.mjs

# 3. Register your agents
openclaw cron add --config agents/pulse.json
openclaw cron add --config agents/hype.json
# (setup.mjs prints exact commands for all agents)
```

**Requirements:**
- [OpenClaw](https://openclaw.ai) installed
- Node.js v18+
- Telegram (or configured OpenClaw channel)

Full guide: [`docs/QUICKSTART.md`](docs/QUICKSTART.md)

---

## Pricing Tiers

| | Starter | Pro |
|--|---------|-----|
| Agents | 5 | 12 |
| Daily reporting | ✓ | ✓ |
| Content briefings | ✓ | ✓ |
| Social posting & engagement | ✓ | ✓ |
| Blog production | ✓ | ✓ |
| Community monitoring | — | ✓ |
| Weekly editorial intelligence | — | ✓ |
| Newsletter drafting | — | ✓ |
| Content performance scoring | — | ✓ |
| Lead generation | — | ✓ |
| Agent standup/audit | — | ✓ |
| Playbooks (4) | ✓ | ✓ |
| HTML dashboards (3) | ✓ | ✓ |

---

## Included Playbooks

Marketing Claw ships with four battle-tested playbooks:

**X Engagement Playbook** — 10 reply frameworks, daily targets, DM strategy, the Banger Test, and a complete voice guide. Built from months of running a high-growth X account.

**Social Strategy Framework** — 5-pillar content system with weekly posting cadence, signature formats, growth targets, and a 2-week launch sequence.

**Newsletter Playbook** — 11-section structure with section guidance, tone guide, and format rules. Produce a consistent, high-quality newsletter every week.

**Outbound Leads Playbook** — ICP framework, signal sources, hot/warm/nurture scoring, multi-touch sequence templates, and weekly review process.

---

## Dashboards

Three HTML dashboards included, work via `file://` (no server needed):

- **Command Center** — Marketing metrics overview with content scoring and recommendations
- **Editorial Kanban** — 5-column board: Ideas → Research → Writing → Review → Published
- **Social Kanban** — 4-column board: Ideas → Ready → Scheduled → Posted

Open directly in your browser. Drag-and-drop cards between columns.

---

## How It Works

1. **`node setup.mjs`** asks 10 questions about your brand
2. Templates are filled with your brand variables and copied to your OpenClaw workspace
3. Agent JSON configs are ready with your settings baked in
4. You register agents with `openclaw cron add` and they start running on schedule
5. Agents deliver reports and content to your Telegram (or configured channel)
6. You review, approve, and stay in control — they do the gruntwork

---

## Customization

Every agent, template, and playbook is fully customizable. See:

- [`docs/CUSTOMIZATION.md`](docs/CUSTOMIZATION.md) — How to customize everything
- [`docs/AGENTS-GUIDE.md`](docs/AGENTS-GUIDE.md) — Deep dive on each agent's prompt and schedule
- [`templates/`](templates/) — Edit templates before or after setup

---

## FAQ

**Do I need to be technical?**
You need Node.js installed. The setup wizard handles everything else. If you can run `node setup.mjs`, you're set.

**What model do the agents use?**
Configurable per agent. Defaults to Claude Sonnet for most tasks, Claude Haiku for lightweight monitoring. Prompts are designed to work well with any capable model.

**Can I run only some agents?**
Yes. Register only the agents you want. Each is fully independent.

**Will it actually post to social for me?**
Megaphone and Mingle agents are designed to interface with your social platforms via OpenClaw's tool layer. You'll need the relevant integrations configured.

**How do I update my brand settings?**
Edit the filled templates in your OpenClaw workspace directly, or re-run `node setup.mjs` with new answers.

**Is it safe to run autonomously?**
All agents operate within OpenClaw's permission model. Outbound actions (posting, sending emails) require your configured channels. Nothing runs outside your sandbox.

---

## License

MIT — see [`LICENSE`](LICENSE)

---

*Built for founders, marketers, and teams who want the leverage of a full marketing operation without the overhead.*
