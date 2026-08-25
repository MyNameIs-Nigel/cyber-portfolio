import { describe, expect, it } from "vitest";
import { frameAt } from "@/features/arcade-demo/arcadeDemo.frame";
import {
  CROPS,
  HARVEST_3,
  LOOP_MS,
  PLANTED_AT,
  RIPE_2,
  RIPE_3,
  SEGMENTS,
  START_COINS,
} from "@/features/arcade-demo/arcadeDemo.constants";

describe("arcade demo frame", () => {
  it("plays every scene the caption promises", () => {
    const seen = new Set(SEGMENTS.map((s) => frameAt(s.from + 10).scene));
    expect([...seen].sort()).toEqual(["board", "connect", "farm", "lobby", "plant", "welcome"]);
  });

  it("loops seamlessly", () => {
    // The last millisecond and the first must be the same scene at the same
    // coin count, or the run visibly jumps when it starts over.
    const end = frameAt(LOOP_MS - 1);
    const start = frameAt(0);
    expect(end.scene).toBe("board");
    expect(start.scene).toBe("connect");
    expect(frameAt(LOOP_MS).scene).toBe(start.scene);
    expect(frameAt(LOOP_MS).coins).toBe(start.coins);
    expect(frameAt(-1).scene).toBe(end.scene);
  });

  it("keeps the purse honest across the run", () => {
    expect(frameAt(RIPE_3).coins).toBe(START_COINS);
    expect(frameAt(HARVEST_3).coins).toBe(START_COINS + CROPS.TURNIP.sellValue);
    expect(frameAt(PLANTED_AT).coins).toBe(
      START_COINS + CROPS.TURNIP.sellValue - CROPS.CARROT.seedCost,
    );
  });

  it("ripens, clears and re-sows plot 3 on the beat", () => {
    expect(frameAt(RIPE_3 - 200).plots[2].ready).toBe(false);
    expect(frameAt(RIPE_3 + 200).plots[2]).toMatchObject({ ready: true });
    expect(frameAt(HARVEST_3 + 200).plots[2].crop).toBeNull();
    expect(frameAt(PLANTED_AT + 200).plots[2].crop?.id).toBe("carrot");
  });

  it("never shows a countdown longer than the crop's own grow time", () => {
    for (let t = 0; t < LOOP_MS; t += 250) {
      for (const p of frameAt(t).plots) {
        if (!p.crop) continue;
        expect(p.remaining).toBeLessThanOrEqual(p.crop.growSeconds);
        expect(p.remaining).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("leaves plot 1's carrot growing — the farm outlasts the session", () => {
    expect(frameAt(LOOP_MS - 1).plots[0].ready).toBe(false);
  });

  it("holds plot 2 ripe from its moment to the end of the loop", () => {
    expect(frameAt(RIPE_2 - 200).plots[1].ready).toBe(false);
    expect(frameAt(RIPE_2 + 200).plots[1].ready).toBe(true);
    expect(frameAt(LOOP_MS - 1).plots[1].ready).toBe(true);
  });
});
