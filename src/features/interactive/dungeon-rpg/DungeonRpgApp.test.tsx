// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DungeonRpgApp } from "@/features/interactive/dungeon-rpg/DungeonRpgApp";
import { RUN_STORAGE_KEY, PROFILE_STORAGE_KEY } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { emptyProfile } from "@/features/interactive/dungeon-rpg/save/schema";

/**
 * jsdom has no canvas implementation, so `getContext` returns null and the game falls back to
 * its DOM chrome. That fallback is worth exercising for real, so most tests here run without
 * a context; `withCanvasContext` stubs one where the drawing path itself is under test.
 */
type ContextCalls = { drawImage: number; fillRect: number; setTransform: number };

function withCanvasContext(): ContextCalls {
  const calls: ContextCalls = { drawImage: 0, fillRect: 0, setTransform: 0 };
  const context = {
    canvas: null as unknown,
    imageSmoothingEnabled: true,
    fillStyle: "",
    drawImage: () => {
      calls.drawImage++;
    },
    fillRect: () => {
      calls.fillRect++;
    },
    clearRect: () => {},
    setTransform: () => {
      calls.setTransform++;
    },
    scale: () => {},
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    context.canvas = this;
    return context;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext);
  return calls;
}

let container: HTMLDivElement;
let root: Root;
let store: Record<string, string>;
let pendingFrames: Map<number, FrameRequestCallback>;
let nextFrameId: number;

/** Runs whatever frames the game has queued. Deliberately not synchronous inside `rAF` — a
 *  browser never calls back during the same tick, and pretending it does hides real bugs. */
function flushFrames() {
  act(() => {
    const callbacks = [...pendingFrames.values()];
    pendingFrames.clear();
    for (const cb of callbacks) cb(0);
  });
}

function mount() {
  act(() => {
    root.render(<DungeonRpgApp />);
  });
}

function unmount() {
  act(() => {
    root.unmount();
  });
}

function findButton(text: string): HTMLButtonElement {
  const match = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes(text));
  if (!match) throw new Error(`no button matching ${text}; saw: ${[...container.querySelectorAll("button")].map((b) => b.textContent).join(" | ")}`);
  return match;
}

function gameView(): HTMLDivElement {
  const view = container.querySelector<HTMLDivElement>('[aria-label^="Dungeon view"]');
  if (!view) throw new Error("game view is not mounted");
  return view;
}

function press(target: Element, key: string) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}

function startRun(seed = "TESTRUN") {
  const input = container.querySelector<HTMLInputElement>("#dungeon-seed")!;
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, seed);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  act(() => {
    findButton("New run").click();
  });
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  store = {};
  pendingFrames = new Map();
  nextFrameId = 0;

  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  });
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = ++nextFrameId;
    pendingFrames.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    pendingFrames.delete(id);
  });

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
  container.remove();
});

describe("mounting", () => {
  it("renders the title screen without throwing, even with no canvas context", () => {
    mount();
    expect(container.textContent).toContain("COLD BOOT");
    expect(findButton("New run")).toBeTruthy();
    unmount();
  });

  it("acquires a 2D context and paints when one is available", () => {
    const calls = withCanvasContext();
    mount();
    startRun();
    flushFrames();
    expect(calls.setTransform).toBeGreaterThan(0);
    expect(calls.fillRect + calls.drawImage).toBeGreaterThan(0);
    unmount();
  });

  it("schedules no frames while sitting idle", () => {
    withCanvasContext();
    mount();
    startRun();
    flushFrames();
    // A game left open in a tab must burn no CPU: nothing re-queues itself.
    expect(pendingFrames.size).toBe(0);
    unmount();
  });

  it("offers to continue only when a valid save exists", () => {
    mount();
    expect(() => findButton("Continue saved run")).toThrow();
    unmount();

    // Start a run so a save lands, then remount.
    root = createRoot(container);
    mount();
    startRun("SAVEDRUN");
    unmount();

    expect(store[RUN_STORAGE_KEY]).toBeDefined();
    root = createRoot(container);
    mount();
    expect(findButton("Continue saved run")).toBeTruthy();
    unmount();
  });
});

