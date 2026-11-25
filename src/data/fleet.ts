import type { FleetCabinet, PipelineStage, RecoveryStep, TopologyNode } from "@/types";
import type { Stat } from "@/components/Stats";

/** Fleet content verified against the public repositories on October 11, 2026.
 * Bulletin, the fifth service, was checked against its repository, the lobby's
 * deploy files, and ssharcade.dev on November 25, 2026.
 * Availability is a dated snapshot, not a live health feed.
 * Recovery figures describe the previously recorded local MinIO drill.
 */

/** The router plus one service per cabinet, each in its own repository. */
export const FLEET_SERVICE_COUNT = 5;

export const FLEET_EYEBROW = "one host · five repos · ci/cd pipeline";

/** The headline on /projects. Names the arcade, not the box. */
export const FLEET_HEADLINE = "Three games and a message board, one SSH command away.";

/** The box is still the interesting engineering. It is just not the hook. */
export const FLEET_SUBHEAD =
  "Five Go services behind a single SSH port on one EC2 instance, with every save streamed to S3 " +
  "so the box underneath is one I can throw away.";

/** The write-up's own title. The deep-dive is allowed to lead with the box. */
export const FLEET_TITLE = "Shipping a Go fleet to a box I can throw away";

/* ------------------------------------------------------------- the arcade */

export const FLEET_CONNECT = "ssh ssharcade.dev";

export const FLEET_CONNECT_NOTE =
  "Use an SSH client and a keypair to keep your saves. Farm and Moon Miner may allow guests, but guest progress is discarded. Statuses are a snapshot, not a live feed: the games were checked on October 11, 2026, and Bulletin joined in November. The lobby shows what is online right now.";

/** Cabinet names match the registry. Statuses are the snapshot dated in FLEET_CONNECT_NOTE. */
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
    name: "GAMBIT",
    slug: "chess",
    tagline: "Play the board over the wire.",
    status: "online",
    note: "Chess · SSH key required · alpha warning",
    accent: 1,
  },
  {
    name: "Bulletin",
    slug: "bulletin",
    tagline: "A message board for the arcade. Drafts autosave as you type.",
    status: "online",
    note: "Message board · SSH key required · alpha warning",
    accent: 1,
  },
];

/** Item 5 of the section: the thing that makes four cabinets feel like one place. */
export const IDENTITY_HEADLINE = "Your key is your account.";
export const IDENTITY_BODY =
  "Same key, same saves every time you reconnect. The router hashes your public key and forwards that identity " +
  "inward, so there is nothing to sign up for and nothing to remember, and no game ever sees the " +
  "key itself. Guest sessions, where allowed, keep no saves. GAMBIT and Bulletin require a key.";

/** The turn from the arcade to the machinery. Set as a rule across the measure. */
export const SHIPS_ITSELF = "and it ships itself";

/* ----------------------------------------------------------- the pipeline */

export const FLEET_TRIGGER = "gh release create vX.Y.Z";

/** Release validation, verification, publication, deployment, and banner check. */
export const pipelineStages: PipelineStage[] = [
  {
    number: "01",
    label: "Release",
    artifacts: ["vMAJOR.MINOR.PATCH", "release: published"],
    annotation: "Non-prerelease only; tagged commit must be on main.",
    accent: 3,
  },
  {
    number: "02",
    label: "Test",
    runner: "ubuntu-latest",
    artifacts: ["go vet ./...", "go build ./...", "go test -race ./..."],
    annotation: "Release verification gates image publication.",
    accent: 4,
  },
  {
    number: "03",
    label: "Publish",
    runner: "ubuntu-latest",
    artifacts: ["ghcr.io/…:vX.Y.Z", "@sha256:<digest>"],
    annotation: "Auth is the run's own token. Nothing stored.",
    accent: 1,
  },
  {
    number: "04",
    label: "Deploy",
    runner: "ubuntu-latest",
    artifacts: ["GitHub OIDC → AWS role", "aws ssm send-command"],
    annotation: "SSM runs the host script with the immutable image digest.",
    accent: 2,
  },
  {
    number: "05",
    label: "Live",
    artifacts: ["SSH banner version", "rollback on failure"],
    annotation: "Deployment checks the expected release version.",
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
  "role, so no AWS key exists in any image or compose file. In an earlier local drill against MinIO, a hard " +
  "kill plus a volume delete restored cleanly, with a measured 12s RPO against an enforced 60s budget.";

export const RECOVERY_LIMIT =
  "Those drills prove the mechanism. Only the live host proves the credentials, and an instance-loss drill is still on the list.";

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
    status: "online",
    posture: ["read_only", "uid 65532", "cap_drop: ALL", "512m"],
    accent: 1,
  },
  {
    name: "bulletin",
    ports: "no published ports",
    status: "online",
    posture: ["read_only", "uid 65532", "cap_drop: ALL", "256m"],
    accent: 1,
  },
];

export const TOPOLOGY_CHAIN = ["Route 53", "Elastic IP", "t3.small · us-east-1"];

export const TOPOLOGY_CAPTION =
  "The router terminates the player's SSH, then opens a second connection to the chosen game on a " +
  "private bridge network. Games publish nothing, so the router is the only public SSH listener and the " +
  "entry point for connection rate limiting. A game that is down degrades to OFFLINE in the menu " +
  "instead of breaking the arcade. Statuses are a snapshot (games checked October 11, 2026; Bulletin added in November). A separate Caddy service exposes web ports 80 and 443.";

/* --------------------------------------------------------------- the stats */

/** Avoid unmeasured cost and deployment-time claims. */
export const fleetStats: Stat[] = [
  { value: fleetCabinets.length, label: "Cabinets in the arcade", accent: 2 },
  { value: 12, suffix: "s", label: "RPO in the recorded local kill-drill (60s budget)", accent: 4 },
  { value: FLEET_SERVICE_COUNT, label: "Independently released Go services", accent: 1 },
  { value: 1, label: "Public SSH port (web uses 80/443)", accent: 2 },
];

export function getPipelineStage(number: string): PipelineStage | undefined {
  return pipelineStages.find((s) => s.number === number);
}
