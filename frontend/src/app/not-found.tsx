import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">
        404 — Page Not Found
      </h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The page you’re looking for doesn’t exist or may have been moved. Please
        check the URL or return to a safe page.
      </p>

      <div className="flex gap-3">
        <Link href="/login">
          <Button variant="default">Back to Login</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Go Home</Button>
        </Link>
      </div>

      <footer className="mt-10 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Auth System by Iventics Technologies —
        All rights reserved
      </footer>
    </div>
  );
}
