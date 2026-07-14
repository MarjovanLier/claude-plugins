# funzies

Claude Code plugin bundling fun thinking-style skills.

## Skills

| Skill | Purpose |
|-------|---------|
| `first-principles` | Break a problem down to fundamental truths, discard assumptions, and rebuild from scratch |
| `what-would-elon-do` | Analyse a problem through Elon Musk's decision-making style: the 5-step process, insane timelines, physics-first thinking |

## Usage

```bash
/first-principles <problem or decision>
/what-would-elon-do <problem or decision>
```

Both also trigger on natural phrasing ("rethink this from the ground up", "WWED").

## Agents

| Agent | Purpose |
|-------|---------|
| `elon` | First-principles decision engine for architecture, scope, and strategy questions; preloads the `what-would-elon-do` skill and keeps persistent memory of past decisions |
