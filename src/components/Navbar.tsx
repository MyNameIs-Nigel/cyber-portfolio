"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/Container";
import { ContactModal } from "@/components/ContactModal";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-bg/60 backdrop-blur-xl transition-colors duration-200">
        <Container className="flex items-center justify-between py-3">
          <Link href="/" className="text-fg font-semibold tracking-tight transition-colors duration-200 hover:text-accent-1">
            .nigelsmith
          </Link>

          <nav className="hidden items-center gap-6 sm:flex" aria-label="Main">
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm transition-colors duration-200 ${
                    active ? "text-accent-1" : "text-muted hover:text-fg"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="rounded-full border border-accent-1/40 px-3 py-1 text-sm text-accent-1 transition-colors duration-200 hover:border-accent-1 hover:bg-accent-1/10"
            >
              Contact
            </button>
          </nav>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-fg transition-colors duration-200 hover:border-accent-1/50 sm:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </Container>

      </header>

      <div
        id="mobile-nav"
        className={`fixed inset-0 z-[60] bg-bg/95 backdrop-blur-xl transition-all duration-200 sm:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className={`flex min-h-full flex-col items-center justify-center gap-8 px-6 transition-transform duration-200 ${menuOpen ? "translate-y-0" : "-translate-y-2"}`}>
          <button
            type="button"
            className="absolute right-6 top-6 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-fg"
            onClick={closeMenu}
          >
            Close
          </button>
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-2xl font-semibold tracking-tight transition-colors duration-200 ${
                  active ? "text-accent-1" : "text-fg hover:text-accent-1"
                }`}
                onClick={closeMenu}
              >
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            className="text-2xl font-semibold tracking-tight text-accent-1 transition-colors duration-200 hover:text-accent-2"
            onClick={() => {
              closeMenu();
              setContactOpen(true);
            }}
          >
            Contact
          </button>
        </div>
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
