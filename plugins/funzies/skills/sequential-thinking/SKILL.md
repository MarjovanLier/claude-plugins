---
name: sequential-thinking
description: "Break a problem into numbered reasoning steps, each carrying its evidence, assumptions, and a stated confidence, with support for revising and branching earlier steps. Use only on explicit request: \"use sequential thinking\", \"number the reasoning steps with confidence\", \"show the revision branches\", or a direct ask for a confidence-scored decision trace. Not for ordinary step-by-step explanations, routine planning or debugging, neutral assumption analysis (use first-principles), or scope trimming (use yagni)."
version: 1.0.1
---

# Sequential Thinking with First Principles

A problem-solving skill that integrates first principles thinking with confidence-scored sequential reasoning. Combines Elon Musk's problem decomposition methodology with Yang et al. (2024) confidence scoring research to systematically break down complex problems while tracking assumptions, fundamental truths, and uncertainty.

## Research Foundation

The confidence scoring methodology in this skill is based on established research:

- **Yang, Tsai, and Yamada (2024)**: "On Verbalized Confidence Scores for LLMs" - Foundational methodology for verbalising confidence levels
- **Li et al. (2025)**: "As Confidence Aligns: Exploring the Effect of AI Confidence on Human Self-confidence in Human-AI Decision Making"
- **Ma et al. (2024)**: "Are You Really Sure? Understanding the Effects of Human Self-Confidence Calibration in AI-Assisted Decision Making" (CHI 2024)

These motivate the format below; none of them measures this skill, so treat them as background rather than evidence that its scores are calibrated. Reported effect sizes belong to each paper's own task and population, and do not transfer to a stated confidence in a conversation.

## When to Use

### Core Use Cases
- Breaking down complex problems into manageable steps with room for revision
- Planning and design where the full scope might not be clear initially
- Analysis that might need course correction
- Problems where the full scope might not be initially clear
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs filtering out

### Enhanced Confidence Scoring Use Cases
Particularly valuable for:
- **High-stakes decision making**: Where understanding certainty levels is critical
- **Complex problem solving**: When multiple valid approaches exist
- **Collaborative reasoning**: When confidence alignment improves team performance
- **Risk assessment**: When uncertainty quantification affects outcomes
- **Research and analysis**: When evidence quality varies significantly

### First Principles Use Cases
- Challenging industry standards or conventional approaches
- Building solutions from fundamental truths rather than analogies
- System design and architecture decisions
- Debugging complex issues with multiple potential root causes
- Avoiding cargo cult programming and "because everyone does it" reasoning

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

### First Principles Approach

When applying first principles thinking:

1. **Identify Assumptions**: List everything we're assuming to be true
2. **Challenge Assumptions**: Question each assumption - is it really fundamental?
3. **Break Down to Fundamentals**: Reduce to basic truths that can't be simplified further
4. **Reconstruct from Zero**: Build solution from fundamentals, not by analogy
5. **Avoid Analogies**: Don't copy what others do - reason from first principles
6. **Document Evidence**: Base conclusions on verifiable facts

### Confidence Calibration (Yang et al. 2024)

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

Confidence is a judgement about the evidence available in this request. There is
no cross-session store of past accuracy, so never report a historical hit rate,
a previous-accuracy figure, or any other measured calibration statistic. Those
numbers would be invented.

#### Confidence Best Practices

1. **Always explain your confidence**: Justify your score with specific reasoning
2. **Be specific about uncertainty**: Identify exact sources of doubt
3. **Consider multiple dimensions**: Evidence quality, problem complexity, time constraints, domain expertise
4. **Be honest about limitations**: Acknowledge what you don't know
5. **Update dynamically**: Revise confidence as information changes

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

## Examples

### Example 1: System Architecture Decision

```markdown
## 💭 Thought 1/5 [Medium: 0.65]

Evaluating whether to use microservices or monolithic architecture for the genealogy scraper.

### 🎯 Confidence Assessment
- **Score**: 0.65 (Medium)
- **Reasoning**: Clear understanding of requirements, but uncertain about scale trajectory
- **Uncertainty Factors**:
  - Unknown future data volume growth
  - Uncertain deployment environment constraints
  - Unclear team size evolution

### 🔧 First Principles Analysis
- **Assumptions Identified**:
  - "Microservices are modern and therefore better"
  - "Monoliths don't scale"
  - "We need to plan for massive scale from day one"
- **Fundamental Truths**:
  - System complexity increases with service boundaries
  - Network calls are slower than in-process calls
  - Operational overhead scales with number of deployable units
- **Analogies Avoided**: "Everyone uses microservices" - not a valid reason
- **Evidence Base**:
  - Current data: 10K records/day processing rate
  - Team size: 1 developer
  - Deployment: Single server
- **Reasoning from Zero**: Yes - evaluating based on actual requirements, not trends

### ➡️ Next Step
Needed - will analyse deployment complexity and operational overhead trade-offs
```

### Example 2: Bug Investigation

```markdown
## 💭 Thought 3/6 [High: 0.85]

The cookie persistence issue stems from Panther and Guzzle using separate cookie storage mechanisms.

### 🎯 Confidence Assessment
- **Score**: 0.85 (High)
- **Reasoning**: Code inspection shows two distinct CookieJar implementations; logs confirm desynchronisation
- **Uncertainty Factors**:
  - Haven't verified Panther's internal cookie storage format
  - Possible race conditions not yet tested

### 🔧 First Principles Analysis
- **Assumptions Challenged**:
  - "Browser cookies automatically sync to HTTP client" - FALSE
  - "Panther uses standard curl cookie format" - UNVERIFIED
- **Fundamental Truths**:
  - Browsers and HTTP clients maintain separate cookie stores by default
  - Cookie synchronisation requires explicit bridging code
  - File-based cookie storage needs consistent format
- **Evidence Base**:
  - Source code: Panther uses BrowserKit, Guzzle uses FileCookieJar
  - Logs show authentication succeeding in browser but failing in API calls
- **Reasoning from Zero**: Yes - traced actual data flow through both systems

### ➡️ Next Step
Needed - will design cookie synchronisation service to bridge the two systems
```


