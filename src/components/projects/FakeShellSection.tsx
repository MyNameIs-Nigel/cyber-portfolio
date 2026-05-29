"use client";

import { InteractiveMobileWarningModal } from "@/components/InteractiveMobileWarningModal";
import { H2, Paragraph } from "@/components/Typography";
import { FakeShellApp } from "@/features/terminal/FakeShellApp";
import { SHELL_MOBILE_DISMISS_KEY } from "@/features/terminal/shell.constants";

export function FakeShellSection() {
  return (
    <section>
      <H2>Terminal</H2>
      <Paragraph muted>
        A simulated bash-style shell — nothing here runs on a server. Create files, explore the filesystem, and type{" "}
        <code className="text-accent-1">help</code> to get started.
      </Paragraph>
      <InteractiveMobileWarningModal
        sessionDismissKey={SHELL_MOBILE_DISMISS_KEY}
        description={
          <>
            <span className="font-semibold text-fg">WARNING!</span> The terminal works best on desktop. On mobile,
            typing and Tab completion may be awkward.
          </>
        }
      />
      <div className="mt-4">
        <FakeShellApp />
      </div>
    </section>
  );
}
