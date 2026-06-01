"use client";

import { Container } from "@/components/Container";
import { H1, Paragraph } from "@/components/Typography";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <Container className="py-24">
        <H1 firstOnPage>Something went wrong</H1>
        <Paragraph muted>An unexpected error occurred. Please try again.</Paragraph>
        <button
          type="button"
          onClick={reset}
          className="mt-4 text-sm font-medium text-accent-1 transition-colors duration-200 hover:text-accent-2"
        >
          Try again
        </button>
      </Container>
    </main>
  );
}
