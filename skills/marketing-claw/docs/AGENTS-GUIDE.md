# Agents Guide — Deep Dive

A comprehensive reference for all 12 Marketing Claw agents. Understand what each agent does, how it works, how to customize it, and how to get the most out of it.

---

## How Agents Work

Each agent is a cron job that runs at a scheduled time, executes a detailed prompt, and delivers output to your configured channel (Telegram by default). Agents read from and write to files in your OpenClaw workspace, which is how they share context with each other.

The general flow:
1. Agent wakes up on schedule
2. Reads relevant memory files and playbooks
3. Executes the task defined in its prompt
4. Updates memory files (content queue, lead pipeline, etc.)
5. Sends a report to your Telegram channel
6. Goes back to sleep until next run

Agents don't communicate with each other directly — they communicate through shared files. This is intentional: it keeps each agent simple, auditable, and easy to debug.

---

## Starter Tier Agents

### 1. Pulse — Daily Analytics Digest

**Schedule:** 8:00 AM daily
**Model:** Claude Sonnet
**Tier:** Starter

**What it does:**
Pulse is your daily briefing agent. Every morning at 8 AM, it pulls together the key numbers from your marketing operation and delivers a concise digest to Telegram.

The report covers:
- Traffic overview (sessions, sources, anomalies)
- Top performing content in the last 24 hours
- Conversion signals (newsletter signups, leads)
- What to watch today (one opportunity, one risk)
- Today's single highest-priority action

**How to get the most out of it:**
Pulse is limited by what data it can access. If you connect your analytics tool to OpenClaw's data layer, Pulse can pull real numbers. Without that connection, it synthesizes from available context and flags when it's estimating vs. reporting.

Configure your analytics tool (Fathom, GA4, Plausible) with OpenClaw to unlock real-time data in Pulse reports.

**Customization:** Edit the report structure in `agents/pulse.json` to add or remove sections. Common additions: ad spend, email stats, sales pipeline updates.

---

### 2. Hype — Daily Content Briefing

**Schedule:** 9:00 AM daily
**Model:** Claude Sonnet
**Tier:** Starter

**What it does:**
Hype produces 3 post ideas every morning with full draft copy — not just ideas, but posts ready to review and approve. Each post is optimized for your brand tone, platform, and ICP.

The briefing includes:
- 3 posts drawn from different content pillars
- Full draft copy for each
- Rationale for why each post works
- Recommended posting time
- Hook quality check

**How to get the most out of it:**
Review Hype's output each morning and mark the best post [READY] in `memory/content-queue.md`. Megaphone will pick it up at 10 AM. 

You can influence Hype's output by updating the social strategy playbook with content angles that are working, or by adding notes in memory files about what topics to prioritize.

**Customization:** Adjust the 5 post types in the prompt to match your preferred content mix. Add specific topics to a "content brief" section in the memory files for Hype to prioritize.

---

### 3. Megaphone — Social Posting Engine

**Schedule:** 10:00 AM daily
**Model:** Claude Haiku
**Tier:** Starter

**What it does:**
Megaphone is the execution arm of your content operation. It checks the content queue for approved posts and executes them — posting to your social platform via available tools.

It also:
- Reports what was posted and what's still pending
- Voice checks posts before publishing
- Flags anything that doesn't match brand tone

**How to get the most out of it:**
The approval workflow is the key: Hype generates → you approve (mark [READY]) → Megaphone posts. If you want to auto-approve Hype's top pick each day, note that in your SOUL.md and Megaphone will know to post without manual approval.

Note: Megaphone requires your social platform to be accessible via OpenClaw's tool layer. If not connected, it prints the post for manual copy-paste and logs what needs to go out.

**Customization:** Adjust the approval workflow. You can configure Megaphone to auto-approve Hype's briefings for specific post types, or to always require manual approval for anything going to LinkedIn.

---

### 4. Mingle — Social Engagement Engine

