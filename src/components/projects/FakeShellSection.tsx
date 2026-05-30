"use client";

import { InteractiveMobileWarningModal } from "@/components/InteractiveMobileWarningModal";
import { H2, Paragraph } from "@/components/Typography";
import { FakeShellApp } from "@/features/terminal/FakeShellApp";
import { SHELL_MOBILE_DISMISS_KEY } from "@/features/terminal/shell.constants";

export function FakeShellSection() {
  return (
    <section>
      <H2>Fake Terminal</H2>
      <Paragraph muted>
        Use this simulated terminal to learn about some of my projects!
      </Paragraph>
      <div className="relative mt-4">
        <InteractiveMobileWarningModal
          contained
          sessionDismissKey={SHELL_MOBILE_DISMISS_KEY}
          description={
            <>
              <span className="font-semibold text-fg">WARNING!</span> The terminal works best on desktop. On mobile,
              typing and Tab completion may be awkward.
            </>
          }
        />
        <FakeShellApp />
        <Paragraph muted>
        Nothing here runs on a server. Create files, explore the filesystem, and type{" "}
        <code className="text-accent-1">help</code> to get started.
      </Paragraph>
      </div>
    </section>
  );
}
