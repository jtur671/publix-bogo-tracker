import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
}

export function SectionHeader({ title, subtitle, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-publix-green/10 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold text-foreground leading-tight tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted font-medium mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-0.5 text-xs font-bold text-publix-green hover:text-publix-green-dark transition-colors flex-shrink-0 mt-1 active:scale-95"
        >
          {action.label}
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
