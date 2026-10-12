import { profile } from "@/data/profile";
import { certifications, CREDLY_PROFILE_URL } from "@/data/certifications";
import { skillCategories } from "@/data/skills";
import { projects } from "@/data/projects";
import { FLEET_SUMMARY, FLEET_TAGS, FLEET_LIMITS } from "@/data/fleetCaseStudy";
import { FLEET_CONNECT, FLEET_CONNECT_NOTE } from "@/data/fleet";

/** Used by both the shell résumé and the public machine-readable profile. */
export function renderCareerSummary(): string {
  return [
    `# ${profile.name}`,
    "",
    `> ${profile.summary}`,
    "",
    "## Contact",
    `- Email: ${profile.email}`,
    `- LinkedIn: ${profile.linkedin}`,
    `- GitHub: ${profile.github}`,
    `- Portfolio: ${profile.website}`,
    "",
    "## Education",
    `- ${profile.education.degree}, ${profile.education.school} — ${profile.education.graduation}`,
    `- Relevant coursework: ${profile.education.coursework.join(", ")}`,
    "",
    "## Work Experience",
    ...profile.experience.flatMap((job) => [
      "", `### ${job.title} — ${job.company} (${job.dates})`, job.location,
      ...job.bullets.map((bullet) => `- ${bullet}`),
    ]),
    "",
    "## Certifications",
    ...certifications.map((cert) => `- ${cert.name} — ${cert.issuer} — ${cert.status === "earned" ? `Earned ${cert.date}` : "Studying; no exam date set"}`),
    `Verify earned badges: ${CREDLY_PROFILE_URL}`,
    "",
    "## Technical Skills",
    ...skillCategories.map((category) => `- ${category.title}: ${category.items.join("; ")}`),
    "",
    "## Projects",
    "",
    "### SSH Arcade (June 2026 – Present)",
    FLEET_SUMMARY,
    `Stack: ${FLEET_TAGS.join(", ")}`,
    `Case study: ${profile.website}/projects/ssh-arcade-fleet`,
    `Play: ${FLEET_CONNECT}. ${FLEET_CONNECT_NOTE}`,
    "Scope and verification limits:",
    ...FLEET_LIMITS.map((limit) => `- ${limit}`),
    ...projects.flatMap((project) => [
      "", `### ${project.title}`, project.description,
      `Stack: ${project.tags.join(", ")}`,
      `Case study: ${profile.website}/projects/${project.slug}`,
      `Site: ${project.link}`,
      ...(project.repoUrl ? [`Source: ${project.repoUrl}`] : []),
    ]),
    "",
    "## Currently",
    "- Seeking DevOps and cloud roles, with an interest in cloud security",
    `- ${profile.certificationStudy.description}`,
    "",
  ].join("\n");
}
