import type { Accent } from "@/types";

/**
 * Long-form content for /projects/ssh-arcade-fleet.
 *
 * Same rule as the section on /projects: every command, flag and figure here is
 * read off the repos. Where something is designed but not yet proven, it says so
 * — see FLEET_LIMITS.
 */

export interface CaseStudySection {
  id: string;
  eyebrow: string;
  title: string;
  body: string[];
  /** Real config, quoted rather than described. */
  code?: { caption: string; content: string };
  /** Short fact pairs rendered as a spec list. */
  specs?: { term: string; value: string }[];
  accent: Accent;
}

export const FLEET_SUMMARY =
  "Four Go services, four repos, one EC2 instance. Published GitHub Releases validate the " +
  "tagged commit, run verification, publish a container to GHCR, and deploy its immutable digest " +
  "through GitHub OIDC and AWS SSM. SQLite player state is replicated to S3 with Litestream.";

export const FLEET_TAGS = [
  "Go",
  "GitHub Actions",
  "Docker",
  "AWS EC2",
  "AWS SSM",
  "OIDC",
  "S3",
  "Litestream",
  "SQLite",
];

export const caseStudySections: CaseStudySection[] = [
  {
    id: "constraint",
    eyebrow: "The constraint",
    title: "Bridging players from the lobby to a game",
    accent: 3,
    body: [
      "An established SSH session stays with the server that accepted it. To let players choose a game without reconnecting their client, the lobby needs to bridge the terminal session to the selected service.",
      "The router terminates the player's SSH, runs the menu, and opens a second SSH connection to the selected game on a private Docker network, piping terminal bytes both ways. Games publish no ports. The router is the public SSH entry point and applies connection rate limits; a separate Caddy service handles web traffic on ports 80 and 443.",
      "The router forwards terminal bytes between the player and game; its session logs record connect, select, and disconnect metadata rather than terminal content.",
    ],
  },
  {
    id: "identity",
    eyebrow: "Identity",
    title: "Your public key is your account",
    accent: 3,
    body: [
      "Behind the router, a game never sees the player's key — it sees the router's. So the router authenticates with its own ed25519 proxy key and forwards the player's identity as data in the SSH username: a 64-character hex SHA-256 of their public key, a dot, then a sanitised save slot.",
      "The game-side rule is deliberately absolute. If and only if the session's key matches a trusted proxy key is the connection treated as proxied and identity read from the username. Any other key is a direct connection whose identity comes from the key itself. That keeps local development working, and it means a hostile direct connection cannot forge anything — without the proxy private key the proxied branch is simply unreachable, and the compound username sanitises down to a harmless slot under the attacker's own key.",
      "The private half is a Compose file secret mounted from the host rather than baked into the image. Optional guest sessions use a separate disposable identity: Farm and Moon Miner support guests when enabled, discard their progress, and do not create persistent saves. GAMBIT remains key-only.",
    ],
  },
  {
    id: "pipeline",
    eyebrow: "Delivery",
    title: "Published release, immutable image, OIDC and SSM",
    accent: 1,
    body: [
      "Merging code and deploying production are separate steps. The release workflows run when a non-prerelease GitHub Release is published. They validate a vMAJOR.MINOR.PATCH tag and require its commit to be reachable from main before verification and image publication.",
      "GitHub-hosted runners publish to GHCR using GITHUB_TOKEN. The deploy job obtains short-lived AWS credentials through GitHub OIDC, then uses SSM Run Command to execute the deployment script on EC2. This replaces the older self-hosted runner approach and does not require opening an inbound management port for CI.",
      "The deployment receives the digest produced by that build, persists the selected image in the host configuration, and verifies the running service's SSH banner against the expected release version. A failed check triggers application/configuration rollback and still reports the deployment as failed. This is not a database rollback.",
    ],
    code: {
      caption: ".github/workflows/release.yml (trigger and concurrency excerpt)",
      content: `on:
  release:
    types: [published]

concurrency:
  group: release-production
  cancel-in-progress: false`,
    },
    specs: [
      { term: "Trigger", value: "Published non-prerelease vMAJOR.MINOR.PATCH on main ancestry" },
      { term: "Verification", value: "Go build, vet, race tests and deployment regression checks" },
      { term: "Production image", value: "CI-produced immutable sha256 digest" },
      { term: "Deploy runner", value: "ubuntu-latest → GitHub OIDC → AWS SSM → EC2" },
      { term: "Credentials", value: "GITHUB_TOKEN for GHCR; short-lived assumed AWS role for SSM" },
    ],
  },
  {
    id: "race",
    eyebrow: "What broke",
    title: "Preventing overlapping deployments",
    accent: 2,
    body: [
      "An earlier deployment race let an older workflow overwrite a newer deployment while both runs appeared successful. That incident exposed the danger of treating independent workflow runs as though they execute in order.",
      "The current release workflows use a release-production concurrency group with cancel-in-progress set to false so an active SSM deployment is not interrupted. The host script also takes a fleet-wide flock to serialize deployments across the four repositories; a repository-level Actions group alone cannot coordinate them.",
      "Deploying a recorded digest and checking the expected banner makes the result explicit. The recovery script attempts to restore the previous application image and configuration. Recovery still needs operator attention if no previous running image is available or rollback itself fails.",
    ],
  },
  {
    id: "image",
    eyebrow: "The image",
    title: "Static binary, hardened runtime",
    accent: 1,
    body: [
      "Every service builds the same way: a Go stage producing a fully static binary, then a pinned upstream Litestream stage, copied into an Alpine runtime that runs as a non-root uid with no home directory.",
      "Alpine rather than distroless, deliberately — the entrypoint needs a shell to run the restore before handing off to the game, and a dependable restore path was worth more than removing the shell. The lockdown happens at the Compose layer instead: read-only root filesystem, all capabilities dropped, no new privileges, a tmpfs for /tmp.",
    ],
    code: {
      caption: "Dockerfile",
      content: `RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" \\
        -o /out/ssh-farm ./cmd/ssh-farm`,
    },
    specs: [
      { term: "Build", value: "golang:1.26.4-alpine3.22 → alpine:3.22" },
      { term: "User", value: "uid 65532, no home directory" },
      { term: "Filesystem", value: "read_only, tmpfs on /tmp" },
      { term: "Capabilities", value: "cap_drop: ALL, no-new-privileges" },
      { term: "Limits", value: "256m / 1.0 cpu for router, Farm and Moon Miner; GAMBIT uses 512m" },
    ],
  },
  {
    id: "durability",
    eyebrow: "Durability",
    title: "The volume is a cache; the bucket is the data",
    accent: 4,
    body: [
      "Each service keeps its state in SQLite on a Docker volume. Litestream replicates that file to S3 roughly every second, and on boot the entrypoint restores it before the game starts — so a container that comes up with an empty volume rebuilds itself from the bucket without anyone doing anything.",
      "The bucket is versioned, encrypted, and closed to the public. Credentials come from the EC2 instance role, scoped by policy to that one bucket, which means no AWS key exists in any image or compose file.",
      "The game binaries needed no changes for any of this. Durability is entirely container plumbing.",
    ],
    specs: [
      { term: "Replication lag", value: "~1 second" },
      { term: "Measured RPO", value: "12s in a kill-drill, against an enforced 60s budget" },
      { term: "Retention", value: "72h of generations, 30d on noncurrent versions" },
      { term: "Credentials", value: "EC2 instance role — none stored in the image" },
    ],
  },
  {
    id: "drills",
    eyebrow: "Proving it",
    title: "A restore that decodes, not just one that opens",
    accent: 4,
    body: [
      "A restore drill that only checks the database opens is close to worthless: a torn restore can pass an integrity check while carrying a truncated save blob, and that player's progress is gone even though the file looks fine. So the check decodes every save through the same code the game boots with, and prints the newest write time so the drill can compute the observed RPO itself.",
      "The previously recorded drills ran against MinIO: hard-kill the container with no graceful flush, delete the volume, bring it back, and fail the run if the measured RPO exceeds its budget. One of them deliberately bypasses the container's boot path entirely, restoring to a scratch directory, so a bug in the entrypoint cannot mask a bug in the replica data or the other way round. Another runs the real image with no network at all, to prove nothing quietly succeeds against an ambient credential.",
      "The first version of these checks passed vacuously. They waited for a log line the entrypoint prints unconditionally, before Litestream is even invoked — so an empty bucket still looked like a successful restore. The revised checks assert on Litestream's own output, and that assertion was verified by a negative test: wiping the bucket between the kill and the restore makes the check fire.",
    ],
  },
];

/** What this page is careful not to claim. */
export const FLEET_LIMITS = [
  "The 12s RPO is from a previously recorded local MinIO kill-drill, not a new measurement of production recovery. A full instance-loss drill — terminate the box, bootstrap a fresh one, bring everything back from S3 — remains unverified.",
  "The Compose configuration uses EC2 instance-role credentials for Litestream. Local drills use explicit credentials, so they cannot establish that the running production IAM policy or replication is healthy.",
  "The release path described here matches the repository workflows checked on October 11, 2026; it does not establish which release digest is currently running. The instance is provisioned from a written runbook rather than Terraform.",
];

export const FLEET_LINKS = [
  { label: "ssharcade.dev", href: "https://ssharcade.dev/", primary: true },
  { label: "GitHub", href: "https://github.com/MyNameIs-Nigel", primary: false },
];
