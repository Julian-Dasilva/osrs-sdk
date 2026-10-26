type FirstFrameStage =
  | { kind: "waiting" }
  | { kind: "drawn" }
  | { kind: "presenting" }
  | { kind: "presented" }
  | { kind: "failed"; error: Error };

export class FirstFrame {
  private stage: FirstFrameStage = { kind: "waiting" };
  private presentedWaiters: (() => void)[] = [];
  private failedWaiters: ((error: Error) => void)[] = [];

  worldDrawn() {
    if (this.stage.kind === "waiting") this.stage = { kind: "drawn" };
  }

  rendered(waitForPixels?: () => void) {
    if (this.stage.kind !== "drawn") return;
    this.stage = { kind: "presenting" };
    waitForPixels?.();
    requestAnimationFrame(() => {
      this.stage = { kind: "presented" };
      this.presentedWaiters.splice(0).forEach((resolve) => resolve());
      this.failedWaiters = [];
    });
  }

  renderFailed(error: Error) {
    if (this.stage.kind !== "drawn") return;
    this.stage = { kind: "failed", error };
    this.failedWaiters.splice(0).forEach((resolve) => resolve(error));
    this.presentedWaiters = [];
  }

  presented(): Promise<void> {
    if (this.stage.kind === "presented") return Promise.resolve();
    return new Promise((resolve) => {
      if (this.stage.kind !== "failed") this.presentedWaiters.push(resolve);
    });
  }

  failed(): Promise<Error> {
    const { stage } = this;
    if (stage.kind === "failed") return Promise.resolve(stage.error);
    return new Promise((resolve) => {
      if (stage.kind !== "presented") this.failedWaiters.push(resolve);
    });
  }
}
