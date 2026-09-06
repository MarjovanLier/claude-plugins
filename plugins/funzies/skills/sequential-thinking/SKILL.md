---
name: sequential-thinking
description: "Break a problem into numbered reasoning steps, each carrying its evidence, assumptions, and a stated confidence, with support for revising and branching earlier steps. Use only on explicit request: \"use sequential thinking\", \"number the reasoning steps with confidence\", \"show the revision branches\", or a direct ask for a confidence-scored decision trace. Not for ordinary step-by-step explanations, routine planning or debugging, neutral assumption analysis (use first-principles), or scope trimming (use yagni)."
version: 1.0.2
---

# Sequential Thinking with First Principles

A problem-solving skill that integrates first principles thinking with confidence-scored sequential reasoning: break the problem into numbered thoughts, track the assumptions and fundamental truths behind each, and state how much evidence each step rests on.

## Methodology

### Thought Structure

Each thought in the sequential thinking process should include:

1. **Thought Number**: Current step (e.g., "Thought 3/7")
2. **Core Analysis**: The main reasoning for this step
3. **Confidence Metrics**:
   - **Confidence Score**: 0.0-1.0, using the single scale under Confidence Calibration below
   - **Confidence Reasoning**: Explicit rationale for the score
   - **Uncertainty Factors**: Specific sources of uncertainty
4. **First Principles Elements**:
   - **Assumptions Identified**: What we're taking for granted
   - **Assumptions Challenged**: Which assumptions we've questioned
   - **Fundamental Truths**: Core facts that can't be reduced further
   - **Reasoning from Zero**: Are we building from fundamentals or copying analogies?
   - **Analogies Avoided**: Industry standards we're deliberately rejecting
   - **Evidence Base**: Factual support for our reasoning
5. **Next Step Indicator**: Whether more thoughts are needed

Start with an estimated total and adjust the stated {Total} as understanding deepens; reference earlier thoughts when building on them.

### First Principles Approach

When applying first principles thinking:

1. **Identify Assumptions**: List everything we're assuming to be true
2. **Challenge Assumptions**: Question each assumption - is it really fundamental?
3. **Break Down to Fundamentals**: Reduce to basic truths that can't be simplified further
4. **Reconstruct from Zero**: Build solution from fundamentals, not by analogy
5. **Avoid Analogies**: Don't copy what others do - reason from first principles
6. **Document Evidence**: Base conclusions on verifiable facts

### Confidence Calibration

#### Confidence Score Scale (0.0-1.0)

- **0.9-1.0 (Very High)**: Strong evidence, clear reasoning, high certainty, verified facts
- **0.8-0.89 (High)**: Good evidence, solid reasoning, minor uncertainties
- **0.6-0.79 (Medium)**: Some evidence, reasonable approach, notable uncertainties
- **0.4-0.59 (Low)**: Limited evidence, uncertain approach, significant doubts
- **0.0-0.39 (Very Low)**: Minimal evidence, speculative reasoning, high uncertainty

#### Calibration Process

Maintain calibrated confidence by:

1. **State confidence**: give the level (0.0-1.0) using the scale above
2. **Explain reasoning**: say why that level, in terms of the evidence at hand
3. **Identify uncertainties**: list the specific factors that introduce doubt
4. **Adjust based on evidence**: update confidence as new information emerges
5. **Be honest**: a low score on a novel problem is useful information, not a failure

Confidence is a judgement about the evidence available in this request. The scale
is a convention for this conversation, not an empirically calibrated instrument:
never present a score as measured, and never borrow an effect size from the
literature to back one. There is no cross-session store of past accuracy, so
never report a historical hit rate, a previous-accuracy figure, or any other
measured calibration statistic. Those numbers would be invented.

## Output Format

Structure thoughts using clear markdown formatting:

```markdown
## 💭 Thought {N}/{Total} [{Confidence Level}: {Score}]

{Core reasoning and analysis}

### 🎯 Confidence Assessment
- **Score**: {0.0-1.0} ({Level})
- **Reasoning**: {Why this confidence level}
- **Uncertainty Factors**: {List specific sources of uncertainty}

### 🔧 First Principles Analysis
- **Assumptions Identified**: {List assumptions}
- **Fundamental Truths**: {Core facts}
- **Analogies Avoided**: {Conventions rejected}
- **Evidence Base**: {Supporting facts}
- **Reasoning from Zero**: {Yes/No - are we building from fundamentals?}

### ➡️ Next Step
{Whether another thought is needed and what it will address}
```

### Special Cases

**Revision** (🔄): When reconsidering a previous thought:
```markdown
## 🔄 Revision: Thought {N}/{Total} (revising thought {X})
```

**Branching** (🌿): When exploring alternative reasoning paths:
```markdown
## 🌿 Branch: Thought {N}/{Total} (from thought {X}, ID: {branch-id})
```

## Example (illustrative)

One thought, showing the shape only; the content is invented.

```markdown
## 💭 Thought 2/5 [Medium: 0.65]

The slow path is the per-row lookup inside the loop, not the query itself.

### 🎯 Confidence Assessment
- **Score**: 0.65 (Medium)
- **Reasoning**: the profile points at the loop; the query plan is unverified
- **Uncertainty Factors**: production dataset size unknown

### 🔧 First Principles Analysis
- **Assumptions Identified**: "the database is the bottleneck"
- **Fundamental Truths**: N round trips cost more than one
- **Analogies Avoided**: "add a cache" as the reflex answer
- **Evidence Base**: 1,200 lookups per request in the trace
- **Reasoning from Zero**: Yes - measured the actual request path

### ➡️ Next Step
Needed: check whether one batched query removes the loop
```

A revision reuses the same block with the 🔄 header and names the thought it revises; a branch uses the 🌿 header and a branch id.

## When to Revise or Branch

### Revise (🔄) When:
- New evidence contradicts previous reasoning
- Earlier assumption proven false
- Better approach becomes apparent
- Confidence drops significantly
- Logical error discovered in prior thought

### Branch (🌿) When:
- Multiple valid approaches exist
- High uncertainty about best path
- Want to explore alternative without abandoning main line
- Testing hypothesis requires different assumptions
- Parallel reasoning paths both seem promising
