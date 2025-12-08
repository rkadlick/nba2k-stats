import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-3 bg-white/70 backdrop-blur-sm">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-end items-end">
        <div className="flex flex-col items-end gap-2 text-right">
          <Image
            src="/dreamTeamLogo.png"
            alt="Dream Team logo"
            width={140}
            height={140}
            className="w-25 h-auto drop-shadow-sm"
            priority={false}
          />
          <span className="text-[11px] text-gray-500">2025 © Dream Team</span>
        </div>
      </div>
    </footer>
  );
}
