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
  "Four Go services, four repos, one EC2 instance. Every merge to main is tested, built into a " +
  "container, published to GHCR and rolled out by a runner living on the host itself — and every " +
  "byte of player state is streamed to S3 so the host underneath can be replaced.";

export const FLEET_TAGS = [
  "Go",
  "GitHub Actions",
  "Docker",
  "AWS EC2",
  "S3",
  "Litestream",
  "SQLite",
];

export const caseStudySections: CaseStudySection[] = [
  {
    id: "constraint",
    eyebrow: "The constraint",
    title: "An SSH session cannot be handed off",
    accent: 3,
    body: [
      "The whole architecture falls out of one protocol fact: an SSH connection is bound to the endpoint that completed its handshake, so there is no way to accept a player on one server and pass them to another. A lobby that lists games therefore cannot redirect anyone.",
      "So the router terminates the player's SSH itself, runs the menu, and — once a game is chosen — opens a second, outbound SSH connection to that game on a private Docker network, piping terminal bytes both ways. Games publish no ports at all. That makes the router the only public listener, the only place rate limiting has to happen, and the only component that has to be careful.",
      "It also means the router never sees game content: it logs connect, select and disconnect metadata, and nothing else.",
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
      "The private half is a Compose file secret mounted from the host. It has never been in an image or in git.",
    ],
  },
  {
    id: "pipeline",
    eyebrow: "Delivery",
    title: "Test, publish, deploy — and the deploy runs on the box",
    accent: 1,
    body: [
      "Each repo carries the same two workflows. CI runs on pull requests and every branch except main; release runs on push to main and repeats the full test job before anything is built, so an untested merge cannot reach production.",
      "The interesting job is the third one. A deploy that dials into the host over SSH would need the host's sshd reachable from GitHub's runner IP range — but that sshd is deliberately locked to a single address, and runner IPs change constantly. Rather than widen the firewall, the runner is registered as a systemd service on the instance itself. The deploy job runs where the containers already are, and CI never needs an inbound port opened.",
      "The publish job's only credential is the workflow run's own GITHUB_TOKEN, scoped to packages: write. Nothing longer-lived is stored.",
    ],
    code: {
      caption: ".github/workflows/release.yml",
      content: `deploy:
  needs: publish
  runs-on: [self-hosted, production]
  environment: production
  steps:
    - name: Deploy router
      run: |
        cd /srv/ssharcade
        docker compose pull router
        docker compose up -d router`,
    },
    specs: [
      { term: "CI", value: "go vet · go build · go test -race" },
      { term: "Image tags", value: ":latest and :sha-<short>" },
      { term: "Runners", value: "ubuntu-latest for test and publish, self-hosted for deploy" },
      { term: "Credential", value: "the run's own GITHUB_TOKEN, packages: write" },
    ],
  },
  {
    id: "race",
    eyebrow: "What broke",
    title: "Two green runs, and the older one won",
    accent: 2,
    body: [
      "Two pull requests merged eleven seconds apart. Both release runs went green. The second one deployed first; the first one, built from the older tree, finished seven seconds later and copied its checkout over the live directory — reverting production to the previous game registry while both runs reported success.",
      "The bug was not in either workflow. It was in the assumption that runs are serialised. A workflow-level concurrency group fixed it: at most one release is ever in flight, and a newer merge supersedes an older one rather than queueing behind it and then clobbering it. Superseding is safe here because the deploy is idempotent — a cancelled run is always followed by a newer one doing the same work from a newer tree.",
    ],
    code: {
      caption: "the four lines that fixed it",
      content: `concurrency:
  group: release-production
  cancel-in-progress: true`,
    },
  },
  {
    id: "image",
    eyebrow: "The image",
    title: "Static binary, hardened runtime",
    accent: 1,
    body: [
      "Every service builds the same way: a Go stage producing a fully static binary, then pinned upstream stages for Litestream and the MinIO client, all copied into a bare Alpine runtime that runs as a non-root uid with no home directory.",
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
      { term: "Limits", value: "256m / 1.0 cpu per service" },
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
      "The drills run against MinIO: hard-kill the container with no graceful flush, delete the volume, bring it back, and fail the run if the measured RPO exceeds its budget. One of them deliberately bypasses the container's boot path entirely, restoring to a scratch directory, so a bug in the entrypoint cannot mask a bug in the replica data or the other way round. Another runs the real image with no network at all, to prove nothing quietly succeeds against an ambient credential.",
      "The first version of these checks passed vacuously. They waited for a log line the entrypoint prints unconditionally, before Litestream is even invoked — so an empty bucket still looked like a successful restore. They now assert on Litestream's own output, and that assertion was verified by a negative test: wiping the bucket between the kill and the restore makes the check fire.",
    ],
  },
];

/** What this page is careful not to claim. */
export const FLEET_LIMITS = [
  "Replication is live in production for all three running services, and the drills above run against MinIO. A full instance-loss drill — terminate the box, bootstrap a fresh one, bring everything back from S3 — has not been run yet.",
  "Those drills prove the mechanism. Only the live host proves the credentials: production leaves the access keys unset so Litestream picks up the instance role, while the drill stack sets them explicitly, so a broken IAM policy would pass every local drill and still fail for real.",
  "There is no Terraform here. The instance is provisioned from a written runbook, which is honest for one box and would not scale to several.",
];

export const FLEET_LINKS = [
  { label: "ssharcade.dev", href: "https://ssharcade.dev/", primary: true },
  { label: "GitHub", href: "https://github.com/MyNameIs-Nigel", primary: false },
];
