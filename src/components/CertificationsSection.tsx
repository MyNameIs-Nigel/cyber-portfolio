import type { SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { H2 } from "@/components/Typography";
import { CREDLY_PROFILE_URL, certifications } from "@/data/certifications";
import type { Certification } from "@/types";

type Status = Certification["status"];

const hoverBorder: Record<Status, string> = {
  earned: "hover:border-accent-1/50",
  anticipated: "hover:border-accent-2/50",
};

const dotColor: Record<Status, string> = {
  earned: "bg-accent-1",
  anticipated: "bg-accent-2",
};

const chipStyle: Record<Status, string> = {
  earned: "border-accent-1/30 bg-accent-1/10 text-accent-1",
  anticipated: "border-accent-2/30 bg-accent-2/10 text-accent-2",
};

const chipLabel: Record<Status, string> = {
  earned: "Earned",
  anticipated: "Expected",
};

/** Verified-badge rosette, in the hand-rolled inline-SVG style used in Footer.tsx. */
function IconVerifiedBadge(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-6 w-6" {...props}>
      <path d="M12 1.5 14.6 4l3.5-.4 1 3.4 3.1 1.7-1.3 3.3 1.3 3.3-3.1 1.7-1 3.4-3.5-.4L12 22.5 9.4 20l-3.5.4-1-3.4L1.8 15.3 3.1 12 1.8 8.7l3.1-1.7 1-3.4L9.4 4 12 1.5Zm-1.1 13.9 5.4-5.4-1.4-1.4-4 4-1.8-1.8-1.4 1.4 3.2 3.2Z" />
    </svg>
  );
}

export function CertificationsSection() {
  return (
    <section id="certifications">
      <H2>Certifications</H2>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
        <figure className="m-0">
          <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-xl border border-border bg-surface sm:mx-0 sm:w-full">
            <Image
              src="/headshot.jpg"
              alt="Nigel Smith"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 160px, 208px"
            />
          </div>
          <figcaption className="mt-3 text-center sm:text-left">
            <p className="text-sm font-semibold text-fg">Nigel Smith</p>
            <p className="text-xs text-muted">B.S. Cybersecurity · BYU–Idaho</p>
          </figcaption>
        </figure>

        <ul className="grid grid-cols-1 gap-2 self-start">
          {certifications.map((cert) => (
            <li
              key={cert.name}
              className={`flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors duration-200 ${hoverBorder[cert.status]}`}
            >
              <span className="flex min-w-0 items-start gap-2.5">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor[cert.status]}`}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg">{cert.name}</span>
                  <span className="mt-0.5 block font-mono text-xs text-muted">
                    {cert.issuer} · {cert.date}
                  </span>
                </span>
              </span>
              <span
                className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${chipStyle[cert.status]}`}
              >
                {chipLabel[cert.status]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={CREDLY_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-4 flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4 outline-none transition-colors duration-200 hover:border-accent-4/50 focus-visible:border-accent-4 focus-visible:ring-2 focus-visible:ring-accent-4 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <IconVerifiedBadge className="h-6 w-6 shrink-0 text-accent-4" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-fg">Verify my badges on Credly</span>
          <span className="block truncate font-mono text-xs text-muted">
            credly.com/users/nigeld-smith
          </span>
        </span>
        <span
          className="shrink-0 text-accent-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden
        >
          →
        </span>
      </Link>
    </section>
  );
}
