"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/about", label: "How It Works" },
  { href: "/text-analysis", label: "Text Analysis" },
  { href: "/live-analysis", label: "Live Analysis" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/[0.07] bg-[#0d0d0f]">
      {/* Logo */}
      <Link href="/" className="font-sans font-bold text-xl tracking-tight">
        <span className="text-[#06AED4]">Emoti</span>
        <span className="text-white">Art</span>
      </Link>

      {/* Navigation Links */}
      <nav className="flex items-center gap-1">
        {navLinks.map((link, index) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={`${index}-${link.label}`}
              href={link.href}
              className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
