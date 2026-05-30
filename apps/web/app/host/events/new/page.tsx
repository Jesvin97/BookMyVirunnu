"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewEventRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/couple/events/new");
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#040906", color: "#34d399", fontWeight: 600 }}>
      Redirecting...
    </main>
  );
}
