---
name: yagni
description: "Apply YAGNI (You Aren't Gonna Need It) to a feature, plan, design, or diff: separate what is needed now from speculation and cut the rest. Use proactively when a plan includes functionality for hypothetical future requirements, configurability nobody asked for, abstractions with one implementation, or 'while we're at it' additions. Also use when someone says 'yagni', 'do we really need this', 'is this premature', or asks to trim scope."
argument-hint: "[feature, plan, or code to challenge]"
---

Apply YAGNI to: $ARGUMENTS

If no argument is given, apply it to the plan, design, or change under discussion.

## The principle

Ron Jeffries (XP): "Always implement things when you actually need them, never when you just foresee that you will need them." Speculative functionality costs now (build, review, maintenance, cognitive load) against a benefit that usually never arrives, and when it does arrive, it arrives with better information than you have today.

## Procedure

1. List every distinct element of the proposal: features, options, parameters, abstractions, config values, error paths, layers.
2. For each element, ask one question: **is there a concrete, current requirement for this?** Evidence means a user asking today, a failing case today, or a hard external constraint. "We might need it later", "it's more flexible", and "best practice" are not evidence.
3. Classify each element:
   - **Keep**: needed now, evidence named.
   - **Delete**: speculative, and rebuilding it later costs about the same as building it now.
   - **Defer with a note**: speculative, but a later retrofit would be genuinely expensive (data migrations, published API contracts, wire formats). Name the retrofit cost; this is the only class where foresight pays.
4. Output the trimmed proposal: what remains, what was cut, one line of justification per cut.

## Calibration

- YAGNI removes speculative scope, not rigour: input validation at trust boundaries, error handling that prevents data loss, security, and accessibility stay regardless.
- YAGNI assumes you can add the feature later cheaply; that assumption holds only with tests and a codebase safe to refactor. If those are missing, say so rather than pretending deferral is free.
- One irreversible-decision exception per proposal is plausible; three "irreversible" exceptions means the analysis has gone soft.

## Output format

```markdown
## YAGNI: <proposal>

| Element | Verdict | Why |
|---------|---------|-----|
| ...     | Keep / Delete / Defer | one line |

### Trimmed version
<the proposal with only the Keep items>
```
