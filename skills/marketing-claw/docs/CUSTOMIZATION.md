# Customization Guide

**How to make Marketing Claw your own.**

Marketing Claw is fully customizable. Every agent prompt, template, playbook, and schedule can be modified. This guide covers everything from quick tweaks to complete overhauls.

---

## The Customization Hierarchy

There are three ways to customize, in order of recommended preference:

1. **Memory files** — The fastest way. Add notes, priorities, and context to memory files that agents read.
2. **Templates** — Edit `SOUL.md`, `USER.md`, etc. to change how agents understand your brand.
3. **Agent configs** — Edit `agents/*.json` directly to change schedules, models, and prompts.

Start with memory files. Move to templates when you have lasting changes. Edit agent configs when you need structural changes.

---

## Quick Customizations

### Change What Agents Know About Your Brand

Edit `SOUL.md` (in your workspace) to update:
- Brand voice and tone
- ICP description
- Competitor list
- Operating principles

Every agent reads SOUL.md. Changes here affect all agents immediately.

### Update the Content Queue

Add items to `memory/content-queue.md` in this format:

```markdown
## Blog Queue
- [ ] [OUTLINE] Title — Target keyword — Due YYYY-MM-DD
- [ ] [DRAFT] Title — Word count target — Due YYYY-MM-DD

## Social Queue
- [ ] [READY] Draft copy here... — Platform — Due YYYY-MM-DD
- [ ] [DRAFT] Idea description — Platform — Date
```

Ghost picks up blog items. Megaphone posts social items marked [READY].

### Give Agents Specific Topics

Add a file `memory/content-brief.md` with specific topics, campaigns, or angles to prioritize:

```markdown
# Content Brief — [Month Year]

## Priority Topics This Month
1. [Topic] — Reason: [why it's important right now]
2. [Topic] — Key angle: [what to say about it]
3. [Topic] — ICP pain point: [what it solves for them]

## Upcoming Campaigns
- [Campaign name] — [Dates] — [Goal]

## Topics to Avoid
- [Topic] — Reason: [why]
```

Hype, Ghost, Oracle, and Quill will incorporate these priorities.

---

## Changing Agent Schedules

All schedules use standard cron expressions. Edit the `schedule.expr` field in any `agents/*.json` file:

```json
"schedule": {
  "kind": "cron",
  "expr": "0 8 * * *",
  "tz": "America/New_York"
}
```

**Common cron patterns:**

| Pattern | Meaning |
|---------|---------|
| `0 8 * * *` | Daily at 8:00 AM |
| `0 8 * * 1` | Mondays at 8:00 AM |
| `0 8 * * 1,3,5` | Mon, Wed, Fri at 8:00 AM |
| `0 8 * * 2,4` | Tue, Thu at 8:00 AM |
| `0 9,16 * * *` | Daily at 9 AM and 4 PM |
| `0 8 1 * *` | 1st of every month at 8 AM |

After editing, re-register the agent:
```bash
openclaw cron remove pulse
openclaw cron add --config agents/pulse.json
```

---

## Changing Agent Models

Edit the `model` field in any agent config:

```json
"model": "sonnet"   // Claude Sonnet — balanced quality and speed
"model": "opus"     // Claude Opus — highest quality, slower and costlier
"model": "haiku"    // Claude Haiku — fastest and cheapest, lighter tasks
```

**Upgrade recommendations:**
- Ghost → Opus if blog quality is your priority
- Hype → Opus for consistently stronger content ideas
- Hunter → Opus for more nuanced lead scoring

**Downgrade recommendations:**
- Oracle → Sonnet if cost is a concern (some quality trade-off)
- Quill → Sonnet for less critical newsletter weeks

---

## Customizing Agent Prompts

Edit the `prompt` field in any `agents/*.json` file. The prompts support these variables (filled by setup.mjs):

| Variable | Value |
|----------|-------|
| `{{BRAND}}` | Your brand name |
| `{{USER_NAME}}` | Your name |
| `{{ROLE}}` | Your job title |
| `{{MISSION}}` | One-line mission |
| `{{TONE}}` | Brand tone |
| `{{ICP}}` | Ideal customer profile |
| `{{COMPETITORS}}` | Competitor list |
| `{{SOCIAL_HANDLE}}` | Social handle |
| `{{SOCIAL_PLATFORM}}` | Primary platform |
| `{{NEWSLETTER_PLATFORM}}` | Newsletter tool |
| `{{ANALYTICS_TOOL}}` | Analytics tool |
| `{{TIMEZONE}}` | Your timezone |
| `{{CHAT_ID}}` | Telegram chat ID |

If you re-run `node setup.mjs`, all variables are re-filled. If you edit prompts manually, keep the variable syntax to preserve the ability to re-run setup.

---

## Customizing the Playbooks

The playbooks in `playbooks/` (and `~/.openclaw/workspace/playbooks/`) are referenced by agents at runtime. Editing them changes how agents behave.

### X Engagement Playbook
Customize the 10 reply frameworks for your specific voice. Add your own frameworks. Update the daily targets based on your capacity.

