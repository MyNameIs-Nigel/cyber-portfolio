import type { FleetCabinet, PipelineStage, RecoveryStep, TopologyNode } from "@/types";
import type { Stat } from "@/components/Stats";

/**
 * ssharcade — a three-cabinet arcade you reach over SSH, and the pipeline that
 * keeps it shipped.
 *
 * Every string here is a real artifact read off the repos: job names from
 * `.github/workflows/release.yml`, tags from the publish step, hardening flags
 * from `deploy/docker-compose.yml`, and the RPO from a recorded kill-drill.
 * Nothing is paraphrased and nothing is invented — the section's whole argument
 * is that a reader who knows Actions or Compose recognises these on sight.
 *
 * Order of the section is the order of a visit: you see the arcade, you get the
 * command that opens it, you see what is behind the door. The delivery pipeline
 * is the last thing, because it is the answer to "how does that stay true",
 * which is not a question anyone asks before they have seen the thing.
 *
 * Accent is layer identity, held consistently across the rail, the loop, the
 * topology and the stats: 3 = source, 4 = verified (the suite, and the data that
 * is replicated off the box), 1 = CI/healthy, 2 = host.
 */

export const FLEET_EYEBROW = "one host · four repos · ci/cd pipeline";

/** The headline on /projects. Names the arcade, not the box. */
export const FLEET_HEADLINE = "Three games accessible by one SSH command.";

/** The box is still the interesting engineering — it is just not the hook. */
export const FLEET_SUBHEAD =
  "Four Go services behind a single SSH port on one EC2 instance, and every save streamed to S3 " +
  "so the box underneath is one I can throw away.";

/** The write-up's own title. The deep-dive is allowed to lead with the box. */
export const FLEET_TITLE = "Shipping a Go fleet to a box I can throw away";

/* ------------------------------------------------------------- the arcade */

export const FLEET_CONNECT = "ssh play.ssharcade.dev";

export const FLEET_CONNECT_NOTE =
  "No account, no client, no install. If you have an SSH client you already have everything.";

/**
 * The cabinets, as the router's menu lists them.
 *
 * Accent stays 1 for all three because on this page accent means layer, not
 * game — the games are the healthy service layer, the same colour they carry in
 * the topology. `chess` shows OFFLINE because that is its true state today: it
 * is in the registry ahead of its first deploy, and the prober degrades it in
 * the menu rather than breaking the arcade. Showing that is better evidence
 * than hiding it.
 *
 * Status is static, read off the fleet as it stands. The shape is the shape a
 * live prober would fill in, so wiring one up later is a data change.
 */
export const fleetCabinets: FleetCabinet[] = [
  {
    name: "Farm",
    slug: "farm",
    tagline: "Plant, water, wait. A save that keeps growing while you are gone.",
    status: "online",
    accent: 1,
  },
  {
    name: "Moon Miner",
    slug: "moonminer",
    tagline: "Work an asteroid belt on radar. Cycle views with V.",
    status: "online",
    accent: 1,
  },
  {
    name: "Chess",
    slug: "chess",
    tagline: "Play the board over the wire.",
    status: "offline",
    note: "awaiting first release",
    accent: 1,
  },
];

/** Item 5 of the section: the thing that makes three games feel like one place. */
export const IDENTITY_HEADLINE = "Your key is your account.";
export const IDENTITY_BODY =
  "Same key, same saves, any game. The router hashes your public key and forwards that identity " +
  "inward, so there is nothing to sign up for and nothing to remember — and no game ever sees the " +
  "key itself.";

/** The turn from the arcade to the machinery. Set as a rule across the measure. */
export const SHIPS_ITSELF = "and it ships itself";

/* ----------------------------------------------------------- the pipeline */

export const FLEET_TRIGGER = "git push origin main";

