import { Settings } from "./Settings";

const MAX_QUEUED_ACTIONS = 8;

type QueuedAction = Readonly<{ run: () => void; registersAt: number }>;

/**
 * Controller to manage delayed inputs (due to input lag and/or tick timers)
 */
export class InputController {
  clientActions: (() => void)[] = [];
  queuedActions: QueuedAction[] = [];

  static controller = new InputController();

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

  /**
   * The input registers on the first world tick at or after the click plus the simulated
   * input delay, so every click made before a tick runs on that tick, in click order.
   */
  queueAction(fn: () => void) {
    if (this.queuedActions.length >= MAX_QUEUED_ACTIONS) {
      return;
    }
    this.queuedActions.push({ run: fn, registersAt: performance.now() + Settings.inputDelay });
  }

  onWorldTick() {
    const now = performance.now();
    const due = this.queuedActions.filter((action) => action.registersAt <= now);
    this.queuedActions = this.queuedActions.filter((action) => action.registersAt > now);
    due.forEach((action) => action.run());
  }
}
