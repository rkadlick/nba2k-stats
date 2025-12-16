import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-3 bg-[color:var(--color-nav)] backdrop-blur-sm border-t border-[color:var(--color-border)] transition-colors">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-end items-end text-[color:var(--color-text)]">
        <div className="flex flex-col items-center gap-2 text-right">
          <Image
            src="/dreamTeamLogo.png"
            alt="Dream Team logo"
            width={140}
            height={140}
            className="w-48 h-auto drop-shadow-sm"
            priority={false}
          />
          <span className="text-[11px] text-[color:var(--color-text-muted)]">2025 © Dream Team</span>
        </div>
      </div>
    </footer>
  );
}
