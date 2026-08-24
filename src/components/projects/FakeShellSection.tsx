"use client";

import { InteractiveMobileWarningModal } from "@/components/InteractiveMobileWarningModal";
import { H2 } from "@/components/Typography";
import { FakeShellApp } from "@/features/terminal/FakeShellApp";
import { SHELL_MOBILE_DISMISS_KEY } from "@/features/terminal/shell.constants";

export function FakeShellSection({ headingClassName = "" }: { headingClassName?: string }) {
  return (
    <section id="shell" className="scroll-mt-16">
      <H2 className={headingClassName}>Portfolio Shell</H2>
      <div className="relative mt-4">
        <InteractiveMobileWarningModal
          contained
          sessionDismissKey={SHELL_MOBILE_DISMISS_KEY}
          description={
            <>
              The shell works on mobile, but typing commands is easier with a keyboard.
            </>
          }
        />
        <FakeShellApp />
      </div>
    </section>
  );
}
