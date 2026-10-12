import { describe, expect, it } from "vitest";
import { getMoonPhase, isSouthernHemisphereZone, phaseName } from "./moonPhase";

/** Distance around the lunation, in hours, between `phase` and `target`. */
function hoursFrom(phase: number, target: number): number {
  const d = Math.abs(phase - target);
  return Math.min(d, 1 - d) * 29.530588853 * 24;
}

describe("getMoonPhase", () => {
  // Eclipses only happen at syzygy, so their published times are exact new/full moons.
  it.each([
    ["2024-04-08T18:21:00Z", "total solar eclipse"],
    ["2026-02-17T12:01:00Z", "annular solar eclipse"],
    ["2026-08-12T17:37:00Z", "total solar eclipse"],
  ])("finds the new moon at %s (%s)", (iso) => {
    const moon = getMoonPhase(new Date(iso));
    expect(hoursFrom(moon.phase, 0)).toBeLessThan(1);
    expect(moon.illumination).toBeLessThan(0.001);
    expect(moon.name).toBe("new moon");
  });

  it.each([
    ["2026-03-03T11:38:00Z", "total lunar eclipse"],
    ["2026-08-28T04:18:00Z", "partial lunar eclipse"],
  ])("finds the full moon at %s (%s)", (iso) => {
    const moon = getMoonPhase(new Date(iso));
    expect(hoursFrom(moon.phase, 0.5)).toBeLessThan(1);
    expect(moon.illumination).toBeGreaterThan(0.999);
    expect(moon.name).toBe("full moon");
  });

  it("is a thin waxing crescent two days after a new moon", () => {
    const moon = getMoonPhase(new Date("2026-10-12T18:00:00Z"));
    expect(moon.waxing).toBe(true);
    expect(moon.name).toBe("waxing crescent");
    expect(moon.illumination).toBeGreaterThan(0.02);
    expect(moon.illumination).toBeLessThan(0.08);
  });

  it("is half lit and waning at last quarter", () => {
    const moon = getMoonPhase(new Date("2026-11-01T20:28:00Z"));
    expect(moon.waxing).toBe(false);
    expect(moon.name).toBe("last quarter");
    expect(moon.illumination).toBeCloseTo(0.5, 1);
  });
});

describe("phaseName", () => {
  it("names the principal phases only within about a day of them", () => {
    expect(phaseName(0.99)).toBe("new moon");
    expect(phaseName(0.06)).toBe("waxing crescent");
    expect(phaseName(0.25)).toBe("first quarter");
    expect(phaseName(0.4)).toBe("waxing gibbous");
    expect(phaseName(0.51)).toBe("full moon");
    expect(phaseName(0.6)).toBe("waning gibbous");
    expect(phaseName(0.76)).toBe("last quarter");
    expect(phaseName(0.9)).toBe("waning crescent");
  });
});

describe("isSouthernHemisphereZone", () => {
  it.each(["Australia/Sydney", "Pacific/Auckland", "America/Argentina/Buenos_Aires", "Africa/Johannesburg"])(
    "treats %s as southern",
    (zone) => expect(isSouthernHemisphereZone(zone)).toBe(true),
  );

  it.each(["America/Denver", "Europe/London", "Asia/Tokyo", "UTC", undefined])("treats %s as northern", (zone) =>
    expect(isSouthernHemisphereZone(zone)).toBe(false),
  );
});
