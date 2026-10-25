import { InputController } from "../../src/sdk/Input";
import { Settings } from "../../src/sdk/Settings";

describe("InputController client-tick inputs", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Settings.inputDelay = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("does not expose an input to a world tick before a client tick samples it", () => {
    const controller = new InputController();
    const action = jest.fn();

    controller.queueClientAction(() => controller.queueAction(action));
    controller.onWorldTick();
    jest.runOnlyPendingTimers();
    controller.onWorldTick();

    expect(action).not.toHaveBeenCalled();

    controller.onClientTick();
    jest.runOnlyPendingTimers();
    controller.onWorldTick();

    expect(action).toHaveBeenCalledTimes(1);
  });

  test("applies latency after the client tick samples the input", () => {
    const controller = new InputController();
    const action = jest.fn();
    Settings.inputDelay = 80;

    controller.queueClientAction(() => controller.queueAction(action));
    controller.onClientTick();
    jest.advanceTimersByTime(79);
    controller.onWorldTick();
    expect(action).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    controller.onWorldTick();
    expect(action).toHaveBeenCalledTimes(1);
  });

  test("preserves the order of multiple client inputs", () => {
    const controller = new InputController();
    const actions: number[] = [];

    controller.queueClientAction(() => controller.queueAction(() => actions.push(1)));
    controller.queueClientAction(() => controller.queueAction(() => actions.push(2)));
    controller.onClientTick();
    jest.runOnlyPendingTimers();
    controller.onWorldTick();

    expect(actions).toEqual([1, 2]);
  });

  test("an action queued while the tick runs its actions waits for the next tick", () => {
    const controller = new InputController();
    const seen: number[] = [];

    controller.queueAction(() => {
      seen.push(1);
      controller.queueAction(() => seen.push(2));
    });
    jest.runOnlyPendingTimers();
    controller.onWorldTick();
    const afterFirstTick = [...seen];
    jest.runOnlyPendingTimers();
    controller.onWorldTick();

    expect([afterFirstTick, seen]).toEqual([[1], [1, 2]]);
  });

  test("drops a ninth action in one tick, and accepts actions again after the tick", () => {
    const controller = new InputController();
    const seen: number[] = [];

    for (let action = 1; action <= 9; action++) {
      controller.queueAction(() => seen.push(action));
      jest.runOnlyPendingTimers();
    }
    controller.onWorldTick();
    const afterFirstTick = [...seen];
    controller.queueAction(() => seen.push(10));
    jest.runOnlyPendingTimers();
    controller.onWorldTick();

    expect([afterFirstTick, seen]).toEqual([
      [1, 2, 3, 4, 5, 6, 7, 8],
      [1, 2, 3, 4, 5, 6, 7, 8, 10],
    ]);
  });
});