/** The line: ordered, one-way, runs once per merge. */
export const pipelineStages: PipelineStage[] = [
  {
    number: "01",
    label: "Commit",
    artifacts: ["task branch → PR", "never main"],
    annotation: "main deploys for real.",
    accent: 3,
  },
  {
    number: "02",
    label: "Test",
    runner: "ubuntu-latest",
    artifacts: ["go vet ./...", "go build ./...", "go test -race ./..."],
    annotation: "Runs again on release. Never skipped.",
    accent: 4,
  },
  {
    number: "03",
    label: "Publish",
    runner: "ubuntu-latest",
    artifacts: ["ghcr.io/…:latest", ":sha-b8315db"],
    annotation: "Auth is the run's own token. Nothing stored.",
    accent: 1,
  },
  {
    number: "04",
    label: "Deploy",
    runner: "[self-hosted, production]",
    artifacts: ["docker compose pull", "docker compose up -d"],
    annotation: "Runs on the box, not over SSH.",
    accent: 2,
  },
  {
    number: "05",
    label: "Live",
    artifacts: ["● ONLINE", "~15s"],
    annotation: "Prober confirms the new version.",
    accent: 1,
  },
];

/** Shown beside the rail's trigger line, so the track carries its own scale. */
export const PIPELINE_CAPTION = "Hover a stage for the commands it runs.";

/* ------------------------------------------- drawn on the write-up, not here */

/** The loop: cyclic, continuous, never "completes". Unnumbered on purpose. */
export const recoverySteps: RecoveryStep[] = [
  { label: "sqlite", detail: "on the container's volume", accent: 4 },
  { label: "litestream", detail: "replicates every ~1s", accent: 4 },
  { label: "s3://", detail: "versioned · SSE-S3 · private", accent: 4 },
  { label: "restore", detail: "on next boot, automatically", accent: 1 },
];

export const RECOVERY_CAPTION =
  "The volume is a cache; the bucket is the fleet's data. Credentials come from the EC2 instance " +
  "role, so no AWS key exists in any image or compose file. Drilled locally against MinIO — a hard " +
  "kill plus a volume delete restored clean, with a measured 12s RPO against an enforced 60s budget.";

export const RECOVERY_LIMIT =
  "Those drills prove the mechanism. Only the live host proves the credentials — an instance-loss drill is still on the list.";

/** The nest: containment. One public listener wrapping private ones. */
export const topologyNodes: TopologyNode[] = [
  {
    name: "router",
    ports: "22 → 2222",
    status: "online",
    posture: ["read_only", "uid 65532", "cap_drop: ALL", "256m"],
    accent: 2,
  },
  {
    name: "farm",
    ports: "no published ports",
    status: "online",
    posture: ["read_only", "uid 65532", "cap_drop: ALL", "256m"],
    accent: 1,
  },
  {
    name: "moonminer",
    ports: "no published ports",
    status: "online",
    posture: ["read_only", "uid 65532", "cap_drop: ALL", "256m"],
    accent: 1,
  },
  {
    name: "chess",
    ports: "no published ports",
    status: "offline",
    posture: ["awaiting first release", "512m"],
    accent: 1,
  },
];

export const TOPOLOGY_CHAIN = ["Route 53", "Elastic IP", "t3.small · us-east-1"];

export const TOPOLOGY_CAPTION =
  "The router terminates the player's SSH, then opens a second connection to the chosen game on a " +
  "private bridge network. Games publish nothing, so the router is the only public listener and the " +
  "only place rate limiting has to happen. A game that is down degrades to OFFLINE in the menu " +
  "instead of breaking the arcade.";

/* --------------------------------------------------------------- the stats */

/**
 * What the arrangement bought, one number each: the host, the data, the loop
 * that keeps it current, and the size of the attack surface. The test count
 * moved to the write-up — it is evidence for a claim this strip no longer makes.
 */
export const fleetStats: Stat[] = [
  { value: 0, prefix: "$", suffix: "/mo", label: "Marginal cost of the next game on the box", accent: 2 },
  { value: 12, suffix: "s", label: "Measured RPO in a kill-drill (60s budget)", accent: 4 },
  { value: 15, prefix: "~", suffix: "s", label: "Merge to live, tests included", accent: 1 },
  { value: 1, label: "Public port for the whole fleet", accent: 2 },
];

export function getPipelineStage(number: string): PipelineStage | undefined {
  return pipelineStages.find((s) => s.number === number);
}
