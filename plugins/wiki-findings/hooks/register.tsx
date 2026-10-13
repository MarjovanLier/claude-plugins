import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionMessage } from 'claude-code'

import type { Fired, Status } from '../types'

// Contract: WC-57 to WC-60 on pages/dev/wiki-checkpoint-spec-finding-queue.md in ~/wiki.

const CHECKPOINT = 'wiki-toolkit:wiki-checkpoint'
// Under the 5-minute prompt cache most sessions write, so the run starts on a warm cache.
const IDLE_MS = 4 * 60_000
const CONTEXT_LIMIT = 80

const queued = atom({ plugin: 'wiki-findings', key: 'queued' } as const, 0)
const fired = atom({ plugin: 'wiki-findings', key: 'fired' } as const, { runs: 0, offered: 0, atContextLimit: false })
const status = atom({ plugin: 'wiki-findings', key: 'status' } as const, 'quiet')

const JUDGE = `You decide whether one turn of a coding assistant conversation produced knowledge worth keeping in the user's wiki or memory.

Worth keeping (FINDING):
- a discovery, conclusion or decision with lasting value
- a research finding, a data result, or a contradiction between sources
- a new entity, relationship, outreach outcome or ruled-out path
- a correction from the user, or a confirmed way of working, that should change what a future session does

Not worth keeping (SKIP): routine work, debugging steps, commands tried, build output, anything that matters only to this conversation, greetings, and questions still unanswered.

Answer with exactly one line: "FINDING: <what, under 20 words>" or "SKIP".`

const forkPrompt = (reason: string) => `[wiki-findings] This message is from the wiki-findings plugin, not the user. Do not use tools; answer in text only.

A check flagged the latest turn of this conversation: ${reason}

Draft each durable finding from the latest turn only, for the wiki checkpoint to verify and file later. State only what the conversation shows; add no figure, instruction or date it does not state. Reply with only a JSON object:
{"findings": [{"route": "wiki" or "memory", "claim": "<one or two sentences>", "target": "<likely wiki page path or memory file name, or new>", "quote": "<words from the turn that support it, under 300 characters>"}]}
If nothing is durable after all, reply {"findings": []}.`

export type Finding = { route: 'wiki' | 'memory'; claim: string; target: string; quote: string }

// A skill's body arrives as a user row of its own; the prompt that loaded it is the row before.
const isPrompt = (m: SessionMessage) =>
  m.role === 'user' && m.text.trim() !== '' && !m.toolResults?.length && !m.text.startsWith('Base directory for this skill:')

export const currentTurn = (messages: SessionMessage[]) => messages.slice(Math.max(0, messages.findLastIndex(isPrompt)))

// Matches the command marker, the Skill call or the report's opening line, never the bare word:
// a turn about the checkpoint is still checked. The report covers a turn whose first row is a later queued prompt.
export const isCheckpointTurn = (turn: SessionMessage[], answer: string) =>
  answer.includes('Wiki checkpoint complete.') ||
  turn.some(
    m =>
      m.text.includes(`<command-name>/${CHECKPOINT}</command-name>`) ||
      m.toolUses.some(t => t.tool === 'Skill' && t.input.skill === CHECKPOINT),
  )

// WC-57: a person's session, the main thread, a finished answer.
export const isMainAnswer = (isInteractive: boolean, e: { agentId?: string; reason: string }) =>
  isInteractive && e.agentId === undefined && e.reason === 'answer'

export const exchangeText = (turn: SessionMessage[]) => {
  const text = turn
    .flatMap(m => [...(m.text.trim() ? [`${m.role.toUpperCase()}: ${m.text.trim()}`] : []), ...m.toolUses.map(t => `TOOL: ${t.tool}`)])
    .join('\n')

  return text.length > 12000 ? `${text.slice(0, 4000)}\n…\n${text.slice(-8000)}` : text
}

export const parseFindings = (text: string): Finding[] => {
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as { findings?: Record<string, unknown>[] }

  return (json.findings ?? [])
    .filter(f => (f.route === 'wiki' || f.route === 'memory') && typeof f.claim === 'string' && f.claim.trim() !== '')
    .map(f => ({ route: f.route as Finding['route'], claim: String(f.claim), target: String(f.target ?? ''), quote: String(f.quote ?? '') }))
}

