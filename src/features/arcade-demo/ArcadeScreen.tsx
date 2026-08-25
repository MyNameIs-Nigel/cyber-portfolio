"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  BOARD_KEYS,
  BOARD_KEYS_COMPACT,
  BOARD_ROWS,
  BOARD_ROWS_COMPACT,
  CONNECT_COMMAND,
  FARM_KEYS,
  FARM_KEYS_COMPACT,
  LOBBY_CABINETS,
  LOBBY_IDENTITY,
  LOBBY_IDENTITY_COMPACT,
  LOBBY_KEY,
  LOBBY_KEYS,
  MOON,
  NAV,
  NAV_COMPACT,
  PLANT_KEYS,
  PLANT_MENU,
  PLANT_MENU_COMPACT,
  TERM,
} from "./arcadeDemo.constants";
import { bar, fmtGrow, fmtGrowShort, fmtRemaining } from "./arcadeDemo.frame";
import { useTerminalFit } from "./useArcadeDemo";
import type { DemoCrop, DemoFrame, PlantModal, PlotView } from "./arcadeDemo.types";

/* ------------------------------------------------------------------ *
 * The screen: the real ssh-farm and SSHARCADE TUIs, redrawn in the DOM.
 *
 * Type is sized so a fixed column budget always fits (see `useTerminalFit`),
 * which is why every width here is in `ch` and every height in `em`: the whole
 * screen is one character grid that scales with the window it is given, so it
 * never overflows the frame and never needs a scrollbar to be complete.
 * ------------------------------------------------------------------ */

