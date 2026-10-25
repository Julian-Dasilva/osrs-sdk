import { Settings } from "./Settings";

const MAX_QUEUED_ACTIONS = 8;

type QueuedAction = Readonly<{ run: () => void; registersAt: number }>;

type InputClock =
  | Readonly<{ kind: "running"; pausedMs: number }>
  | Readonly<{ kind: "paused"; pausedMs: number; since: number }>;

/**
 * Controller to manage delayed inputs (due to input lag and/or tick timers)
 */
export class InputController {
  clientActions: (() => void)[] = [];
  queuedActions: QueuedAction[] = [];
  private clock: InputClock = { kind: "running", pausedMs: 0 };

  static controller = new InputController();

  pause() {
    if (this.clock.kind === "running")
      this.clock = { kind: "paused", pausedMs: this.clock.pausedMs, since: performance.now() };
  }

  resume() {
    if (this.clock.kind === "paused")
      this.clock = { kind: "running", pausedMs: this.clock.pausedMs + performance.now() - this.clock.since };
  }

  private runningTime() {
    return (this.clock.kind === "paused" ? this.clock.since : performance.now()) - this.clock.pausedMs;
  }

  /**
   * Queue an input to be sampled by the next 20 ms client tick.
   *
   * Prayer controls use this to keep browser event timing separate from both
   * the client-side lit state and the server-side active state.
   */
  queueClientAction(fn: () => void) {
    this.clientActions.push(fn);
  }

  onClientTick() {
    const actions = this.clientActions;
    this.clientActions = [];
    actions.forEach((action) => action());
  }

  queueAction(fn: () => void) {
    const registersAt = this.runningTime() + Settings.inputDelay;
    const registeredBy = this.queuedActions.filter((action) => action.registersAt <= registersAt);
    if (registeredBy.length >= MAX_QUEUED_ACTIONS) {
      this.queuedActions = this.queuedActions.filter((action) => action !== registeredBy[0]);
    }
    this.queuedActions.push({ run: fn, registersAt });
  }

  onWorldTick() {
    const now = this.runningTime();
    const due = this.queuedActions.filter((action) => action.registersAt <= now);
    this.queuedActions = this.queuedActions.filter((action) => action.registersAt > now);
    due.forEach((action) => action.run());
  }
}