export type Situation = {
  queued: number
  fired: Fired
  lastOrigin: string
  isGlobalWiki: boolean
  hasKey: boolean
  contextPercent: number
}

// WC-59: once after idle, once more past the context limit, only for the person's own prompts.
export const decide = (s: Situation): 'none' | 'manual' | 'needs-key' | 'idle' | 'now' => {
  if (s.queued <= s.fired.offered) return 'none'
  if (!s.isGlobalWiki) return 'manual'
  if (s.lastOrigin !== 'composer') return 'none'
  const isLimitRun = s.contextPercent >= CONTEXT_LIMIT && !s.fired.atContextLimit && s.fired.runs < 2
  if (!isLimitRun && s.fired.runs > 0) return 'none'
  if (!s.hasKey) return 'needs-key'

  return isLimitRun ? 'now' : 'idle'
}

// WC-60: a consumed run moved the queue away, so counting starts over; otherwise what is queued was offered.
export const afterCheckpoint = (isConsumed: boolean, queued: number, f: Fired) =>
  isConsumed ? { queued: 0, fired: { ...f, offered: 0 } } : { queued, fired: { ...f, offered: queued } }

const NOTE: Record<Status, string> = {
  quiet: '',
  waiting: ' · checkpoint after 4 idle minutes',
  'needs-key': ' · checkpoint due: run ssh-add',
  manual: ' · project wiki: run /wiki-checkpoint yourself',
  started: ' · checkpoint started',
}

// The module's own variables: a reload starts them over, and session.start rebuilds what matters.
let isInteractive = false
let isGlobalWiki = false
let lastOrigin = ''
let lastAnswer = ''
let contextPercent = 0
let timer: { cancel: () => void } | undefined
let isBusy = false
let isPending = false

const stopTimer = () => {
  timer?.cancel()
  timer = undefined
}

async function queueFile($: EngineInterface) {
  return `${await $.env.get('HOME')}/.claude/wiki-checkpoint/findings/${await $.session.id()}.jsonl`
}

async function readQueue($: EngineInterface) {
  return $.fs.read(await queueFile($)).catch(() => '')
}

// An empty queue tells capture-snapshot.sh this plugin is installed (WC-50), so a -p run, which queues
// nothing, is not captured at session end; without the file the hook keeps the byte floor.
async function createQueue($: EngineInterface, file: string) {
  await $.fs.write(file, '')
  await $.process.run(['chmod', '600', file])
}

// $.state survives a hot reload, not a restart or --resume; $.store keeps the runs so a resume does not fire again.
async function setFired($: EngineInterface, change: (f: Fired) => Fired) {
  await update($, fired, change)
  await $.store.set(`fired:${await $.session.id()}`, await read($, fired))
}

async function check($: EngineInterface) {
  const turn = currentTurn(await $.session.messages())
  if (isCheckpointTurn(turn, lastAnswer)) {
    const file = await queueFile($)
    const isConsumed = !(await $.fs.exists(file))
    if (isConsumed) await createQueue($, file)
    const after = afterCheckpoint(isConsumed, await read($, queued), await read($, fired))
    await update($, queued, () => after.queued)
    await setFired($, () => after.fired)
    return
  }

  const verdict = await $.model.complete({ model: 'haiku', system: JUDGE, prompt: exchangeText(turn), maxTokens: 60, timeoutMs: 20000 })
  if (!verdict.isAnswered) return $.ui.log(`wiki-findings: check failed (${verdict.reason})`)
  const line = verdict.text.trim()
  if (!line.startsWith('FINDING')) return

  // shortcut: a prompt sent before the fork runs makes it read the newer turn; the checkpoint re-verifies every draft (WC-60).
  const reply = await $.model.fork({ prompt: forkPrompt(line.replace(/^FINDING:?\s*/, '')) })
  if (!reply.isAnswered) return $.ui.log(`wiki-findings: draft failed (${reply.reason})`)
  let findings: Finding[]
  try {
    findings = parseFindings(reply.text)
  } catch {
    return $.ui.log('wiki-findings: the draft was not JSON')
  }
  if (findings.length === 0) return

  const at = new Date(await $.clock.now()).toISOString()
  const file = await queueFile($)
  await $.fs.write(file, (await readQueue($)) + findings.map(f => JSON.stringify({ at, ...f }) + '\n').join(''))
  // Owner-only like the snapshots (WC-48, WC-58): the quotes come from the same conversations.
  await $.process.run(['chmod', '600', file])
  await update($, queued, n => n + findings.length)
}