export function ArcadeScreen({ frame }: { frame: DemoFrame }) {
  const ref = useRef<HTMLDivElement>(null);
  const fit = useTerminalFit(ref);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" style={{ background: TERM.bg }}>
      <div
        className="h-full w-full font-mono leading-[1.5]"
        style={{ fontSize: `${fit.fontSize}px`, color: TERM.text }}
      >
        {frame.scene === "connect" ? (
          <ConnectScreen typed={frame.typed} />
        ) : frame.scene === "lobby" ? (
          <LobbyScreen frame={frame} compact={fit.compact} />
        ) : (
          <FarmScreen frame={frame} compact={fit.compact} />
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- connect */

function ConnectScreen({ typed }: { typed: string }) {
  const done = typed.length === CONNECT_COMMAND.length;
  return (
    <div className="break-all p-[1.4em]">
      <span style={{ color: TERM.text }}>ndsmith@Nigels-MacBook-Pro ~ % </span>
      <span>{typed}</span>
      {/* The block sits still while keys are landing, and blinks once they stop. */}
      <span
        className={done ? "terminal-cursor" : undefined}
        style={{
          display: "inline-block",
          width: "0.6ch",
          height: "1.05em",
          verticalAlign: "text-bottom",
          background: TERM.text,
        }}
      />
    </div>
  );
}

/* ----------------------------------------------------------------- lobby */

function LobbyScreen({ frame, compact }: { frame: DemoFrame; compact: boolean }) {
  return (
    <div className="flex h-full items-center justify-center px-[2ch] py-[1.4em]">
      <div
        className="relative w-full"
        style={{ maxWidth: compact ? "56ch" : "78ch", border: `1px solid ${TERM.cyanDim}` }}
      >
        <BorderLabel side="top" align="left" color={TERM.cyan}>
          <span style={{ color: TERM.cyanDim }}>◇ </span>SSHARCADE
        </BorderLabel>
        {compact ? null : (
          <BorderLabel side="top" align="right" color={TERM.cyanDim}>
            play.ssharcade.dev
          </BorderLabel>
        )}

        <div className="px-[3ch] py-[1.2em]">
          <p style={{ color: TERM.cyan }} className="font-bold">
            SSH Arcade is live!
          </p>
          {compact ? null : (
            <p style={{ color: TERM.amber }}>Support the cabinet at https://www.ssharcade.dev/!</p>
          )}

          <div className="mt-[1.6em]">
            {LOBBY_CABINETS.map((cab, i) => {
              const picked = i === frame.lobbyChoice;
              return (
                <div key={cab.name} className="whitespace-nowrap">
                  <span style={{ color: TERM.cyan }}>{picked ? "▸ " : "  "}</span>
                  <span style={{ color: picked ? TERM.cyan : TERM.cyanDim }}>● </span>
                  <span
                    className="font-bold"
                    style={
                      /* ENTER lands: the row lights up the way the real menu does. */
                      picked && frame.lobbyEntered
                        ? { background: TERM.cyan, color: "#08222b", padding: "0 0.5ch" }
                        : { color: TERM.cyan }
                    }
                  >
                    {cab.name}
                  </span>{" "}
                  <span style={{ color: TERM.text }}>{cab.tagline}</span>
                  {compact ? null : (
                    <div className="pl-[6ch]" style={{ color: TERM.cyanDim }}>
                      {cab.meta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-[1.6em]" style={{ color: TERM.text }}>
            {compact ? LOBBY_IDENTITY_COMPACT : LOBBY_IDENTITY}
          </p>
          <p className="mt-[1.2em] text-right" style={{ color: TERM.cyanDim }}>
            {LOBBY_KEY}
          </p>
        </div>

        <BorderLabel side="bottom" align="left" color={TERM.cyan} indent="3ch">
          {compact ? "↑↓ SELECT · ENTER PLAY · Q QUIT" : LOBBY_KEYS}
        </BorderLabel>
      </div>
    </div>
  );
}

/** A label sitting in a gap in the box rule, the way lipgloss draws them. */
function BorderLabel({
  side,
  align,
  color,
  indent = "1.5ch",
  children,
}: {
  side: "top" | "bottom";
  align: "left" | "right";
  color: string;
  indent?: string;
  children: ReactNode;
}) {
  return (
    <span
      className="absolute whitespace-nowrap px-[0.75ch]"
      style={{
        [side]: "-0.75em",
        [align]: indent,
        background: TERM.bg,
        color,
      } as CSSProperties}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ farm */

function FarmScreen({ frame, compact }: { frame: DemoFrame; compact: boolean }) {
  const tabs = compact ? NAV_COMPACT : NAV;
  const keys =
    frame.modal?.kind === "plant"
      ? PLANT_KEYS
      : frame.scene === "board"
        ? compact
          ? BOARD_KEYS_COMPACT
          : BOARD_KEYS
        : compact
          ? FARM_KEYS_COMPACT
          : FARM_KEYS;

  return (
    <div className="h-full" style={{ padding: compact ? "0.6em" : "0.9em" }}>
      <div
        className="flex h-full flex-col rounded-[0.5em]"
        style={{ border: `1px solid ${TERM.frame}`, padding: compact ? "0.4em 1.5ch" : "0.6em 1.5ch" }}
      >
        {/* Identity and purse */}
        <div className="flex items-baseline justify-between gap-[2ch] whitespace-nowrap">
          <span className="min-w-0 truncate">
            <span aria-hidden>🌾 </span>
            <b style={{ color: TERM.bright }}>ssh-farm</b>
            <span style={{ color: TERM.dim }}> · </span>
            <span>ndsmith</span>
            {compact ? null : (
              <span className="italic" style={{ color: TERM.dim }}>
                {"   "}
                {MOON}
              </span>
            )}
          </span>
          <span className="shrink-0" style={{ color: TERM.gold }}>
            <span aria-hidden>🪙 </span>
            <b className="tabular-nums">{frame.coins}</b> coins
          </span>
        </div>

        {/* The gate, then the day's headline */}
        <div className="truncate">
          <span aria-hidden>{frame.headline.icon} </span>
          {frame.headline.highlight ? (
            <b style={{ color: TERM.bright }}>{frame.headline.text}</b>
          ) : (
            <span className="italic" style={{ color: TERM.dim }}>
              <span style={{ color: TERM.text }}>The Daily Furrow:</span> {frame.headline.text}
            </span>
          )}
        </div>

        {/* Tabs — a modal takes the highlight and offers the way out instead */}
        <div className="mt-[0.2em] flex items-center gap-[2ch] whitespace-nowrap">
          {tabs.map((tab) => {
            const active = frame.activeTab === tab.key;
            return (
              <span
                key={tab.key}
                className={active ? "rounded-[0.2em] px-[0.75ch] font-bold" : undefined}
                style={
                  active
                    ? { background: TERM.tabBg, color: TERM.tabText }
                    : { color: tab.locked ? TERM.dim : TERM.text }
                }
              >
                <span style={active ? undefined : { color: TERM.dim }}>{tab.key}</span> {tab.name}
                {tab.locked ? " 🔒" : ""}
              </span>
            );
          })}
          {frame.modal ? (
            <span
              className="ml-auto rounded-[0.2em] px-[0.75ch] font-bold"
              style={{ background: TERM.tabBg, color: TERM.tabText }}
            >
              {compact ? "[x]" : "[x] Close"}
            </span>
          ) : null}
        </div>

        {/* The screen the tabs open onto */}
        {/*
          A modal takes the screen rather than floating over it — the real TUI
          clears the field before it draws the card, and a grid peeking out from
          behind one is the tell that this is a web page imitating a terminal.
        */}
        <div className="relative mt-[1.1em] min-h-0 flex-1">
          {frame.modal?.kind === "welcome" ? (
            <WelcomeCard compact={compact} />
          ) : frame.modal?.kind === "plant" ? (
            <PlantCard modal={frame.modal} compact={compact} />
          ) : frame.scene === "board" ? (
            <Board coins={frame.coins} compact={compact} />
          ) : (
            <Plots plots={frame.plots} compact={compact} />
          )}
        </div>

        {/* Status, then the keys that would get you there */}
        <div className="mt-[0.6em] pt-[0.4em]" style={{ borderTop: `1px solid ${TERM.frameDim}` }}>
          <p className="h-[1.5em] truncate" style={{ color: statusColor(frame.status.tone) }}>
            {frame.modal?.kind === "welcome" ? (
              <span className="italic" style={{ color: TERM.dim }}>
                press any key to continue
              </span>
            ) : (
              frame.status.text
            )}
          </p>
          <p className="truncate italic" style={{ color: TERM.dim }}>
            {keys}
          </p>
        </div>
      </div>
    </div>
  );
}

function statusColor(tone: DemoFrame["status"]["tone"]): string {
  return tone === "good" || tone === "ready" ? TERM.bright : TERM.dim;
}

function Plots({ plots, compact }: { plots: PlotView[]; compact: boolean }) {
  const segments = compact ? 6 : 8;
  return (
    <div className="flex" style={{ gap: compact ? "1ch" : "1.5ch" }}>
      {plots.map((p, i) => (
        <div
          key={i}
          className="rounded-[0.35em] px-[1.2ch] py-[0.3em]"
          style={{
            width: compact ? "16ch" : "25ch",
            border: `1px solid ${p.selected ? TERM.bright : p.ready ? TERM.frame : TERM.frameDim}`,
          }}
        >
          <div className="font-bold" style={{ color: TERM.gold }}>
            Plot {i + 1}
          </div>
          {p.crop ? (
            <>
              <div className="truncate">{p.crop.name}</div>
              <div className="whitespace-nowrap">
                {p.ready ? (
                  <span style={{ color: TERM.bright }}>✔ ready!</span>
                ) : (
                  <>
                    <span style={{ color: TERM.bright }}>{bar(p.progress, segments).filled}</span>
                    <span style={{ color: TERM.frameDim }}>{bar(p.progress, segments).empty}</span>
                    <span className="tabular-nums" style={{ color: TERM.dim }}>
                      {" "}
                      {fmtRemaining(p.remaining)}
                    </span>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ color: TERM.dim }}>· empty ·</div>
              <div style={{ color: TERM.dim }}>enter to plant</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Board({ coins, compact }: { coins: number; compact: boolean }) {
  const rows = compact ? BOARD_ROWS_COMPACT : BOARD_ROWS;
  const medal = [TERM.gold, TERM.silver, TERM.violet];
  return (
    <div>
      <div className="flex justify-between gap-[2ch] whitespace-nowrap font-bold" style={{ color: TERM.bright }}>
        <span>LEADERBOARD — RICHEST FARMS</span>
        <span>YOU: #5/7</span>
      </div>
      <div className="mt-[1em]">
        {rows.map((row) => {
          const colour = row.you ? TERM.bright : medal[row.rank - 1] ?? TERM.text;
          return (
            <div key={row.rank} className="flex justify-between gap-[2ch] whitespace-nowrap">
              <span>
                <span style={{ color: TERM.bright }}>{row.you ? "▸ " : "  "}</span>
                <b style={{ color: colour }}>#{row.rank}</b>{" "}
                <b style={{ color: colour }}>{row.name}</b>
                <span style={{ color: TERM.dim }}> ·{row.key}</span>
                <span style={{ color: TERM.gold }}> ↻ {row.rebirths}</span>
                {row.you ? <span style={{ color: TERM.bright }}> ← YOU</span> : null}
              </span>
              <span className="tabular-nums" style={{ color: colour }}>
                <span style={{ color: row.you ? TERM.bright : colour }}>◆ </span>
                {(row.coins ?? coins).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-[1em] italic" style={{ color: TERM.dim }}>
        updated 3s ago
      </p>
    </div>
  );
}

/** The card the game greets you with when the farm has been running without you. */
function WelcomeCard({ compact }: { compact: boolean }) {
  return (
    <Card width={compact ? "100%" : "58ch"} compact={compact}>
      <p className="font-bold" style={{ color: TERM.bright }}>
        Welcome back! <span aria-hidden>🌾</span>
      </p>
      <p className="mt-[1.2em]">You were away 12h 01m.</p>
      <p className="italic" style={{ color: TERM.dim }}>
        A parcel arrived at the gate while you were away.
      </p>
      <p className="font-bold" style={{ color: TERM.bright }}>
        <span aria-hidden>📦 </span>A parcel waits at the gate — press g
      </p>
    </Card>
  );
}

function PlantCard({ modal, compact }: { modal: PlantModal; compact: boolean }) {
  const menu = compact ? PLANT_MENU_COMPACT : PLANT_MENU;
  return (
    <Card width={compact ? "46ch" : "72ch"} compact={compact}>
      <p className="font-bold">Plant on plot {modal.plot + 1}</p>
      <div className="mt-[1.2em]">
        {menu.map((crop, i) => {
          const picked = i === modal.choice;
          return (
            <div key={crop.id} className="whitespace-nowrap">
              <span style={{ color: TERM.bright }}>{picked ? "▸ " : "  "}</span>
              <span style={{ color: picked ? TERM.bright : crop.locked ? TERM.dim : TERM.text }}>
                {seedLine(crop, compact)}
              </span>
              {crop.locked ? <span aria-hidden> 🔒</span> : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * `Turnip  5c · 1m 00s · sells 9c · fails to …`, shortened by stages as the
 * window narrows: first the risk note goes, then the words around the numbers.
 */
function seedLine(crop: DemoCrop, compact: boolean): string {
  const cost = crop.seedCost.toLocaleString();
  const sells = crop.sellValue.toLocaleString();
  if (compact) return `${crop.name} ${cost}c · ${fmtGrowShort(crop.growSeconds)} · ${sells}c`;
  const head = `${crop.name}  ${cost}c · ${fmtGrow(crop.growSeconds)} · sells ${sells}c`;
  return crop.fail ? `${head} · fails to ${crop.fail.to}c (${crop.fail.pct}%)` : head;
}

function Card({ width, compact, children }: { width: string; compact: boolean; children: ReactNode }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div
        className="rounded-[0.4em]"
        style={{
          width,
          maxWidth: "100%",
          padding: compact ? "0.9em 2ch" : "1.2em 3ch",
          background: TERM.bg,
          border: `1px solid ${TERM.frame}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
