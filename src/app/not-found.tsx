import Link from "next/link";
import { Container } from "@/components/Container";
import { H1, Paragraph } from "@/components/Typography";

export default function NotFound() {
  return (
    <main>
      <Container className="py-24">
        <H1 firstOnPage>404 — Page Not Found</H1>
        <Paragraph muted>This page doesn&apos;t exist or has been moved.</Paragraph>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-accent-1 transition-colors duration-200 hover:text-accent-2"
        >
          ← Back to Home
        </Link>
      </Container>
    </main>
  );
}
