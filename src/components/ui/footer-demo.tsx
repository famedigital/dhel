"use client";

import Link from "next/link";
import { DIcons } from "dicons";

import ThemeToogle from "@/components/ui/footer";
import { DhelAppMark } from "@/components/dhel/DhelLogo";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

const navigation = {
  categories: [
    {
      id: "product",
      name: "Product",
      sections: [
        {
          id: "product",
          name: "Product",
          items: [
            { name: "Agent desk", href: "/desk/login" },
            { name: "Plan a trip", href: "/build" },
            { name: "Trips", href: "/dashboard" },
          ],
        },
        {
          id: "resources",
          name: "Resources",
          items: [
            { name: "Hotels", href: "/resources/hotels" },
            { name: "Guides", href: "/resources/guides" },
            { name: "Drivers", href: "/resources/drivers" },
          ],
        },
        {
          id: "legal",
          name: "Legal",
          items: [
            { name: "Terms", href: "/terms" },
            { name: "Privacy", href: "/privacy" },
            { name: "Cookies", href: "/cookies" },
          ],
        },
        {
          id: "agents",
          name: "Agents",
          items: [
            { name: "Sign in", href: "/desk/login" },
            { name: "Sign up", href: "/signup" },
            { name: "Agent agreement", href: "/agent-agreement" },
          ],
        },
        {
          id: "ops",
          name: "Ops",
          items: [
            { name: "Clients", href: "/clients" },
            { name: "Settings", href: "/settings" },
            { name: "Onboarding", href: "/onboarding" },
          ],
        },
        {
          id: "company",
          name: "Company",
          items: [
            { name: "Home", href: "/" },
            { name: "Privacy", href: "/privacy" },
            { name: "Terms", href: "/terms" },
          ],
        },
      ],
    },
  ],
};

const Underline =
  "hover:-translate-y-1 border border-dotted rounded-xl p-2.5 transition-transform";

export function Footer() {
  return (
    <footer className="mx-auto w-full border-b border-t border-border px-2 sm:px-4">
      <div className="relative mx-auto grid max-w-7xl items-center justify-center gap-6 p-10 pb-0 md:flex">
        <Link href="/" aria-label={`${BRAND_NAME} home`}>
          <p className="flex items-center justify-center gap-2.5 rounded-full">
            <DhelAppMark className="h-8 w-8" />
            <span className="font-[family-name:var(--font-ui)] text-2xl font-semibold tracking-[0.02em]">
              {BRAND_NAME}
            </span>
          </p>
        </Link>
        <p className="bg-transparent text-center text-xs leading-4 text-primary/60 md:text-left">
          {BRAND_NAME} is the {BRAND_TAGLINE} for agents — paste a client WhatsApp or
          email, clarify what&apos;s missing, compare real hotels, and ship a
          client-ready PDF. Built for private tours, SDF rules, and ops that
          should not live in scattered chat threads.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="border-b border-dotted" />
        <div className="py-10">
          {navigation.categories.map((category) => (
            <div
              key={category.name}
              className="grid grid-cols-2 flex-row justify-between gap-6 leading-6 sm:grid-cols-3 md:flex"
            >
              {category.sections.map((section) => (
                <div key={section.name}>
                  <ul
                    role="list"
                    aria-labelledby={`${category.id}-${section.id}-heading-mobile`}
                    className="flex flex-col space-y-2"
                  >
                    {section.items.map((item) => (
                      <li key={item.name} className="flow-root">
                        <Link
                          href={item.href}
                          className="text-sm text-slate-600 hover:text-black dark:text-slate-400 hover:dark:text-white md:text-xs"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="border-b border-dotted" />
      </div>

      <div className="flex flex-wrap justify-center gap-y-6">
        <div className="flex flex-wrap items-center justify-center gap-6 gap-y-4 px-6">
          <Link
            aria-label="Email"
            href="mailto:hello@dhel.travel"
            rel="noreferrer"
            target="_blank"
            className={Underline}
          >
            <DIcons.Mail strokeWidth={1.5} className="h-5 w-5" />
          </Link>
          <Link
            aria-label="X"
            href="https://x.com"
            rel="noreferrer"
            target="_blank"
            className={Underline}
          >
            <DIcons.X className="h-5 w-5" />
          </Link>
          <Link
            aria-label="Instagram"
            href="https://www.instagram.com"
            rel="noreferrer"
            target="_blank"
            className={Underline}
          >
            <DIcons.Instagram className="h-5 w-5" />
          </Link>
          <Link
            aria-label="WhatsApp"
            href="https://wa.me"
            rel="noreferrer"
            target="_blank"
            className={Underline}
          >
            <DIcons.WhatsApp className="h-5 w-5" />
          </Link>
          <Link
            aria-label="LinkedIn"
            href="https://www.linkedin.com"
            rel="noreferrer"
            target="_blank"
            className={Underline}
          >
            <DIcons.LinkedIn className="h-5 w-5" />
          </Link>
          <Link
            aria-label="YouTube"
            href="https://www.youtube.com"
            rel="noreferrer"
            target="_blank"
            className={Underline}
          >
            <DIcons.YouTube className="h-5 w-5" />
          </Link>
        </div>
        <ThemeToogle />
      </div>

      <div className="mx-auto mb-10 mt-10 flex flex-col justify-between text-center text-xs md:max-w-7xl">
        <div className="flex flex-row flex-wrap items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
          <span>©</span>
          <span>{new Date().getFullYear()}</span>
          <span>Made with</span>
          <DIcons.Heart className="mx-1 h-4 w-4 animate-pulse text-red-600" />
          <span>for</span>
          <Link
            aria-label={BRAND_NAME}
            className="font-bold text-black hover:text-primary dark:text-white"
            href="/"
          >
            {BRAND_NAME}
          </Link>
          <span>— {BRAND_TAGLINE}</span>
        </div>
      </div>
    </footer>
  );
}
