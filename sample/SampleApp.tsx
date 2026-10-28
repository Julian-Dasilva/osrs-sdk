import React, { useEffect, useRef, useState } from "react";
import { ControlPanelController, Region, Settings, TrainerInstance, TrainerLoadingState } from "../src";
import {
  DefaultSidebar,
  GameOverlay,
  LoadoutManager,
  RuneScapeButton,
  TrainerApp,
  TrainerLoadingSplash,
  useTrainerContext,
} from "osrs-sdk-react";
import { configureSampleCacheRenderer } from "./cache-render";
import { SampleRegion } from "./SampleRegion";
import { loadoutTemplates } from "./loadoutTemplates";

function createTrainer() {
  configureSampleCacheRenderer();
  Settings.readFromStorage();
  const regions: Record<string, Region> = {
    "index.html": new SampleRegion(loadoutTemplates),
  };
  const regionName = window.location.pathname.split("/").pop() ?? "index.html";
  const region = regions[regionName] ?? regions["index.html"];
  const trainer = new TrainerInstance(region, { readyTimer: 6 });
  // Temporary internal flag to make the manticore aggressive, for automated visual testing of its spotanim
  if (new URLSearchParams(window.location.search).get("visual-harness") === "1") {
    (window as Window & { __OSRS_VISUAL_HARNESS__?: unknown }).__OSRS_VISUAL_HARNESS__ = {
      trainer,
      startManticoreAttack() {
        const player = trainer.getSnapshot().player;
        const manticore = trainer.region.mobs.find((mob) => mob.mobName() === "Manticore");
        if (!player || !manticore) throw new Error("Manticore scenario is not initialised");
        manticore.setAggro(player);
      },
    };
  }
  return trainer;
}

function SampleSidebarContents({ onLoadoutToggle }: { onLoadoutToggle: () => void }) {
  const trainer = useTrainerContext();

  return (
    <>
      <RuneScapeButton type="button" onClick={() => trainer.reset()}>
        Reset
      </RuneScapeButton>
      <RuneScapeButton type="button" onClick={() => ControlPanelController.controller.setActiveControl("SETTINGS")}>
        Ingame Settings
      </RuneScapeButton>
      <RuneScapeButton type="button" onClick={onLoadoutToggle}>
        Loadout
      </RuneScapeButton>
      <div style={{ paddingBottom: 10, paddingTop: 10, textAlign: "center", width: "100%" }}>
        <div id="gpu_warning" />
      </div>
    </>
  );
}

function PlayerPositionDebug() {
  const trainer = useTrainerContext();
  const coordinates = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    const updateCoordinates = () => {
      const player = trainer.getSnapshot().player;
      if (coordinates.current) {
        coordinates.current.textContent = player
          ? `Player position: ${player.location.x}, ${player.location.y}`
          : "Player position: loading";
      }
      frame = requestAnimationFrame(updateCoordinates);
    };
    updateCoordinates();
    return () => cancelAnimationFrame(frame);
  }, [trainer]);

  return (
    <div
      ref={coordinates}
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 10000,
        padding: "6px 8px",
        background: "#000c",
        color: "#0f0",
        font: "14px monospace",
        pointerEvents: "none",
      }}
    />
  );
}

export function SampleApp() {
  const [trainer] = useState(createTrainer);
  const [loading, setLoading] = useState<TrainerLoadingState>();
  const [loadoutOpen, setLoadoutOpen] = useState(false);

  return (
    <TrainerApp trainer={trainer} onLoadingStateChange={setLoading}>
      <GameOverlay>
        {new URLSearchParams(window.location.search).get("scene-debug") === "1" && <PlayerPositionDebug />}
        <TrainerLoadingSplash state={loading} />
        <LoadoutManager loadouts={loadoutTemplates} open={loadoutOpen} onClose={() => setLoadoutOpen(false)} />
      </GameOverlay>
      <div id="disclaimer_panel">
        Work in progress.
        <br />
        All assets are property of Jagex.
      </div>
      <DefaultSidebar>
        <SampleSidebarContents onLoadoutToggle={() => setLoadoutOpen((open) => !open)} />
      </DefaultSidebar>
    </TrainerApp>
  );
}