describe("keyboard input", () => {
  function position(): string {
    return /Position (\d+, \d+)/.exec(container.querySelector("canvas")!.getAttribute("aria-label") ?? "")![1]!;
  }

  it("moves the player on an arrow key when the view has focus", () => {
    mount();
    startRun("MOVEME");

    const view = gameView();
    const before = position();
    // Spawn is inside a room, so at least one of the four directions is walkable.
    const moved = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].some((key) => {
      press(view, key);
      return position() !== before;
    });
    expect(moved).toBe(true);
    unmount();
  });

  it("accepts WASD as well as the arrow keys", () => {
    mount();
    startRun("WASDRUN");
    const view = gameView();
    const before = position();
    const moved = ["d", "s", "a", "w"].some((key) => {
      press(view, key);
      return position() !== before;
    });
    expect(moved).toBe(true);
    unmount();
  });

  it("calls preventDefault on arrow keys so the page does not scroll under the game", () => {
    mount();
    startRun("PREVENT");
    const view = gameView();
    const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
    act(() => {
      view.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    unmount();
  });

  it("ignores arrow keys dispatched outside the game view", () => {
    mount();
    startRun("OUTSIDE");
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
    act(() => {
      outside.dispatchEvent(event);
    });
    // Nothing swallowed it, so a reader scrolling past the page keeps their scroll.
    expect(event.defaultPrevented).toBe(false);
    outside.remove();
    unmount();
  });
});

describe("chrome", () => {
  it("renders the session log as real, scrollable DOM text", () => {
    mount();
    startRun("LOGTEST");
    const log = container.querySelector('[role="log"]')!;
    expect(log).toBeTruthy();
    expect(log.getAttribute("aria-live")).toBe("polite");
    expect(log.className).toContain("overflow-y-auto");
    expect(log.textContent).toContain("Perimeter");
    unmount();
  });

  it("labels the canvas for assistive technology", () => {
    mount();
    startRun("A11YRUN");
    const canvas = container.querySelector("canvas")!;
    expect(canvas.getAttribute("role")).toBe("img");
    expect(canvas.getAttribute("aria-label")).toContain("Segment 1 of 5");
    unmount();
  });

  it("normalizes a messy seed instead of refusing it", () => {
    mount();
    startRun("  abc-123!  ");
    expect(container.textContent).toContain("seed ABC123");
    unmount();
  });

  it("generates a seed when the field is left blank", () => {
    mount();
    act(() => {
      findButton("New run").click();
    });
    expect(container.textContent).toMatch(/seed [A-Z0-9]{8}/);
    unmount();
  });

  it("warns, and keeps playing, when storage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);
    mount();
    startRun("NOSTORE");
    expect(container.textContent).toContain("will not be saved");
    expect(gameView()).toBeTruthy();
    unmount();
  });
});

describe("teardown", () => {
  it("unmounts cleanly with no pending frames and no stray listeners", () => {
    withCanvasContext();
    mount();
    startRun("TEARDOWN");
    expect(pendingFrames.size).toBeGreaterThan(0);

    const errors: unknown[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => errors.push(args);
    try {
      unmount();
      // A key event after teardown must not reach anything.
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    } finally {
      console.error = originalError;
    }
    expect(errors).toEqual([]);
    expect(container.textContent).toBe("");
    // The pending frame was cancelled, so nothing paints into a dead canvas.
    expect(pendingFrames.size).toBe(0);
  });

  it("saves the run in progress on unmount and leaves the profile alone", () => {
    store[PROFILE_STORAGE_KEY] = JSON.stringify({ ...emptyProfile(), totalRuns: 7 });
    mount();
    startRun("UNMOUNT");
    unmount();

    expect(store[RUN_STORAGE_KEY]).toBeDefined();
    expect(JSON.parse(store[RUN_STORAGE_KEY]!).seed).toBe("UNMOUNT");
    expect(JSON.parse(store[PROFILE_STORAGE_KEY]!).totalRuns).toBe(7);
  });
});