Key sections to personalize:
- **Voice Guide Template** — Fill in the 3 adjectives, examples of posts that sound right and wrong
- **Banned words list** — Add your brand-specific banned phrases
- **Timing Reference** — Adjust for your audience's timezone and peak hours

### Social Strategy Playbook
Adjust the 5-pillar allocations based on what's working:

```markdown
### Pillar 1: Expertise (adjust %)
### Pillar 2: Story (adjust %)
```

Update the **Weekly Posting Cadence Template** based on your actual capacity. If you can only post 3x/week, adjust accordingly.

Update **Growth Targets** after Month 1 with your actual baselines.

### Newsletter Playbook
Add recurring sections specific to your newsletter. The 11-section structure is a template — add, remove, or rename sections to match your format.

Add your specific format rules to the **Format Rules** section (column width, font, CTA placement, etc.).

### Outbound Leads Playbook
**Most important customization:** Fill in the ICP Definition Framework completely. The more specific your ICP, the better Hunter and Prospector perform.

```markdown
### Firmographic Profile
Company type: B2B SaaS
Company stage: Series A–B
Company size: 20–200 employees
Revenue range: $1M–$20M ARR
Industry: [Your exact industry]
```

Add specific subreddits, X search queries, and LinkedIn search parameters for your ICP.

Update the **Multi-Touch Outreach Sequence** with your actual voice — the templates are starting points.

---

## Adding a New Agent

To create a custom agent:

1. Copy an existing agent config:
   ```bash
   cp agents/hype.json agents/my-custom-agent.json
   ```

2. Edit the config:
   ```json
   {
     "name": "My Agent — What It Does",
     "schedule": { "kind": "cron", "expr": "0 14 * * *", "tz": "{{TIMEZONE}}" },
     "tier": "pro",
     "model": "sonnet",
     "description": "What this agent does in one sentence",
     "prompt": "You are [Agent Name]...\n\n[Full detailed prompt]"
   }
   ```

3. Register it:
   ```bash
   openclaw cron add --config agents/my-custom-agent.json
   ```

**Ideas for custom agents:**
- **Inbox monitor** — Reads your email inbox and surfaces anything marketing-relevant
- **Ad performance** — Weekly paid ad performance digest
- **Partnership scout** — Monitors for partnership and collab opportunities
- **Podcast scout** — Identifies podcasts your ICP listens to for outreach
- **Review monitor** — Watches G2, Capterra, and app stores for new reviews

---

## Disabling Agents

To pause an agent without deleting it:
```bash
openclaw cron pause pulse
```

To remove an agent entirely:
```bash
openclaw cron remove pulse
```

To resume:
```bash
openclaw cron resume pulse
```

---

## Multi-Brand Setup

If you manage marketing for multiple brands:

1. Run `node setup.mjs` for each brand with different answers
2. Save agent configs to brand-specific directories:
   ```
   workspace/brand-a/agents/
   workspace/brand-b/agents/
   ```

3. Use different Telegram channels for each brand's delivery

Note: Running 24 agents (12 per brand) is resource-intensive. Pro tier for one brand + Starter for another is a common multi-brand setup.

---

## Connecting Analytics Tools

Pulse and Judge perform better with real analytics data. Connect your tool to OpenClaw:

**Fathom Analytics:**
- Configure Fathom API key in OpenClaw settings
- Pulse will pull real visitor counts, top pages, and referral sources

**Google Analytics 4:**
- Connect GA4 via OpenClaw's Google integration
- Pulse will pull sessions, conversions, and top pages

**Plausible:**
- Configure Plausible API and site domain in OpenClaw settings
- Pulse will pull stats from the Plausible API

Without integration, agents use estimation and note that real data would require manual input. Integration is not required — it's an upgrade.

---

## Calibrating Lead Quality

After Hunter and Prospector have been running for 2–4 weeks, calibrate the scoring rubric based on which leads actually converted:

1. Review `memory/prospector/` and `memory/lead-pipeline.md`
2. Identify which signals produced actual conversations or deals
3. Update the scoring rubric in `playbooks/outbound-leads.md`:
   - Increase weight for signals that converted
   - Decrease weight for signals that didn't
4. Add that context to SOUL.md: "Leads from Reddit r/[subreddit] that mention [specific pain] convert at 3x the rate of other sources."

This feedback loop makes the lead agents significantly more accurate over time.

---

## Content Voice Calibration

After Ghost and Hype have been running for a month:

1. Judge will have scored all content and identified patterns
2. Update SOUL.md's brand voice section with what's working: "Posts that use first-person stories get 2x engagement vs. generic advice posts."
3. Add specific voice rules to the social strategy playbook
4. Add example posts (winners from Judge's scoreboard) to SOUL.md's voice guide

The agents learn from what you tell them. Writing explicit rules based on your data produces better output than vague style guidance.

---

## The Feedback Loop

The Marketing Claw system is designed to get better over time:

```
Agents produce output
    → Judge scores it
    → You update playbooks and SOUL.md with what's working
    → Agents read updated context
    → Output improves
```

Block 30 minutes monthly to review Judge's scoreboard, update the playbooks, and calibrate your ICP definition. This single habit compounds significantly over 6–12 months.
