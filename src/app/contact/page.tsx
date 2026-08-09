import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ContactTerminal } from "@/features/contact/ContactTerminal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Nigel Smith about DevOps, cloud infrastructure, or web projects.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — Nigel Smith's Portfolio",
    description: "Contact Nigel Smith about DevOps, cloud infrastructure, or web projects.",
    siteName: "Nigel Smith's Portfolio",
    locale: "en_US",
    type: "website",
    url: "https://nigel-smith.dev/contact",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function ContactPage() {
  return (
    <main>
      <Container className="py-12">
        <ContactTerminal />
      </Container>
    </main>
  );
}