async function start($: EngineInterface, isLimitRun: boolean) {
  const count = await read($, queued)
  await update($, status, () => 'started')
  try {
    await $.command.run({
      command: CHECKPOINT,
      args: `auto-run by wiki-findings: sweep this conversation only, starting from the queued findings in ${await queueFile($)}`,
    })
  } catch (err) {
    await update($, status, () => 'quiet')
    return $.ui.log(`wiki-findings: could not start ${CHECKPOINT}: ${err}`)
  }
  // Counted only once the command was accepted, so a refused run leaves the findings unoffered.
  await setFired($, f => ({ runs: f.runs + 1, offered: Math.max(f.offered, count), atContextLimit: f.atContextLimit || isLimitRun }))
}

async function arm($: EngineInterface) {
  stopTimer()
  const s: Situation = {
    queued: await read($, queued),
    fired: await read($, fired),
    lastOrigin,
    isGlobalWiki,
    hasKey: false,
    contextPercent,
  }
  // ssh-add exits 0 only when the agent lists an identity.
  if (decide(s) === 'needs-key') s.hasKey = (await $.process.run(['ssh-add', '-l']).catch(() => ({ exitCode: 2 }))).exitCode === 0
  const plan = decide(s)
  if (plan === 'none') return update($, status, () => 'quiet')
  if (plan === 'manual' || plan === 'needs-key') return update($, status, () => plan)
  if (plan === 'idle') await update($, status, () => 'waiting')
  // A timer, not a direct call: a command cannot run inside the hook that a turn waits on.
  timer = $.clock.after(plan === 'idle' ? IDLE_MS : 1000, () => void start($, plan === 'now').catch(err => $.ui.log(`wiki-findings: ${err}`)))
}

async function consider($: EngineInterface) {
  if (isBusy) {
    isPending = true
    return
  }
  isBusy = true
  try {
    await check($)
    await arm($)
  } finally {
    isBusy = false
    if (isPending) {
      isPending = false
      void consider($).catch(err => $.ui.log(`wiki-findings: ${err}`))
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    isInteractive = e.isInteractive
    const file = await queueFile($)
    if (!(await $.fs.exists(file))) await createQueue($, file)
    if (!isInteractive) return next(e)

    const root = (await $.session.repo())?.root ?? e.cwd
    isGlobalWiki = !(await $.fs.exists(`${root}/wiki`)) && (await $.fs.exists(`${await $.env.get('HOME')}/wiki`))
    // A reload starts the module over; the queue file is the record of what was found, the store of what was run.
    const lines = (await readQueue($)).split('\n').filter(Boolean).length
    await update($, queued, () => lines)
    const stored = (await $.store.get(`fired:${await $.session.id()}`)) as Fired | undefined
    if (stored) await update($, fired, () => stored)
    await $.command.register({ name: 'wiki-findings', description: 'Show the findings queued for the wiki checkpoint' })

    return next(e)
  })

  on('command.run', { command: 'wiki-findings' }, async $ => {
    const f = await read($, fired)
    const text = `${await read($, queued)} findings in ${await queueFile($)}; ${f.offered} offered to ${f.runs} checkpoint run(s); status: ${await read($, status)}`

    return { text }
  })

  on('prompt.submit', async ($, e, next) => {
    lastOrigin = e.origin.kind
    stopTimer()
    if ((await read($, status)) === 'waiting') await update($, status, () => 'quiet')

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const c = e.context
    contextPercent = c.percent ?? (c.tokens ? Math.round((c.tokens / c.window) * 100) : 0)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (isMainAnswer(isInteractive, e)) {
      lastAnswer = e.answer
      void consider($).catch(err => $.ui.log(`wiki-findings: ${err}`))
    }

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const count = await read($, queued)
    const f = await read($, fired)
    if (e.props.hasSurvey || count <= f.offered) return next(e)

    const s = await read($, status)
    const { Box, Text } = $.ui.resolve(e)
    const waiting = count - f.offered

    return (
      <Box>
        <Text color={s === 'needs-key' ? 'yellow' : undefined} dimColor={s !== 'needs-key'} wrap="truncate-end">
          Wiki: {waiting} {waiting === 1 ? 'finding' : 'findings'} queued{NOTE[s]}
        </Text>
      </Box>
    )
  })
}
