# Content reconciliation — October 11, 2026

This pass updates facts and supporting documentation. It does not redesign page layouts,
styles, animations, or Open Graph artwork.

## Sources

- Owner-provided October 6, 2026 résumé: employment, education, coursework, skills,
  four earned certifications, and SSH Arcade project history.
- Owner corrections: replace Network+ with undated CCNA study; remove the $700/month
  savings claim and the fixed count of 11 shipped web apps.
- Public default-branch release workflows, read October 11, 2026:
  [lobby](https://github.com/mynameis-nigel/ssh-arcadelobby/blob/main/.github/workflows/release.yml),
  [Farm](https://github.com/mynameis-nigel/ssh-farm/blob/main/.github/workflows/release.yml),
  [Moon Miner](https://github.com/mynameis-nigel/ssh-moonminer/blob/main/.github/workflows/release.yml),
  [Chess](https://github.com/mynameis-nigel/ssh-chess/blob/main/.github/workflows/release.yml).
  Farm's reusable verification workflow and the lobby's default-branch deployment script
  were also checked. Local branches contain additional recovery work that is not described
  here as already merged.
- Lobby registry and Compose configuration: cabinet names, key/guest policy, service
  hardening, chess memory allocation, and the separate Caddy web listener.
- [Public arcade status API](https://api.ssharcade.dev/v1/players), observed at
  `2026-10-12T03:59:46Z` (October 11 in America/Boise): Farm, Moon Miner, and GAMBIT online.
  This is a snapshot, not a new live-status integration.

## Reconciled differences

| Surface | Difference resolved |
| --- | --- |
| Homepage experience | Add Full Coverage Tech consulting (May 2023–present), restore Fybercom's 200+ monthly calls, ISP scale, provisioning and optical audits, and specify Roundsphere's end-of-life OS migration and small-scale Workspace migrations. Remove the older Home Depot highlight to match the résumé's selected experience. |
| Education and caption | Expected July 2027; Networking, Hands-on SOC, IAM and DevOps coursework; identify the degree as in progress. |
| Statistics and achievements | Keep the résumé's 14% savings. Remove $700/month, the 11-app count, and unsupported enterprise/no-interruption wording. Use the documented 200+ monthly support-call metric. |
| Certifications and roadmap | Four earned credentials remain earned. Replace expired Network+ targets with CCNA study and no exam date. CCNA is excluded from earned totals and structured credentials. |
| Skills | Align with the résumé's Go, JavaScript/TypeScript, AWS IAM, Debian/Ubuntu and Cisco IOS; include project-backed Docker, Actions, OIDC/SSM and SQLite/Litestream. |
| Structured data | Current titles include Technical Support Representative and Cloud & IT Consultant. Name, links and titles come from shared professional data. |
| `/llms.txt` | Generate from the same education, experience, certifications, skills and project data as the site and shell. Remove conflicting certification dates/targets, location assertions, relocation plans and AWS Solutions Architect study that the supplied résumé and owner corrections do not establish. |
| Arcade pipeline and case study | Replace main-push/self-hosted-runner deployment with published non-prerelease GitHub Releases, tagged-main ancestry validation, verification, GHCR digests, OIDC and AWS SSM. Correct concurrency to `cancel-in-progress: false` plus the host-wide lock. Describe rollback limits without importing unmerged fixes. |
| Arcade availability and access | Name GAMBIT correctly and remove its obsolete first-release/offline label. Date the observed online snapshot. Distinguish persistent keyed saves from optional disposable guests; GAMBIT remains key-only. |
| Arcade technical claims | Distinguish the public SSH port from Caddy's web ports; correct GAMBIT's 512m allocation and the removed MinIO-client image-stage description. Remove unverified $0 marginal-cost, 15s deployment-time and fixed test-count/coverage claims. Label 12s RPO as a previously recorded local drill, not newly verified production recovery. |
| Scripted demo | Remove obsolete release versions and inferred beta/alpha labels. Label the recreation as scripted; leaderboard values are historical demo data. |
| Browser shell | `resume.sh` prints the shared career summary rather than pretending to download an unserved PDF. Include SSH Arcade in seeded project files. Base image v4 reseeds the sandbox; old overlays remain under their old localStorage key. No real download or network request is added. |
| Navigation and contributor docs | Remove a jump link to an unrendered section; correct this repository's clone URL and Vitest documentation; document the new content sources and shell behavior. |

## Reviewed without changes

- About-page hobbies, music, photography and personality are outside the résumé's scope.
- Contact email, GitHub and LinkedIn agree with the résumé/site identity.
- Other project descriptions, dynamic project metadata, manifest, robots, sitemap and
  redirects do not contradict the supplied résumé. Coming-soon interactive projects remain
  identified as such.
- Existing earned-certification dates are retained; the résumé confirms the credentials
  but does not provide their individual issue dates. The Credly verification link remains.
- The hero's existing Rexburg location is retained. No new residence or relocation claim
  is inferred from the employer's Idaho Falls location.
- Open Graph artwork was inspected and is deferred to the later visual pass requested
  by the owner.

## Verification boundaries

Repository workflow/configuration evidence is distinct from production deployment evidence.
No AWS deployment, credential inspection, production restore or new recovery benchmark is
part of this change. Previously recorded local recovery results remain qualified as historical;
the actual running digest and full-instance-loss recovery remain unverified.
