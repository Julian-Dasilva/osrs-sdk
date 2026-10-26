type FirstFrameStage = "waiting" | "drawn" | "presenting" | "presented";

export class FirstFrame {
  private stage: FirstFrameStage = "waiting";
  private waiters: (() => void)[] = [];

  worldDrawn() {
    if (this.stage === "waiting") this.stage = "drawn";
  }

  // The first draw of new models queues their shader links and uploads, and the
  // browser finishes that work when it presents the frame. No animation frame
  // runs until that presentation returns, so the next one marks it done.
  rendered() {
    if (this.stage !== "drawn") return;
    this.stage = "presenting";
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
