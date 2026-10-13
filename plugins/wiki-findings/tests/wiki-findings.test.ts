import { expect, test } from 'claude-code/testing'

import { afterCheckpoint, currentTurn, decide, isCheckpointTurn, isMainAnswer, parseFindings } from '../hooks/register'
import type { Situation } from '../hooks/register'

const ready: Situation = {
  queued: 2,
  fired: { runs: 0, offered: 0, atContextLimit: false },
  lastOrigin: 'composer',
  isGlobalWiki: true,
  hasKey: true,
  contextPercent: 10,
}

test('only a finished main-thread answer in a person session is checked', async () => {
  expect(isMainAnswer(true, { reason: 'answer' })).toBe(true)
  expect(isMainAnswer(false, { reason: 'answer' })).toBe(false)
  expect(isMainAnswer(true, { reason: 'answer', agentId: 'a1' })).toBe(false)
  expect(isMainAnswer(true, { reason: 'aborted' })).toBe(false)
})

test('a checkpoint turn is recognised by its command marker or Skill call, not by the word', async () => {
  const typed = currentTurn([
    { role: 'user', text: 'earlier prompt', toolUses: [] },
    { role: 'user', text: '<command-message>wiki-toolkit:wiki-checkpoint</command-message>\n<command-name>/wiki-toolkit:wiki-checkpoint</command-name>', toolUses: [] },
    { role: 'user', text: 'Base directory for this skill: /x/skills/wiki-checkpoint\n\n# Wiki Checkpoint', toolUses: [] },
    { role: 'assistant', text: 'Wiki checkpoint complete', toolUses: [] },
  ])
  const called = [
    { role: 'user' as const, text: 'save this session', toolUses: [] },
    { role: 'assistant' as const, text: '', toolUses: [{ tool_use_id: 't', tool: 'Skill', input: { skill: 'wiki-toolkit:wiki-checkpoint' } }] },
  ]
  const discussed = [
    { role: 'user' as const, text: 'should wiki-checkpoint run per turn?', toolUses: [] },
    { role: 'assistant' as const, text: 'The wiki-checkpoint skill runs at episode boundaries.', toolUses: [] },
  ]

  expect(typed[0]?.text).toContain('<command-name>')
  expect(isCheckpointTurn(typed, '')).toBe(true)
  expect(isCheckpointTurn(called, '')).toBe(true)
  expect(isCheckpointTurn(discussed, 'The checkpoint runs at idle.')).toBe(false)
})

test('a checkpoint turn whose first row is a later queued prompt is known by its report', async () => {
  const turn = currentTurn([
    { role: 'user', text: '<command-name>/wiki-toolkit:wiki-checkpoint</command-name>', toolUses: [] },
    { role: 'user', text: 'also check the lint output', toolUses: [] },
    { role: 'assistant', text: 'Wiki checkpoint complete.\n- Pages created: 1', toolUses: [] },
  ])

  expect(turn[0]?.text).toBe('also check the lint output')
  expect(isCheckpointTurn(turn, 'Wiki checkpoint complete.\n- Pages created: 1')).toBe(true)
})

test('the first run waits for idle time, and only for the person at the composer', async () => {
  expect(decide(ready)).toBe('idle')
  expect(decide({ ...ready, lastOrigin: 'scheduled-trigger' })).toBe('none')
  expect(decide({ ...ready, lastOrigin: 'plugin' })).toBe('none')
})

test('nothing starts without new findings, outside the global wiki, or without an ssh identity', async () => {
  expect(decide({ ...ready, fired: { ...ready.fired, offered: 2 } })).toBe('none')
  expect(decide({ ...ready, isGlobalWiki: false })).toBe('manual')
  expect(decide({ ...ready, hasKey: false })).toBe('needs-key')
})

test('after one run, only the context limit starts a second, and never a third', async () => {
  const afterIdleRun = { ...ready, queued: 5, fired: { runs: 1, offered: 2, atContextLimit: false } }

  expect(decide(afterIdleRun)).toBe('none')
  expect(decide({ ...afterIdleRun, contextPercent: 85 })).toBe('now')
  expect(decide({ ...afterIdleRun, contextPercent: 85, fired: { runs: 1, offered: 2, atContextLimit: true } })).toBe('none')
  expect(decide({ ...afterIdleRun, contextPercent: 90, fired: { runs: 2, offered: 2, atContextLimit: true } })).toBe('none')
})

test('a first run can be the context-limit run, and then it is the only one', async () => {
  expect(decide({ ...ready, contextPercent: 81 })).toBe('now')
  expect(decide({ ...ready, queued: 4, contextPercent: 95, fired: { runs: 1, offered: 2, atContextLimit: true } })).toBe('none')
})

test('a consumed checkpoint starts the count over, a retained one marks the queue offered', async () => {
  const f = { runs: 1, offered: 1, atContextLimit: false }

  expect(afterCheckpoint(true, 3, f)).toEqual({ queued: 0, fired: { runs: 1, offered: 0, atContextLimit: false } })
  expect(afterCheckpoint(false, 3, f)).toEqual({ queued: 3, fired: { runs: 1, offered: 3, atContextLimit: false } })
})

test('parseFindings keeps routed claims and drops the rest', async () => {
  const text = `Here: {"findings": [
    {"route": "wiki", "claim": "The SSH agent was empty on 13 Oct.", "target": "pages/dev/x.md", "quote": "The agent has no identities."},
    {"route": "jira", "claim": "x"},
    {"route": "memory", "claim": "  "},
    {"route": "memory", "claim": "Answer Not now to the reload question."}
  ]} done`

  expect(parseFindings(text)).toEqual([
    { route: 'wiki', claim: 'The SSH agent was empty on 13 Oct.', target: 'pages/dev/x.md', quote: 'The agent has no identities.' },
    { route: 'memory', claim: 'Answer Not now to the reload question.', target: '', quote: '' },
  ])
  expect(() => parseFindings('no json here')).toThrow()
})
