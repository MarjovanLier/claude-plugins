---
name: first-principles
description: "Break down any problem using first-principles thinking. Decompose to fundamental truths, discard assumptions, rebuild from scratch. Use proactively whenever a decision rests on unexamined assumptions: architecture or design choices with multiple viable approaches, should-we-build-this questions, make-versus-buy calls, cost or effort estimates that feel high, requirements taken on faith, or any justification of the form 'best practice', 'industry standard', or 'we've always done it this way'. Also use when someone is stuck, facing a complex decision, wants trade-offs examined, or wants to rethink something from the ground up."
argument-hint: "[problem or question]"
---

Break down the following problem using first-principles reasoning. No analogies to other solutions. No "best practices". No "industry standard". Start from what is physically, logically, or mathematically true and rebuild.

The problem: $ARGUMENTS

If no problem is stated above, take the problem under discussion in the conversation and state it in one sentence before starting.

## Process

### 1. State the goal
What specific outcome are we trying to achieve? One sentence. If it takes more, the goal isn't clear yet: clarify before continuing.

### 2. List every assumption
Write out everything currently believed about this problem: constraints, costs, timelines, approaches, "the way it's done". Number them. Be exhaustive. Include assumptions so obvious they feel silly to write down; those are often the most dangerous.

### 3. Challenge each assumption
For every assumption, ask:
- Is this a law of physics/logic/mathematics, or is it a convention someone invented?
- What evidence supports this? Who said it and what was their context?
- What happens if this assumption is simply wrong?

Mark each assumption: **fundamental** (physically/logically unavoidable) or **conventional** (someone decided this, and someone can un-decide it).

### 4. Identify the fundamental truths
From the wreckage of challenged assumptions, collect only what survived: the things that are true regardless of convention, opinion, or tradition. These are your building blocks. There should be surprisingly few.

### 5. Rebuild from fundamentals
Using only the surviving truths as raw materials, construct a solution. Ignore every existing approach. Ask: "If none of the current solutions existed and I only knew these truths, what would I build?"

### 6. Reality-check the rebuild
Compare your rebuilt solution against the original approach:
- Where are they the same? (Validates the original)
- Where do they differ? (Opportunities or blind spots)
- What would switching cost, and does the difference pay for it?
- What's the simplest experiment to test the difference?

### 7. Define the action
End with one of:
- **A decision**: what to do and why, based on the analysis
- **An experiment**: the smallest test that resolves the biggest uncertainty
- **A refined question**: if the decomposition revealed the real problem is different from the stated one

## Rules

- No appeals to authority ("experts say", "Google does it this way")
- No analogies as evidence (analogies illustrate, they don't prove)
- Quantify where possible: numbers expose fuzzy thinking
- Scale depth to stakes: for small questions, compress steps 2 to 4 into a paragraph
- If a step produces nothing useful, say so and move on. Don't pad
- Prioritise clarity over completeness. A clear partial answer beats a thorough muddy one
