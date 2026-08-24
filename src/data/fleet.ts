import type { Accent, PipelineStage, RecoveryStep, TopologyNode } from "@/types";
import type { Stat } from "@/components/Stats";

/**
 * ssharcade — the delivery pipeline behind a four-repo Go fleet.
 *
 * Every string here is a real artifact read off the repos: job names from
 * `.github/workflows/release.yml`, tags from the publish step, hardening flags
 * from `deploy/docker-compose.yml`, and the RPO from a recorded kill-drill.
 * Nothing is paraphrased and nothing is invented — the section's whole argument
 * is that a reader who knows Actions or Compose recognises these on sight.
 *
 * Accent is layer identity, held consistently across the rail, the loop, the
 * topology and the stats: 3 = source, 1 = CI/healthy, 2 = host, 4 = data.
 */

export const FLEET_EYEBROW = "One host · four repos · zero manual steps";
export const FLEET_TITLE = "Shipping a Go fleet to a box I can throw away";

export const FLEET_LEDE =
  "Four Go services live behind one SSH port on a single EC2 instance. Merging to main builds " +
  "the image, ships it, and restarts the service on the host itself — and every save is streamed " +
  "to S3 so the instance underneath is replaceable.";

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
    accent: 1,
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
    runner: "self-hosted · production",
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

/**
 * The two decisions the rail cannot show. Everything above is what the machine
 * does; this is why it was built that way — including the release race that
 * only surfaced in production.
 */
export interface FleetDecision {
  label: string;
  headline: string;
  body: string;
  code?: string;
  accent: Accent;
}

export const fleetDecisions: FleetDecision[] = [
  {
    label: "Why the runner lives on the host",
    headline: "CI opens no inbound port",
    body:
      "The host's real sshd is locked to a single IP, and GitHub-hosted runners come from an " +
      "ever-changing range that will never match it — a dial-in deploy job would just time out. " +
      "Registering the runner as a service on the box instead means the deploy reaches production " +
      "without anything having to be let in.",
    accent: 2,
  },
  {
    label: "What broke in production",
    headline: "Two green runs, and the older one won",
    body:
      "Two PRs merged eleven seconds apart. Both workflows reported success, but each deploy copies " +
      "its own checkout over the live directory, so the winner was whichever finished last — not " +
      "whichever commit was newer. Production silently reverted to the previous registry. One " +
      "workflow-level concurrency group fixed it: at most one release in flight, and a newer merge " +
      "supersedes an older one rather than queueing behind it.",
    code: "concurrency:\n  group: release-production\n  cancel-in-progress: true",
    accent: 3,
  },
];

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

/** One stat per layer, so the colour coding carries all the way through. */
export const fleetStats: Stat[] = [
  { value: 20, prefix: "$", suffix: "/mo", label: "Flat hosting cost, whatever the game count", accent: 2 },
  { value: 12, suffix: "s", label: "Measured RPO in a kill-drill (60s budget)", accent: 4 },
  { value: 0, label: "Inbound ports opened for CI", accent: 1 },
  { value: 1472, label: "Tests across four repos, ~42% of the code", accent: 3 },
];

export function getPipelineStage(number: string): PipelineStage | undefined {
  return pipelineStages.find((s) => s.number === number);
}