## Best Practices

### Core Thinking Process

1. **Start with Estimation**: Begin with estimated total thoughts, adjust dynamically as understanding deepens
2. **Document Reasoning**: Make thinking explicit and traceable
3. **Maintain Context**: Reference previous thoughts when building on earlier analysis
4. **Filter Irrelevant Information**: Focus on what matters for the current problem

### Confidence Calibration

5. **Be Honest About Confidence**: Low confidence is valuable information, not a failure
6. **Explain Every Score**: Provide specific reasoning for confidence levels
7. **Update Dynamically**: Revise confidence as new evidence emerges
8. **Identify Uncertainty Sources**: Be specific about what introduces doubt

### First Principles Thinking

9. **Challenge Everything**: Especially "everyone does it this way" assumptions
10. **Find Fundamental Truths**: Break down to irreducible facts
11. **Avoid Analogies**: Build from first principles, not by copying
12. **Document Evidence**: Base conclusions on verifiable facts
13. **Reason from Zero**: Start from fundamentals, not industry standards

### Revision and Branching

14. **Revise Freely**: Better to revise than continue down wrong path
15. **Branch When Uncertain**: Explore alternatives rather than committing prematurely
16. **Mark Revisions Clearly**: Use 🔄 prefix and indicate which thought is being reconsidered
17. **Track Branches**: Use 🌿 prefix and assign branch IDs for alternative reasoning paths
18. **Extend Thoughts**: Adjust the stated {Total} when the problem proves more complex

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

### Example Revision:

```markdown
## 🔄 Revision: Thought 4/8 (revising thought 2) [Medium: 0.65]

After analysing the actual API response format, my earlier assumption about GraphQL was incorrect.

### 🎯 Confidence Assessment
- **Score**: 0.65 (Medium)
- **Reasoning**: Clear evidence from API inspection, but implementation approach still has uncertainty
- **Uncertainty Factors**:
  - Haven't tested all edge cases
  - Response format might vary by endpoint

### 🔧 First Principles Analysis
- **Assumptions Challenged**: "MyHeritage uses standard GraphQL" - WRONG, uses multipart/form-data POST
- **Fundamental Truths**: Actual HTTP request format is multipart/form-data with bearer token
- **Evidence Base**: Network inspection shows Content-Type: multipart/form-data
- **Reasoning from Zero**: Yes - traced actual network traffic instead of assuming standards

### ➡️ Next Step
Needed - will implement multipart request handler based on actual format
```

### Example Branch:

```markdown
## 🌿 Branch: Thought 5a/8 (from thought 4, ID: alternative-cache-strategy) [High: 0.80]

Exploring Redis caching as alternative to filesystem cache.

### 🎯 Confidence Assessment
- **Score**: 0.80 (High)
- **Reasoning**: Redis benefits well-documented, but migration effort uncertain
- **Uncertainty Factors**:
  - Unknown performance impact
  - Infrastructure changes needed

### 🔧 First Principles Analysis
- **Assumptions Challenged**: "Filesystem cache is sufficient"
- **Fundamental Truths**:
  - In-memory caching is faster than disk I/O
  - Redis provides atomic operations and TTL management
- **Analogies Avoided**: Not copying "use Redis for everything" pattern - evaluating actual need
- **Evidence Base**: Current cache has 14-day TTL, 10K+ API responses cached

### ➡️ Next Step
Needed - will benchmark filesystem vs Redis for actual usage patterns
```

## Anti-Patterns to Avoid

### Confidence Calibration Anti-Patterns
- ❌ **Skipping confidence assessment**: Always provide explicit scores with reasoning
- ❌ **Artificial confidence**: Being honest about uncertainty is more valuable than appearing certain
- ❌ **Missing uncertainty factors**: Identify specific sources of doubt, don't just give a score
- ❌ **Static confidence**: Update as new evidence emerges

### First Principles Anti-Patterns
- ❌ **Copying by analogy**: "Everyone does it this way" is not a reason
- ❌ **Unchallenged assumptions**: Question everything, especially industry standards
- ❌ **Missing fundamentals**: Break down to irreducible truths, not just one level
- ❌ **Cargo cult programming**: Copying patterns without understanding why they exist
- ❌ **Appeal to authority**: "X company does it" doesn't make it right for your context

### Process Anti-Patterns
- ❌ **Forgetting to revise**: Better to backtrack than continue down wrong path
- ❌ **Linear thinking**: Some problems need branching and exploration
- ❌ **Fixed thought counts**: Raise the stated {Total} when the problem proves complex
- ❌ **Context loss**: Reference and build on previous thoughts
- ❌ **Irrelevant detail**: Filter out information that doesn't serve the analysis

## Integration with Development Workflow

- **Planning Phase**: Use sequential thinking to break down features
- **Architecture Decisions**: Apply first principles to avoid cargo culting
- **Debugging**: Track confidence in hypotheses, revise as evidence emerges
- **Code Review**: Challenge assumptions in implementation approaches
- **Performance Optimisation**: Reason from fundamental algorithmic complexity

