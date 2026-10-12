import { renderCareerSummary } from "@/data/careerText";

export const dynamic = "force-static";

export function GET() {
  return new Response(renderCareerSummary(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
