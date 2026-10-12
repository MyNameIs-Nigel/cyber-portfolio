import { describe, expect, it } from "vitest";
import { couplingAt, flashIntensity, orderParameter, stepPhases } from "./fireflySync";

/** Deterministic swarm: evenly spread phases, rhythms within ±12% of a 3.2s period. */
function swarm(n: number) {
  const phases = Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2);
  const frequencies = Array.from({ length: n }, (_, i) => ((Math.PI * 2) / 3.2) * (0.88 + (0.24 * i) / (n - 1)));
  return { phases, frequencies };
}

function simulate(seconds: number, coupling: (t: number) => number, n = 30) {
  const { phases, frequencies } = swarm(n);
  const dt = 1 / 60;
  for (let t = 0; t < seconds; t += dt) stepPhases(phases, frequencies, coupling(t), dt);
  return orderParameter(phases).r;
}

describe("firefly synchrony", () => {
  it("stays scattered when the fireflies ignore each other", () => {
    expect(simulate(60, () => 0.04)).toBeLessThan(0.4);
  });

  it("falls into step under strong coupling", () => {
    expect(simulate(40, () => 1.5)).toBeGreaterThan(0.9);
  });

  it("gathers during the scheduled sync window", () => {
    expect(simulate(50, couplingAt)).toBeGreaterThan(0.85);
  });

  it("cycles between loose and tight coupling", () => {
    const samples = Array.from({ length: 80 }, (_, t) => couplingAt(t));
    expect(Math.min(...samples)).toBeLessThan(0.1);
    expect(Math.max(...samples)).toBeGreaterThan(1);
  });

  it("flashes at phase zero and is dark half a cycle away", () => {
    expect(flashIntensity(0)).toBe(1);
    expect(flashIntensity(Math.PI)).toBeLessThan(0.001);
    expect(flashIntensity(Math.PI * 2 - 0.05)).toBeGreaterThan(0.9);
  });
});
