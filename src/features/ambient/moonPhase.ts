const DEG = Math.PI / 180;
/** Mean length of one lunation, in days. */
export const SYNODIC_MONTH_DAYS = 29.530588853;
/** Half-width of the window, in lunation fraction (about a day), that counts as a principal phase. */
const PRINCIPAL_WINDOW = 1 / SYNODIC_MONTH_DAYS;

export type MoonPhaseName =
  | "new moon"
  | "waxing crescent"
  | "first quarter"
  | "waxing gibbous"
  | "full moon"
  | "waning gibbous"
  | "last quarter"
  | "waning crescent";

export interface MoonPhase {
  /** Position in the lunation: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
  phase: number;
  /** Fraction of the visible disc that is lit, 0–1. */
  illumination: number;
  waxing: boolean;
  name: MoonPhaseName;
}

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * The Moon's phase at `date`, from the low-precision lunar theory in Meeus,
 * *Astronomical Algorithms* ch. 48 (mean elongation plus the six largest
 * periodic terms). Good to well under an hour against published new/full moon
 * times — far finer than a few-pixel terminator can show.
 */
export function getMoonPhase(date: Date): MoonPhase {
  const julianDay = date.getTime() / 86_400_000 + 2_440_587.5;
  const T = (julianDay - 2_451_545) / 36_525;

  const D = normalizeDegrees(297.8501921 + 445_267.1114034 * T) * DEG; // mean elongation
  const M = normalizeDegrees(357.5291092 + 35_999.0502909 * T) * DEG; // Sun's mean anomaly
  const Mp = normalizeDegrees(134.9633964 + 477_198.8675055 * T) * DEG; // Moon's mean anomaly

  // 180° minus the phase angle i (Meeus 48.4): the Sun–Moon elongation that sets the phase.
  const elongation =
    D / DEG +
    6.289 * Math.sin(Mp) -
    2.1 * Math.sin(M) +
    1.274 * Math.sin(2 * D - Mp) +
    0.658 * Math.sin(2 * D) +
    0.214 * Math.sin(2 * Mp) +
    0.11 * Math.sin(D);

  const phase = normalizeDegrees(elongation) / 360;
  const illumination = (1 - Math.cos(elongation * DEG)) / 2;
  return { phase, illumination, waxing: phase < 0.5, name: phaseName(phase) };
}

export function phaseName(phase: number): MoonPhaseName {
  const near = (target: number) => {
    const d = Math.abs(phase - target);
    return Math.min(d, 1 - d) < PRINCIPAL_WINDOW;
  };
  if (near(0)) return "new moon";
  if (near(0.25)) return "first quarter";
  if (near(0.5)) return "full moon";
  if (near(0.75)) return "last quarter";
  if (phase < 0.25) return "waxing crescent";
  if (phase < 0.5) return "waxing gibbous";
  if (phase < 0.75) return "waning gibbous";
  return "waning crescent";
}

/*
 * South of the equator the Moon is seen "upside down": a waxing crescent is lit
 * on the left, and the maria are rotated 180°. The browser doesn't tell us
 * latitude without a permission prompt, but the IANA time zone is a good proxy.
 */
const SOUTHERN_ZONE_PREFIXES = ["Australia/", "Antarctica/", "America/Argentina/"];
const SOUTHERN_ZONES = new Set([
  "Pacific/Auckland",
  "Pacific/Chatham",
  "Pacific/Fiji",
  "Pacific/Tongatapu",
  "Pacific/Apia",
  "Pacific/Noumea",
  "Pacific/Efate",
  "Pacific/Norfolk",
  "Pacific/Port_Moresby",
  "Pacific/Tahiti",
  "Pacific/Rarotonga",
  "Pacific/Easter",
  "America/Buenos_Aires",
  "America/Santiago",
  "America/Punta_Arenas",
  "America/Sao_Paulo",
  "America/Bahia",
  "America/Recife",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Montevideo",
  "America/Asuncion",
  "America/La_Paz",
  "America/Lima",
  "Africa/Johannesburg",
  "Africa/Maputo",
  "Africa/Harare",
  "Africa/Lusaka",
  "Africa/Windhoek",
  "Africa/Gaborone",
  "Africa/Maseru",
  "Africa/Mbabane",
  "Africa/Blantyre",
  "Africa/Lubumbashi",
  "Africa/Luanda",
  "Africa/Dar_es_Salaam",
  "Indian/Antananarivo",
  "Indian/Mauritius",
  "Indian/Reunion",
  "Atlantic/Stanley",
  "Atlantic/St_Helena",
]);

export function isSouthernHemisphereZone(timeZone: string | undefined): boolean {
  if (!timeZone) return false;
  return SOUTHERN_ZONES.has(timeZone) || SOUTHERN_ZONE_PREFIXES.some((p) => timeZone.startsWith(p));
}
