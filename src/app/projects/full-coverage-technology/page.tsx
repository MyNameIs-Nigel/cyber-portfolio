import { Paragraph } from "@/components/Typography";
import { ProjectPage, projectMetadata } from "@/components/projects/ProjectPage";
import { getProjectBySlug } from "@/data/projects";

const project = getProjectBySlug("full-coverage-technology");

export const metadata = projectMetadata(project);

export default function FullCoverageTechnologyPage() {
  return (
    <ProjectPage project={project}>
      {/* Placeholder until the write-up lands: the summary from projects.ts. */}
      {project.content.map((paragraph, i) => (
        <Paragraph key={i}>{paragraph}</Paragraph>
      ))}
    </ProjectPage>
  );
}
