import Link from "next/link";
import { ThemeToggle } from "../ThemeToggle";
import { Target } from "lucide-react";

export function Header() {
  return (
    <header className="flex justify-center w-full border-b">
      <div className="flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Zoer Template</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6"></nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
