export type Fired = { runs: number; offered: number; atContextLimit: boolean }
export type Status = 'quiet' | 'waiting' | 'needs-key' | 'manual' | 'started'

declare module 'claude-code' {
  interface PluginState {
    'wiki-findings': { queued: number; fired: Fired; status: Status }
  }
}