**Schedule:** 11:00 AM and 4:00 PM daily
**Model:** Claude Sonnet
**Tier:** Starter

**What it does:**
Mingle runs two engagement sessions per day, handling everything that builds your social presence beyond posting:
- Replies to inbound mentions and comments
- Identifies high-value reply opportunities from ICP accounts
- Drafts replies using the 10 frameworks from the engagement playbook
- Surfaces DM opportunities for review

Each session targets 15–25 meaningful engagements.

**How to get the most out of it:**
Read the X Engagement Playbook (`playbooks/x-engagement.md`). The 10 reply frameworks Mingle uses are documented there. Understanding them helps you evaluate Mingle's output and refine your engagement style.

Review Mingle's flagged items (accounts requiring your personal attention) daily. These are often partnership opportunities or high-value conversations that need a human touch.

**Customization:** Add specific accounts to engage with in the memory files. Add topics or keywords to prioritize. Adjust engagement session frequency (can run 3x daily for high-growth phases).

---

### 5. Ghost — Blog Content Engine

**Schedule:** 9:00 AM Tuesdays and Thursdays
**Model:** Claude Sonnet
**Tier:** Starter

**What it does:**
Ghost produces blog content twice a week. It either picks the next item from your editorial calendar (content-queue.md) or generates its own topic based on your ICP and market.

Ghost can produce:
- Full outlines with section summaries
- Complete draft posts (800–1,500 words)
- SEO-optimized content with keywords and meta descriptions

Drafts are saved to `memory/blog-drafts/` and the content queue is updated.

**How to get the most out of it:**
Feed Ghost good briefs. When you have a specific topic in mind, add it to the content queue with a brief description, target keyword, and any key points to hit. Ghost will produce much better output with a brief than without one.

Review Ghost's drafts and add your personal stories, specific examples, and brand details. AI-drafted blog posts are always better with human voice inserted at key moments.

**Customization:** Adjust word count targets, SEO strategy, CTA preferences. Add specific formatting requirements (H2 structure, internal linking strategy, image callout placeholders) to the prompt.

---

## Pro Tier Agents

### 6. Scout — Community Intelligence Monitor

**Schedule:** 8:30 AM daily
**Model:** Claude Sonnet
**Tier:** Pro

**What it does:**
Scout monitors the digital landscape every morning and surfaces what matters:
- Brand mentions across Reddit, X, and communities
- Competitor moves (new content, announcements, viral posts)
- ICP buying signals in online communities
- Industry trends with relevance to your brand

Scout is your early warning system. It finds things before they become obvious, so you can respond while windows are still open.

**How to get the most out of it:**
Act on Scout's ICP signals immediately. When Scout finds someone asking for exactly what you offer, that signal has a short shelf life (48–72 hours before it's cold). Hunter will pick up the leads Scout flags — but move fast.

Use Scout's competitor intelligence to inform Oracle's editorial brief and your positioning strategy.

**Customization:** Add specific subreddits, X accounts to monitor, industry forums, or Slack communities (if accessible). Add specific competitors and keywords to track.

---

### 7. Oracle — Weekly Editorial Intelligence

**Schedule:** 7:00 AM every Monday
**Model:** Claude Opus
**Tier:** Pro

**What it does:**
Oracle runs every Monday morning and produces the week's editorial intelligence brief — a strategic document that guides all content decisions for the week ahead.

