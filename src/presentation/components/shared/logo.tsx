import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/admin" className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/favicon.ico"
        alt="SCCT Logo"
        width={32}
        height={32}
        className="object-contain shrink-0"
      />
      <span className="text-xl font-bold text-primary tracking-tight">
        SCCT
      </span>
    </Link>
  );
}