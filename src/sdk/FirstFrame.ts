type FirstFrameStage = "waiting" | "drawn" | "presenting" | "presented";

export class FirstFrame {
  private stage: FirstFrameStage = "waiting";
  private waiters: (() => void)[] = [];

  worldDrawn() {
    if (this.stage === "waiting") this.stage = "drawn";
  }

  rendered(waitForPixels?: () => void) {
    if (this.stage !== "drawn") return;
    this.stage = "presenting";
    waitForPixels?.();
    requestAnimationFrame(() => {
      this.stage = "presented";
      this.waiters.splice(0).forEach((resolve) => resolve());
    });
  }

  presented(): Promise<void> {
    if (this.stage === "presented") return Promise.resolve();
    return new Promise((resolve) => this.waiters.push(resolve));
  }
}