The Oracle brief includes:
- Top 5 moving topics in your industry
- Content gap analysis (what competitors aren't covering)
- Weekly content calendar with specific topics for each day
- The "Big Angle" — the highest-opportunity content play of the week
- 3 keywords with ICP search intent
- Competitor watch from last week

Ghost, Hype, and Quill all draw from Oracle's brief to inform their output.

**How to get the most out of it:**
Oracle uses Claude Opus (the most capable model) because editorial intelligence requires synthesizing across many sources and making nuanced judgments. Don't downgrade the model for this agent.

Read Oracle's brief on Monday morning before looking at anything else. Let it frame your week. If Oracle identifies a Big Angle, make that the priority for Ghost and Quill that week.

**Customization:** Add specific industry publications, thought leaders, or data sources you want Oracle to consider. Add strategic priorities you want Oracle to always weigh (e.g., "we're targeting fintech companies this quarter").

---

### 8. Quill — Newsletter Drafting Engine

**Schedule:** 10:00 AM every Wednesday
**Model:** Claude Opus
**Tier:** Pro

**What it does:**
Quill writes a complete newsletter issue every Wednesday, ready for your review and send via your newsletter platform. The draft follows the 11-section structure from the newsletter playbook.

Quill reads:
- Oracle's brief for this week's editorial direction
- Your tone and brand guidelines from SOUL.md
- The newsletter playbook for structure and quality standards

Output: Full draft saved to `memory/newsletter-drafts/YYYY-MM-DD-issue.md`, with 3 subject line options.

**How to get the most out of it:**
Quill's drafts are 80% of the way there. Your job is the remaining 20%: inject your personal stories, real data from this week, and specific examples only you know. The most effective newsletter issues feel personal because they are.

Schedule your "newsletter review" block for Thursday morning. Read Quill's draft, add your voice, and send by Thursday evening.

**Customization:** Adjust the 11-section structure in the newsletter playbook. Add your editorial calendar so Quill knows what's coming. Include specific recurring sections unique to your newsletter.

---

### 9. Judge — Content Performance Scorer

**Schedule:** 3:00 PM every Friday
**Model:** Claude Sonnet
**Tier:** Pro

**What it does:**
Judge scores everything published that week across social, blog, and newsletter. Each piece gets a 1–10 score across three dimensions: Reach, Resonance, and Return.

Beyond scoring, Judge:
- Identifies the week's winner and the underperformer
- Surfaces patterns in what's working
- Gives 3 specific recommendations for next week
- Maintains a running performance scoreboard

**How to get the most out of it:**
Treat Judge's recommendations seriously. If Judge says "do more Perspective content," try it for 2 weeks before dismissing it. The scoring improves over time as it learns your patterns.

Read Judge's report on Friday afternoon. Use the patterns section to update the social strategy playbook with what's actually working for your audience.

**Customization:** Add custom metrics you want tracked. Adjust the scoring dimensions. Add industry benchmarks to compare against.

---

### 10. Hunter — Warm Outbound Lead Finder

**Schedule:** 7:30 AM daily
**Model:** Claude Sonnet
**Tier:** Pro

**What it does:**
Hunter scans Reddit, X, LinkedIn, and other accessible sources every morning looking for people actively signaling they need what you offer. It's not cold prospecting — it's finding warm signals.

Every lead gets scored (HOT/WARM/NURTURE) using the scoring rubric from the outbound playbook. HOT leads get a recommended first message. The pipeline in `memory/lead-pipeline.md` is updated.

**How to get the most out of it:**
Contact HOT leads the same day Hunter surfaces them. The signal that made them hot has a short shelf life. If someone asked "can anyone recommend an X tool?" on Reddit this morning, contact them today — not next week.

Use Hunter's recommended first messages as a starting point, but personalize them. Reference something specific about their post or profile.

**Customization:** Refine the ICP definition in the outbound leads playbook. Add specific subreddits, X search queries, or LinkedIn search parameters that match your ICP. The more specific, the better quality leads.

---

### 11. Prospector — Lead Generation Batch

**Schedule:** 6:00 AM Monday, Wednesday, and Friday
**Model:** Claude Sonnet
**Tier:** Pro

**What it does:**
While Hunter is opportunistic (finds warm signals each day), Prospector is systematic. Three times a week, it runs a structured batch across 5 source types:
- Reddit batch search (5 subreddits, rotating queries)
- X/Twitter batch search (5 targeted searches)
- Job board intelligence (companies hiring = buying signal)
- Competitor displacement (unhappy competitor users)
- Community batch (industry-specific communities)

Every prospect is scored. HOT and WARM prospects are added to the pipeline. Full batch saved to `memory/prospector/`.

**How to get the most out of it:**
Prospector generates volume. Hunter generates urgency. Use them together: Prospector fills your warm pipeline, Hunter tells you who to contact today.

Review Prospector's batches on Monday, Wednesday, and Friday. The batch files give you context on every lead — use that context to personalize outreach.

**Customization:** Tune the scoring rubric based on what actually converts. Add competitor-specific search queries for companies where you have the strongest differentiation. Adjust batch size based on your outreach capacity.

---

### 12. Standup — Daily Agent Audit

**Schedule:** 9:30 AM daily
**Model:** Claude Haiku
**Tier:** Pro

**What it does:**
Standup is the meta-agent — it audits all the other agents. Every morning, it checks:
- Which agents ran (and which might have missed a run)
- What output is pending your review
- Any blockers (empty content queue, cold HOT leads, etc.)
- Quick metrics snapshot across all systems

The Standup report is short and factual — a status check, not a deep dive.

**How to get the most out of it:**
Start your morning with the Standup report. It's your dashboard summary before you open your dashboards. If Standup says "3 HOT leads going cold," that's your first action.

Standup uses Claude Haiku (the fast, lightweight model) because it doesn't need deep reasoning — it needs to read files and summarize status. This keeps it fast and cheap.

**Customization:** Add other systems you want Standup to audit. Configure the alert thresholds (e.g., alert if content queue is empty, alert if a HOT lead has been sitting for 12 hours).

---

## Agent Interaction Map

How agents feed each other:

```
Oracle (Mon 7 AM)
    └─→ Hype reads Oracle brief for content angles
    └─→ Ghost reads Oracle brief for blog topics
    └─→ Quill reads Oracle brief for newsletter theme

Scout (Daily 8:30 AM)
    └─→ Hunter picks up ICP signals Scout flags

Hype (Daily 9 AM)
    └─→ Megaphone posts from Hype's approved output

Prospector + Hunter (Daily/3x week)
    └─→ Both write to memory/lead-pipeline.md
    └─→ Standup reads pipeline status

Ghost (Tue/Thu)
    └─→ Saves drafts to memory/blog-drafts/
    └─→ Judge evaluates Ghost's output on Friday

Quill (Wed)
    └─→ Saves drafts to memory/newsletter-drafts/
    └─→ Judge evaluates Quill's send metrics on Friday

Mingle + Megaphone (Daily)
    └─→ Judge scores all posted content on Friday
    └─→ Standup checks posting activity

Standup (Daily 9:30 AM)
    └─→ Reads output from all agents
    └─→ Reports to you on what needs attention
```

---

## Model Selection Rationale

| Agent | Model | Why |
|-------|-------|-----|
| Pulse | Sonnet | Balanced — needs synthesis + speed |
| Hype | Sonnet | Creative quality matters |
| Megaphone | Haiku | Simple execution, no deep reasoning |
| Mingle | Sonnet | Reply quality matters for brand impression |
| Ghost | Sonnet | Writing quality, SEO knowledge |
| Scout | Sonnet | Pattern recognition across sources |
| Oracle | Opus | Strategic reasoning, editorial judgment |
| Quill | Opus | Highest writing quality — flagship output |
| Judge | Sonnet | Analysis and pattern recognition |
| Hunter | Sonnet | Signal interpretation, ICP judgment |
| Prospector | Sonnet | Scoring accuracy, batch processing |
| Standup | Haiku | Status check — speed over depth |

Upgrade any Sonnet agent to Opus for higher quality output at higher cost. Downgrade Opus agents to Sonnet to reduce cost (quality will drop slightly).
