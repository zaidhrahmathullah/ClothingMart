import type { ReactNode } from "react";

import Container from "@/components/ui/Container";

import AccountMobileNav from "./AccountMobileNav";
import AccountSidebar from "./AccountSidebar";

type AccountShellProps = {
  name: string;
  email: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export default function AccountShell({
  name,
  email,
  eyebrow = "My Account",
  title,
  description,
  children,
}: AccountShellProps) {
  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="border-b border-neutral-200 bg-white">
        <Container>
          <div className="py-9 sm:py-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {eyebrow}
            </p>

            <h1 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              {title}
            </h1>

            {description && (
              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-neutral-500">
                {description}
              </p>
            )}
          </div>
        </Container>
      </section>

      <Container>
        <div className="py-7 sm:py-8 lg:py-10">
          <AccountMobileNav />

          <div className="mt-6 grid gap-8 lg:mt-0 lg:grid-cols-[210px_minmax(0,1fr)] lg:items-start xl:grid-cols-[220px_minmax(0,1fr)]">
            <div className="hidden lg:sticky lg:top-24 lg:block">
              <AccountSidebar
                name={name}
                email={email}
              />
            </div>

            <div className="min-w-0">
              {children}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}